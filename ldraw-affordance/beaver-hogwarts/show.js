import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';

const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const DEFAULT_SOURCE='https://pub-02c7ef4c74d5445691176fe4b4455d50.r2.dev/models/IOModel2V2/71043.ldr';
const source=params.get('source')||DEFAULT_SOURCE;
const startMode=params.get('mode')==='proof'?'proof':'target';
const staticMode=params.get('static')==='1';
const missing=new Set(['16478','13765','64807']);
let proofUids=[],rawText='',mode=startMode,root=null,lastBox=null,serial=0,raf=0;

const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:!staticMode,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(staticMode?1:Math.min(devicePixelRatio||1,1.5));
renderer.setClearColor(0xf4f1e8);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=false;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,.1,50000);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=!staticMode;controls.dampingFactor=.07;controls.screenSpacePanning=true;
scene.add(new THREE.HemisphereLight(0xffffff,0x6c7180,2.2));
const sun=new THREE.DirectionalLight(0xffffff,2.8);sun.position.set(1200,1800,900);scene.add(sun);
const fill=new THREE.DirectionalLight(0xffffff,1.0);fill.position.set(-900,600,-1200);scene.add(fill);
const loader=new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.setPartsLibraryPath('../../ldraw/');

function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function draw(){resize();controls.update();renderer.render(scene,camera)}
function animate(){draw();raf=requestAnimationFrame(animate)}
if(!staticMode)raf=requestAnimationFrame(animate);
function dispose(r){r?.traverse(o=>{o.geometry?.dispose?.();for(const m of(Array.isArray(o.material)?o.material:[o.material]))m?.dispose?.()})}
function clear(){if(root){scene.remove(root);dispose(root);root=null}}
function fit(){if(!root)return;const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;lastBox=b.clone();const s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z);controls.target.copy(c);camera.position.set(c.x+d*.92,c.y+d*.55,c.z+d*1.32);camera.near=Math.max(.1,d/10000);camera.far=d*20;camera.updateProjectionMatrix();controls.update();if(staticMode)draw()}
function front(){if(!lastBox)return;const s=lastBox.getSize(new THREE.Vector3()),c=lastBox.getCenter(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z);controls.target.copy(c);camera.position.set(c.x,c.y+d*.12,c.z+d*1.55);controls.update();if(staticMode)draw()}
function type1(line){const p=line.trim().split(/\s+/);if(p[0]!=='1'||p.length<15)return null;return{ref:p.slice(14).join(' '),parts:p}}
function cleanId(ref){return String(ref).replace(/\\/g,'/').split('/').pop().replace(/\.dat$/i,'')}
function selectedText(which){
  const proof=new Set(proofUids.map(x=>Number(String(x).replace(/^ldraw-/,''))).filter(Number.isFinite));
  let placementIndex=0,kept=0,hidden=0;const out=['0 Beaver Hogwarts visual projection','0 Name: 71043-visual.ldr'];
  for(const line of rawText.split(/\r?\n/)){
    const row=type1(line);if(!row)continue;
    const idx=placementIndex++,id=cleanId(row.ref);
    if(missing.has(id)){hidden++;continue}
    if(which==='proof'&&!proof.has(idx))continue;
    out.push(line);kept++;
  }
  return{text:out.join('\n')+'\n',kept,hidden,total:placementIndex};
}
function setState(which){
  const target=which==='target';
  $('#targetBtn').classList.toggle('active',target);$('#proofBtn').classList.toggle('active',!target);
  $('#state').textContent=target?'LOUD / TARGET':'QUIET / COMPONENT';$('#state').className=`state ${target?'badgeTarget':'badgeProof'}`;
  $('#noteTitle').textContent=target?'THE WHOLE CASTLE IS A TARGET, NOT A PROOF.':'THIS IS ALL BEAVER CAN CURRENTLY PROVE.';
  $('#noteText').textContent=target?'The red state stays loud until the connector graph can physically account for the assembly. Seven target instances currently lack local geometry and are omitted from this view.':'Twenty-five target pieces form the largest strict stud-connected component. Beaver reaches QUIET here with 41 CLICK proofs, but that does not certify the rest of Hogwarts.';
  $('#truth').textContent=target?'TARGET POSE ≠ PHYSICAL PROOF':'25 PARTS · 41 CLICK PROOFS · ONE ROOT';
}
async function render(which,{refit=true}={}){
  if(which==='proof'&&!proofUids.length)return;
  document.body.dataset.renderReady='0';
  const n=++serial,sel=selectedText(which);mode=which;setState(which);$('#loading').className='';$('#loading').innerHTML=`RENDERING ${which==='target'?'5,929 PIECES':'CERTIFIED 25'}<br><small>${sel.kept.toLocaleString()} local LDraw instances</small>`;
  await new Promise((resolve,reject)=>loader.parse(sel.text,g=>{if(n!==serial){dispose(g);resolve();return}clear();if(staticMode)g.traverse(o=>{if(o.isLine||o.isLineSegments)o.visible=false});root=new THREE.Group();root.rotation.x=Math.PI;root.add(g);scene.add(root);if(refit)fit();else if(staticMode)draw();resolve()},e=>reject(e)));
  if(staticMode){draw();await new Promise(r=>requestAnimationFrame(()=>{draw();r()}))}
  $('#loading').className='done';document.body.dataset.renderReady='1';document.body.dataset.mode=which;document.body.dataset.renderedPieces=String(sel.kept);
}

$('#targetBtn').onclick=()=>render('target');
$('#proofBtn').onclick=()=>render('proof');
$('#frontBtn').onclick=front;$('#homeBtn').onclick=fit;

async function boot(){
  try{
    $('#state').textContent='FETCHING';
    const [modelRes,proofRes]=await Promise.all([fetch(source,{cache:'no-store'}),fetch('./proof-uids.json',{cache:'no-store'}).catch(()=>null)]);
    if(!modelRes.ok)throw new Error(`target source ${modelRes.status}`);rawText=await modelRes.text();
    if(proofRes?.ok){const p=await proofRes.json();proofUids=Array.isArray(p.uids)?p.uids:[]}
    if(!proofUids.length){$('#proofBtn').disabled=true;$('#proofBtn').title='Proof membership has not been published yet'}
    await loader.preloadMaterials('../../ldraw/LDConfig.ldr');
    await render(startMode);
  }catch(e){console.error(e);$('#loading').className='bad';$('#loading').innerHTML=`COULD NOT RENDER 71043<br><small>${String(e.message||e)}</small>`;$('#state').textContent='LOAD FAILED';document.body.dataset.renderReady='error'}
}
boot();

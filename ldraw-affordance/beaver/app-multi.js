import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {toLDraw} from '../src/engine.js';
import {createSolver} from './solver.js';
import {BUILDS,VOCAB_MODES} from './builds-runtime.js';

const $=s=>document.querySelector(s),byId=id=>document.getElementById(id),delay=ms=>new Promise(r=>setTimeout(r,ms));
const [library,rules,overrides]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/compatibility.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/seam-overrides.json',{cache:'no-store'}).then(r=>r.json())
]);
let buildIndex=0,vocabMode='full',solver=null,running=false,audioCtx=null,lastPoint=null,lastOk=true,suiteResults=new Map();

function latchStudMilestones(){
  for(const s of solver.hear().states)if(s.solved&&s.feature.prerequisite.type==='stud'&&s.feature.completion.kind==='port')solver.state.completed.add(s.feature.id);
}
function makeSolver(){solver=createSolver({library,rules,overrides,field:BUILDS[buildIndex],vocabMode});latchStudMilestones()}
function expected(){return BUILDS[buildIndex].expect?.[vocabMode]||null}

function audio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function clickSound(n=1){if(!audioCtx)return;for(let i=0;i<Math.min(n,5);i++){const t=audioCtx.currentTime+i*.045,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(1100,t);o.frequency.exponentialRampToValueAtTime(320,t+.04);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.1,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.05);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.055)}}

// Real LDraw viewer ----------------------------------------------------------
const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0xf3f1ea);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,12000),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;scene.add(new THREE.HemisphereLight(0xffffff,0x666666,2.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(200,280,160);scene.add(sun);const grid=new THREE.GridHelper(520,26,0x8c8c8c,0xd3d0c8);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ready=false,root=null,renderSerial=0,markers=[];
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(t){requestAnimationFrame(animate);resize();controls.update();for(const m of markers)m.scale.setScalar(.9+.15*Math.sin(t*.007+m.userData.p));renderer.render(scene,camera)}requestAnimationFrame(animate);
function dispose(r){r?.traverse(o=>{o.geometry?.dispose?.();(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean).forEach(m=>m.dispose?.())})}
function clear(){if(root){scene.remove(root);dispose(root)}root=null;markers=[];grid.visible=false}
function fit(r){const b=new THREE.Box3().setFromObject(r);if(b.isEmpty())return;const s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,65);controls.target.copy(c);camera.position.set(c.x+d*1.35,c.y+d*.95,c.z+d*1.5);camera.far=d*55;camera.updateProjectionMatrix();grid.position.y=b.min.y-.7;grid.visible=true}
function cueMarkers(){const g=new THREE.Group(),h=solver.hear();markers=[];for(const [i,s] of h.states.entries()){if(s.solved)continue;const active=h.strongest?.feature.id===s.feature.id,p=s.feature.prerequisite.p,n=s.feature.prerequisite.n,color=active?0xff3322:0xffa319,m=new THREE.Mesh(new THREE.SphereGeometry(active?3.6:1.8,12,8),new THREE.MeshBasicMaterial({color,depthTest:false}));m.position.set(...p);m.userData.p=i*.5;m.renderOrder=20;g.add(m);markers.push(m);g.add(new THREE.ArrowHelper(new THREE.Vector3(...n).normalize(),new THREE.Vector3(...p),active?16:9,color,3,2))}if(lastPoint){const m=new THREE.Mesh(new THREE.SphereGeometry(2.4,12,8),new THREE.MeshBasicMaterial({color:lastOk?0x00c970:0xff0033,depthTest:false}));m.position.set(...lastPoint);g.add(m)}return g}
async function renderReal(refit=true){if(!ready||!solver)return;const serial=++renderSerial,text=toLDraw(solver.state.assembly,solver.index,`BEAVER-${BUILDS[buildIndex].id.toUpperCase()}`);return new Promise(resolve=>loader.parse(text,g=>{if(serial!==renderSerial){dispose(g);resolve();return}clear();root=new THREE.Group();root.rotation.x=Math.PI;root.add(g);root.add(cueMarkers());scene.add(root);if(refit)fit(root);resolve()},e=>{console.error(e);$('#geom').textContent='LDRAW ERROR';resolve()}))}
try{await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ready=true;$('#geom').textContent='REAL LDRAW READY'}catch(e){console.error(e);$('#geom').textContent='LDRAW INIT ERROR'}

function contactPoint(action){return action?.parentInst&&action?.parentPort?solver.openPorts().find(r=>r.inst.uid===action.parentInst.uid&&r.port.id===action.parentPort.id)?.p:null}
function setPhase(phase,text,proof=''){ $('#phase').textContent=phase;$('#decision').textContent=text;$('#proof').textContent=proof }
function renderUI(){
  const b=BUILDS[buildIndex],h=solver.hear(),clean=solver.state.assembly.filter(x=>!x.provisional),exp=expected();
  $('#buildSelect').value=String(buildIndex);$('#vocabSelect').value=vocabMode;
  $('#buildName').textContent=b.name;$('#buildCategory').textContent=b.category.toUpperCase();$('#buildDesc').textContent=b.description;
  $('#signals').textContent=`${h.unresolved.length} SIGNAL${h.unresolved.length===1?'':'S'}`;$('#parts').textContent=`${clean.length} PARTS`;$('#counts').textContent=`CLICK ${solver.state.stats.clicks} · AUDIT ${solver.state.stats.audits}`;
  $('#expect').textContent=exp?`EXPECT ${exp.toUpperCase()}`:'UNSCORED';$('#expect').className=`chip ${exp==='quiet'?'pass':exp==='blocked'?'warn':''}`;
  const action=h.strongest?solver.chooseAction(h.strongest):null;
  if(!h.strongest){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='Nothing is asking for another part.'}
  else{$('#hear').className=action?'loud':'blocked';$('#hearLabel').textContent=action?'HEAR':'STILL HEAR';$('#hearText').textContent=h.strongest.stage==='mate'?h.strongest.feature.completion.label:h.strongest.feature.prerequisite.cry}
  $('#cueList').innerHTML=h.states.map(s=>{const active=h.strongest?.feature.id===s.feature.id,state=s.solved?'QUIET':active?(action?'LOUD':'BLOCKED'):'WAIT';return`<div class="cue ${state.toLowerCase()}"><b>${state}</b><span>${s.feature.label}</span><small>${s.solved?'signal extinguished':s.stage==='mate'?s.feature.completion.label:s.feature.prerequisite.cry}</small></div>`}).join('');
  $('#pieceList').innerHTML=clean.map((x,i)=>{const p=solver.partOf(x),contacts=(x.jointRecord?1:0)+(x.secondaryJoints?.length||0);return`<div class="piece"><b>${String(i+1).padStart(2,'0')} · ${p.id}</b><span>${p.name}</span><small>${x.seed?'SUBSTRATE':`${x.label||''} · ${contacts} verified contact${contacts===1?'':'s'}`}</small></div>`}).join('');
  $('#suiteList').innerHTML=BUILDS.map((x,i)=>{const key=`${x.id}|${vocabMode}`,r=suiteResults.get(key);return`<button class="suite ${i===buildIndex?'active':''} ${r?.actual||''}" data-i="${i}"><b>${String(i+1).padStart(2,'0')}</b> ${x.name}<small>${r?r.actual.toUpperCase():x.category}</small></button>`}).join('');
  document.querySelectorAll('.suite').forEach(el=>el.onclick=()=>selectBuild(Number(el.dataset.i)));
}
async function selectBuild(i){
  if(running){renderUI();return}
  buildIndex=(i+BUILDS.length)%BUILDS.length;makeSolver();lastPoint=null;setPhase('HEAR','read the strongest local releaser','same solver · different world');renderUI();await renderReal(true)
}
const LOCK_IDS=['runBtn','stepBtn','resetBtn','nextBtn','suiteBtn','buildSelect','vocabSelect'];
function toggle(v){for(const id of LOCK_IDS){const el=byId(id);if(el)el.disabled=v}}
function recoverUI(error,where){
  console.error(`BEAVER UI ERROR · ${where}`,error);running=false;toggle(false);setPhase('UI ERROR',`${where} failed`,error?.message||String(error));renderUI()
}

async function act(show=true){
  const h=solver.hear();if(!h.strongest){setPhase('QUIET','stop building','no releaser remains');renderUI();return'complete'}
  const action=solver.chooseAction(h.strongest);if(!action){setPhase('STILL HEAR',h.strongest.feature.prerequisite.cry,`NO VERIFIED RESPONSE · ${h.strongest.feature.prerequisite.operatorHint||'NO OPERATOR'}`);renderUI();return'blocked'}
  const cp=contactPoint(action);lastPoint=cp||h.strongest.feature.prerequisite.p;lastOk=false;setPhase('TRY',`${action.part.id} ${action.part.name}`,`preflight exact handshake · target ${h.strongest.feature.label}`);renderUI();if(show){await renderReal(false);await delay(170)}
  const r=solver.step();if(r.status==='retry'){setPhase('REJECT',action.part.name,r.reason||'handshake rejected');renderUI();return'retry'}if(r.status!=='acted')return r.status;
  latchStudMilestones();lastOk=true;clickSound(r.contacts);setPhase(r.contacts>1?`CLICK ×${r.contacts}`:'CLICK',`${r.action.part.id} accepted`,`${r.contacts} verified contact${r.contacts===1?'':'s'} · accumulated assembly re-audited`);renderUI();if(show){await renderReal(false);await delay(210)}return'acted';
}
async function run(){
  if(running)return;audio();running=true;toggle(true);
  try{
    for(let i=0;i<160;i++){const r=await act(true);if(r==='retry')continue;if(r!=='acted')break}
    scoreCurrent();renderUI();await renderReal(true)
  }catch(error){recoverUI(error,'RUN BEAVER');return}
  finally{running=false;toggle(false)}
}
function scoreCurrent(){const actual=solver.hear().strongest?'blocked':'quiet',exp=expected();suiteResults.set(`${BUILDS[buildIndex].id}|${vocabMode}`,{actual,pass:!exp||actual===exp})}
async function runSuite(){
  if(running)return;running=true;toggle(true);suiteResults=new Map();const old=buildIndex;
  try{
    for(let i=0;i<BUILDS.length;i++){
      buildIndex=i;makeSolver();let guard=0;
      while(guard++<400){const r=solver.step();if(r.status==='retry')continue;latchStudMilestones();if(r.status!=='acted')break}
      scoreCurrent();renderUI();await delay(0);
    }
    buildIndex=old;makeSolver();setPhase('SUITE',`${[...suiteResults.values()].filter(x=>x.pass).length}/${BUILDS.length} expected outcomes`,`${vocabMode} · green=quiet · red=blocked`);renderUI();await renderReal(true)
  }catch(error){buildIndex=old;makeSolver();recoverUI(error,'RUN SUITE');return}
  finally{running=false;toggle(false)}
}
function reset(){if(running){renderUI();return}makeSolver();lastPoint=null;setPhase('HEAR','read the strongest local releaser','nothing placed without a physical test');renderUI();renderReal(true)}
async function singleStep(){
  if(running)return;audio();running=true;toggle(true);
  try{await act(true);scoreCurrent();renderUI()}
  catch(error){recoverUI(error,'HEAR · TRY · TEST')}
  finally{running=false;toggle(false)}
}

$('#buildSelect').innerHTML=BUILDS.map((b,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${b.name}</option>`).join('');
$('#vocabSelect').innerHTML=VOCAB_MODES.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');
$('#buildSelect').onchange=e=>selectBuild(Number(e.target.value));
$('#vocabSelect').onchange=e=>{if(running){e.target.value=vocabMode;return}vocabMode=e.target.value;suiteResults=new Map();reset()};
$('#runBtn').onclick=run;$('#stepBtn').onclick=singleStep;$('#resetBtn').onclick=reset;$('#nextBtn').onclick=()=>selectBuild(buildIndex+1);$('#suiteBtn').onclick=runSuite;
$('#exportBtn').onclick=()=>{const text=toLDraw(solver.state.assembly,solver.index,`BEAVER-${BUILDS[buildIndex].id.toUpperCase()}`),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`beaver-${BUILDS[buildIndex].id}.mpd`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
makeSolver();renderUI();renderReal(true);

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {makePlan,stateFor,hear,commit,unresolved,signalLoad,toLDraw,simulate,DESIGN} from './model.js';

const $=s=>document.querySelector(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
let state=stateFor(makePlan()),running=false,last=null,audioCtx=null,lastContacts=[];
const dry=simulate(makePlan(),1000),selfTest={ok:dry.remaining.length===0&&dry.water===0&&dry.clicks>400,detail:`${dry.moves} placements · ${dry.clicks} verified clutch contacts · water ${dry.water}`};

function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function oneClick(at){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(1250,at);o.frequency.exponentialRampToValueAtTime(320,at+.038);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.105,at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.05);o.connect(g).connect(audioCtx.destination);o.start(at);o.stop(at+.055)}
function clicks(n){if(!audioCtx)return;for(let i=0;i<Math.min(5,n);i++)oneClick(audioCtx.currentTime+i*.035)}
function seal(){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(210,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(75,audioCtx.currentTime+.13);g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.15);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.16)}

const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf2f0e9,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,16000),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(760,520,880);controls.enableDamping=true;controls.dampingFactor=.08;scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2.5));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(500,800,430);scene.add(sun);const grid=new THREE.GridHelper(900,45,0x888888,0xd2d0ca);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ldrawReady=false,modelRoot=null,renderSerial=0,signalDots=[];
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(t){requestAnimationFrame(animate);resize();controls.update();for(const d of signalDots){const pulse=.75+.25*Math.sin(t*.006+d.phase);d.mesh.scale.setScalar(pulse)}renderer.render(scene,camera)}requestAnimationFrame(animate);
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clear(){if(modelRoot){scene.remove(modelRoot);dispose(modelRoot);modelRoot=null}signalDots=[];grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,300);controls.target.copy(center);camera.position.set(center.x+d*1.18,center.y+d*.83,center.z+d*1.35);camera.near=.1;camera.far=Math.max(6000,d*35);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.8;grid.visible=true}
const signalColor={WATER:0x158cff,GRAVITY:0xff4a35,STRUCTURE:0xff9e1a,ACCESS:0x23b56e,GUARD:0xffd62b,RAIN_ENTRY:0x00a8b5,VENT:0x8b68c7};
function markers(){const g=new THREE.Group(),h=hear(state);signalDots=[];for(const [i,a] of h.open.slice(0,16).entries()){const active=a===h.raw,color=signalColor[a.signal]||0xff372b,r=active?4.4:2.2,m=new THREE.Mesh(new THREE.SphereGeometry(r,14,9),new THREE.MeshBasicMaterial({color,transparent:true,opacity:active?.95:.58,depthTest:false}));m.position.set(a.t[0],a.t[1]-10,a.t[2]);m.renderOrder=30;g.add(m);signalDots.push({mesh:m,phase:i*.55})}for(const c of lastContacts.slice(0,12)){const m=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8),new THREE.MeshBasicMaterial({color:0x00cf72,depthTest:false}));m.position.set(...c.p);m.renderOrder=35;g.add(m)}return g}
async function renderReal(refit=false){if(!ldrawReady)return;const serial=++renderSerial,text=toLDraw(state);return new Promise(resolve=>loader.parse(text,group=>{if(serial!==renderSerial){dispose(group);resolve();return}clear();modelRoot=new THREE.Group();modelRoot.rotation.x=Math.PI;modelRoot.add(group);modelRoot.add(markers());scene.add(modelRoot);if(refit)fit(modelRoot);resolve()},err=>{console.error(err);$('#geom').textContent='LDRAW ERROR';resolve()}))}
try{const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig ${r.status}`);await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geom').textContent='REAL LDRAW READY'}catch(e){console.error(e);$('#geom').textContent='LDRAW INIT ERROR'}

function current(){return hear(state)}
function actionText(a){return`${a.signal} · ${a.file} · ${a.label}`}
async function move(visual=true){
  const h=current();if(!h.raw){last={phase:'QUIET',text:'Every programmed house condition is closed.',proof:'water 0 · gravity 0 · guard 0 · entry 0 · vent 0'};renderUI();return'complete'}
  if(!h.choice){last={phase:'STILL HEAR',text:actionText(h.raw),proof:'NO PHYSICALLY SEATABLE PREREQUISITE'};renderUI();return'blocked'}
  const {action,seat}=h.choice;last={phase:'TEST',text:actionText(action),proof:`${seat.contacts.length}/${seat.need} live stud contacts · ${h.raw!==action?'louder condition remains blocked':''}`};renderUI();if(visual)await delay(70);
  const rec=commit(action,state);if(!rec){last={phase:'REJECT',text:actionText(action),proof:'support state changed before commit'};renderUI();return'retry'}
  lastContacts=rec.contacts.map(x=>({p:x.p}));if(rec.clicks){clicks(rec.clicks);last={phase:`CLICK ×${rec.clicks}`,text:`${action.file} seated`,proof:`${action.label} · ${rec.clicks} verified stud/anti-stud contacts`}}else{seal();last={phase:'FIT / SEAL',text:`${action.file} inserted`,proof:`${action.label} · ${rec.protocol} · deliberately no fake stud click`}}
  renderUI();if(visual){await renderReal(false);await delay(45)}return'acted';
}
async function run(){if(running||!selfTest.ok)return;ensureAudio();running=true;toggle(true);let i=0;for(;i<800;i++){const r=await move(false);if(r==='retry')continue;if(r!=='acted')break;if(i%3===0){await renderReal(false);await delay(26)}}running=false;toggle(false);renderUI();await renderReal(true)}
function toggle(v){$('#runBtn').disabled=v;$('#stepBtn').disabled=v;$('#resetBtn').disabled=v}
function reset(){state=stateFor(makePlan());lastContacts=[];last={phase:'HEAR',text:'Rain and gravity find a completely unbuilt 24×16 house field.',proof:'Nothing above the real 32×32 baseplate is assumed.'};renderUI();renderReal(true)}

function renderUI(){
  const h=current(),left=unresolved(state),placed=state.placements.length,clickCount=state.placements.reduce((n,a)=>n+(a.kind==='structure'?1:0),0),water=signalLoad(state,'WATER'),gravity=signalLoad(state,'GRAVITY'),guard=signalLoad(state,'GUARD');
  $('#selftest').textContent=selfTest.ok?'SELF TEST PASS':'SELF TEST FAIL';$('#selftest').className=selfTest.ok?'chip pass':'chip fail';$('#placed').textContent=`${placed}/${placed+left.length}`;$('#water').textContent=`WATER ${water}`;$('#support').textContent=`GRAVITY ${gravity}`;$('#guard').textContent=`GUARD ${guard}`;$('#geom').textContent=ldrawReady?`REAL LDRAW · ${placed} PIECES · ${clickCount} STRUCTURAL`:'INITIALIZING…';
  if(!h.raw){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='The house has stopped asking.'}else{const blocked=!h.choice||h.choice.action!==h.raw;$('#hear').className=blocked?'blocked':'loud';$('#hearLabel').textContent=blocked?'LOUD / BLOCKED':'HEAR';$('#hearText').textContent=`${h.raw.signal} · ${h.raw.label}${blocked&&h.choice?` → act on ${h.choice.action.signal}`:''}`}
  $('#phase').textContent=last?.phase||'HEAR';$('#decision').textContent=last?.text||'';$('#proof').textContent=last?.proof||'';
  $('#signals').innerHTML=h.open.slice(0,30).map(a=>{const p=h.choice?.action===a,raw=h.raw===a,cls=raw?'raw':p?'act':'wait';return`<div class="sig ${cls}"><b>${a.signal}</b><span>${a.label}</span><small>${a.file} · severity ${a.severity} · ${p?'SEATABLE NOW':raw?'LOUD':'WAIT'}</small></div>`}).join('')||'<div class="sig quiet"><b>QUIET</b><span>ALL CONDITIONS CLOSED</span></div>';
  $('#pieces').innerHTML=state.placements.slice(-45).reverse().map(a=>`<div class="piece"><b>${a.kind==='structure'?'CLUTCH':'FIT'}</b><span>${a.file}</span><small>${a.label}</small></div>`).join('')||'<div class="piece"><b>SITE</b><span>3811.dat</span><small>real 32×32 baseplate only</small></div>';
}

$('#runBtn').onclick=()=>run();$('#stepBtn').onclick=async()=>{if(running||!selfTest.ok)return;ensureAudio();toggle(true);await move(true);toggle(false);renderUI()};$('#resetBtn').onclick=()=>reset();$('#exportBtn').onclick=()=>{const blob=new Blob([toLDraw(state)],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-courtyard-atelier.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#testDetail').textContent=selfTest.detail;$('#designDetail').textContent=`${DESIGN.ground} · ${DESIGN.upper} · bearing spine · roof terrace · 11 windows · porch · chimney`;
if(!selfTest.ok){$('#runBtn').disabled=true;$('#stepBtn').disabled=true}reset();

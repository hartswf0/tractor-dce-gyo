import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {HOUSE,makeSlots,baseplateSupports,moduleForSlot,actionable,commitModule,leakOf,totalLeak,leakPoint,toLDraw,simulateAll} from './model.js';

const $=s=>document.querySelector(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
let slots=makeSlots(),supports=baseplateSupports(),instances=[],running=false,lastEvent=null;
const initialLeak=totalLeak(slots);
const testSim=simulateAll();
const selfTest={ok:testSim.leak===0&&testSim.moves===20&&testSim.clicks===160,detail:`${testSim.moves} moves · ${testSim.clicks} stud clicks · leak ${testSim.leak}`};

// AUDIO ----------------------------------------------------------------------
let audioCtx=null,waterGain=null,noise=null;
function ensureAudio(){
  if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume();return}
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
  noise=audioCtx.createBufferSource();noise.buffer=buffer;noise.loop=true;
  const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1500;
  waterGain=audioCtx.createGain();waterGain.gain.value=0;
  noise.connect(filter).connect(waterGain).connect(audioCtx.destination);noise.start();updateWaterSound();
}
function updateWaterSound(){if(!waterGain||!audioCtx)return;const ratio=Math.max(0,Math.min(1,totalLeak(slots)/initialLeak));waterGain.gain.setTargetAtTime(.018+ratio*.07,audioCtx.currentTime,.08);if(ratio===0)waterGain.gain.setTargetAtTime(0,audioCtx.currentTime,.12)}
function oneClick(at){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(1100,at);o.frequency.exponentialRampToValueAtTime(330,at+.035);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.11,at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.045);o.connect(g).connect(audioCtx.destination);o.start(at);o.stop(at+.05)}
function playClicks(n){if(!audioCtx)return;for(let i=0;i<Math.min(5,n);i++)oneClick(audioCtx.currentTime+i*.04)}
function sealSound(){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(170,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(90,audioCtx.currentTime+.12);g.gain.setValueAtTime(.04,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.14);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.15)}

// REAL LDRAW -----------------------------------------------------------------
const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf3f1ea,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,12000),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(650,420,720);controls.enableDamping=true;controls.dampingFactor=.08;scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2.6));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(450,600,380);scene.add(sun);const grid=new THREE.GridHelper(760,38,0x888888,0xd4d1c8);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ldrawReady=false,modelWrapper=null,renderSerial=0,flowDots=[];
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(t){requestAnimationFrame(animate);resize();controls.update();for(const d of flowDots){const u=((t*.00032+d.offset)%1),a=d.a,b=d.b;d.mesh.position.set(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u)}renderer.render(scene,camera)}requestAnimationFrame(animate);
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}flowDots=[];grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,240);controls.target.copy(center);camera.position.set(center.x+d*1.15,center.y+d*.78,center.z+d*1.28);camera.near=.1;camera.far=Math.max(5000,d*30);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.8;grid.visible=true}
function waterViz(){
  const g=new THREE.Group();flowDots=[];
  const leaking=slots.filter(s=>leakOf(s)>0).sort((a,b)=>leakOf(b)-leakOf(a));
  for(const [i,slot] of leaking.entries()){
    const a=leakPoint(slot),dir=slot.flowDir,b=[a[0]+dir[0]*64,a[1]+dir[1]*64,a[2]+dir[2]*64],color=0x168dff;
    const arrow=new THREE.ArrowHelper(new THREE.Vector3(...dir).normalize(),new THREE.Vector3(...a),48,color,8,4);arrow.renderOrder=30;g.add(arrow);
    for(let j=0;j<3;j++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(i===0?3.1:2.1,10,7),new THREE.MeshBasicMaterial({color,transparent:true,opacity:i===0?.95:.65,depthTest:false}));mesh.renderOrder=31;g.add(mesh);flowDots.push({mesh,a,b,offset:(j/3+i*.07)%1})}
  }
  return g;
}
async function renderReal(refit=false){const serial=++renderSerial;if(!ldrawReady)return;const mpd=toLDraw(instances);return new Promise(resolve=>loader.parse(mpd,group=>{if(serial!==renderSerial){dispose(group);resolve();return}clearModel();modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);modelWrapper.add(waterViz());scene.add(modelWrapper);if(refit||instances.length===0)fit(modelWrapper);resolve()},err=>{console.error('[LDRAW]',err);$('#geom').textContent='LDRAW ERROR';resolve()}))}
try{const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig ${r.status}`);await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geom').textContent='REAL LDRAW READY'}catch(err){console.error(err);$('#geom').textContent='LDRAW INIT ERROR'}

// HEAR / ACT -----------------------------------------------------------------
function hear(){
  const leaking=slots.filter(s=>leakOf(s)>0).sort((a,b)=>leakOf(b)-leakOf(a));
  const raw=leaking[0]||null;let choice=null;
  for(const slot of leaking){const act=actionable(slot,supports);if(act){choice=act;break}}
  return{leaking,raw,choice};
}
function stageLabel(slot){if(slot.category==='roof')return'ROOF';if(slot.state==='framed')return slot.type==='door'?'DOOR LEAF':'WINDOW GLASS';if(slot.type==='door')return'DOOR FRAME';if(slot.type==='window')return'WINDOW FRAME';return'WALL'}
function describeChoice(choice){if(!choice)return'No verified response can be seated yet.';const {slot,module,seat}=choice;if(module.kind==='closure')return`${stageLabel(slot)} · ${module.protocol} · SEAL, NO CLICK`;return`${stageLabel(slot)} · ${module.id} · ${seat.contacts.length}/${seat.need} exact stud contacts available`}
async function doMove(visual=true){
  const h=hear();if(!h.raw){lastEvent={phase:'QUIET',text:'Envelope quiet. Water no longer crosses the programmed shell.',proof:'LEAK 0'};renderUI();updateWaterSound();return'complete'}
  if(!h.choice){lastEvent={phase:'STILL HEAR',text:`${stageLabel(h.raw)} leaks ${leakOf(h.raw)} units`,proof:'NO VERIFIED ACTIONABLE INTERFACE'};renderUI();return'blocked'}
  const {slot,module,seat}=h.choice;lastEvent={phase:'TRY',text:`${stageLabel(slot)} · ${module.id}`,proof:describeChoice(h.choice)};renderUI();
  if(visual&&module.kind!=='closure'){
    const ghost={id:'ghost',moduleId:module.id,t:[slot.t[0],slot.t[1]-28,slot.t[2]],r:slot.r,kind:module.kind,parts:module.parts};instances.push(ghost);await renderReal(false);await delay(180);instances.pop();
  }
  if(module.kind!=='closure'&&!seat.ok){lastEvent={phase:'REJECT',text:`${module.id} cannot seat`,proof:`${seat.contacts.length}/${seat.need} contacts`};renderUI();return'retry'}
  const rec=commitModule(slot,module,supports,instances);if(!rec){lastEvent={phase:'REJECT',text:`${module.id} refused`,proof:'support test changed before commit'};renderUI();return'retry'}
  if(rec.seal){sealSound();lastEvent={phase:'SEAL',text:`${stageLabel(slot)} closed the flow`,proof:`${module.protocol} · deliberately NO CLICK`}}else{playClicks(rec.clicks);lastEvent={phase:`CLICK ×${rec.clicks}`,text:`${module.id} committed`,proof:`${rec.clicks} exact stud/anti-stud contacts · module internals precompiled`}}
  updateWaterSound();renderUI();await renderReal(false);if(visual)await delay(150);return'acted';
}
async function runBeaver(){if(running||!selfTest.ok)return;ensureAudio();running=true;toggle(true);for(let i=0;i<80;i++){const r=await doMove(true);if(r==='retry')continue;if(r!=='acted')break}running=false;toggle(false);renderUI();await renderReal(true)}
function toggle(v){$('#runBtn').disabled=v;$('#stepBtn').disabled=v;$('#resetBtn').disabled=v}
function reset(){slots=makeSlots();supports=baseplateSupports();instances=[];lastEvent={phase:'HEAR',text:'The 32 × 16 envelope is completely open.',proof:`initial water leak ${initialLeak}`};updateWaterSound();renderUI();renderReal(true)}

// UI -------------------------------------------------------------------------
function renderUI(){
  const h=hear(),leak=totalLeak(slots),sealed=slots.filter(s=>s.state==='sealed').length,framed=slots.filter(s=>s.state==='framed').length;
  $('#selftest').textContent=selfTest.ok?'SELF TEST PASS':'SELF TEST FAIL';$('#selftest').className=selfTest.ok?'chip pass':'chip fail';
  $('#scale').textContent=`${HOUSE.lengthStuds}×${HOUSE.depthStuds} · ${HOUSE.wallBricks} BRICKS HIGH`;
  $('#leak').textContent=`LEAK ${leak}/${initialLeak}`;$('#parts').textContent=`MODULES ${instances.length}`;$('#sealed').textContent=`SEALED ${sealed}/${slots.length}`;
  $('#geom').textContent=ldrawReady?`REAL LDRAW · ${instances.length} MODULES · ${framed} FRAMED/LEAKING`:'INITIALIZING…';
  if(!h.raw){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='No water crosses the envelope.'}
  else{const rawAction=actionable(h.raw,supports),rawBlocked=!rawAction;$('#hear').className=rawBlocked?'blocked':'loud';$('#hearLabel').textContent=rawBlocked?'LOUD BUT BLOCKED':'HEAR WATER';$('#hearText').textContent=`${stageLabel(h.raw)} · flow ${leakOf(h.raw)}${rawBlocked&&h.choice?` · act instead on ${stageLabel(h.choice.slot)}`:''}`}
  $('#phase').textContent=lastEvent?.phase||'HEAR';$('#decision').textContent=lastEvent?.text||'';$('#proof').textContent=lastEvent?.proof||'';
  $('#flowList').innerHTML=h.leaking.map(slot=>{const act=actionable(slot,supports),state=slot.state==='framed'?'FRAME LEAK':act?'ACTIONABLE':'WAIT';return`<div class="flow ${act?'hot':''}"><b>${leakOf(slot)}</b><span>${stageLabel(slot)}</span><small>${slot.id} · ${state}</small></div>`}).join('')||'<div class="flow quiet"><b>0</b><span>ENVELOPE QUIET</span></div>';
  $('#moduleList').innerHTML=instances.slice().reverse().map(x=>`<div class="piece"><b>${x.closure?'SEAL':'CLUTCH'}</b><span>${x.moduleId}</span><small>${x.id}</small></div>`).join('')||'<div class="piece"><b>SITE</b><span>3811.dat · 32×32 baseplate</span><small>water has not caused a module yet</small></div>';
}

$('#runBtn').onclick=()=>runBeaver();$('#stepBtn').onclick=async()=>{if(running||!selfTest.ok)return;ensureAudio();toggle(true);await doMove(true);toggle(false);renderUI()};$('#resetBtn').onclick=()=>reset();$('#exportBtn').onclick=()=>{const blob=new Blob([toLDraw(instances)],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-water-house.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#testDetail').textContent=selfTest.detail;reset();

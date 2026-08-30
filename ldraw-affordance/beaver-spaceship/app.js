import {makePlan,stateFor,hear,commit,unresolved,signalLoad,pressureMissing,toLDraw,simulate,DESIGN} from './model-runtime.js';

const $=s=>document.querySelector(s);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const MOBILE=matchMedia('(max-width:680px), (pointer:coarse)').matches;
let state=stateFor(makePlan()),running=false,last=null,lastContacts=[],audioCtx=null;
let THREE=null,OrbitControls=null,LDrawLoader=null,LDrawConditionalLineMaterial=null;
let renderer=null,scene=null,camera=null,controls=null,loader=null,root=null,grid=null,markers=[];
let viewerReady=false,viewerLoading=null,serial=0,resizeObserver=null;

// The builder proves itself without loading Three.js or parsing any LDraw geometry.
const dry=simulate(makePlan(),5000);
const selfTest={
  ok:dry.remaining.length===0&&dry.pressureMissing.length===0&&(dry.thrustMissing?.length||0)===0,
  detail:`${dry.moves} actions · ${dry.clicks} verified contacts · pressure ${dry.pressureMissing.length} · thrust ${dry.thrustMissing?.length||0}`
};

function audio(){
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
}
function clickOne(t){
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='square';o.frequency.setValueAtTime(1250,t);o.frequency.exponentialRampToValueAtTime(310,t+.04);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.05);
  o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.055);
}
function clicks(n){if(!audioCtx)return;for(let i=0;i<Math.min(4,n);i++)clickOne(audioCtx.currentTime+i*.025)}
function fitSound(){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=145;
  g.gain.setValueAtTime(.02,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.1);
  o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.11);
}

const host=$('#threeHost');
const colors={PRESSURE:0x168dff,GRAVITY:0xff4938,STRUCTURE:0xffa31a,ACCESS:0x20bb70,THRUST:0xe84cff,SYSTEMS:0x7c6cff};

function geomText(text,cls=''){
  const el=$('#geom');el.textContent=text;el.className=cls;
}
function resize(){
  if(!renderer||!camera)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderFrame();
}
function renderFrame(){if(renderer&&scene&&camera)renderer.render(scene,camera)}
function dispose(r){r?.traverse(o=>{o.geometry?.dispose?.();(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean).forEach(m=>m.dispose?.())})}
function clear(){if(root){scene.remove(root);dispose(root)}root=null;markers=[];if(grid)grid.visible=false}
function signalMarkers(){
  const g=new THREE.Group(),h=hear(state);markers=[];
  for(const [i,a] of h.open.slice(0,MOBILE?14:28).entries()){
    const m=new THREE.Mesh(
      new THREE.SphereGeometry(a===h.raw?4.5:2, MOBILE?7:12, MOBILE?5:8),
      new THREE.MeshBasicMaterial({color:colors[a.signal]||0xff372b,transparent:true,opacity:a===h.raw?.95:.5,depthTest:false})
    );
    m.position.set(a.t[0],a.t[1]-10,a.t[2]);m.userData.p=i*.4;m.renderOrder=30;g.add(m);markers.push(m);
  }
  for(const c of lastContacts.slice(0,MOBILE?8:18)){
    const m=new THREE.Mesh(new THREE.SphereGeometry(2,MOBILE?6:10,MOBILE?4:7),new THREE.MeshBasicMaterial({color:0x00cf72,depthTest:false}));
    m.position.set(...c.p);g.add(m);
  }
  return g;
}
function fitModel(r){
  const b=new THREE.Box3().setFromObject(r);if(b.isEmpty())return;
  const s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,540);
  controls.target.copy(c);camera.position.set(c.x+d*1.18,c.y+d*.72,c.z+d*1.34);camera.far=d*45;camera.updateProjectionMatrix();
  grid.position.y=b.min.y-.8;grid.visible=true;controls.update();renderFrame();
}

async function init3D(){
  if(viewerReady)return true;
  if(viewerLoading)return viewerLoading;
  viewerLoading=(async()=>{
    geomText('LOADING 3D… BUILDER STILL ACTIVE');
    try{
      const mods=await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/loaders/LDrawLoader.js'),
        import('three/addons/materials/LDrawConditionalLineMaterial.js')
      ]);
      THREE=mods[0];OrbitControls=mods[1].OrbitControls;LDrawLoader=mods[2].LDrawLoader;LDrawConditionalLineMaterial=mods[3].LDrawConditionalLineMaterial;
      renderer=new THREE.WebGLRenderer({antialias:!MOBILE,powerPreference:MOBILE?'low-power':'high-performance'});
      renderer.setPixelRatio(MOBILE?1:Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0xf1efe8);renderer.outputColorSpace=THREE.SRGBColorSpace;
      host.replaceChildren(renderer.domElement);
      scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,26000);controls=new OrbitControls(camera,renderer.domElement);
      controls.enableDamping=!MOBILE;controls.dampingFactor=.08;controls.addEventListener('change',renderFrame);
      scene.add(new THREE.HemisphereLight(0xffffff,0x596273,MOBILE?2.2:2.8));
      const sun=new THREE.DirectionalLight(0xffffff,MOBILE?1.9:2.5);sun.position.set(700,900,500);scene.add(sun);
      grid=new THREE.GridHelper(1600,MOBILE?40:80,0x777777,0xd2d0c8);grid.visible=false;scene.add(grid);
      loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');
      // One cached material load. The old code fetched LDConfig once, then made the loader fetch it again.
      await loader.preloadMaterials('../../ldraw/LDConfig.ldr');
      viewerReady=true;
      resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
      $('#view3dBtn').textContent='REFRESH 3D';
      geomText(`3D READY · ${state.placements.length} PIECES`);
      return true;
    }catch(e){
      console.error(e);geomText('3D LOAD FAILED · BUILDER STILL WORKS','fail');viewerLoading=null;return false;
    }
  })();
  return viewerLoading;
}

async function render(refit=false){
  if(!viewerReady)return false;
  const n=++serial,text=toLDraw(state);geomText(`PARSING ${state.placements.length} REAL PARTS…`);
  return new Promise(resolve=>loader.parse(text,g=>{
    if(n!==serial){dispose(g);resolve(false);return}
    clear();root=new THREE.Group();root.rotation.x=Math.PI;root.add(g);root.add(signalMarkers());scene.add(root);
    if(refit)fitModel(root);else renderFrame();
    geomText(`REAL LDRAW · ${state.placements.length} PIECES · ${state.clicks} CONTACTS`);resolve(true);
  },e=>{console.error(e);geomText('LDRAW PARSE ERROR · BUILDER STILL WORKS','fail');resolve(false)}));
}
async function show3D(refit=true){
  if(running)return;
  const ok=await init3D();if(ok)await render(refit);
}
function preset(name){
  if(!viewerReady)return show3D(true).then(()=>preset(name));
  const t=new THREE.Vector3(0,170,0);controls.target.copy(t);
  if(name==='front')camera.position.set(-1100,320,320);
  if(name==='top')camera.position.set(0,1250,20);
  if(name==='port')camera.position.set(80,320,-1200);
  controls.update();renderFrame();
}

async function move(show=true){
  const h=hear(state);
  if(!h.raw){last={phase:'QUIET',text:'Support, pressure, access and thrust are quiet.',proof:`pressure gaps ${pressureMissing(state).length}`};ui();return'complete'}
  if(!h.choice){last={phase:'BLOCKED',text:`${h.raw.signal} · ${h.raw.label}`,proof:'no physically reachable response in the current build state'};ui();return'blocked'}
  const {action,seat}=h.choice;
  last={phase:'TEST',text:`${action.file} · ${action.label}`,proof:action.kind==='structure'?`${seat.contacts.length}/${seat.need} live contacts · span ${Math.round(seat.spread||0)} LDU`:`fit protocol · anchors ${action.anchors?.length||0}`};ui();
  if(show&&!MOBILE)await delay(55);
  const rec=commit(action,state);if(!rec)return'retry';lastContacts=rec.contacts.map(c=>({p:c.p}));
  if(rec.clicks){clicks(rec.clicks);last={phase:`CLICK ×${rec.clicks}`,text:`${action.file} committed`,proof:action.label}}
  else{fitSound();last={phase:'FIT / SEAL',text:`${action.file} inserted`,proof:`${action.label} · no fake stud click`}}
  ui();
  // Stepping can refresh an already-loaded viewer. It never forces 3D to load.
  if(show&&viewerReady)await render(false);
  return'acted';
}

async function run(){
  if(running||!selfTest.ok)return;
  audio();running=true;toggle(true);
  const batch=MOBILE?32:16;
  let i=0;
  for(;i<5000;i++){
    const h=hear(state);
    if(!h.raw){last={phase:'QUIET',text:'Support, pressure, access and thrust are quiet.',proof:`pressure gaps ${pressureMissing(state).length}`};break}
    if(!h.choice){last={phase:'BLOCKED',text:`${h.raw.signal} · ${h.raw.label}`,proof:'no physically reachable response in the current build state'};break}
    const {action,seat}=h.choice,rec=commit(action,state);if(!rec)continue;
    lastContacts=rec.contacts.map(c=>({p:c.p}));
    last={phase:rec.clicks?`CLICK ×${rec.clicks}`:'FIT / SEAL',text:`${action.file} ${rec.clicks?'committed':'inserted'}`,proof:action.label};
    // Yield to the browser and update only cheap UI during the fast build.
    if(i%batch===0){ui(false);await delay(0)}
  }
  running=false;toggle(false);ui(true);
  if(viewerReady){await render(true)}
  else geomText(`BUILD COMPLETE · ${state.placements.length} PIECES · TAP VIEW 3D`,'pass');
}
function toggle(v){for(const id of ['runBtn','stepBtn','resetBtn','view3dBtn'])$(id).disabled=v}
function reset(){
  state=stateFor(makePlan());lastContacts=[];
  last={phase:'HEAR',text:'The orbital yard is empty. The keel is the first reachable discrepancy.',proof:'nothing is precompiled as a spaceship'};
  ui(true);if(viewerReady)render(true);else geomText(MOBILE?'BUILDER READY · 3D SLEEPING':'BUILDER READY · 3D LOADING LATER');
}

function ui(full=true){
  const h=hear(state),left=unresolved(state),gaps=pressureMissing(state),placed=state.placements.length;
  $('#selftest').textContent=selfTest.ok?'SELF TEST PASS':'SELF TEST FAIL';$('#selftest').className=selfTest.ok?'chip pass':'chip fail';
  $('#placed').textContent=`${placed}/${placed+left.length}`;$('#pressure').textContent=`PRESSURE ${signalLoad(state,'PRESSURE')}`;$('#thrust').textContent=`THRUST ${signalLoad(state,'THRUST')}`;
  $('#gaps').textContent=`GAPS ${gaps.length}`;$('#gaps').className=`chip ${gaps.length?'fail':'pass'}`;
  if(!h.raw){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='The ship stopped asking.'}
  else{const blocked=!h.choice||h.choice.action!==h.raw;$('#hear').className=blocked?'blocked':'loud';$('#hearLabel').textContent=blocked?'LOUD / BLOCKED':'HEAR';$('#hearText').textContent=`${h.raw.signal} · ${h.raw.label}${blocked&&h.choice?` → reachable: ${h.choice.action.signal}`:''}`}
  $('#phase').textContent=last?.phase||'HEAR';$('#decision').textContent=last?.text||'';$('#proof').textContent=last?.proof||'';
  if(!full)return;
  $('#signals').innerHTML=h.open.slice(0,MOBILE?24:42).map(a=>`<div class="sig ${h.raw===a?'raw':h.choice?.action===a?'act':''}"><b>${a.signal}</b><span>${a.label}</span><small>${a.file}</small></div>`).join('')||'<div class="sig quiet"><b>QUIET</b><span>STARSHIP COMPLETE</span></div>';
  $('#pieces').innerHTML=state.placements.slice(-(MOBILE?35:70)).reverse().map(a=>`<div class="piece"><b>${a.kind==='structure'?'CLUTCH':'FIT'}</b><span>${a.file}</span><small>${a.label}</small></div>`).join('')||'<div class="piece"><b>YARD</b><span>2 × 3811.dat</span><small>64×32 stud orbital build substrate</small></div>';
}

$('#runBtn').onclick=run;
$('#stepBtn').onclick=async()=>{if(running||!selfTest.ok)return;audio();toggle(true);await move(true);toggle(false)};
$('#resetBtn').onclick=reset;
$('#view3dBtn').onclick=()=>show3D(true);
$('#exportBtn').onclick=()=>{const b=new Blob([toLDraw(state)],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='beaver-starship-i.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#frontBtn').onclick=()=>preset('front');$('#topBtn').onclick=()=>preset('top');$('#portBtn').onclick=()=>preset('port');
$('#testDetail').textContent=selfTest.detail;$('#designDetail').textContent=`${DESIGN.ship} · ${DESIGN.systems}`;
if(!selfTest.ok){$('#runBtn').disabled=true;$('#stepBtn').disabled=true}
reset();

// Desktop can prepare 3D when idle. Mobile does absolutely no Three/LDraw work until VIEW 3D is tapped.
if(!MOBILE){
  const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,900));
  idle(()=>init3D().then(ok=>{if(ok&&state.placements.length)render(true)}),{timeout:2500});
}

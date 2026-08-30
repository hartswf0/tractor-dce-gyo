import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {PARTS,CHALLENGES} from './atlas.js';
import {makeState,hear,step,coverage} from './model.js';

const $=s=>document.querySelector(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
let state,seed=17,running=false,visuals=new Map(),laneCounts=new Map();

const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf4f2eb,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,20000),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(950,650,1050);controls.enableDamping=true;scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2.6));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(700,900,600);scene.add(sun);const world=new THREE.Group();scene.add(world);const grid=new THREE.GridHelper(2200,44,0x777777,0xd3d0c8);scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ready=false;
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
try{await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ready=true;$('#geom').textContent='REAL LDRAW READY'}catch(err){console.error(err);$('#geom').textContent='LDRAW INIT ERROR'}

const laneOf=p=>p.class.startsWith('SITE_')?'site':p.class.includes('BRIDGE')?'bridge':['BUILDING_MODULE','ROOF_SHELL','CANOPY','GLAZED_SHELL','POD_SHELL','WALL_PANEL'].includes(p.class)?'shelter':['LADDER_RAIL','VERTICAL_CIRCULATION','LATTICE_PANEL','CAGE_PLATFORM'].includes(p.class)?'access':['MATERIAL_HANDLING','BIN_CONTAINER','TRANSIT_CASE','STORAGE_MODULE','BULK_CONTAINER'].includes(p.class)?'logistics':['WET_FIXTURE','FLUID_CONTROL'].includes(p.class)?'wet':p.class==='FURNITURE'?'interior':'other';
const laneOrigin={site:[0,0,650],bridge:[-650,0,0],shelter:[0,0,0],access:[-330,0,300],logistics:[520,0,260],wet:[440,0,-280],interior:[130,0,-250],other:[0,0,-600]};
function slotFor(p){const lane=laneOf(p),n=laneCounts.get(lane)||0;laneCounts.set(lane,n+1);const o=laneOrigin[lane],dx=((n%3)-1)*230,dz=Math.floor(n/3)*230;return[o[0]+dx,o[1],o[2]+dz]}
function fit(){const b=new THREE.Box3().setFromObject(world);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,500);controls.target.copy(center);camera.position.set(center.x+d*1.12,center.y+d*.78,center.z+d*1.2);camera.near=.1;camera.far=Math.max(8000,d*30);camera.updateProjectionMatrix();controls.update()}
function loadPart(part){return new Promise((resolve,reject)=>loader.load(`../../ldraw/parts/${part.file}`,g=>resolve(g),undefined,reject))}
async function addVisual(part){if(!ready||visuals.has(part.id))return;try{const g=await loadPart(part),holder=new THREE.Group();holder.rotation.x=Math.PI;holder.add(g);world.add(holder);let b=new THREE.Box3().setFromObject(holder),c=b.getCenter(new THREE.Vector3()),slot=slotFor(part);holder.position.x+=slot[0]-c.x;holder.position.z+=slot[2]-c.z;holder.position.y+=slot[1]-b.min.y;holder.scale.setScalar(.001);visuals.set(part.id,holder);for(let s=.001;s<1;s+=.13){holder.scale.setScalar(Math.min(1,s));await delay(12)}holder.scale.setScalar(1);fit()}catch(err){console.error(part.file,err);state.events.push({type:'LOAD_FAIL',part,text:`Could not render ${part.file}`});renderUI()}}
function clearWorld(){for(const h of visuals.values())world.remove(h);visuals.clear();laneCounts.clear()}

function reset(){running=false;clearWorld();seed=Number($('#seed').value)||17;state=makeState($('#challenge').value,$('#vocab').value,seed);renderUI();fit()}
function currentLoud(){return hear(state).loudest}
async function doStep(){if(state.quiet||state.blocked)return;const before=currentLoud(),res=step(state),ev=res.event;if(ev?.part)await addVisual(ev.part);renderUI();return{before,ev}}
async function runAll(){if(running)return;running=true;toggle(true);for(let i=0;i<64&&!state.quiet&&!state.blocked;i++){await doStep();await delay(110)}running=false;toggle(false);renderUI()}
function toggle(v){$('#run').disabled=v;$('#one').disabled=v;$('#reset').disabled=v}

function renderUI(){const h=hear(state),cov=coverage(state);$('#parts').textContent=`${state.used.length} CHUNKS`;$('#coverage').textContent=`${cov.done}/${cov.total} QUIET`;$('#vocabCount').textContent=`VOCAB ${state.vocab.length}`;if(state.quiet){$('#hear').className='quiet';$('#hearK').textContent='QUIET';$('#hearT').textContent='All current world demands are absorbed.'}else if(state.blocked){$('#hear').className='blocked';$('#hearK').textContent='STILL HEAR';$('#hearT').textContent=h.loudest?`${h.loudest.label} · ${h.loudest.remaining.join(' + ')}`:'Blocked'}else{$('#hear').className='loud';$('#hearK').textContent='HEAR';$('#hearT').textContent=h.loudest?`${h.loudest.label} · needs ${h.loudest.remaining.join(' + ')}`:'Listening…'}
  $('#signals').innerHTML=h.signals.map(s=>`<div class="sig ${s.solved?'done':s===h.loudest?'hot':''}"><b>${s.solved?'QUIET':s.weight}</b><span>${s.label}</span><small>${s.solved?'absorbed':`still needs ${s.remaining.join(' + ')}`}</small></div>`).join('');
  $('#candidates').innerHTML=h.candidates.slice(0,8).map((c,i)=>`<div class="cand ${i===0?'best':''}"><b>${c.part.id}</b><span>${c.part.name}</span><small>${c.part.class} · gain ${c.gain.toFixed(1)} · ${c.hits.flatMap(x=>x.tokens).join(' + ')}</small></div>`).join('')||'<div class="cand blocked"><b>NONE</b><span>No vocabulary item can reduce the remaining signal.</span></div>';
  $('#used').innerHTML=state.used.slice().reverse().map(p=>`<div class="used"><b>SET</b><span>${p.id} · ${p.name}</span><small>${p.class} · real LDraw geometry · macro placement is NOT a stud click</small></div>`).join('')||'<div class="used"><b>WORLD</b><span>No chunks selected yet.</span></div>';
  $('#event').textContent=state.events.length?state.events.at(-1).text:'World is presenting its demands.';
}

for(const [k,v] of Object.entries(CHALLENGES)){const o=document.createElement('option');o.value=k;o.textContent=v.name;$('#challenge').appendChild(o)}
$('#challenge').value='flood_depot';$('#vocab').onchange=reset;$('#challenge').onchange=reset;$('#seed').onchange=reset;$('#run').onclick=runAll;$('#one').onclick=()=>doStep();$('#reset').onclick=reset;$('#random').onclick=()=>{$('#vocab').value='random18';$('#seed').value=1+Math.floor(Math.random()*9999);reset()};
$('#atlas').textContent=`${PARTS.length} REAL CHUNKS · ${new Set(PARTS.map(p=>p.class)).size} CLASSES`;reset();

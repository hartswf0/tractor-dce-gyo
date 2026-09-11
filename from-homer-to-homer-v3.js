import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {LIVE_FACE_CAST,CAST24,PERFORMANCE_NAMES,SIGNATURES,faceOrigin,hasSourceFace,renderSourceFace,makeDecalMesh,selection,titleCase} from './odyssey-decal-v3.js';
import {actorKit,makeCostumeMeshes,assemblyLabel} from './odyssey-actor-kit.js';

const $=s=>document.querySelector(s);
let character='poseidon',performance='recognition',mode='cast',repertory='odyssey',frameMode='full';
const spring=['homer','marge','bart','lisa','maggie','ned'];
const sourceHost=$('#sourceHost'),tray=$('#tray'),host=$('#actorHost');

const ROLES={
 poseidon:['GOD OF THE SEA','the god is known'],odysseus:['KING OF ITHACA','the traveler returns'],penelope:['QUEEN OF ITHACA','she waits and tests'],telemachus:['SON OF ODYSSEUS','the son becomes an actor'],athena:['GODDESS OF WISDOM','the guide watches'],eurycleia:['NURSE OF ITHACA','she knows the scar'],nestor:['KING OF PYLOS','memory becomes counsel'],eumaeus:['SWINEHERD OF ITHACA','hospitality survives'],circe:['ENCHANTRESS','danger becomes regard'],nausicaa:['PRINCESS OF PHAEACIA','strangeness becomes welcome'],helen:['QUEEN OF SPARTA','memory refuses innocence'],alcinous:['KING OF PHAEACIA','the stranger is judged'],polyphemus:['THE CYCLOPS','hunger becomes curse'],calypso:['NYMPH OF OGYGIA','love becomes release'],tiresias:['THE SEER','the dead speak ahead'],laertes:['FATHER OF ODYSSEUS','proof becomes joy'],antinous:['SUITOR OF PENELOPE','entitlement becomes panic'],menelaus:['KING OF SPARTA','grief remembers glory'],arete:['QUEEN OF PHAEACIA','scrutiny becomes approval'],hermes:['MESSENGER OF THE GODS','the message moves'],zeus:['KING OF THE GODS','judgment becomes decree'],phemius:['BARD OF ITHACA','performance becomes plea'],melanthius:['GOATHERD OF ITHACA','contempt becomes fear'],argos:['DOG OF ODYSSEUS','waiting becomes recognition']
};
const DEFAULT_PERF={poseidon:'recognition',odysseus:'resolve',penelope:'waiting',telemachus:'uncertainty',athena:'command',eurycleia:'recognition'};
const FEATURED=['poseidon','odysseus','penelope','telemachus','athena','eurycleia'];
const HAND_L='0.985 -0.1202 0.1202 0.17 0.6964 -0.6964 0 0.707 0.707';
const HAND_R='0.985 0.1202 -0.1202 -0.17 0.6964 -0.6964 0 0.707 0.707';
function ref(c,x,y,z,f,m='1 0 0 0 1 0 0 0 1'){return`1 ${c} ${x} ${y} ${z} ${m} parts/${f}`}
function actorDat(c){
  const kit=actorKit(c),top=kit.costume.top,bottom=kit.costume.bottom,h=kit.hair;
  const lines=['0 FILE actor.ldr',ref(78,0,-84,0,'3626b.dat'),ref(top,0,-60,0,'973.dat'),
    ref(top,-15.552,-51,0,'3818.dat','0.985 -0.17 0 0.17 0.985 0 0 0 1'),
    ref(top,15.552,-51,0,'3819.dat','0.985 0.17 0 -0.17 0.985 0 0 0 1'),
    ref(78,-23.6904,-33.226,-9.8982,'3820.dat',HAND_L),ref(78,23.6904,-33.226,-9.8982,'3820.dat',HAND_R),ref(bottom,0,-28,0,'3815c01.dat')];
  if(h)lines.push(ref(kit.hairColor,0,-84,0,h));return lines.join('\n');
}

const scene=new THREE.Scene();scene.background=new THREE.Color(0xf1eee6);
const camera=new THREE.PerspectiveCamera(27,1,.1,5000);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
scene.add(new THREE.HemisphereLight(0xffffff,0x766f65,2.5));const key=new THREE.DirectionalLight(0xffffff,2.15);key.position.set(100,170,150);scene.add(key);const rim=new THREE.DirectionalLight(0xfff3dc,.75);rim.position.set(-90,120,-120);scene.add(rim);
const grid=new THREE.GridHelper(230,12,0xaaa59b,0xd8d4ca);scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('./ldraw/');let root=null;
function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function fit(){if(!root)return;const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());if(frameMode==='head'){const e=42,target=new THREE.Vector3(center.x,box.max.y-17,center.z);controls.target.copy(target);camera.position.set(target.x+e*.44,target.y+e*.16,target.z+e*1.44)}else{const e=Math.max(size.x,size.y,size.z,72);controls.target.copy(center);camera.position.set(center.x+e*.68,center.y+e*.35,center.z+e*1.72)}grid.position.y=box.min.y-.8}
new ResizeObserver(()=>{resize();fit()}).observe(host);(function tick(){requestAnimationFrame(tick);resize();controls.update();renderer.render(scene,camera)})();
function dispose(o){o?.traverse(x=>{x.geometry?.dispose?.();(Array.isArray(x.material)?x.material:[x.material]).filter(Boolean).forEach(m=>{m.map?.dispose?.();m.dispose?.()})})}
function clearActor(){if(root){scene.remove(root);dispose(root);root=null}}
async function renderActor(){if(repertory!=='odyssey'||!hasSourceFace(character)){clearActor();return}return new Promise(resolve=>loader.parse(actorDat(character),group=>{clearActor();root=new THREE.Group();root.rotation.x=Math.PI;root.add(group);const costume=makeCostumeMeshes(character);if(costume)root.add(costume);const decal=makeDecalMesh(THREE,character,performance);if(decal)root.add(decal);scene.add(root);fit();resolve();},e=>{console.error(e);resolve()}))}
function renderSource(){sourceHost.innerHTML='';if(!hasSourceFace(character)){sourceHost.innerHTML='<div class="argos"><b>ARGOS</b><br>DOG RIG · NOT A HUMAN HEAD PRINT</div>';return}const c=renderSourceFace(character,performance,700);c.style.width='100%';c.style.height='auto';sourceHost.appendChild(c)}
function role(c){return ROLES[c]||['ODYSSEY ACTOR','performed identity']}
function updateLabels(){
  const [r,q]=role(character);$('#sourceName').textContent=titleCase(character);$('#actorName').textContent=titleCase(character);$('#sourcePerf').textContent=performance;$('#sourceOrigin').textContent=faceOrigin(character);$('#actorMeta').textContent='same face · decal · brick';$('#characterRole').textContent=r;$('#sourceQuote').textContent=`“${q}.”`;$('#assemblyLine').textContent=assemblyLabel(character);
}
function chooseChar(c,p=null){character=c;if(!hasSourceFace(c))performance='neutral';else if(p)performance=p;update()}
function choosePerf(p){performance=p;update()}
function update(){updateLabels();renderSource();renderActor();renderPerformanceRail();renderTray()}

function renderPerformanceRail(){const rail=$('#performanceRail');rail.innerHTML='';const names=[...new Set([...(SIGNATURES[character]||[]),...PERFORMANCE_NAMES])];for(const p of names){const row=document.createElement('div');row.className='railPerf'+(p===performance?' on':'');row.textContent=p.toUpperCase();row.onclick=()=>choosePerf(p);rail.appendChild(row)}}

function renderFeaturedCast(){const wrap=document.createElement('div');wrap.className='featuredCast';for(const c of FEATURED){const p=DEFAULT_PERF[c]||'neutral';const card=document.createElement('button');card.className='portrait'+(c===character?' on':'');const cv=renderSourceFace(c,p,220);if(cv)card.appendChild(cv);const cap=document.createElement('span');cap.innerHTML=`<b>${titleCase(c)}</b><small>${p.toUpperCase()}</small>`;card.appendChild(cap);card.onclick=()=>chooseChar(c,p);wrap.appendChild(card)}const explore=document.createElement('button');explore.className='explore';explore.innerHTML='<b>›</b><span>EXPLORE<br>THE FULL CAST<small>24 CHARACTERS<br>× PERFORMANCE</small></span>';explore.onclick=()=>{mode='cast';renderTray();setTimeout(()=>tray.querySelector('.fullCast')?.scrollIntoView({behavior:'smooth'}),20)};wrap.appendChild(explore);return wrap}

function renderTray(){
  tray.innerHTML='';
  if(repertory==='springfield'){tray.innerHTML='<div class="foot"><b>HOMER II · SPRINGFIELD</b><br>Same performance language, different head geometry. Springfield remains the transfer test while Odyssey is the live cast.</div>'+spring.map(n=>`<button class="card"><b>${n.toUpperCase()}</b><small>TRANSFER TEST</small></button>`).join('');return}
  if(mode==='cast'){tray.appendChild(renderFeaturedCast());const all=document.createElement('div');all.className='fullCast list';for(const c of CAST24){const b=document.createElement('button');b.className='card '+(c===character?'on ':'')+(hasSourceFace(c)?'':'todo');b.innerHTML=`<b>${titleCase(c)}</b><small>${hasSourceFace(c)?role(c)[0]:'DOG RIG'}</small>`;b.onclick=()=>chooseChar(c,DEFAULT_PERF[c]||'neutral');all.appendChild(b)}tray.appendChild(all);return}
  if(mode==='performance'){const sig=SIGNATURES[character]||[],d=document.createElement('div');d.className='perf';for(const p of [...new Set([...sig,...PERFORMANCE_NAMES])]){const b=document.createElement('button');b.textContent=p.toUpperCase();if(p===performance)b.className='on';b.onclick=()=>choosePerf(p);d.appendChild(b)}tray.appendChild(d);return}
  if(mode==='assembly'){const k=actorKit(character),d=document.createElement('div');d.className='assembly';for(const [a,b] of [['HEAD CLASS',k.head.replaceAll('_',' ')],['BEARD PRINT',k.beard||'none'],['HAIR',k.hair||'special / none'],['COSTUME',k.costume.pattern]]){const u=document.createElement('div');u.className='unit';u.innerHTML=`<small>${a}</small><b>${String(b).toUpperCase()}</b>`;d.appendChild(u)}tray.appendChild(d);const f=document.createElement('div');f.className='frame';for(const [id,label] of [['full','FULL BODY'],['head','HEAD / MAKEUP']]){const b=document.createElement('button');b.textContent=label;if(frameMode===id)b.className='on';b.onclick=()=>{frameMode=id;fit();renderTray()};f.appendChild(b)}tray.appendChild(f);const note=document.createElement('div');note.className='foot';note.textContent='ACTUAL LDRAW BODY · source-anchored white sclera · printed beard · transparent Odyssey costume print';tray.appendChild(note);return}
  if(mode==='compare'){const d=document.createElement('div');d.className='compare';for(const c of LIVE_FACE_CAST){const b=document.createElement('button'),cv=renderSourceFace(c,performance,220);b.appendChild(cv);const lab=document.createElement('b');lab.textContent=titleCase(c);b.appendChild(lab);const sm=document.createElement('small');sm.textContent=role(c)[0];b.appendChild(sm);b.onclick=()=>chooseChar(c);d.appendChild(b)}tray.appendChild(d);const f=document.createElement('div');f.className='foot';f.textContent=`${performance.toUpperCase()} · SAME DRAMATIC OPERATION · CHARACTER-SPECIFIC REALIZATIONS`;tray.appendChild(f)}
}

for(const b of document.querySelectorAll('.dock [data-mode]'))b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('.dock [data-mode]').forEach(x=>x.classList.toggle('on',x===b));renderTray()};
$('#odyssey').onclick=()=>{repertory='odyssey';$('#odyssey').classList.add('on');$('#springfield').classList.remove('on');update()};
$('#springfield').onclick=()=>{repertory='springfield';clearActor();$('#springfield').classList.add('on');$('#odyssey').classList.remove('on');renderTray()};
$('#modelView').onclick=()=>{frameMode=frameMode==='full'?'head':'full';fit();$('#modelView').textContent=frameMode==='full'?'VIEW HEAD / MAKEUP':'VIEW FULL ACTOR';};
$('#send').onclick=()=>{if(!hasSourceFace(character))return;const s=selection(character,performance);localStorage.setItem('word-to-theatre.odysseyFace',JSON.stringify(s));location.href=`./word-to-theatre.html?odyssey=${encodeURIComponent(character)}&performance=${encodeURIComponent(performance)}`};
await loader.preloadMaterials('./ldraw/LDConfig.ldr');
window.__HOMER_TO_HOMER={get selection(){return selection(character,performance)},LIVE_FACE_CAST,CAST24,PERFORMANCE_NAMES,get frame(){return frameMode},get assembly(){return actorKit(character)}};
update();

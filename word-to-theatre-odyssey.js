import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {CAST24,LIVE_FACE_CAST,PERFORMANCE_NAMES,SIGNATURES,faceOrigin,hasSourceFace,renderSourceFace,makeDecalMesh,selection,titleCase} from './odyssey-decal.js';

const $=id=>document.getElementById(id);
const q=new URLSearchParams(location.search);
let saved={};try{saved=JSON.parse(localStorage.getItem('word-to-theatre.odysseyFace')||'{}')}catch{}
const state={
 character:(q.get('odyssey')||saved.character||'odysseus').toLowerCase(),
 performance:(q.get('performance')||saved.performance||'recognition').toLowerCase(),
 skin:78,top:4,bottom:70,hair:true,mode:null,submode:null,root:null
};
if(!CAST24.includes(state.character))state.character='odysseus';

const SKINS=[['LIGHT NOUGAT',78,'#ffc995'],['MEDIUM NOUGAT',84,'#b57d52'],['NOUGAT',92,'#c78964'],['DARK NOUGAT',128,'#a85f3f'],['R BROWN',70,'#6b3513'],['DARK BROWN',308,'#352100']];
const PAINTS=[['WHITE',15,'#f4f4f4'],['RED',4,'#c91a09'],['BLUE',1,'#0055bf'],['DARK BLUE',272,'#19325a'],['GREEN',2,'#237841'],['BROWN',70,'#6b3513'],['TAN',19,'#e4cd9e'],['GRAY',71,'#a0a5a9']];
const costumes={odysseus:[4,70],penelope:[15,15],telemachus:[272,70],athena:[15,272],eurycleia:[70,19],nestor:[19,70],eumaeus:[19,70],circe:[4,70],nausicaa:[15,272],helen:[15,4],alcinous:[272,15],polyphemus:[70,70],poseidon:[272,19],calypso:[15,272],tiresias:[71,72],laertes:[19,70],antinous:[4,70],menelaus:[4,70],arete:[272,19],hermes:[71,70],zeus:[15,272],phemius:[19,70],melanthius:[70,70]};
const hairs={penelope:['12890.dat',70],eurycleia:['12890.dat',71],circe:['12890.dat',70],nausicaa:['12890.dat',70],helen:['12890.dat',70],athena:['12890.dat',19],odysseus:['21787.dat',70],telemachus:['21787.dat',70],nestor:['21787.dat',71],eumaeus:['21787.dat',70],alcinous:['21787.dat',71],poseidon:['21787.dat',15],calypso:['12890.dat',70],tiresias:['21787.dat',71],laertes:['21787.dat',71],antinous:['21787.dat',70],menelaus:['21787.dat',70],arete:['12890.dat',70],hermes:['21787.dat',70],zeus:['21787.dat',15],phemius:['21787.dat',70],melanthius:['21787.dat',70]};

function defaults(){const c=costumes[state.character]||[15,70];state.skin=78;state.top=c[0];state.bottom=c[1];state.hair=true}
defaults();

$('catalogReady').textContent='24 CAST';$('catalogReady').classList.add('ok');
$('rigReady').textContent='ODYSSEY FACE';$('rigReady').classList.add('ok');
$('world').innerHTML='<option value="odyssey">The Odyssey</option>';
function renderActorOptions(){$('figure').innerHTML=CAST24.map(c=>`<option value="${c}" ${c===state.character?'selected':''}>${titleCase(c)}</option>`).join('')}
renderActorOptions();

const host=$('threeHost');const scene=new THREE.Scene();scene.background=new THREE.Color(0xf1eee5);
const camera=new THREE.PerspectiveCamera(29,1,.1,6000);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.25));const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(120,180,160);scene.add(key);const grid=new THREE.GridHelper(260,13,0x999999,0xd2cfc7);scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('./ldraw/');

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function fit(face=false){if(!state.root)return;const box=new THREE.Box3().setFromObject(state.root);if(box.isEmpty())return;const s=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());if(face){const t=new THREE.Vector3(c.x,box.max.y-s.y*.18,c.z);controls.target.copy(t);const e=46;camera.position.set(t.x+e*.45,t.y+e*.18,t.z+e*1.65)}else{const e=Math.max(s.x,s.y,s.z,62);controls.target.copy(c);camera.position.set(c.x+e*.86,c.y+e*.47,c.z+e*1.72)}grid.position.y=box.min.y-.8}
new ResizeObserver(()=>{resize();fit(state.mode==='hmu')}).observe(host);(function tick(){requestAnimationFrame(tick);resize();controls.update();renderer.render(scene,camera)})();
function dispose(o){o?.traverse(x=>{x.geometry?.dispose?.();(Array.isArray(x.material)?x.material:[x.material]).filter(Boolean).forEach(m=>m.dispose?.())})}
function clearActor(){if(state.root){scene.remove(state.root);dispose(state.root);state.root=null}}
function ref(c,x,y,z,f,m='1 0 0 0 1 0 0 0 1'){return`1 ${c} ${x} ${y} ${z} ${m} parts/${f}`}
function actorDat(){const h=hairs[state.character],lines=['0 FILE odyssey-actor.ldr',ref(state.skin,0,-84,0,'3626b.dat'),ref(state.top,0,-60,0,'973.dat'),ref(state.top,-15.552,-51,0,'3818.dat','0.985 -0.17 0 0.17 0.985 0 0 0 1'),ref(state.top,15.552,-51,0,'3819.dat','0.985 0.17 0 -0.17 0.985 0 0 0 1'),ref(state.skin,-23.6904,-33.226,-9.8982,'3820.dat','0.985 -0.1202 0.1202 0.17 0.6964 -0.6964 0 0.707 0.707'),ref(state.skin,23.6904,-33.226,-9.8982,'3820.dat','0.985 0.1202 -0.1202 -0.17 0.6964 -0.6964 0 0.707 0.707'),ref(state.bottom,0,-28,0,'3815c01.dat')];if(state.hair&&h)lines.push(ref(h[1],0,-84,0,h[0]));return lines.join('\n')}
async function renderFigure(){
 $('figName').textContent=titleCase(state.character);$('figNote').textContent=hasSourceFace(state.character)?`${state.performance} · ${faceOrigin(state.character)} decal`:'DOG RIG · separate actor body';
 if(!hasSourceFace(state.character)){clearActor();$('portBadge').textContent='ARGOS · DOG RIG';return}
 return new Promise(resolve=>loader.parse(actorDat(),group=>{clearActor();state.root=new THREE.Group();state.root.rotation.x=Math.PI;state.root.add(group);const decal=makeDecalMesh(THREE,state.character,state.performance);if(decal)state.root.add(decal);scene.add(state.root);fit(state.mode==='hmu');$('portBadge').textContent='CROWN · NECK · L GRIP · R GRIP';persist();resolve()},e=>{console.error(e);resolve()}));
}
function persist(){const s=selection(state.character,state.performance);localStorage.setItem('word-to-theatre.odysseyFace',JSON.stringify(s));history.replaceState(null,'',`?odyssey=${encodeURIComponent(state.character)}&performance=${encodeURIComponent(state.performance)}`)}

function closeTray(){state.mode=null;state.submode=null;$('app').classList.remove('trayOpen');document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('active'));setTimeout(()=>fit(false),40)}
function openMode(mode){state.mode=mode;state.submode=mode==='hmu'?'performance':mode==='wardrobe'?'top':mode==='props'?'hand':null;$('app').classList.add('trayOpen');document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));renderTray();setTimeout(()=>fit(mode==='hmu'),40)}
function subtabs(items){$('subtabs').innerHTML=items.map(([id,label])=>`<button data-sub="${id}" class="${state.submode===id?'active':''}">${label}</button>`).join('');$('subtabs').querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{state.submode=b.dataset.sub;renderTray()})}
function section(title,html){return`<div class="section"><div class="sectionTitle">${title}</div>${html}</div>`}
function swatches(rows,current,kind){return`<div class="skins">${rows.map(([name,code,color])=>`<button class="swatch ${current===code?'active':''}" data-${kind}="${code}" title="${name}" style="background:${color}"></button>`).join('')}</div>`}
function performanceTray(){
 const src=renderSourceFace(state.character,state.performance,260);const body=$('trayBody');body.innerHTML='<div id="odSource" class="section"></div>';
 const slot=body.querySelector('#odSource');if(src){src.style.width='104px';src.style.height='104px';src.style.objectFit='cover';src.style.imageRendering='pixelated';slot.appendChild(src)}
 const info=document.createElement('div');info.style.cssText='display:inline-block;vertical-align:top;padding:8px;font-size:8px;max-width:210px';info.innerHTML=`<b>${titleCase(state.character)} × ${state.performance.toUpperCase()}</b><br>${faceOrigin(state.character)}<br><br><button id="repertory">OPEN REPERTORY</button>`;slot.appendChild(info);info.querySelector('#repertory').onclick=()=>location.href=`./from-homer-to-homer.html?character=${state.character}&performance=${state.performance}`;
 const perf=document.createElement('div');perf.className='section';perf.innerHTML='<div class="sectionTitle">CHARACTER × PERFORMANCE</div>';const names=[...new Set([...(SIGNATURES[state.character]||[]),...PERFORMANCE_NAMES])];for(const p of names){const b=document.createElement('button');b.textContent=p.toUpperCase();b.style.margin='0 5px 5px 0';b.style.minHeight='34px';b.style.fontSize='7px';if(p===state.performance)b.className='active';b.onclick=()=>{state.performance=p;renderFigure();renderTray()};perf.appendChild(b)}body.appendChild(perf)
}
function piecesTray(){const h=hairs[state.character];const rows=[['3626b.dat','standard cylindrical head','HEAD'],['973.dat','plain torso context','TORSO'],['3815c01.dat','hips + legs','LOWER']];if(state.hair&&h)rows.push([h[0],'context hair / headwear','HEADGEAR']);rows.push([`${state.character} × ${state.performance}`,'Odyssey performance decal','FACE PRINT']);$('trayBody').innerHTML='<div class="hint">Actual brick assembly plus the performance print currently wrapped onto the 3626b head.</div>'+rows.map((r,i)=>`<div class="piece"><b>${String(i+1).padStart(2,'0')} · ${r[0]}</b><span>${r[1]}</span><small>${r[2]}</small></div>`).join('')}
function renderTray(){
 $('trayTitle').textContent=state.mode==='hmu'?'HAIR / MAKEUP':state.mode==='wardrobe'?'WARDROBE':state.mode==='props'?'PROPS':'PIECES';
 if(state.mode==='hmu'){subtabs([['performance','PERFORMANCE'],['hair','HAIR / HAT'],['skin','SKIN']]);if(state.submode==='performance')return performanceTray();if(state.submode==='hair'){$('trayBody').innerHTML=section('HEADWEAR',`<button id="hairToggle">${state.hair?'REMOVE CURRENT HAIR':'RESTORE CONTEXT HAIR'}</button><div class="hint">Headwear still obeys the crown port. The Odyssey face stays a print on the head underneath.</div>`);$('hairToggle').onclick=()=>{state.hair=!state.hair;renderFigure();renderTray()};return}if(state.submode==='skin'){$('trayBody').innerHTML=section('SKIN',swatches(SKINS,state.skin,'skin'));$('trayBody').querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{state.skin=+b.dataset.skin;renderFigure();renderTray()});return}}
 if(state.mode==='wardrobe'){subtabs([['top','TOP'],['bottom','BOTTOM']]);const rows=PAINTS,current=state.submode==='top'?state.top:state.bottom;$('trayBody').innerHTML=section(state.submode.toUpperCase(),swatches(rows,current,'paint'));$('trayBody').querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{if(state.submode==='top')state.top=+b.dataset.paint;else state.bottom=+b.dataset.paint;renderFigure();renderTray()});return}
 if(state.mode==='props'){subtabs([['hand','BEAVER HAND'],['set','SET']]);$('trayBody').innerHTML='<div class="rigState"><span class="state probe">PORT READY</span><span>The Odyssey actor exposes the same L/R grip ports. Full magnetic prop solving remains in general production while this face bridge is isolated.</span></div><div class="section"><button id="general">OPEN GENERAL PROP RIG</button></div>';$('general').onclick=()=>location.href='./word-to-theatre.html';return}
 if(state.mode==='pieces'){subtabs([]);return piecesTray()}
}

document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openMode(b.dataset.mode));$('closeTray').onclick=closeTray;
$('figure').onchange=e=>{state.character=e.target.value;state.performance='neutral';defaults();renderFigure();renderActorOptions();if(state.mode)renderTray()};
$('world').onchange=()=>{};
await loader.preloadMaterials('./ldraw/LDConfig.ldr');$('ldrawReady').textContent='LDRAW READY';$('ldrawReady').classList.add('ok');
renderFigure();
window.__WORD_TO_THEATRE_ODYSSEY={state,get selection(){return selection(state.character,state.performance)},renderFigure,LIVE_FACE_CAST,CAST24};window.__MOVIEATOR_READY=true;window.__MOVIEATOR_STATE=state;

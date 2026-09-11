import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {P,SKINS,PAINTS,WORLDS,FIGURES,PROSTHETICS} from './movieator-production-data.js';
import {listDecals,paintDecal,clearDecal} from './odyssey-decals.js';   // the halfworld's Odyssey faces as head decals
import {
  MAGNET_PHASES,CLOCKS,GRIP_FRACTIONS,HANDS,HAND_GRIP_LOCAL,
  headFamily,actorPorts,isFaceCandidate,hasPrintedFacialHair,isHeadwearCandidate,isNeckLayerCandidate,
  probeCrownSocket,probeGripSegments,headwearCompatibility,handFrame,isAttachmentOnlyProp
} from './movieator-rig-v3.js';

const $=id=>document.getElementById(id);
const norm=s=>String(s||'').toLowerCase();
const DESCRIPTORS='./wag-viewer-prime-integration-20251112-055341%20copy/all-parts-descriptors.json';
const state={
  world:'simpsons',fig:null,root:null,mode:null,submode:null,catalogLoaded:false,
  cache:new Map(),partBoxCache:new Map(),
  catalog:{face:[],facialHair:[],hair:[],neck:[],top:[],bottom:[],prop:[],setprop:[]},
  look:{},magnet:null
};

function collect(node,out,seen){
  if(!node||typeof node!=='object'||seen.has(node))return;
  seen.add(node);
  if(!Array.isArray(node)){
    const filename=node.filename||node.name,description=node.description||node.desc||'',path=node.path||'';
    if(filename&&/\.dat$/i.test(filename)&&(/(^|\/)parts\//i.test(path)||!path)){
      out.push({filename:String(filename),description:String(description),path:path?String(path):`parts/${filename}`});
    }
  }
  for(const value of Array.isArray(node)?node:Object.values(node))collect(value,out,seen);
}
function classify(records){
  const primary=records.filter(r=>r.description&&!r.description.trim().startsWith('~')&&!/obsolete/i.test(r.description));
  const uniq=rows=>[...new Map(rows.map(r=>[r.filename,r])).values()].sort((a,b)=>a.description.localeCompare(b.description));
  state.catalog.face=uniq(primary.filter(isFaceCandidate));
  state.catalog.facialHair=uniq(primary.filter(hasPrintedFacialHair));
  state.catalog.hair=uniq(primary.filter(isHeadwearCandidate));
  state.catalog.neck=uniq(primary.filter(isNeckLayerCandidate));
  state.catalog.top=uniq(primary.filter(r=>/^Minifig Torso\b/i.test(r.description)&&!/with (?:Arms|Dual Mould Arms)/i.test(r.description)));
  state.catalog.bottom=uniq(primary.filter(r=>/^Minifig (?:Hips and Legs|Hips and Legs Short)\b/i.test(r.description)));
  const propWords=/\b(?:accessory|weapon|sword|saber|lightsaber|blaster|gun|rifle|pistol|shield|wand|slingshot|camera|radio|microphone|guitar|cup|mug|bottle|book|briefcase|bag|tool|axe|hammer|staff|spear|bow|torch|bat|club)\b/i;
  state.catalog.prop=uniq(primary.filter(r=>/^Minifig\b/i.test(r.description)&&propWords.test(r.description)&&!/^Minifig (?:Head|Hair|Hat|Helmet|Headgear)/i.test(r.description)));
  state.catalog.setprop=uniq(primary.filter(r=>propWords.test(r.description)));
  state.catalogLoaded=true;
  $('catalogReady').textContent='CATALOG READY';
  $('catalogReady').classList.add('ok');
  if(state.mode)renderTray();
}

const host=$('threeHost');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf1eee5);
const camera=new THREE.PerspectiveCamera(30,1,.1,10000);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.25));
const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(120,180,160);scene.add(key);
const grid=new THREE.GridHelper(280,14,0x999999,0xd2cfc7);scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('./ldraw/');
let ldrawReady=false;

function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function tick(){requestAnimationFrame(tick);resize();controls.update();renderer.render(scene,camera)}tick();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=Array.isArray(o.material)?o.material:[o.material];ms.filter(Boolean).forEach(m=>m.dispose?.())})}
function clearScene(){if(!state.root)return;scene.remove(state.root);dispose(state.root);state.root=null}
function fit(root){
  const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const extent=Math.min(170,Math.max(size.x,size.y,size.z,62));
  controls.target.copy(center);camera.position.set(center.x+extent*1.18,center.y+extent*.66,center.z+extent*1.6);
  camera.far=10000;camera.updateProjectionMatrix();grid.position.y=box.min.y-.8;
}
new ResizeObserver(()=>{resize();if(state.root)setTimeout(()=>fit(state.root),40)}).observe(host);

function ref(color,x,y,z,file,matrix='1 0 0 0 1 0 0 0 1'){return`1 ${color??16} ${x} ${y} ${z} ${matrix} parts/${file}`}

function torsoLines(part){
  const color=part.color??state.look.topColor,skin=state.look.skin;
  return[
    ref(color,0,-60,0,part.file),
    ref(color,-15.552,-51,0,'3818.dat','0.985 -0.17 0 0.17 0.985 0 0 0 1'),
    ref(color,15.552,-51,0,'3819.dat','0.985 0.17 0 -0.17 0.985 0 0 0 1'),
    ref(skin,...HANDS.left.p,'3820.dat',HANDS.left.m.join(' ')),
    ref(skin,...HANDS.right.p,'3820.dat',HANDS.right.m.join(' '))
  ];
}
async function expandUpper(part){
  try{
    const r=await fetch(`./ldraw/parts/${part.file}`,{cache:'force-cache'});if(!r.ok)throw 0;
    const text=await r.text(),out=[];
    for(const raw of text.split(/\r?\n/)){
      const a=raw.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;
      let color=+a[1];const x=+a[2],y=+a[3]-60,z=+a[4],matrix=a.slice(5,14).join(' '),file=a.slice(14).join(' ').replace(/^parts\//,'');
      const low=file.toLowerCase();
      if(low.endsWith('3820.dat'))color=state.look.skin;
      else if((low.endsWith('3818.dat')||low.endsWith('3819.dat'))&&color===14)color=state.look.skin;
      else if(color===16)color=part.color??state.look.topColor;
      out.push(ref(color,x,y,z,file,matrix));
    }
    return out.length?out:[ref(part.color??state.look.topColor,0,-60,0,part.file)];
  }catch{return[ref(part.color??state.look.topColor,0,-60,0,part.file)]}
}
function originalHead(){return state.fig?.parts.find(p=>p.role==='HEAD'||p.role==='BABY_HEAD')||null}
function currentHead(){
  if(state.look.prosthetic)return{file:state.look.prosthetic.filename,filename:state.look.prosthetic.filename,description:state.look.prosthetic.description,mountY:state.look.prosthetic.mountY};
  if(state.look.face)return{file:state.look.face.filename,filename:state.look.face.filename,description:state.look.face.description,mountY:-84};
  return originalHead();
}
function currentPorts(){return actorPorts({head:currentHead(),body:state.fig?.body})}

function effectiveParts(){
  const out=[];
  for(const part of state.fig.parts){
    if((state.look.face||state.look.prosthetic)&&(part.role==='HEAD'||part.role==='BABY_HEAD'))continue;
    if(state.look.top&&(part.role==='TORSO'||part.role==='UPPER'))continue;
    if(state.look.bottom&&part.role==='LOWER')continue;
    if(state.look.hair!==undefined&&part.role==='HEADGEAR')continue;
    out.push({...part});
  }
  if(state.look.face)out.push(P('HEAD',state.look.face.filename,state.look.face.description,{exact:false,wardrobe:true,mountY:-84}));
  if(state.look.prosthetic)out.push(P(state.fig.body==='baby'?'BABY_HEAD':'HEAD',state.look.prosthetic.filename,state.look.prosthetic.description,{exact:false,wardrobe:true,mountY:state.look.prosthetic.mountY}));
  if(state.look.top)out.push(P('TORSO',state.look.top.filename,state.look.top.description,{exact:false,color:state.look.topColor,wardrobe:true}));
  if(state.look.bottom)out.push(P('LOWER',state.look.bottom.filename,state.look.bottom.description,{exact:false,color:state.look.bottomColor,wardrobe:true}));
  if(state.look.hair)out.push(P('HEADGEAR',state.look.hair.filename,state.look.hair.description,{exact:false,color:state.look.hairColor,wardrobe:true,status:state.look.hairStatus}));
  if(state.look.leftProp)out.push(P('HAND_PROP',state.look.leftProp.record.filename,state.look.leftProp.record.description,{exact:false,color:state.look.propColor,side:'left',pose:state.look.leftProp.pose,status:'CLICK'}));
  if(state.look.rightProp)out.push(P('HAND_PROP',state.look.rightProp.record.filename,state.look.rightProp.record.description,{exact:false,color:state.look.propColor,side:'right',pose:state.look.rightProp.pose,status:'CLICK'}));
  if(state.look.setProp)out.push(P('SET_PROP',state.look.setProp.filename,state.look.setProp.description,{exact:false,color:state.look.propColor,status:'TRY'}));
  return out;
}

function matrix3FromQuat(q){
  const m4=new THREE.Matrix4().makeRotationFromQuaternion(q),e=m4.elements;
  return[e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]];
}
function poseMatrix4(pose){
  const m=new THREE.Matrix4();m.set(
    pose.matrix[0],pose.matrix[1],pose.matrix[2],pose.t[0],
    pose.matrix[3],pose.matrix[4],pose.matrix[5],pose.t[1],
    pose.matrix[6],pose.matrix[7],pose.matrix[8],pose.t[2],
    0,0,0,1
  );return m;
}
async function partBox(file){
  if(state.partBoxCache.has(file))return state.partBoxCache.get(file).clone();
  try{
    const group=await loader.loadAsync(`./ldraw/parts/${file}`),box=new THREE.Box3().setFromObject(group);
    state.partBoxCache.set(file,box.clone());dispose(group);return box;
  }catch{return new THREE.Box3(new THREE.Vector3(-4,-4,-4),new THREE.Vector3(4,4,4))}
}
function pointAlong(seg,f){return new THREE.Vector3(...seg.origin).add(new THREE.Vector3(...seg.axis).multiplyScalar(seg.length*f))}
function poseFor(seg,frame,targetAxis,clock,fraction){
  const from=new THREE.Vector3(...seg.axis).normalize(),to=new THREE.Vector3(...targetAxis).normalize();
  const align=new THREE.Quaternion().setFromUnitVectors(from,to);
  const around=new THREE.Quaternion().setFromAxisAngle(to,clock*Math.PI/180);
  const q=around.multiply(align);
  const local=pointAlong(seg,fraction).applyQuaternion(q),target=new THREE.Vector3(...frame.center),t=target.sub(local);
  return{t:[t.x,t.y,t.z],matrix:matrix3FromQuat(q),clock,fraction,axis:[to.x,to.y,to.z],segment:seg};
}
function actorClearanceScore(box,side,pose,seg){
  const b=box.clone().applyMatrix4(poseMatrix4(pose)),head=currentHead(),hy=head?.mountY??-84;
  const headCenter=new THREE.Vector3(0,hy,0),headRadius=headFamily(head)==='standard'?19:30;
  const headDist=b.distanceToPoint(headCenter);
  let penalty=Math.max(0,headRadius-headDist)*30;
  const c=b.getCenter(new THREE.Vector3());
  if(side==='right'&&c.x<12)penalty+=(12-c.x)*4;
  if(side==='left'&&c.x>-12)penalty+=(c.x+12)*4;
  const overlap=2*Math.min(pose.fraction*seg.length,(1-pose.fraction)*seg.length);
  if(overlap<6)penalty+=(6-overlap)*100;
  if(seg.radius<3.2||seg.radius>4.8)penalty+=10000;
  penalty+=Math.abs(pose.fraction-(seg.length>=28?.72:.5))*2;
  if(pose.axis[0]!==0||pose.axis[2]!==0)penalty+=3;
  return{penalty,clear:headDist>=headRadius,headDist,overlap,box:b};
}
async function solveMagneticGrip(record,probe,side){
  const frame=handFrame(side),box=await partBox(record.filename),candidates=[];
  const axes=[frame.axes.vertical,frame.axes.localY,frame.axes.localZ];
  for(const seg of probe.segments.slice(0,4)){
    for(const axis of axes)for(const clock of CLOCKS)for(const fraction of GRIP_FRACTIONS){
      const pose=poseFor(seg,frame,axis,clock,fraction),score=actorClearanceScore(box,side,pose,seg);
      candidates.push({...pose,...score});
    }
  }
  candidates.sort((a,b)=>a.penalty-b.penalty);
  const best=candidates[0];
  if(!best)return{ok:false,status:'BLOCKED',reason:'NO GRIP POSE'};
  const ok=best.overlap>=6&&best.segment.radius>=3.2&&best.segment.radius<=4.8;
  return{ok,status:ok?'CLICK':'TRY',reason:ok?`HELD · ${Math.round(best.fraction*100)}% · ${best.clock}°`:'FIT UNRESOLVED',pose:best};
}

let magnetTimer=0;
function magneticLabel(phase,detail=''){
  clearTimeout(magnetTimer);
  const el=$('magnet');el.textContent=detail?`${phase} · ${detail}`:phase;el.className=`magnet on ${phase.toLowerCase()}`;
  if(phase==='HEAR')navigator.vibrate?.(5);
  if(phase==='CLICK'){navigator.vibrate?.([8,18,16]);clickSound()}
  magnetTimer=setTimeout(()=>{el.classList.remove('on')},phase==='CLICK'?650:500);
}
function clickSound(){
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const ctx=clickSound.ctx||(clickSound.ctx=new A()),o=ctx.createOscillator(),g=ctx.createGain();
    o.frequency.setValueAtTime(860,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(420,ctx.currentTime+.035);
    g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.04);
    o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.045);
  }catch{}
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function commitProp(side,record){
  magneticLabel('HEAR',side.toUpperCase());
  await wait(45);
  const probe=await probeGripSegments(record,{cache:state.cache});
  if(!probe.ok){magneticLabel('BLOCKED',probe.reason);return}
  magneticLabel('PULL',`${probe.segments.length} SHAFT${probe.segments.length===1?'':'S'}`);await wait(45);
  magneticLabel('ALIGN','HAND FRAME');await wait(45);
  magneticLabel('SLIDE','GRIP VOLUME');
  const solved=await solveMagneticGrip(record,probe,side);
  if(!solved.ok){magneticLabel('BLOCKED',solved.reason);return}
  await wait(45);magneticLabel('CLOCK',`${solved.pose.clock}°`);await wait(45);
  state.look[`${side}Prop`]={record,probe,pose:solved.pose};
  state.look[`${side}Clock`]=solved.pose.clock;
  await renderFigure();
  magneticLabel('CLICK',solved.reason);
  if(state.mode==='props')renderTray();
}

async function buildAssembly(){
  const lines=[`0 FILE production_${state.fig.id}.mpd`,`0 Name: ${state.fig.name}`,'0 !LDRAW_ORG Model','0 // Movieator Beaver: only committed slots',''];
  for(const part of effectiveParts()){
    const color=part.color??16;
    switch(part.role){
      case'HEAD':lines.push(ref(part.color??state.look.skin,0,part.mountY??-84,0,part.file));break;
      case'BABY_HEAD':lines.push(ref(part.color??state.look.skin,0,part.mountY??-58,0,part.file));break;
      case'HEADGEAR':lines.push(ref(color,0,-84,0,part.file));break;
      case'UPPER':lines.push(...await expandUpper(part));break;
      case'TORSO':lines.push(...torsoLines(part));break;
      case'LOWER':lines.push(ref(color,0,-28,0,part.file));break;
      case'OVERLAY':lines.push(ref(color,0,-28,0,part.file));break;
      case'BABY':lines.push(ref(color,0,-42,0,part.file));break;
      case'HAND_PROP':lines.push(ref(color,...part.pose.t,part.file,part.pose.matrix.join(' ')));break;
      case'SET_PROP':lines.push(ref(color,55,-18,24,part.file));break;
    }
    lines.push('');
  }
  return lines.join('\n');
}
async function renderFigure(){
  if(!ldrawReady||!state.fig)return;
  $('portBadge').textContent='BUILDING';
  const text=await buildAssembly();
  return new Promise(resolve=>loader.parse(text,group=>{
    clearScene();state.root=new THREE.Group();state.root.rotation.x=Math.PI;state.root.add(group);scene.add(state.root);if(state.look.decal)paintDecal(THREE,group,state.look.decal.who,state.look.decal.emotion,{y:currentHead()?.mountY??-84});fit(state.root);updatePortBadge();resolve();
  },error=>{$('portBadge').textContent='LOAD ERROR';$('portBadge').className='portBadge bad';console.error(error);resolve()}));
}
function updatePortBadge(){
  const p=currentPorts(),held=[state.look.leftProp?'L✓':'L GRIP',state.look.rightProp?'R✓':'R GRIP'];
  $('portBadge').textContent=[p.crown?'CROWN':'NO CROWN',p.neckLayer?'NECK':'NO NECK',...held].join(' · ');
  $('portBadge').className='portBadge';
}

function worldFigures(){return FIGURES.filter(f=>f.world===state.world)}
function resetLook(render=true){
  const f=state.fig;state.look={skin:f?.skin??14,face:null,decal:null,prosthetic:null,hair:undefined,hairStatus:null,neck:null,top:null,bottom:null,topColor:15,bottomColor:1,hairColor:70,propColor:70,leftProp:null,rightProp:null,setProp:null,leftClock:0,rightClock:0};
  if(render)renderFigure();
}
function renderSelectors(){
  $('world').innerHTML=WORLDS.map(w=>`<option value="${w.id}" ${w.id===state.world?'selected':''}>${w.label}</option>`).join('');
  $('figure').innerHTML=worldFigures().map(f=>`<option value="${f.id}" ${state.fig?.id===f.id?'selected':''}>${f.name}</option>`).join('');
}
function selectFigure(fig){
  if(!fig)return;state.fig=fig;state.world=fig.world;resetLook(false);renderSelectors();$('figName').textContent=fig.name;$('figNote').textContent=fig.note;closeTray();renderFigure();
}

function openMode(mode){state.mode=mode;state.submode=mode==='hmu'?'face':mode==='wardrobe'?'top':mode==='props'?'right':null;$('app').classList.add('trayOpen');document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));renderTray();setTimeout(()=>state.root&&fit(state.root),60)}
function closeTray(){state.mode=null;state.submode=null;$('app').classList.remove('trayOpen');document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('active'));setTimeout(()=>state.root&&fit(state.root),60)}
function tabsForMode(){
  if(state.mode==='hmu')return[['face','FACE'],['facialHair','FACIAL HAIR'],['prosthetic','PROSTHETIC'],['hair','HAIR / HAT'],['neck','BEARD / NECK'],['skin','SKIN']];
  if(state.mode==='wardrobe')return[['top','TOP'],['bottom','BOTTOM']];
  if(state.mode==='props')return[['left','LEFT HAND'],['right','RIGHT HAND'],['setprop','SET'],['clock','CLOCK']];
  return[];
}
function rigLine(status,reason){return`<div class="rigState"><span class="state ${status.toLowerCase()}">${status}</span><span>${reason}</span></div>`}
function loading(message){$('trayBody').innerHTML=rigLine('PROBE',message)+'<div class="hint">The actor rig is live while the catalog hydrates.</div>'}
function renderTray(){
  if(!state.mode)return;$('trayTitle').textContent=state.mode==='hmu'?'HAIR / MAKEUP':state.mode.toUpperCase();
  const tabs=tabsForMode();$('subtabs').innerHTML=tabs.map(([id,label])=>`<button data-sub="${id}" class="${state.submode===id?'active':''}">${label}</button>`).join('');
  document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{state.submode=b.dataset.sub;renderTray()});
  if(state.mode==='pieces')return renderPieces();
  if(state.submode==='face'||state.submode==='facialHair')return renderFaces(state.submode==='facialHair');
  if(state.submode==='prosthetic')return renderProsthetics();
  if(state.submode==='hair')return renderHair();
  if(state.submode==='neck')return renderNeck();
  if(state.submode==='skin')return renderSkin();
  if(state.submode==='top'||state.submode==='bottom')return renderWardrobeSlot(state.submode);
  if(state.submode==='left'||state.submode==='right')return renderHandProps(state.submode);
  if(state.submode==='setprop')return renderSetProps();
  if(state.submode==='clock')return renderClock();
}
function renderFaces(beardsOnly=false){
  if(!state.catalogLoaded)return loading(beardsOnly?'LOADING BEARDED / STUBBLED FACES':'LOADING STANDARD FACE FAMILY');
  const rows=beardsOnly?state.catalog.facialHair:state.catalog.face;
  $('trayBody').innerHTML=rigLine('CLICK',beardsOnly?'PRINTED FACIAL HAIR · 3626 FAMILY':'3626 STANDARD HEAD FAMILY')+`<div class="hint">${beardsOnly?'Beard, moustache, stubble, goatee and sideburn prints. Head geometry stays standard.':'FACE changes print/expression without substituting a sculpt.'}</div><div class="search"><input id="q" placeholder="${beardsOnly?'search beard / moustache / stubble':'search face / expression'}"></div><div id="rows"></div>`;
  const draw=()=>{
    const q=norm($('q').value),list=(q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)):rows).slice(0,100);
    $('rows').innerHTML=`<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed head</span><span class="state click">CLICK</span></button>`+list.map(r=>`<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('');
    document.querySelector('[data-original]').onclick=()=>{state.look.face=null;state.look.prosthetic=null;state.look.hair=undefined;state.look.neck=null;renderFigure();renderTray()};
    document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{state.look.face=rows.find(r=>r.filename===b.dataset.file);state.look.prosthetic=null;state.look.neck=null;renderFigure();renderTray()});
  };$('q').oninput=draw;draw();
  if(!beardsOnly)renderDecals();
}
/* ODYSSEY DOT FACES: the halfworld's twelve drawn faces (world/faces/odyssey) painted over the current head as a decal, one direction at a time. */
async function renderDecals(){
  const box=document.createElement('div');box.className='decals';box.innerHTML=rigLine('CLICK','ODYSSEY DOT FACES · HALFWORLD DECALS')+'<div class="hint">The halfworld\'s drawn faces, dotted and masked to the print area, over whatever head is on. Pick a face, then a direction.</div><div id="decalRows"></div>';
  $('trayBody').appendChild(box);
  let index;try{index=await listDecals()}catch{box.querySelector('#decalRows').innerHTML='<div class="hint">no decals here: run tools/decals.js</div>';return}
  const d=state.look.decal||{who:null,emotion:'neutral'};
  const draw=()=>{
    const faces=Object.keys(index.faces),emos=index.emotions;
    $('decalRows').innerHTML=`<div class="rows">${faces.map(w=>`<button class="choice${d.who===w?' active':''}" data-decal="${w}"><b>${w.toUpperCase()}</b><span>${Object.keys(index.faces[w]).length} directions</span><span class="state click">CLICK</span></button>`).join('')}<button class="choice original" data-decal=""><b>NO DECAL</b><span>the head\'s own print</span><span class="state click">CLICK</span></button></div>`+(d.who?`<div class="rows">${emos.map(e=>`<button class="choice${d.emotion===e?' active':''}" data-emotion="${e}"><b>${e.toUpperCase()}</b><span>${index.faces[d.who][e]?index.faces[d.who][e].ink+' dots':''}</span></button>`).join('')}</div>`:'');
    $('decalRows').querySelectorAll('[data-decal]').forEach(b=>b.onclick=()=>{const w=b.dataset.decal;state.look.decal=w?{who:w,emotion:d.emotion||'neutral'}:null;if(!w&&state.root)clearDecal(state.root.children[0]);renderFigure();renderTray()});
    $('decalRows').querySelectorAll('[data-emotion]').forEach(b=>b.onclick=()=>{state.look.decal={who:d.who,emotion:b.dataset.emotion};renderFigure();renderTray()});
  };draw();
}
function renderProsthetics(){
  $('trayBody').innerHTML=rigLine('CLICK','CALIBRATED COMPLETE HEAD REPLACEMENTS')+'<div class="hint">A prosthetic owns the complete head volume and closes crown / beard ports unless separately calibrated.</div>'+PROSTHETICS.map(r=>`<button class="choice" data-pro="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('');
  document.querySelectorAll('[data-pro]').forEach(b=>b.onclick=()=>{state.look.prosthetic=PROSTHETICS.find(r=>r.filename===b.dataset.pro);state.look.face=null;state.look.hair=null;state.look.neck=null;renderFigure();renderTray()});
}
async function renderHair(){
  const head=currentHead(),ports=currentPorts();
  if(!ports.crown){$('trayBody').innerHTML=rigLine('BLOCKED','CURRENT HEAD EXPOSES NO CROWN PORT')+'<div class="hint">Choose a standard FACE first. Prosthetics keep their authored silhouette.</div>';return}
  if(!state.catalogLoaded)return loading('LOADING HEADWEAR');
  const rows=state.catalog.hair;
  $('trayBody').innerHTML=rigLine('HEAR','CROWN OPEN · CLICK = PROVED · TRY = UNRESOLVED')+'<div class="hint">TRY is selectable. It means legitimate headwear whose socket is not yet mechanically proven, not a rejection.</div><div class="search"><input id="q" placeholder="search hair / hat / helmet"></div><div id="rows"></div>';
  const draw=()=>{
    const q=norm($('q').value),list=(q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)):rows).slice(0,40);
    $('rows').innerHTML=`<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed headwear</span><span class="state click">CLICK</span></button><button class="choice none" data-none><b>NONE</b><span>leave crown open</span><span class="state click">CLICK</span></button>`+list.map(r=>`<button class="choice" data-probe="${r.filename}" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state probe">PROBE</span></button>`).join('');
    document.querySelector('[data-original]').onclick=()=>{state.look.hair=undefined;renderFigure()};
    document.querySelector('[data-none]').onclick=()=>{state.look.hair=null;renderFigure()};
    for(const record of list)headwearCompatibility({actorHead:head,candidate:record,cache:state.cache}).then(test=>{
      const b=document.querySelector(`[data-probe="${CSS.escape(record.filename)}"]`);if(!b)return;
      b.disabled=!test.ok;const badge=b.querySelector('.state');badge.textContent=test.status;badge.className=`state ${test.status.toLowerCase()}`;b.title=test.reason;
      if(test.ok)b.onclick=async()=>{magneticLabel('HEAR','CROWN');await wait(40);magneticLabel('PULL',test.status);await wait(40);state.look.hair=record;state.look.hairStatus=test.status;await renderFigure();magneticLabel(test.status==='CLICK'?'CLICK':'TRY',test.reason)};
    });
  };$('q').oninput=draw;draw();
}
function renderNeck(){
  if(!currentPorts().neckLayer){$('trayBody').innerHTML=rigLine('BLOCKED','CURRENT HEAD EXPOSES NO NECK-LAYER PORT');return}
  if(!state.catalogLoaded)return loading('LOADING PHYSICAL BEARDS / NECK LAYERS');
  const rows=state.catalog.neck;
  $('trayBody').innerHTML=rigLine('TRY','PHYSICAL FACIAL HAIR / NECK LAYERS')+'<div class="hint">These are separate geometry. We surface them now, but they stay TRY until neck clearance is solved.</div><div class="search"><input id="q" placeholder="search beard / moustache / scarf / collar"></div><div id="rows"></div>';
  const draw=()=>{const q=norm($('q').value),list=(q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)):rows).slice(0,60);$('rows').innerHTML=list.map(r=>`<button class="choice" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state try">TRY</span></button>`).join('')};$('q').oninput=draw;draw();
}
function renderSkin(){
  if(headFamily(currentHead())!=='standard'){$('trayBody').innerHTML=rigLine('BLOCKED','PROSTHETIC HEAD HAS AUTHORED SKIN');return}
  $('trayBody').innerHTML=rigLine('CLICK','STANDARD HEAD + REBUILDABLE HANDS')+`<div class="section"><div class="sectionTitle">SKIN</div><div class="skins">${SKINS.map(s=>`<button class="swatch ${state.look.skin===s.code?'active':''}" data-skin="${s.code}" title="${s.name}" style="background:${s.hex}"></button>`).join('')}</div></div>`;
  document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{state.look.skin=+b.dataset.skin;renderSkin();renderFigure()});
}
function renderWardrobeSlot(slot){
  if(state.fig.body==='baby'){$('trayBody').innerHTML=rigLine('BLOCKED','BABY RIG HAS DIFFERENT BODY PORTS');return}
  if(!state.catalogLoaded)return loading(`LOADING ${slot.toUpperCase()}`);
  const rows=state.catalog[slot];$('trayBody').innerHTML=rigLine('CLICK',`STANDARD ${slot.toUpperCase()} SLOT`)+`<div class="search"><input id="q" placeholder="search ${slot}"></div><div id="rows"></div>`;
  const draw=()=>{const q=norm($('q').value),list=(q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)):rows).slice(0,80);$('rows').innerHTML=`<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed ${slot}</span><span class="state click">CLICK</span></button>`+list.map(r=>`<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('');document.querySelector('[data-original]').onclick=()=>{state.look[slot]=null;renderFigure()};document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{state.look[slot]=rows.find(r=>r.filename===b.dataset.file);renderFigure()})};$('q').oninput=draw;draw();
}
function renderHandProps(side){
  if(state.fig.body==='baby'){$('trayBody').innerHTML=rigLine('BLOCKED','BABY RIG HAS NO STANDARD HAND GRIP');return}
  if(!state.catalogLoaded)return loading('LOADING HAND PROPS');
  const rows=state.catalog.prop,held=state.look[`${side}Prop`];
  $('trayBody').innerHTML=rigLine(held?'CLICK':'HEAR',held?`${side.toUpperCase()} HAND HOLDS ${held.record.filename}`:`${side.toUpperCase()} HAND LISTENING`)+
    '<div class="hint">Beaver probes grip shafts, then searches SLIDE × CLOCK × hand frame. CLICK occurs only after a solved grip pose.</div><div class="search"><input id="q" placeholder="search hand props"></div><div id="rows"></div>';
  const draw=()=>{
    const q=norm($('q').value),list=(q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)):rows).slice(0,32);
    $('rows').innerHTML=`<button class="choice none" data-none><b>NONE</b><span>empty ${side} hand</span><span class="state click">CLICK</span></button>`+list.map(r=>`<button class="choice" data-probe="${r.filename}" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state probe">PROBE</span></button>`).join('');
    document.querySelector('[data-none]').onclick=()=>{state.look[`${side}Prop`]=null;renderFigure();renderTray()};
    for(const record of list)probeGripSegments(record,{cache:state.cache}).then(test=>{
      const b=document.querySelector(`[data-probe="${CSS.escape(record.filename)}"]`);if(!b)return;const semanticTry=isAttachmentOnlyProp(record);
      b.disabled=!test.ok;const status=test.ok?(semanticTry?'TRY':'HEAR'):'BLOCKED',badge=b.querySelector('.state');badge.textContent=status;badge.className=`state ${status.toLowerCase()}`;b.title=test.reason;
      if(test.ok)b.onclick=()=>commitProp(side,record);
    });
  };$('q').oninput=draw;draw();
}
function renderSetProps(){
  if(!state.catalogLoaded)return loading('LOADING SET PROPS');const rows=state.catalog.setprop;
  $('trayBody').innerHTML=rigLine('TRY','SET PROP DOES NOT OCCUPY A HAND PORT')+'<div class="search"><input id="q" placeholder="search set props"></div><div id="rows"></div>';
  const draw=()=>{const q=norm($('q').value),list=q?rows.filter(r=>norm(`${r.description} ${r.filename}`).includes(q)).slice(0,60):[];$('rows').innerHTML=`<button class="choice none" data-none><b>NONE</b><span>remove set prop</span></button>`+list.map(r=>`<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state try">SET</span></button>`).join('');document.querySelector('[data-none]').onclick=()=>{state.look.setProp=null;renderFigure()};document.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{state.look.setProp=rows.find(r=>r.filename===b.dataset.file);renderFigure()})};$('q').oninput=draw;draw();
}
function renderClock(){
  $('trayBody').innerHTML='<div class="hint">Automatic Beaver chooses a safe clock. These controls deliberately override it while preserving the solved grip point.</div>'+['left','right'].map(side=>{const held=state.look[`${side}Prop`];return`<div class="section"><div class="sectionTitle">${side.toUpperCase()} · ${held?held.record.description:'EMPTY'}</div><div class="clocks">${CLOCKS.map(c=>`<button class="clock ${held?.pose.clock===c?'active':''}" data-clock="${side}|${c}" ${held?'':'disabled'}>${c}°</button>`).join('')}</div></div>`}).join('');
  document.querySelectorAll('[data-clock]').forEach(b=>b.onclick=async()=>{const[side,val]=b.dataset.clock.split('|'),held=state.look[`${side}Prop`];if(!held)return;held.pose=poseFor(held.pose.segment,handFrame(side),held.pose.axis,+val,held.pose.fraction);held.pose.clock=+val;await renderFigure();magneticLabel('CLICK',`CLOCK ${val}°`);renderClock()});
}
async function renderPieces(){
  const parts=effectiveParts(),ports=currentPorts();
  $('trayBody').innerHTML=`<div class="slotSummary"><div class="slotCard"><b>HEAD FAMILY</b><span>${headFamily(currentHead()).toUpperCase()}</span><small>${currentHead()?.file||currentHead()?.filename||''}</small></div><div class="slotCard"><b>OPEN PORTS</b><span>${[ports.crown?'CROWN':null,ports.neckLayer?'NECK':null,ports.leftGrip?'L GRIP':null,ports.rightGrip?'R GRIP':null].filter(Boolean).join(' · ')||'NONE'}</span></div></div>`+parts.map((p,i)=>`<button class="piece" data-piece="${p.file}"><b>${String(i+1).padStart(2,'0')} · ${p.file}</b><span>${p.description}</span><small>${p.role}${p.status?` · ${p.status}`:''}</small></button>`).join('')+'<div id="header"></div>';
  document.querySelectorAll('[data-piece]').forEach(b=>b.onclick=async()=>{try{const r=await fetch(`./ldraw/parts/${b.dataset.piece}`),text=await r.text();$('header').innerHTML=`<pre class="headerText">${escapeHtml(text.split(/\r?\n/).slice(0,28).join('\n'))}</pre>`}catch{}});
}
const escapeHtml=s=>s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>state.mode===b.dataset.mode?closeTray():openMode(b.dataset.mode));
$('closeTray').onclick=closeTray;
$('world').onchange=e=>{state.world=e.target.value;state.fig=worldFigures()[0];resetLook(false);renderSelectors();selectFigure(state.fig)};
$('figure').onchange=e=>selectFigure(FIGURES.find(f=>f.id===e.target.value));

renderSelectors();state.fig=worldFigures()[0];$('figName').textContent=state.fig.name;$('figNote').textContent=state.fig.note;resetLook(false);
try{
  await loader.preloadMaterials('./ldraw/LDConfig.ldr');ldrawReady=true;$('ldrawReady').textContent='LDRAW READY';$('ldrawReady').classList.add('ok');await renderFigure();
}catch(e){$('ldrawReady').textContent='LDRAW ERROR';$('ldrawReady').classList.add('bad');console.error(e)}

async function selfTest(){
  const checks=[];
  checks.push(headFamily({file:'3626b.dat',description:'Minifig Head'})==='standard');
  checks.push(headFamily({file:'15527p02.dat',description:'Homer Simpson'})==='prosthetic');
  const hw=await probeCrownSocket({filename:'21787.dat'},{cache:state.cache});checks.push(hw.ok);
  const blocked=await headwearCompatibility({actorHead:{file:'15527p02.dat',description:'Homer Simpson'},candidate:{filename:'21787.dat',description:'Minifig Hair Short Quiff'},cache:state.cache});checks.push(!blocked.ok);
  const axe=await probeGripSegments({filename:'39802.dat',description:'Minifig Axe with Pick End and Long Handle'},{cache:state.cache});checks.push(axe.ok&&axe.segments.length>0);
  const frame=handFrame('right');checks.push(frame.center.length===3&&frame.axes.vertical.length===3);
  const pass=checks.filter(Boolean).length;$('rigReady').textContent=`BEAVER ${pass}/${checks.length}`;$('rigReady').classList.add(pass===checks.length?'ok':'bad');
  window.__MOVIEATOR_BEAVER={pass:pass===checks.length,checks};
}
await selfTest();

async function loadCatalog(){
  try{const r=await fetch(DESCRIPTORS);if(!r.ok)throw 0;const data=await r.json(),records=[];collect(data,records,new WeakSet());classify(records)}
  catch(e){$('catalogReady').textContent='CATALOG ERROR';$('catalogReady').classList.add('bad');console.error(e)}
}
loadCatalog();
window.__MOVIEATOR_READY=true;
window.__MOVIEATOR_STATE=state;

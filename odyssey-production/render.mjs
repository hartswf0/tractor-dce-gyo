import {renderScene} from '/halfworld/engine/halfworld-engine.mjs';
import sourceScene from '/halfworld/scenes/OD-B23-S04.mjs';
const C = await (await fetch('bed-test.contract.json')).json();
const variant = new URLSearchParams(location.search).get('variant') || 'v3';
const repaired = variant !== 'v1';
const screen = document.querySelector('#screen'), status = document.querySelector('#status');
const voice = document.querySelector('#voice'), ref = document.querySelector('#reference');
const out = screen.getContext('2d');
const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1280,720); renderer.setPixelRatio(1);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = repaired ? 1.0 : 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#191e30');
const camera = new THREE.PerspectiveCamera(42,16/9,1,5000);
scene.add(new THREE.HemisphereLight(0xd4deff,0x725037,0.75));
const key = new THREE.DirectionalLight(0xffd8a8,1.7); key.position.set(-350,500,400); key.castShadow=true;
key.shadow.mapSize.set(2048,2048); Object.assign(key.shadow.camera,{left:-700,right:700,top:700,bottom:-700,near:1,far:1800}); scene.add(key);
const rim = new THREE.DirectionalLight(0x9cbfff,1.2); rim.position.set(350,300,-800); scene.add(rim);
const fire = new THREE.PointLight(0xff8133,2.1,650); fire.position.set(0,95,-317); scene.add(fire);
const manager = new THREE.LoadingManager(); const missing = [], loaded = new Set();
manager.onError = url => missing.push(url);
manager.onProgress = url => loaded.add(url);
const loader = new THREE.LDrawLoader(manager); loader.path='./native/ldraw/'; loader.smoothNormals=true;
loader.separateObjects=true; // world/main.js:288: preserve nested part parse scopes.
loader.setFileMap(await (await fetch('ldraw-map.json')).json());
await new Promise((resolve,reject)=>loader.load('LDConfig.ldr',resolve,undefined,reject));
const props = new Props.Props({scene,loader,M:40});
const reports = [];
function stripLines(g) {const lines=[];g.traverse(o=>{if(o.isLine||o.isLineSegments)lines.push(o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});for(const l of lines)l.parent.remove(l);return g;}
async function build(name,ops) {
  status.textContent='Building '+name;
  const program={name,ops}, result=Dsl.compile(program); reports.push({name,program,report:result.report});
  if(result.report.errors.length||result.report.unknown.length||result.report.floating) throw new Error(name+': rejected DSL assembly '+JSON.stringify(result.report));
  const item=await props.add({id:name,mpd:Dsl.toMPD(result,name),x:0,y:0,z:0,yaw:0,src:{film:'OD-B23-S04'}},true);
  if(!item)throw new Error('Native build failed: '+name); return item.group;
}
status.textContent='Building the megaron from native LDraw parts…';
const hallOps=[
 {op:'slab',x:-24,z:-34,w:48,d:36,y:0,plates:1,col:19},
 {op:'box',x:-24,z:-34,w:19,d:1,y:0,h:13,col:28}, {op:'box',x:5,z:-34,w:19,d:1,y:0,h:13,col:28},
 {op:'box',x:-5,z:-34,w:10,d:1,y:0,h:1,col:70},
 {op:'box',x:-24,z:-34,w:1,d:36,y:0,h:10,col:28},
 {op:'box',x:23,z:-34,w:1,d:12,y:0,h:10,col:28}, {op:'box',x:23,z:-15,w:1,d:17,y:0,h:10,col:28},
 {op:'box',x:-24,z:-34,w:48,d:1,y:13,h:1,col:70},
 {op:'column',x:-12,z:-22,y:0,h:12,col:19}, {op:'column',x:12,z:-22,y:0,h:12,col:19},
 {op:'box',x:-2,z:-18,w:4,d:4,y:0,h:1,col:72},
 {op:'part',part:repaired?'37775':'85959',col:25,x:0,z:-16,y:1},
 {op:'part',part:repaired?'37775':'85959',col:46,x:-1,z:-17,y:1},
];
// Every stair tread is supported down to the floor. The actor uses its entrance portal.
for(let i=0;i<7;i++)hallOps.push({op:'box',x:19,z:-13+i*2,w:4,d:2,y:0,h:i+1,col:19});
await build('megaron',hallOps);
// An explicitly labelled chamber insert. It is never placed in the actors' hall.
const bed=await build('rooted-bed',[
 {op:'slab',x:44,z:-22,w:14,d:16,y:0,plates:1,col:28},
 {op:'box',x:47,z:-20,w:1,d:1,y:0,h:2,col:70},
 {op:'box',x:52,z:-20,w:1,d:1,y:0,h:2,col:70},
 {op:'box',x:47,z:-11,w:1,d:1,y:0,h:2,col:70},
 {op:'box',x:52,z:-11,w:1,d:1,y:0,h:2,col:70},
 {op:'box',x:47,z:-20,w:6,d:10,y:2,h:1,col:70},
 {op:'slab',x:47,z:-20,w:6,d:10,y:3,plates:2,col:19},
 {op:'slab',x:47,z:-20,w:6,d:2,y:3,plates:3,col:15},
 {op:'column',x:46,z:-11,y:0,h:5,col:70},
 {op:'box',x:46,z:-11,w:2,d:1,y:2,h:1,col:70},
 {op:'box',x:44,z:-10,w:4,d:1,y:0,h:1,col:70},
 {op:'box',x:46,z:-12,w:1,d:5,y:0,h:1,col:70},
]);
const actors={};
for(const [name,station] of Object.entries(C.initial)) {
 status.textContent='Loading native cast: '+name;
 const baseName = name==='penelope' ? 'penelope-ithaca' : name==='telemachus' ? 'telemachus-ithaca' : name;
 // The restored king is at home; the native costume is retained, his battle spear removed.
 const def={...Minifig.DEFS[baseName],weapon:null};
 const rig=Minifig.skeleton(40,def), groups=[];
 for(const [slot,part,col] of Minifig.partsOf(def)){
   const g=stripLines(await props.parse(`0 FILE part.ldr\n0 !LDRAW_ORG Unofficial_Model\n1 ${col} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${part}.dat`,'part.ldr'));
   let count=0;g.traverse(o=>{if(o.isMesh)count++});if(!count)throw new Error('Empty geometry: '+part);
   groups.push(g);
 }
 Minifig.mount(rig,groups,def,scene);
 const perf=Perform.attach({name},rig);perf.face=Face.attach(rig,def.face);perf.life=0.035;
 actors[name]={rig,perf,station};
}
// Match the native material palette to an sRGB output pipeline exactly once per material.
if(repaired){const adjusted=new Set();scene.traverse(o=>{if(!o.isMesh||o.name==='face')return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(adjusted.has(m))continue;adjusted.add(m);m.color?.convertSRGBToLinear();if(m.roughness!=null)m.roughness=Math.max(.4,m.roughness);}});}
const smooth = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function stageTime(t){
 if(!repaired)return Math.min(78,t*78/C.recordingDuration);
 const knots=C.syncKnots;for(let i=1;i<knots.length;i++){const a=knots[i-1],b=knots[i];if(t<=b[1])return a[0]+(b[0]-a[0])*(t-a[1])/(b[1]-a[1]);}return 78;
}
function world(st){return new THREE.Vector3((st.x-.5)*960,8,-660+st.z*660);}
function mark(name){const p=world(C.stations[name]);if(variant==='v3'&&name==='stair_up'){p.x=420;p.z=-40;}if(repaired&&name==='embrace_r')p.x=world(C.stations.embrace_l).x+34;return p;}
function position(who,t){let p=mark(C.initial[who]),moving=false,heading=null;for(const m of C.moves.filter(x=>x.who===who)){
 if(t<m.t0)break;const a=mark(m.from_station),b=mark(m.to_station);if(t>=m.t1){p=b;continue;}
 p=a.clone().lerp(b,smooth((t-m.t0)/(m.t1-m.t0)));heading=Math.atan2(b.x-a.x,b.z-a.z);moving=true;break;
}if(variant==='v3'&&p.x>=380&&p.x<=460&&p.z>=-260&&p.z<=20)p.y=8+24*Math.min(7,Math.floor((p.z+260)/40)+1);return {p,moving,heading};}
const diagTimes=[0,5.7,8,12.6,20,26,32.5,35.4,40.5,48,54];
function cameraAt(t,ts){
 let pos,target,fov=42,label;
 if(t<6.5){pos=[0,320,780];target=[0,65,-290];label='THE MEGARON · a test between two pillars';}
 else if(t<11.86){pos=[335,175,-70];target=[340,70,-380];fov=54;label='THE ORDER';}
 else if(t<18){pos=[55,120,90];target=[-175,55,-233];fov=36;label='HE KNOWS THE BED CANNOT MOVE';}
 else if(t<22.9){pos=[740,260,125];target=[995,55,-275];fov=45;label='THE SECRET · chamber visualization';}
 else if(t<30.5){pos=[-50,110,-95];target=[230,64,-369];fov=33;label='RECOGNITION';}
 else if(t<35.3){pos=[0,320,450];target=[0,45,-225];fov=46;label='SHE CROSSES AROUND THE HEARTH';}
 else if(t<42.64){pos=[-70,130,75];target=[repaired?-137:-96,60,-172];fov=37;label='AFTER TWENTY YEARS';}
 else {const u=smooth((t-42.64)/12.36);pos=[-55,160+70*u,170+170*u];target=[-100,55,-180];fov=38;label='ATHENA HOLDS THE DAWN';}
 camera.position.fromArray(pos);camera.fov=fov;camera.lookAt(new THREE.Vector3(...target));camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 return label;
}
function poseAt(who,ts,t,moving){
 let phrase='neutral';
 if(who==='odysseus')phrase=ts<22?'arms crossed':ts<32?'angry':ts<42?'pointing':ts<50?'open arms':'grief';
 if(who==='penelope')phrase=ts<13?'guarded':ts<22?'pointing':ts<42?'hands near face':ts<50?'recognition':'tenderness';
 if(who==='telemachus')phrase=ts<42?'concern':'tenderness';
 if(who==='eurycleia')phrase=ts<22?'concern':'tenderness';
 const channels={...(Perform.PHRASES[phrase]||{})};
 if(who==='penelope'&&ts>=13&&ts<22)channels['arm.R.pitch']=-.6;
 if(ts>=50&&(who==='odysseus'||who==='penelope')){channels['arm.L.pitch']=-1.2;channels['arm.R.pitch']=-1.25;channels['arm.L.out']=.35;channels['arm.R.out']=.35;channels['torso.lean']=.06;channels['head.yaw']=who==='penelope'?.42:-.27;channels['gaze.x']=who==='penelope'?-.25:.18;}
 const spoken=C.segments.find(s=>s.kind==='DIALOGUE'&&s.speakerId==='character.'+who&&t>=s.start&&t<s.end);
 if(spoken)channels['mouth.jaw']=.16+.23*Math.abs(Math.sin(t*13));
 if(moving){delete channels['torso.lean'];delete channels['torso.twist'];}
 return channels;
}
function caption(t){return C.segments.find(s=>t>=s.start&&t<s.end)?.text||'';}
function wrap(text,max){const lines=[];let line='';for(const w of text.split(' ')){if((line+' '+w).length>max){lines.push(line);line=w;}else line+=(line?' ':'')+w;}if(line)lines.push(line);return lines;}
function draw(t){
 const ts=stageTime(t), state={};
 for(const who of Object.keys(actors))state[who]=position(who,ts);
 for(const [who,a] of Object.entries(actors)){
   const s=state[who],r=a.rig;r.pos.copy(s.p);r.gait=s.moving?1:0;
   r.figure.visible=!(who==='phemius'&&ts>=7)&&!(who==='eurycleia'&&(ts<10||(ts>=20&&ts<60)));
   let target=state[who==='odysseus'?'penelope':who==='penelope'&&ts>=13&&ts<22?'eurycleia':'odysseus'].p;
   r.heading=s.moving?s.heading:Math.atan2(target.x-s.p.x,target.z-s.p.z);
   // A fresh neutral pose at absolute scene time prevents additive drift when seeking.
   r.figure.rotation.set(0,r.heading,0);r.torsoP.rotation.set(0,0,0);r.headP.rotation.set(0,0,0);
   Minifig.pose(r,{phase:Math.floor(t*12)/12*12,gait:r.gait,t:Math.floor(t*12)/12,swing:null,aim:0});
   a.perf.base=poseAt(who,ts,t,s.moving);a.perf.active.clear();a.perf.last=null;a.perf.lastQ=null;
   Perform.apply(a.perf,t,{speed:1});
 }
 const label=cameraAt(t,ts);fire.intensity=2.1+.12*Math.sin(t*4.1);
 // A held cold light remains held through the scene; no sunrise transition is fabricated.
 rim.intensity=ts>=64?1.5:1.2;
 scene.getObjectByName('prop:megaron').visible=!(t>=18&&t<22.9);
 renderer.render(scene,camera);out.drawImage(renderer.domElement,0,0);
 out.fillStyle='rgba(9,11,17,.72)';out.fillRect(0,0,1280,44);
 out.font='15px monospace';out.fillStyle='#d9c59c';out.fillText('OD-B23-S04  /  '+label,26,28);
 const cap=caption(t),lines=wrap(cap,88);if(cap){out.fillStyle='rgba(8,9,13,.82)';out.fillRect(60,630-lines.length*29,1160,30+lines.length*29);out.font='24px system-ui';out.textAlign='center';out.fillStyle='#fff';lines.forEach((l,i)=>out.fillText(l,640,659-(lines.length-i-1)*29));out.textAlign='left';}
 out.fillStyle='rgba(9,11,17,.8)';out.fillRect(0,678,1280,42);out.font='13px monospace';out.fillStyle='#ddd';out.fillText(`${variant.toUpperCase()} · NATIVE LDRAW · RECORDING ${t.toFixed(2)}s / SOURCE ${ts.toFixed(2)}s`,26,703);
 return {t,sourceTime:ts,label,positions:Object.fromEntries(Object.entries(state).map(([k,v])=>[k,{position:v.p.toArray(),visible:actors[k].rig.figure.visible,moving:v.moving}]))};
}
const blob=(cv,type='image/png')=>new Promise(r=>cv.toBlob(r,type,.94));
async function evidence(name,value){await fetch('/evidence/'+name+'.json',{method:'POST',body:JSON.stringify(value,null,2)});}
async function still(name,cv){await fetch('/evidence/'+name+'.png',{method:'POST',body:await blob(cv)});}
let playing=false,exporting=false,raf=0,tailStart=null;
function tick(){if(!playing)return;let t=voice.currentTime;if(voice.ended){tailStart??=performance.now();t=C.recordingDuration+(performance.now()-tailStart)/1000;}draw(Math.min(t,55));document.querySelector('#seek').value=Math.min(t,55).toFixed(2);if(t>=55){playing=false;return;}raf=requestAnimationFrame(tick);}
document.querySelector('#play').onclick=async()=>{if(exporting||playing)return;playing=true;tailStart=null;if(voice.ended)voice.currentTime=0;await voice.play();tick();};
document.querySelector('#stop').onclick=()=>{playing=false;voice.pause();cancelAnimationFrame(raf);};
document.querySelector('#jump').onclick=()=>{playing=false;voice.pause();const t=Math.max(0,Math.min(55,+document.querySelector('#seek').value||0));voice.currentTime=Math.min(t,C.recordingDuration);draw(t);};
document.querySelector('#refs').onclick=async()=>{for(const t of diagTimes){const record=draw(t);renderScene(ref,sourceScene,{pipeline:'MESH',t:record.sourceTime,card:false});await still(`${variant}-lego-${t}`,screen);await still(`${variant}-halfworld-${t}`,ref);}status.textContent='Matched references captured: '+diagTimes.join(', ');};
document.querySelector('#export').onclick=async()=>{
 if(exporting)return;exporting=true;playing=false;voice.pause();cancelAnimationFrame(raf);
 try{
 const frames=Math.ceil(C.renderDuration*C.fps),samples=[];
 for(let i=0;i<frames;i++){
   const t=i/C.fps,r=draw(t);if(i%12===0)samples.push(r);
   const res=await fetch(`/capture/${variant}/${String(i).padStart(5,'0')}`,{method:'POST',body:await blob(screen,'image/jpeg')});if(!res.ok)throw new Error('Capture failed');
   if(i%12===0)status.textContent=`${variant} · rendered ${i+1}/${frames} frames · ${t.toFixed(1)}/55 seconds`;
 }
 await evidence(variant+'-receipt',{contract:C,variant,renderer:'Native Cinerium modules: Dsl, Props, LDrawLoader, Minifig, Face, Perform',width:1280,height:720,frames,fps:C.fps,missing,loaded:[...loaded],assemblies:reports,samples});
 status.textContent=`COMPLETE: ${variant} · ${frames} native frames · ${missing.length} loading errors. Encode with encode.py ${variant}.`;
 }catch(e){status.textContent='FAILED: '+e.stack;await evidence(variant+'-failure',{error:e.stack,missing});}finally{exporting=false;}
};
draw(0);status.textContent=`READY · ${variant} · ${Object.keys(actors).length} native actors · ${reports.length} native assemblies · ${missing.length} loading errors`;

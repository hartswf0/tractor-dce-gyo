import {nativeCore,saveStill,saveJSON,blob} from './native-core.mjs';
const cv=document.querySelector('#screen'),status=document.querySelector('#status'),pick=document.querySelector('#scene'),seek=document.querySelector('#seek'),N=await nativeCore(cv),T=THREE;
const groups={},bom=[],donors=[],actors={},audit={version:1,sourceScenes:['OD-B10-S04','OD-B17-S03'],geometry:'Native LDraw only',duration:16,fps:12,limits:['Circe transformation uses an editorial substitution; no morph geometry','Argos candidate is a rigid standing shepherd: rejected for the final recumbent hound performance','Donor architecture is a staging kit, not an ancient reconstruction','No dialogue, score or location plate is baked into these isolated acting tests']};
window.addEventListener('unhandledrejection',e=>status.textContent='ERROR: '+e.reason);
function group(name,parent=N.scene){const g=new T.Group();g.name=name;parent.add(g);return g;}
async function p(parent,id,col,x=0,y=0,z=0,ry=0){const g=await N.part(id,col);g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);bom.push({assembly:parent.name,part:id,color:col,position:[x,y,z],yaw:ry});return g;}
async function donor(parent,name,x,y,z,ry=0){status.textContent='Loading donor '+name;let txt=await(await fetch('./native/odyssey-donors/'+name+'.mpd')).text();if(name.startsWith('pinetree'))txt=txt.replace(/^1 15 /gm,'1 2 ');
 const raw=N.finish(await N.props.parse(txt,name+'.mpd')),flip=new T.Group(),root=group(name,parent);flip.rotation.x=Math.PI;flip.add(raw);root.add(flip);root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root),c=b.getCenter(new T.Vector3());flip.position.set(-c.x,-b.min.y,-c.z);root.position.set(x,y,z);root.rotation.y=ry;donors.push({name,position:[x,y,z],yaw:ry,measuredSize:b.getSize(new T.Vector3()).toArray(),source:'21343 / Philippe Hurbain'});return root;}
async function actor(parent,name,base,overrides={}){const def={...Minifig.DEFS[base],weapon:null,cape:null,collar:null,...overrides};const rig=Minifig.skeleton(40,def),parts=[];for(const [slot,id,col]of Minifig.partsOf(def))parts.push(await N.raw(id,col));Minifig.mount(rig,parts,def,parent);if(def.face)Face.attach(rig,def.face);actors[name]=rig;return rig;}
function pose(r,t,gait=0){Minifig.pose(r,{phase:t*7,gait,t,swing:null,aim:0});r.figure.rotation.y=r.heading;}
function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
async function floor(parent,w,d,color){for(let x=-w;x<=w;x++)for(let z=-d;z<=d;z++)await p(parent,'3031',color,x*80,-4,z*80);}
// Circe: the furniture defines the men's positions, then the same spaces become pens.
const circe=groups.circe=group('circe-forest-threshold');await floor(circe,4,3,28);
await donor(circe,'GreatHallBackWall',0,0,-200);await donor(circe,'forgewall',-230,0,-110);await donor(circe,'forgewall',230,0,-110);
for(const x of[-180,180])await donor(circe,'GreatHallPillar',x,0,-80);
await donor(circe,'pinetree2',-285,0,-165);await donor(circe,'pinetree2',290,0,-155);
for(const[x,z]of[[-270,100],[275,130],[-300,-10]])await p(circe,'10884',2,x,12,z);
const table=group('drugged-service-table',circe);for(const x of[-70,70])for(const z of[-35,35]){await p(table,'3062b',70,x,24,z);await p(table,'3062b',70,x,48,z);}for(const x of[-40,40])await p(table,'3031',70,x,56,0);for(const x of[-65,0,65])await p(table,'2343',297,x,64,5);
const sorceress=await actor(circe,'circe','penelope-ithaca',{torso:272,arms:272,legs:272,hips:272,hat:['3901',0],face:'halfworld:circe'});sorceress.pos.set(0,0,-95);sorceress.heading=0;
const wand=await N.raw('30374',297);sorceress.slots.weaponR.add(wand);
const crew=[],pigs=[];for(let i=0;i<3;i++){crew.push(await actor(circe,'crew-'+i,'sailor',{torso:[71,19,28][i],arms:[71,19,28][i]}));const pig=await N.grounded('87621p01',13);circe.add(pig);pigs.push(pig);}
const witness=await actor(circe,'eurylochus','sailor',{torso:70,arms:70});
const gates=[];for(const x of[-140,140]){const pivot=group('pen-gate-hinge',circe);pivot.position.set(x,0,150);const leaf=await donor(pivot,'GreatHallDoor1',0,0,0);leaf.position.x=36;gates.push(pivot);}
const lamp=new T.PointLight(0xffb462,1.4,550,2);lamp.position.set(0,120,-150);circe.add(lamp);
// Argos: two men remain beside the animal; no foot placement on the heap.
const argos=groups.argos=group('argos-last-thirty-feet');await floor(argos,4,3,19);
for(const x of[-240,220])await donor(argos,'forgewall',x,0,-155);for(const x of[-105,105])await donor(argos,'GreatHallPillar',x,0,-170);for(const x of[-80,0,80])await p(argos,'3001',70,x,150,-170);
const heap=group('litter-beside-the-gate',argos);for(const[x,z,c]of[[-195,0,70],[-155,0,19],[-175,40,70],[-135,40,28]])await p(heap,'3039',c,x,24,z);for(const[x,z]of[[-195,45],[-135,60]])await p(heap,'2423',28,x,20,z);
const dog=await N.grounded('92586p01',19);argos.add(dog);dog.position.set(-165,24,20);dog.rotation.y=Math.PI/2;
const od=await actor(argos,'odysseus','odysseus-sword',{torso:70,arms:70,legs:308,hips:308,hat:['3901',71],face:'halfworld:odysseus'});
const eum=await actor(argos,'eumaeus','sailor',{torso:28,arms:28,hat:['3901',70],face:'halfworld:eumaeus'});
// Walking staff withheld until grip orientation and ground contact are validated.
const labels={circe:'CIRCE · HOSPITALITY BECOMES CAPTIVITY',argos:'ARGOS · THE ONE WHO KNOWS HIM'};
function draw(which,t){for(const[k,g]of Object.entries(groups))g.visible=k===which;let eye,look,beat,note;
 if(which==='circe'){
  N.scene.background.set('#20352f');const change=ease((t-7)/2);pose(sorceress,t);sorceress.armRP.rotation.x=-.4-1.3*ease((t-5)/2);
  for(let i=0;i<3;i++){const x=-110+i*110,z=145-45*ease(t/4),cut=8+i*.28;crew[i].pos.set(x,0,z);crew[i].heading=Math.PI;crew[i].figure.visible=t<cut;pose(crew[i],t,t<4?.5:0);pigs[i].visible=t>=cut;pigs[i].position.set(x,0,z+35*ease((t-9)/3));pigs[i].rotation.y=.3*(i-1);}
  witness.pos.set(280+100*ease((t-11)/4),0,190+130*ease((t-11)/4));witness.heading=t<11?-2.1:.6;pose(witness,t,t>11?1:0);
  gates.forEach((g,i)=>g.rotation.y=(i?1:-1)*Math.PI/2*(1-ease((t-10)/2)));
  beat=t<5?'The invitation':t<9?'The wand changes the room':t<12?'The gate closes':'One witness escapes';note='OD-B10-S04 · same actor marks before / after · native pigs; substitution edit';
  eye=t<5?[390,235,520]:t<9?[245,170,365]:t<12?[315,175,415]:[470,240,500];look=t<9?[0,60,10]:t<12?[0,35,110]:[120,50,130];
 }else{
  N.scene.background.set('#b7afa0');od.pos.set(60-10*ease((t-4)/4),0,210-125*ease(t/5));od.heading=t<5?Math.PI:t<12?-Math.PI/2:Math.PI;pose(od,t,t<5?.4:0);od.headP.rotation.y=t>5&&t<12?-.15:0;od.armRP.rotation.x=-.35*ease((t-7)/2);eum.pos.set(155,0,125-220*ease(t/16));eum.heading=Math.PI;pose(eum,t,.35);
  beat=t<5?'Two strangers at the gate':t<10?'He recognizes his master':t<13?'Odysseus turns aside':'The gate draws him onward';note='OD-B17-S03 · dog pose REJECTED for final shot: needs recumbent body, ears and tail';
  eye=t<5?[365,185,470]:t<10?[125,110,355]:t<13?[180,120,315]:[280,150,365];look=t<5?[-50,45,20]:t<10?[-60,48,50]:t<13?[10,60,65]:[-30,50,-45];
 }
 N.render(eye,look,42);const c=N.ctx;c.fillStyle='#101820ed';c.fillRect(0,0,1280,72);c.fillRect(0,660,1280,60);c.fillStyle='#f0d297';c.font='bold 22px system-ui';c.fillText(labels[which]+' / '+beat,24,43);c.font='16px system-ui';c.fillStyle='#e5e9eb';c.fillText(note,24,695);c.font='15px monospace';c.fillText(t.toFixed(1)+' s',1195,695);
}
audit.bom=bom;audit.donors=donors;audit.loaded=[...N.loaded];audit.missing=N.missing;audit.measurements=N.measurements;await saveJSON('next-scenes-build',audit);draw('circe',0);status.textContent='READY · 2 × 16-second native studies · Argos performance gate remains open';
let playing=false,start=0;function tick(now){if(!playing)return;const t=Math.min(16,(now-start)/1000);seek.value=t;draw(pick.value,t);if(t<16)requestAnimationFrame(tick);else playing=false;}
document.querySelector('#play').onclick=()=>{playing=true;start=performance.now()-+seek.value*1000;requestAnimationFrame(tick);};document.querySelector('#stop').onclick=()=>playing=false;seek.oninput=()=>{playing=false;draw(pick.value,+seek.value);};pick.onchange=()=>{playing=false;seek.value=0;draw(pick.value,0);};
async function stills(){for(const which of['circe','argos'])for(const t of[0,6,10,14]){draw(which,t);await saveStill('next-'+which+'-'+t,cv);}}
document.querySelector('#stills').onclick=async()=>{playing=false;await stills();status.textContent='Saved eight matched scene frames';};
document.querySelector('#capture').onclick=async()=>{playing=false;for(const which of['circe','argos'])for(let i=0;i<192;i++){draw(which,i/12);await fetch('/capture/next-'+which+'/'+String(i).padStart(5,'0'),{method:'POST',body:await blob(cv,'image/jpeg')});if(i%12===0)status.textContent='Capturing '+which+' '+i+'/192';}await stills();status.textContent='COMPLETE · 384 frames · two silent 16-second studies';};

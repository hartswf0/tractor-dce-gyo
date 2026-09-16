import {nativeCore,saveStill,saveJSON,blob,boreCheck} from './native-core.mjs';
const cv=document.querySelector('#screen'),status=document.querySelector('#status'),pick=document.querySelector('#scene'),seek=document.querySelector('#seek');
window.addEventListener('unhandledrejection',e=>status.textContent='ERROR '+e.reason);
const N=await nativeCore(cv),T=THREE,groups={},bom=[];
function group(name,parent=N.scene){const g=new T.Group();g.name=name;parent.add(g);return g;}
async function p(parent,id,col,x=0,y=0,z=0,rx=0,ry=0,rz=0){status.textContent='Building '+parent.name+' · '+id;const g=await N.part(id,col);g.position.set(x,y,z);g.rotation.set(rx,ry,rz);parent.add(g);bom.push({assembly:parent.name,part:id,color:col,position:[x,y,z],rotation:[rx,ry,rz]});return g;}
async function floor(parent,w,d,col=19){for(let x=-w;x<=w;x++)for(let z=-d;z<=d;z++)await p(parent,'3031',col,x*80,0,z*80);}
async function actor(parent,name,col){const def={...Minifig.DEFS[name],weapon:null,cape:null};if(col){def.torso=def.arms=col;}const rig=Minifig.skeleton(40,def),parts=[];for(const [slot,id,c] of Minifig.partsOf(def))parts.push(await N.raw(id,c));Minifig.mount(rig,parts,def,parent);if(def.face)Face.attach(rig,def.face);return rig;}
function pose(r,t=0){Minifig.pose(r,{phase:t*5,gait:0,t:0,swing:null,aim:0});r.figure.rotation.y=r.heading;}
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
// BED: chamber cutaway. One trunk takes the near head corner, three posts remain furniture.
const bed=groups.bed=group('bed-test');
const deck=group('chamber-floor',bed);await floor(deck,3,3,19);deck.position.y=-4;
const rooted=group('living-root-and-post',bed);
for(let y=-48;y<=96;y+=24)await p(rooted,'3941',70,-60,y,-80);
await p(rooted,'14769p83',19,-60,104,-80);
await p(rooted,'30131',70,-60,-80,-80);
const frame=group('joined-bed-frame',bed);
for(const [x,z]of[[60,-80],[-60,100],[60,100]])for(let y=24;y<=48;y+=24)await p(frame,'3062b',70,x,y,z);
for(let z=-60;z<=80;z+=40){await p(frame,'3004',70,-60,48,z,0,Math.PI/2);await p(frame,'3004',70,60,48,z,0,Math.PI/2);}
for(let x=-40;x<=40;x+=40){await p(frame,'3004',70,x,48,-80);await p(frame,'3004',70,x,48,100);}
const weave=group('oxhide-strap-lattice',bed);
for(let z=-60;z<=80;z+=40)await p(weave,'3666',84,0,40,z);
for(let x=-40;x<=40;x+=40)for(const z of[-30,50])await p(weave,'3710',19,x,48,z,0,Math.PI/2);
const linen=group('bedding',bed);for(let z=-40;z<=80;z+=80)await p(linen,'3031',272,0,56,z);await p(linen,'3020',15,0,64,-60);
const nurse=await actor(bed,'eurycleia'),pen=await actor(bed,'penelope-ithaca');nurse.pos.set(105,0,85);nurse.heading=-Math.PI/2;pen.pos.set(-150,0,90);pen.heading=Math.PI/2;
// STAKE: one physical object and four character contact constraints.
const stake=groups.stake=group('stake-test');await floor(stake,5,2,72);
const shaft=group('ONE-shared-olivewood-stake',stake);
for(let x=-144;x<144;x+=24)await p(shaft,'3062b',70,x,0,0,0,0,Math.PI/2);
await p(shaft,'4589',0,144,0,0,0,0,-Math.PI/2);
const crew=[];for(let i=0;i<4;i++)crew.push(await actor(stake,i===0?'odysseus-wet':'sailor',[308,19,28,71][i]));
const fire=group('heating-bed',stake);for(let x=-1;x<=1;x++)await p(fire,'3001',72,140+x*40,0,0);await p(fire,'37775',25,160,30,0);
// A scale-neutral eye target is deliberately labelled a stand-in, never passed off as Polyphemus.
const target=group('eye-height-calibration-target',stake);for(let y=0;y<72;y+=24)await p(target,'3001',72,280,y,0);await p(target,'14769p01',15,256,75,0,0,0,Math.PI/2);
// AXES: through-bores are actual part 6541, blades flank the bore instead of capping it.
const axes=groups.axes=group('axes-test');await floor(axes,2,5,19);const heads=[];
for(let i=0;i<12;i++){const a=group('axe-'+String(i+1).padStart(2,'0'),axes);a.position.z=-330+i*60;for(let y=0;y<=48;y+=24)await p(a,'3062b',70,0,y,0);await p(a,'6541',71,0,80,0);await p(a,'3040b',71,-20,80,0,0,0,0);await p(a,'3040b',71,20,80,0,0,Math.PI,0);heads.push(a);}
const archer=await actor(axes,'odysseus-wet',308);archer.pos.set(-62,0,430);archer.heading=Math.PI;
const son=await actor(axes,'telemachus-ithaca');son.pos.set(110,0,390);son.heading=Math.PI;
// Stock bow is a continuity reference only: its arrow is inseparable. The travel test uses a separate 4L gauge rod.
const bow=await p(axes,'93231',70,-28,63,405,0,0,0);
const arrow=await p(axes,'30374',297,0,70,415,Math.PI/2,0,0);
const audit={format:'native blocking tests, not completed source-scene performances',fps:12,duration:18,tests:{bed:{source:'OD-B23-S04',states:['made','stripped','root reveal','attempted move'],rootFixed:true,remaining:['true mortise joints','olive-specific bark and root refinement','hands solving full two-hand lift']},stake:{source:'OD-B09-S09',physicalStakeCount:1,bearers:4,remaining:['Polyphemus body and eye rig','five-person dramatic staging if required by adaptation','feet and two-hand constraints','final cave geography']},axes:{source:'OD-B21-S07',heads:12,axis:{x:0,y:70,z:[-330,330]},projectile:'30374 4L calibration rod; NOT final arrow',stockBow:'93231 integral arrow; static reference only, rejected for release',remaining:['separate bow limbs/string','final arrow and fletching','seated beggar costume','actor-to-bow contact']}}};
function draw(which,t){Object.entries(groups).forEach(([k,g])=>g.visible=k===which);let title,note,eye,look;
 if(which==='bed'){pose(nurse);pose(pen);const pull=smooth((t-11)/2)*(1-smooth((t-15)/2));nurse.armLP.rotation.x=-1.1-pull*.18;nurse.armRP.rotation.x=-1.1-pull*.18;nurse.torsoP.rotation.z=pull*.15;linen.position.y=70*smooth((t-4)/3);linen.visible=t<10;deck.visible=true;for(const tile of deck.children)tile.visible=!(t>=8&&t<=15&&tile.position.x<0&&tile.position.z<0);title=t<4?'01 · THE BED IS BUILT AROUND THE TREE':t<8?'STRIP THE BED · expose the oxhide lattice':t<12?'ROOT REVEAL · one post continues below the floor':'THE FALSE MOVE · the bed stays rooted';note='OD-B23-S04 · chamber construction / blocking study · root transform remains fixed';const u=smooth(t/18);eye=t<8?[300-90*u,240-65*u,380-90*u]:[-240,140,-330];look=t<8?[-15,30,5]:[-45,15,-65];if(t>=12){eye=[260,165,320];look=[20,42,55];}}
 if(which==='stake'){const advance=75*smooth((t-7)/5);shaft.position.set(advance,62+8*smooth((t-3)/3),0);shaft.rotation.x=.3*Math.sin(t*2)*smooth((t-12)/2);fire.visible=t<5;for(let i=0;i<4;i++){const r=crew[i],side=i%2===0?1:-1;r.heading=side>0?0:Math.PI;pose(r);r.pos.set(0,0,0);let best=1e9,angle=-1.25;for(let j=0;j<=80;j++){r.armLP.rotation.x=-.4-j*.02;r.figure.updateMatrixWorld(true);const delta=Math.abs(Minifig.fist(r,new T.Vector3()).y+4-shaft.position.y);if(delta<best){best=delta;angle=r.armLP.rotation.x;}}r.armLP.rotation.x=angle;r.armRP.rotation.x=angle;r.figure.updateMatrixWorld(true);const hand=Minifig.fist(r,new T.Vector3()),desired=new T.Vector3(-110+i*70+advance,shaft.position.y,side*9);r.pos.copy(desired.sub(hand));}title=t<4?'02 · HEAT ONE SHARED STAKE':t<8?'FOUR BEARERS · one transform, four contacts':t<12?'ADVANCE · the crew travels with the load':'TURN · test the shaft against the eye-height target';note='OD-B09-S09 · contact/scale test · calibration target stands in for Cyclops';eye=[-190,340,490];look=[45,45,0];}
 if(which==='axes'){pose(archer);pose(son);archer.armLP.rotation.x=-1.25;archer.armRP.rotation.x=-1;arrow.position.z=415-870*smooth((t-6)/8);arrow.visible=t>=5;title=t<5?'03 · TWELVE AXES · true open bores':t<14?'AXIS TEST · one gauge passes the entire lane':'PROOF VIEW · twelve openings stay collinear';note='OD-B21-S07 · calibration rod, not final arrow · stock bow is an integral-arrow reference';eye=t<5?[250,240,620]:t<14?[140,160,300-650*smooth((t-6)/8)]:[18,90,590];look=t<14?[0,60,t<5?0:arrow.position.z-110]:[0,70,-280];}
 N.render(eye,look,42);const c=N.ctx;c.fillStyle='rgba(10,15,24,.88)';c.fillRect(0,0,1280,62);c.fillRect(0,666,1280,54);c.fillStyle='#f1d398';c.font='bold 23px system-ui';c.fillText(title,26,39);c.fillStyle='#d7dfe9';c.font='17px system-ui';c.fillText(note,26,699);c.font='16px monospace';c.fillText(t.toFixed(1)+'s',1190,39);
}
// Zero-intersection ray through the assembled physical bores, including all twelve heads.
audit.boreChecks=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;audit.boreChecks.push(boreCheck(heads,[Math.cos(a)*4,70+Math.sin(a)*4,400],[0,0,-1],800));}audit.axeBoreHits=audit.boreChecks.reduce((n,b)=>n+b.hits.length,0);
audit.loaded=[...N.loaded];audit.missing=N.missing;audit.measurements=N.measurements;audit.bom=bom;
await saveJSON('hero-tests-build',audit);draw('bed',0);status.textContent='READY · three 18-second native blocking tests';
let playing=false,start=0;function tick(now){if(!playing)return;const t=Math.min(18,(now-start)/1000);seek.value=t;draw(pick.value,t);if(t>=18){playing=false;status.textContent='Playback complete';}else requestAnimationFrame(tick);}
document.querySelector('#play').onclick=()=>{if(playing)return;playing=true;start=performance.now()-Number(seek.value)*1000;requestAnimationFrame(tick);};document.querySelector('#stop').onclick=()=>playing=false;
seek.oninput=()=>{playing=false;draw(pick.value,+seek.value)};pick.onchange=()=>{playing=false;seek.value=0;draw(pick.value,0)};
async function stills(){audit.contactSamples=[];for(let t=0;t<=18;t+=1){draw('stake',t);audit.contactSamples.push({t,feetY:crew.map(r=>r.pos.y),handErrors:crew.map((r,i)=>Minifig.fist(r,new T.Vector3()).distanceTo(new T.Vector3(-110+i*70+shaft.position.x,shaft.position.y,i%2===0?9:-9)))});}for(const which of Object.keys(groups))for(const t of[0,6,10,14,17]){draw(which,t);await saveStill('hero-'+which+'-'+t,cv);}await saveJSON('hero-tests-build',audit);}
document.querySelector('#stills').onclick=async()=>{await stills();status.textContent='Evidence saved · 15 matched test frames';};
document.querySelector('#capture').onclick=async()=>{playing=false;for(const which of Object.keys(groups)){for(let i=0;i<216;i++){draw(which,i/12);await fetch('/capture/hero-'+which+'-v1/'+String(i).padStart(5,'0'),{method:'POST',body:await blob(cv,'image/jpeg')});if(i%12===0)status.textContent='Capturing '+which+' '+i+'/216';}await saveJSON('hero-'+which+'-v1',{...audit.tests[which],frames:216,fps:12,duration:18});}await stills();status.textContent='COMPLETE · 648 frames / three native tests + evidence';};

import {nativeCore,saveJSON,saveStill,blob} from './native-core.mjs';
const cv=document.querySelector('canvas'),status=document.querySelector('#status'),N=await nativeCore(cv),T=THREE,bom=[];
window.addEventListener('unhandledrejection',e=>status.textContent='ERROR '+e.reason);
function group(name,parent=N.scene){const g=new T.Group();g.name=name;parent.add(g);return g;}
async function part(parent,id,c,x,y,z,ry=0){const g=await N.part(id,c);g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);bom.push({assembly:parent.name,part:id,color:c,position:[x,y,z],yaw:ry});return g;}
const cave=group('limestone-mouth');
for(let x=-4;x<=4;x++)for(let z=-5;z<=4;z++)await part(cave,'3031',19,x*80,-4,z*80);
// Readymade 6082 identified in verified 6279 Island donor; reassembled, never scaled.
for(const x of[-190,190])for(const z of[-240,-60,120])await part(cave,'6082',19,x,144,z,x<0?Math.PI/2:-Math.PI/2);
for(const x of[-160,-80,0,80,160]){await part(cave,'3001',19,x,168,60);await part(cave,'3039',19,x,192,60);}
for(const x of[-285,285])for(const z of[-120,60,230])await part(cave,'6083',28,x,168,z,x<0?0:Math.PI);
const stone=group('sealing-stone');
// Brick-built disk assembled from stepped rows. It translates as a rehearsal proxy; roll rig remains open.
for(let y=0;y<7;y++){const width=[2,3,4,4,4,3,2][y];for(let x=-width;x<=width;x++)for(const z of[-10,10])await part(stone,'3004',72,x*40,y*24+24,z);}
stone.position.set(0,0,105);
const sheep=[],riders=[],legs=[];
for(let i=0;i<3;i++){
 const s=group('great-flock-'+i);sheep.push(s);const ls=[];
 for(const x of[-50,50])for(const z of[-55,55]){const leg=group('leg',s);leg.position.set(x,0,z);for(const y of[24,48,72])await part(leg,'3005',0,0,y,0);ls.push(leg);}legs.push(ls);
 for(const z of[-60,-20,20,60]){await part(s,'3003',15,0,96,z);for(const x of[-25,25])await part(s,'3039',15,x,120,z,x<0?-Math.PI/2:Math.PI/2);}
 await part(s,'3003',0,0,106,100);await part(s,'3020',0,0,110,110);for(const x of[-30,30])await part(s,'3023',0,x,110,90);
 const def={...Minifig.DEFS.sailor,weapon:null,cape:null,collar:null},r=Minifig.skeleton(40,def),ps=[];for(const [slot,id,c]of Minifig.partsOf(def))ps.push(await N.raw(id,c));Minifig.mount(r,ps,def,s);r.pos.set(0,32,0);Minifig.pose(r,{phase:0,gait:0,t:0});r.figure.rotation.x=Math.PI/2;riders.push(r);
}
const lantern=new T.PointLight(0xff9e42,2,550);lantern.position.set(-100,110,-200);N.scene.add(lantern);
N.scene.background.set('#92a9b0');
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function draw(t){stone.position.x=t<5?320*(1-ease(t/4)):t<10?0:320*ease((t-10)/4);for(let i=0;i<3;i++){const progress=ease((t-14-i*1.4)/6);sheep[i].position.set(0,0,-330-i*190+progress*(780+i*190));legs[i].forEach((l,j)=>l.rotation.x=progress>0&&progress<1?.10*Math.sin(t*8+(j%2)*Math.PI):0);}
 const eye=t<10?[440,280,640]:t<15?[340,190,530]:[240,85,480],look=t<15?[0,85,10]:[0,55,130];N.render(eye,look,44);const c=N.ctx;c.fillStyle='#141c24ee';c.fillRect(0,0,1280,72);c.fillRect(0,658,1280,62);c.fillStyle='#edcf96';c.font='bold 25px system-ui';c.fillText(t<5?'CYCLOPS / The stone closes the mouth':t<10?'CYCLOPS / No way out':t<15?'CYCLOPS / Dawn opens the passage':'CYCLOPS / Hidden beneath the great flock',24,45);c.font='17px system-ui';c.fillStyle='#eee';c.fillText('Native geometry rehearsal · stone translation proxy · custom sheep · hand grip / giant performance pending',24,693);}
const checks={version:1,source:'6279 Skull Island / Stan Isachenko; 6082 rock-panel grammar',bom,missing:N.missing,limits:['Stone translates; rolling/pushing performance not rigged','Sheep custom native brick assembly; fleece and leg joints not physically certified','Riders fit is measured as bounds, not hand-to-wool contact','No animated Cyclops or real-location plate yet']};
draw(0);N.scene.updateMatrixWorld(true);checks.riders=riders.map((r,i)=>{const b=new T.Box3().setFromObject(r.figure);return{size:b.getSize(new T.Vector3()).toArray(),minY:b.min.y,maxY:b.max.y,bellyBottom:72,verticalClearance:72-b.max.y,legInnerWidth:80,lateralClearance:80-b.getSize(new T.Vector3()).x};});await saveJSON('cyclops-sequence-build',checks);status.textContent='READY · 24-second entrance and escape rehearsal';
let playing=false;document.querySelector('#play').onclick=()=>{playing=true;const start=performance.now();function tick(now){const t=(now-start)/1000;if(!playing)return;draw(Math.min(24,t));if(t<24)requestAnimationFrame(tick);}requestAnimationFrame(tick);};
document.querySelector('#capture').onclick=async()=>{playing=false;for(let i=0;i<288;i++){draw(i/12);await fetch('/capture/cyclops-sequence/'+String(i).padStart(5,'0'),{method:'POST',body:await blob(cv,'image/jpeg')});if(i%12===0)status.textContent='Capturing '+i+'/288';}for(const t of[0,6,12,18,22]){draw(t);await saveStill('cyclops-sequence-'+t,cv);}status.textContent='COMPLETE · 288 frames and five evidence views';};

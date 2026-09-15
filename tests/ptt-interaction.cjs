/* Run with Node 18+: node tests/ptt-interaction.cjs
   Uses the same Three.js 0.128.0 as word-to-world.html, and real Build/City stores.
   Set THREE_SOURCE_PATH to a local three.min.js for offline runs.
   DOM is stubbed; real camera, browser rendering and speech are not covered. */
const fs=require('node:fs'),path=require('node:path');
function run(THREE,buildSource,bricksSource,controllerSource){

const nodes=new Map();
class Node {
 constructor(id){this.id=id;this.dataset={};this.style={};this.value='';this.textContent='';this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.tagName='DIV';this.children=[];this.material={};}
 addEventListener(n,f,opts){(this.listeners[n]||(this.listeners[n]=[])).push({f,opts})}
 appendChild(n){this.children.push(n);return n}replaceChildren(){this.children=[]}setAttribute(){}click(){if(this.onclick)this.onclick();for(const l of this.listeners.click||[])l.f({preventDefault(){}})}
 get firstElementChild(){return this}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:1000,height:700}}
}
const $=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id)};
const document={querySelector:$,querySelectorAll:()=>[],createElement:t=>new Node(t),head:new Node('head'),body:new Node('body')};
const window={addEventListener(){},__world:null};
const localStorage={getItem:()=>null,setItem(){}},navigator={};
const innerWidth=1000,innerHeight=700,performance={now:()=>1000},Minifig={facing:(r,v)=>v.set(0,0,-1)};
const console={info(){},warn(){},error(){}};
const W={ready:true,mode:'walk',rig:{pos:new THREE.Vector3(0,0,600),heading:Math.PI,cam:{}},scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(50,1000/700,1,20000),renderer:{domElement:$('#canvas')},input:{L:{}},G:{h:()=>0},master:{},city:{buildings:[],near(){return this.buildings}},props:{items:new Map()}};
W.camera.position.set(0,500,1000);W.camera.lookAt(0,60,0);W.camera.updateMatrixWorld(true);
window.__world=W;
eval(buildSource);
const geoms=new Map([['3001',{geom:new THREE.BoxGeometry(80,24,40).translate(0,12,0),bb:[-40,40,-20,20,24]}]]);
W.build=new window.Build.Build({scene:W.scene,M:40,geoms,colours:()=>new THREE.Color(0xff0000),groundH:()=>0,buildings:()=>[],rings:()=>[]});
const p=W.build.add({id:'brick',part:'3001',col:4,x:0,y:0,z:0,rot:0});
eval(controllerSource);
const api=window.PutThatThere;
const assert=(x,m)=>{if(!x)throw Error(m)};
const screen=v=>{const p=v.clone().project(W.camera);return [(p.x+1)/2,(1-p.y)/2]};
let [x,y]=screen(new THREE.Vector3(0,12,0));
let hit=api.pointIntoWorld(x,y);
assert(hit&&hit.kind==='piece'&&hit.id==='brick','real Three ray selects real Build brick');
api.beginDrag(hit,x,y,'pointer');api.dragTo(x+.12,y-.08);
W.scene.updateMatrixWorld(true);
const preview=W.scene.getObjectByName('move preview');
assert(preview&&preview.position.length()>20,'full geometry preview moves');
api.endDrag(true);
assert(Math.hypot(p.x,p.z)>20,'release mutates real Build piece');
const newp=W.build.pieces.get('brick');assert(newp&&newp.box.min.x===newp.x-40,'collision box follows moved piece');
api.execute({verb:'undo'});
assert(W.build.pieces.get('brick').x===0&&W.build.pieces.get('brick').z===0,'undo restores original piece');
[x,y]=screen(new THREE.Vector3(0,12,0));
let prevented=0,stopped=0;
const e=(x,y)=>({target:{tagName:'CANVAS'},pointerId:7,button:0,clientX:x*1000,clientY:y*700,preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
api.directDown(e(x,y));api.directMove(e(x+.1,y));api.directUp({...e(x+.1,y),type:'pointerup'});
assert(prevented===3&&stopped===3,'arrange consumes game controls');
assert(W.build.pieces.get('brick').x!==0,'pointer path operates on world');
api.execute({verb:'undo'});
api.beginDrag(api.pointIntoWorld(x,y),x,y,'hand');api.dragTo(x+.2,y);api.endDrag(false);
assert(W.build.pieces.get('brick').x===0,'cancel never mutates world');
api.setArrange(false);prevented=0;api.directDown(e(x,y));assert(prevented===0,'Walk gives control back to game');
api.setArrange(true);api.afterCamera();assert(W.camera.position.y>200,'Arrange supplies elevated camera');
const off=screen(new THREE.Vector3(0,12,0));
assert(api.pointIntoWorld(...off)?.kind==='piece','ray remains aligned with Arrange camera');

api.execute({verb:'stop'});api.setArrange(true);api.afterCamera();
const b=W.build.pieces.get('brick'),beforeHand=[b.x,b.z],target=screen(new THREE.Vector3(b.x,b.y+12,b.z));
const open=Array.from({length:21},()=>({x:.5,y:.8,z:0}));
for(const [i,x] of [[5,.35],[9,.45],[13,.55],[17,.65]]){open[i]={x,y:.65,z:0};open[i+1]={x,y:.5,z:0};open[i+2]={x,y:.35,z:0};open[i+3]={x,y:.2,z:0};}open[4]={x:.1,y:.65,z:0};
const shift=(marks,dx,dy)=>marks.map(p=>({...p,x:p.x-dx,y:p.y+dy}));
api.updateHand(open,2000);
const aimed=shift(open,(target[0]-.5)/1.8,(target[1]-.5)/1.8);
for(let i=0;i<35;i++)api.updateHand(aimed,2040+i*40);
assert(api.state().that==='brick 2×4','hand dwell selects real ray target');
const fist=aimed.map(p=>({...p}));
for(const i of [5,9,13,17])fist[i+3]={x:fist[i].x,y:fist[i].y+.08,z:0};
for(let i=0;i<6;i++)api.updateHand(fist,3500+i*40);
const moving=shift(fist,.12,0);
for(let i=0;i<15;i++)api.updateHand(moving,3800+i*40);
const release=shift(aimed,.12,0);
for(let i=0;i<6;i++)api.updateHand(release,4500+i*40);
assert(W.build.pieces.get('brick').x!==beforeHand[0]||W.build.pieces.get('brick').z!==beforeHand[1],'fist drag release changes real world');

eval(bricksSource);
W.city=new window.Bricks.City({scene:W.scene,M:40,geoms,groundM:()=>0,colours:()=>new THREE.Color(0x999999)});
W.city.set([{id:77,ring:[{x:8,z:-8},{x:14,z:-8},{x:14,z:-14},{x:8,z:-14}],h:5}]);
const building=W.city.buildings[0],centre=new THREE.Box3().copy(building.aabb).getCenter(new THREE.Vector3()),coords=screen(centre);
hit=api.pointIntoWorld(...coords);
assert(hit&&hit.kind==='building'&&hit.id===77,'real City AABB is selectable');
const originalCX=building.cx;
api.beginDrag(hit,...coords,'pointer');api.dragTo(coords[0]+.08,coords[1]+.04);api.endDrag(true);
assert(W.city.buildings[0].cx!==originalCX,'city source and rebuilt geometry move');
api.execute({verb:'undo'});assert(W.city.buildings[0].cx===originalCX,'city undo restores footprint');
return {passed:16,three:THREE.REVISION};



}
async function main(){
  let threeSource;
  if(process.env.THREE_SOURCE_PATH)threeSource=fs.readFileSync(process.env.THREE_SOURCE_PATH,'utf8');
  else {const r=await fetch('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');if(!r.ok)throw Error('Three.js fetch: '+r.status);threeSource=await r.text();}
  const THREE=new Function('const module={exports:{}};const exports=module.exports;'+threeSource+';return module.exports;')();
  if(THREE.REVISION!=='128')throw Error('Tests require Three.js r128');
  const read=p=>fs.readFileSync(path.join(__dirname,'../world',p),'utf8');
  console.log(run(THREE,read('build.js'),read('bricks.js'),read('put-that-there.js')));
}
main().catch(e=>{console.error(e);process.exitCode=1});

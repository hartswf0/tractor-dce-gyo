const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.THREE=require(process.env.THREE_PATH||'/tmp/alley-three.js');global.window=global;global.localStorage={getItem(){return null},setItem(){}};global.CustomEvent=class{};global.dispatchEvent=()=>{};
vm.runInThisContext(fs.readFileSync(process.env.BUILD_PATH||'/tmp/alley-build.js','utf8'));require('./placement.js');
const geom=new THREE.BoxGeometry(80,24,40);geom.translate(0,12,0);const scene=new THREE.Scene(),B=new Build.Build({scene,M:40,geoms:new Map([['3001',{geom,bb:[-40,40,-20,20,24]}]]),colours:()=>new THREE.Color('red'),groundH:()=>0,buildings:()=>[],cap:30});
const camera=new THREE.PerspectiveCamera(60,1,1,4000);camera.position.set(0,200,600);camera.lookAt(0,0,0);camera.updateMatrixWorld();
global.__world={ready:true,build:B,camera,scene,G:{h:()=>0},rig:{pos:new THREE.Vector3()}};
for(const[id,x]of [['base',0],['a',-160],['b',160]])B.add({id,part:'3001',col:4,x,y:0,z:0,rot:0});
require('./controller.js');const C=BuilderWag;C.install();
const snap=id=>B.toRow(B.pieces.get(id)).slice();const a0=snap('a');
C.panel(true);B.target={x:400,y:0,z:0,blocked:false};assert.equal(B.place(),null);assert.equal(C.preview('a',{x:0,y:24,z:0}),false);assert.equal(C.commit(),false);C.panel(false);
C.preview('a',{x:0,y:24,z:0});assert.equal(B.pieces.get('a').y,0);assert.equal(C.commit(),true);assert.equal(B.pieces.get('a').y,24);B.undo();assert.deepEqual(snap('a'),a0);
C.preview('a',{x:0,y:0,z:0});assert.equal(C.commit(),false);assert.deepEqual(snap('a'),a0);C.cancel();
C.preview('a',{x:400,y:40,z:0});C.preview('b',{x:400,y:40,z:0});assert.equal(C.commit(),false);C.cancel();
C.preview('a',{x:-160,y:40,z:120});C.preview('b',{x:160,y:40,z:120});assert.equal(C.commit(),true);assert.equal(B.pieces.get('a').y,40);assert.equal(B.pieces.get('b').z,120);B.undo();assert.deepEqual(snap('a'),a0);assert.equal(B.pieces.get('b').y,0);
// Actual gesture classifier, synthetic landmarks: check independent hand ownership.
const source=fs.readFileSync(__dirname+'/gestures.js','utf8');const classifier=source.slice(source.indexOf('function handGesture('),source.indexOf('function updateHand('));vm.runInThisContext(classifier);global.PutThatThere={handGesture};
function marks(x,closed){const h=Array.from({length:21},()=>({x,y:.6,z:0}));h[0]={x,y:.8,z:0};h[4]={x:x-.3,y:.4,z:0};for(const[m,p,t,dx]of [[5,6,8,-.06],[9,10,12,-.02],[13,14,16,.03],[17,18,20,.09]]){h[m]={x:x+dx,y:.6,z:0};h[p]={x:x+dx,y:.45,z:0};h[t]={x:x+dx,y:closed?.73:.22,z:0};}return h;}
assert.equal(handGesture(marks(.35,false)).closed,false);assert.equal(handGesture(marks(.35,true)).closed,true);
C.select({id:'a',item:B.pieces.get('a')});C.hands(new Map([['Left',marks(.05,false)]]),1000);C.hands(new Map([['Left',marks(.05,true)]]),1100);C.hands(new Map([['Left',marks(.05,true)]]),1300);assert.equal(C.state.hands.get('Left').grab.id,'a');
C.select({id:'b',item:B.pieces.get('b')});C.hands(new Map([['Left',marks(.05,true)],['Right',marks(.95,true)]]),1400);C.hands(new Map([['Left',marks(.05,true)],['Right',marks(.95,true)]]),1600);assert.equal(C.state.hands.get('Right').grab.id,'b');assert.equal(C.state.hands.get('Left').grab.id,'a');
C.hands(new Map(),2100);assert.equal(C.state.hands.get('Left').grab,null);assert.deepEqual(snap('a'),a0);assert.equal(B.pieces.get('b').y,0);C.cancel();
console.log('PASS: panel placement gate; preview-only movement; stacking; blocked preservation; two-preview collision; atomic two-piece commit/Undo; either hand grabs; simultaneous independent ownership; tracking loss never commits.');

const fs=require('fs'),vm=require('vm'),assert=require('assert');
const THREE=require('../native/vendor/three.min.js');const noop=()=>{};
const context={THREE,window:{},document:{createElement:()=>({style:{},innerHTML:'',querySelector:()=>({}),append:noop}),body:{append:noop}},setInterval:noop,console};vm.createContext(context);
for(const name of ['drive','odyssey-play'])vm.runInContext(fs.readFileSync(`native/world/${name}.js`,'utf8'),context);
const {Drive,OdysseyPlay}=context.window;
function vehicle(kind,water){const group=new THREE.Group();group.position.set(0,0,0);return Drive.create({M:40,groundH:()=>0,aabbs:()=>[],prop:{group,yaw:0,box:new THREE.Box3(new THREE.Vector3(-20,0,-40),new THREE.Vector3(20,80,40)),src:{kind,water}}});}
const horse=vehicle('horse');horse.input.y=1;for(let i=0;i<120;i++)Drive.step(horse,1/60,{});assert(horse.pos.z>200);const h=horse.heading;horse.input.x=.5;for(let i=0;i<30;i++)Drive.step(horse,1/60,{});assert(horse.heading<h);horse.input.x=horse.input.y=0;for(let i=0;i<180;i++)Drive.step(horse,1/60,{});assert.equal(horse.speed,0);
const water={minX:-200,maxX:200,minZ:-200,maxZ:200,y:140};const boat=vehicle('boat',water);boat.input.y=1;for(let i=0;i<600;i++)Drive.step(boat,1/60,{});assert(Drive.waterContains(water,boat.pos.x,boat.pos.z,boat.r));assert.equal(boat.pos.y,140);assert(boat.pos.z<=200-boat.r);
const box=new THREE.Box3(new THREE.Vector3(-1,-1,40),new THREE.Vector3(1,1,50));assert.equal(OdysseyPlay.segmentBox({x:0,y:0,z:0},{x:0,y:0,z:100},box),.4);assert.equal(OdysseyPlay.segmentBox({x:2,y:0,z:0},{x:2,y:0,z:100},box),null);
console.log(JSON.stringify({horse:{travel:horse.pos.length(),turn:horse.heading,stopped:horse.speed===0},boat:{pos:boat.pos.toArray(),inside:true},sweptArrow:'hit across 100 LDU segment; near miss rejected'},null,2));

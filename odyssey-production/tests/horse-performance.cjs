const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',value:'',prepend(){},append(){},querySelector:node,querySelectorAll(){return[]}});return nodes.get(key)};
const events={};const W={ready:true,mode:'ride',t:12,stick(x,y){this.stickValue=[x,y]},veh:{speed:90,vel:{set(...x){this.value=x}}},rig:{pos:{x:0,z:0},heading:0,figure:{rotation:{}}}};
const window={__world:W,addEventListener(n,f){events[n]=f}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../native/world/odyssey-performance.js'),'utf8'),{window,document:{getElementById:node,createElement:node,addEventListener(){}},Math});
const command=window.OdysseyPerformance.command;
command('walk forward');assert.equal(W.performanceRide.y,1);assert.equal(W.performanceRide.until,15);
command('turn left');assert.equal(W.performanceRide.x,-1);
command('reverse');assert.equal(W.performanceRide.y,-1);
command('stop');assert.equal(W.performanceRide,null);assert.equal(W.veh.speed,0);
command('walk forward');events.blur();assert.equal(W.performanceRide,null);
W.mode='walk';command('walk forward');assert.equal(W.performanceTarget.z,200);command('stop');assert.equal(W.performanceTarget,null);
// Exercise the actual simulation arbitration: physical input wins; cues expire.
const main=fs.readFileSync(path.join(__dirname,'../native/world/main.js'),'utf8');
const clause=main.match(/const cue=W\.performanceRide;[^\n]+/)[0];
const V={input:{},landing:false};const I={L:{mag:0}};W.performanceRide={x:0,y:1,until:15};vm.runInNewContext(clause,{W,V,I,Math});assert.equal(V.input.y,1);
I.L.mag=.8;vm.runInNewContext(clause,{W,V,I,Math});assert.equal(W.performanceRide,null);
I.L.mag=0;W.performanceRide={x:0,y:1,until:12};vm.runInNewContext(clause,{W,V,I,Math});assert.equal(W.performanceRide,null);
console.log('PASS: mounted forward/turn/reverse, immediate stop, blur stop, walking, manual override and cue expiry');

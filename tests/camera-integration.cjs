/* Node 18+: real Minifig camera integration; uses the application's Three r128. */
const fs=require('node:fs'),path=require('node:path');
const run=function(THREE,minifigSource,surfaceSource){
 const window={};new Function('window','THREE',minifigSource)(window,THREE);
 const M=window.Minifig,knob={style:{}},$=()=>knob;
 let lookPointer=1,lookAxis={x:1,y:0};
 const W={ready:true,input:{look:{dx:0,dy:0}}};
 const step=eval('('+surfaceSource.slice(surfaceSource.indexOf('function cameraStep('),surfaceSource.indexOf('function pages('))+')');
 const rig={M:40,pos:new THREE.Vector3(),cam:{yaw:0,pitch:.2,set:false,pos:new THREE.Vector3(),look:new THREE.Vector3()}};
 const camera=new THREE.PerspectiveCamera(50,1,1,10000),world={groundH:()=>-10000};
 for(let i=0;i<60;i++){step(1/60);M.camera(rig,camera,1/60,W.input.look,world,false,false);W.input.look.dx=W.input.look.dy=0;}
 if(Math.abs(rig.cam.yaw+1.08)>.0001)throw Error('One second look must turn 1.08 radians, got '+rig.cam.yaw);
 if(Math.abs(rig.cam.pitch-.2)>.0001)throw Error('Horizontal look changed pitch');
 const move={};M.moveFromStick(rig,{x:0,y:1},move);if(Math.abs(Math.hypot(move.x,move.z)-1)>.0001)throw Error('Movement lost camera-relative unit length');
 lookPointer=null;const yaw=rig.cam.yaw;step(1/60);M.camera(rig,camera,1/60,W.input.look,world,false,false);
 if(rig.cam.yaw!==yaw)throw Error('Released joystick still turns');
 return {passed:4,turnDegrees:Math.round(-yaw*180/Math.PI)};
};
(async()=>{
const three=process.env.THREE_SOURCE_PATH?fs.readFileSync(process.env.THREE_SOURCE_PATH,'utf8'):await (await fetch('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js')).text();
const THREE=new Function('const module={exports:{}};const exports=module.exports;'+three+';return module.exports;')();
const read=n=>fs.readFileSync(path.join(__dirname,'../world',n),'utf8');
console.log(run(THREE,read('minifig.js'),read('world-surface.js')));
})().catch(e=>{console.error(e);process.exitCode=1});

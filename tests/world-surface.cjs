/* node tests/world-surface.cjs — source-level input tests; no browser rendering. */
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../world/world-surface.js'),'utf8');
function run(source){
 let pointer=null,movePointer=null,selected=null,calls=[],currentHit=null;
 const knob={style:{}},pad={getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};
 const $=s=>s==='#vMove'?pad:knob;
 const P={surfaceState:()=>({selected,dragging:false}),pointIntoWorld:()=>currentHit,beginDrag:h=>{calls.push('begin');return true;},dragTo:()=>calls.push('move'),endDrag:c=>calls.push(c?'place':'cancel'),capture:h=>{selected=h;calls.push('select');},resetBindings:()=>{selected=null;calls.push('clear');}};
 const W={ready:true,mode:'walk',input:{L:{},fly:{},look:{dx:0,dy:0}},renderer:{domElement:{getBoundingClientRect:()=>({left:10,top:20,width:400,height:600})}}};
 const trace=()=>{};let traceUntil=0;
 const block=source.slice(source.indexOf('function coords('),source.indexOf("for(const name of ['pointerdown','pointermove','pointerup','pointercancel'])"));
 const steerSource=source.slice(source.indexOf('function steer('),source.indexOf("$('#vMove').onpointerdown"));
 const stopSource=source.slice(source.indexOf('function stopMovement('),source.indexOf('function cancel('));
 const handlers=eval('(function(){'+block+steerSource+stopSource+';return {down,motion,up,steer,stopMovement};})()');
 const event=(x,y,type='pointerup',id=1)=>({clientX:x,clientY:y,type,pointerId:id,button:0,target:{setPointerCapture(){}},preventDefault(){},stopImmediatePropagation(){}});
 const assert=(ok,text)=>{if(!ok)throw Error(text)};
 const object={kind:'piece',id:1,name:'brick'};currentHit=object;
 handlers.down(event(60,60));handlers.up(event(60,60));assert(selected===object&&!calls.includes('begin'),'tap selects without moving');
 calls=[];handlers.down(event(60,60));handlers.motion(event(90,75));handlers.up(event(90,75));assert(calls.join(',')==='begin,move,place','selected drag commits on release');
 calls=[];handlers.down(event(60,60));handlers.motion(event(90,75));handlers.up(event(90,75,'pointercancel'));assert(calls.at(-1)==='cancel','pointer interruption cancels drag');
 calls=[];selected=null;handlers.down(event(60,60));handlers.motion(event(90,75));handlers.up(event(90,75));assert(!calls.includes('begin')&&Math.abs(W.input.look.dx-.135)<.000001,'unselected drag looks without moving object');
 currentHit={kind:'ground',point:{}};selected=object;handlers.down(event(60,60));handlers.up(event(60,60));assert(calls.includes('clear'),'empty tap clears selection');
 movePointer=2;handlers.steer(event(100,0,'pointermove',2));assert(W.input.L.mag<=1&&W.input.L.held,'joystick clamps magnitude');
 const x=W.input.L.x;handlers.steer(event(0,0,'pointermove',3));assert(W.input.L.x===x,'second pointer cannot steal joystick');
 handlers.stopMovement();assert(W.input.L.mag===0&&!W.input.L.held&&movePointer===null,'release clears movement');
 return {passed:8};
}
console.log(run(source));

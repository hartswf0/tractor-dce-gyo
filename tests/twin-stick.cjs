/* node tests/twin-stick.cjs — continuous look and independent pointer ownership. */
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../world/world-surface.js'),'utf8');
const code=src.slice(src.indexOf("function stopLook("),src.indexOf("$('#vLook').onpointerdown"))+src.slice(src.indexOf("function cameraStep("),src.indexOf("function pages("));
const check=function anonymous(code
) {

let lookPointer=22,lookAxis={x:0,y:0};
const knob={style:{}},pad={getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})},$=s=>s==='#vLook'?pad:knob;
const W={ready:true,input:{look:{dx:0,dy:0},L:{x:.7,y:.7,mag:1,held:true}}};
eval(code+';lookSteer({pointerId:22,clientX:85,clientY:50});cameraStep(1/60);cameraStep(1/60);');
if(Math.abs(W.input.look.dx-8)>.001)throw Error('Held look must integrate every frame');
if(W.input.L.x!==.7||!W.input.L.held)throw Error('Look stole movement');
eval(code+';lookSteer({pointerId:99,clientX:0,clientY:0});');
if(lookAxis.x!==1)throw Error('Wrong pointer stole look');
eval(code+';stopLook();cameraStep(1/60);');
if(lookPointer!==null||W.input.look.dx!==0||lookAxis.x!==0)throw Error('Look did not stop');
return {passed:4};

};
console.log(check(code));

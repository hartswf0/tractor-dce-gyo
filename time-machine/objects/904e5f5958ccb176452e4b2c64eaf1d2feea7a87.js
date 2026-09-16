/* Preserve the original operator controls; reserve canvas space for their dock. */
(function(){
'use strict';
const $=s=>document.querySelector(s),W=window.__world;
if(!W||!window.PutThatThere)return;
document.body.classList.add('operator-surface');
const dock=document.createElement('aside');dock.id='operatorDock';dock.setAttribute('aria-label','Word to World operator');
dock.innerHTML='<div id="operatorTools"><div id="operatorMenu"></div><div id="operatorGesture" hidden></div></div><div id="operatorBar"></div>';
document.body.appendChild(dock);
function move(id,parent){const node=$(id);if(node)$(parent).appendChild(node);}
for(const id of ['#menu','#find','#palette'])move(id,'#operatorMenu');
move('#ptt','#operatorGesture');
move('#wb','#operatorBar');
move('#wbSay','#operatorBar');
const gestureButton=document.createElement('button');gestureButton.id='operatorPoint';gestureButton.textContent='point';gestureButton.setAttribute('aria-expanded','false');
$('#wbTop').appendChild(gestureButton);
for(const id of ['#pttArrange','#pttStart','#pttAsk'])move(id,'#wbTop');
$('#pttStart').textContent='Hand';
$('#pttArrange').title='Switch between walking and selecting objects';
$('#pttAsk').title='Record speech';
const state=$('#pttState');$('#operatorGesture').prepend(state);
$('#pttDiagnostics summary').textContent='Diagnostics · operator 9';
let pointOpen=false;
function openPoint(on){
 pointOpen=on;$('#operatorGesture').hidden=!on;gestureButton.classList.toggle('on',on);gestureButton.setAttribute('aria-expanded',String(on));
 if(on){$('#menu').classList.remove('open');$('#wbCode').hidden=true;$('#wbLog').hidden=true;W.wbOpen&&W.wbOpen(true,true);}
 schedule();
}
gestureButton.onclick=()=>openPoint(!pointOpen);
$('#pttStart').addEventListener('click',()=>openPoint(true));
$('#pttAsk').addEventListener('click',()=>openPoint(true));
for(const id of ['#wbCodeBtn','#wbLogBtn','#wbKeyBtn','#menuBtn'])$(id).addEventListener('click',()=>{if(pointOpen)openPoint(false);schedule();});
for(const id of ['#wbCodeBtn','#wbLogBtn'])$(id).addEventListener('click',()=>{
 const other=id==='#wbCodeBtn'?'#wbLog':'#wbCode';$(other).hidden=true;$(other+'Btn').classList.remove('on');
});
const close=document.createElement('button');close.textContent='Close pointing tools';close.onclick=()=>openPoint(false);$('#operatorGesture').prepend(close);
// The original Build / Read input remains the primary composer.
$('#pttForm').hidden=true;
const instruction=document.createElement('button');instruction.textContent='Apply words to selection';instruction.title='Use the builder text as a pointed instruction';
instruction.onclick=()=>{const text=$('#words').value.trim();if(text)window.PutThatThere.heard(text,true);else $('#words').focus();};
$('#pttActions').prepend(instruction);
for(const name of ['pointerdown','pointerup','pointermove','keydown'])dock.addEventListener(name,e=>e.stopPropagation());
let queued=false,last='';
function schedule(){if(!queued){queued=true;requestAnimationFrame(fit);}}
function fit(){
 queued=false;
 const v=window.visualViewport,h=v?v.height:innerHeight,offset=v?v.offsetTop:0;
 document.documentElement.style.setProperty('--operator-height',h+'px');
 dock.style.bottom=Math.max(0,innerHeight-h-offset)+'px';
 const rect=dock.getBoundingClientRect(),stage=$('#stage');
 const height=Math.max(1,rect.top-offset);
 stage.style.top=offset+'px';stage.style.bottom='auto';stage.style.height=height+'px';
 document.documentElement.style.setProperty('--operator-floor',(innerHeight-rect.top)+'px');
 const signature=stage.clientWidth+':'+stage.clientHeight;
 if(W.renderer&&W.camera&&signature!==last){last=signature;W.renderer.setSize(stage.clientWidth,stage.clientHeight);W.camera.aspect=stage.clientWidth/stage.clientHeight;W.camera.updateProjectionMatrix();}
}
new ResizeObserver(schedule).observe(dock);
new MutationObserver(schedule).observe(dock,{attributes:true,attributeFilter:['hidden','class'],subtree:true});
window.addEventListener('resize',schedule);
if(window.visualViewport){visualViewport.addEventListener('resize',schedule);visualViewport.addEventListener('scroll',schedule);}
window.PutThatThere.setArrange(false);
schedule();
})();
/* A world-first surface over the existing builder and gesture engine. */
(function(){
'use strict';
const $=s=>document.querySelector(s),W=window.__world,P=window.PutThatThere;
if(!W||!P)return;
P.worldSurface();document.body.classList.add('void-world');
const root=document.createElement('div');root.id='voidUI';
root.innerHTML='<button id="vSettings" aria-label="Settings" title="Settings">⚙</button><button id="vMove" aria-label="Move: drag to walk; arrow keys also work"><i></i><span>MOVE</span></button><button id="vLook" aria-label="Look: drag to turn camera"><i></i><span>LOOK</span></button><button id="vMic" aria-label="Hold to speak; tap to type" title="Hold to speak; tap to type">Mic</button><button id="vUndo" aria-label="Undo last available change" hidden>↶</button><div id="vTrace" role="status" aria-live="polite" hidden></div><button id="vObject" hidden></button><div id="vAction" hidden><button id="vStop">Stop</button><button id="vRetry" hidden>Retry</button><button id="vType" hidden>Type</button><button id="vCancel">Cancel</button></div><div id="vPreview" hidden></div><form id="vText" hidden><textarea id="vWords" rows="2" aria-label="World instruction" placeholder="Say what to change…" enterkeyhint="send"></textarea><div><button type="submit">Send</button><button type="button" id="vTextClose">Close</button></div></form><section id="vPanel" hidden aria-label="Settings"><header><nav><button data-vtab="builder">Builder</button><button data-vtab="inputs">Inputs</button><button data-vtab="world">World</button></nav><button id="vClose" aria-label="Close settings">×</button></header><div id="vPanelBody"><div id="vPages"><div id="v-builder"></div><div id="v-inputs" hidden></div><div id="v-world" hidden></div></div></div><footer id="vPager"><button id="vPrev">Previous</button><span id="vPageCount"></span><button id="vNext">Next</button></footer></section>';
document.body.appendChild(root);
function move(id,to){const n=$(id);if(n)$(to).appendChild(n);}
move('#wb','#v-builder');move('#palette','#v-builder');move('#bchip','#v-builder');move('#build','#v-builder');
move('#ptt','#v-inputs');move('#pttStart','#v-inputs');
move('#menu','#v-world');move('#find','#v-world');move('#credit','#v-world');
move('#wbCommit','#vPreview');move('#wbDiscard','#vPreview');
const adjust=document.createElement('button');adjust.textContent='Adjust';adjust.onclick=()=>panel('builder');$('#vPreview').appendChild(adjust);
$('#wbCommit').textContent='Apply';
$('#pttDiagnostics summary').textContent='Developer diagnostics';
$('#pttArrange').hidden=true;$('#pttState').hidden=true;$('#pttForm').hidden=true;$('#pttKey').hidden=true;
$('#wbHide').hidden=true;

const access=document.createElement('nav');access.id='vAccess';access.setAttribute('aria-label','World operator controls');
const builder=document.createElement('button');builder.textContent='Builder';builder.onclick=()=>panel('builder');access.appendChild(builder);
const world=$('#menuBtn');world.textContent='Who · Where';access.appendChild(world);
const hand=$('#pttStart');access.appendChild(hand);
root.appendChild(access);
const locationLabel=document.createElement('button');locationLabel.id='vLocation';locationLabel.onclick=()=>panel('world');root.appendChild(locationLabel);
move('#shield','#voidUI');
move('#pttView','#voidUI');move('#pttState','#voidUI');$('#pttState').hidden=false;
move('#minimap','#voidUI');move('#det','#voidUI');

let phase='REST',lastInstruction='',traceUntil=0,fault=false,tab='builder',pointer=null,movePointer=null,lookPointer=null,lookAxis={x:0,y:0},pageOffset=0,hold=null,submitAudio=false,lastTime=0,previousSignature='';
function trace(text,duration=4500){$('#vTrace').textContent=text;traceUntil=performance.now()+duration;}
function panel(name){stopMovement();stopLook();pageOffset=0;tab=name||tab;$('#vPanel').hidden=false;root.querySelectorAll('[data-vtab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vtab===tab)));for(const n of ['builder','inputs','world'])$('#v-'+n).hidden=n!==tab;layout();}
function closePanel(){stopLook();$('#vPanel').hidden=true;layout();$('#vSettings').focus();}
$('#vSettings').onclick=()=>$('#vPanel').hidden?panel(tab):closePanel();
$('#vClose').onclick=closePanel;
root.querySelectorAll('[data-vtab]').forEach(b=>b.onclick=()=>panel(b.dataset.vtab));
$('#menuBtn').onclick=()=>panel('world');
$('#pttKey').onclick=()=>{panel('builder');$('#wbKeyRow').classList.add('on');$('#wbKey').focus();};
function textInput(){$('#vPanel').hidden=true;$('#vText').hidden=false;$('#vWords').value=lastInstruction;$('#vWords').focus();layout();}
$('#vTextClose').onclick=()=>{$('#vText').hidden=true;$('#vWords').blur();layout();};
$('#vType').onclick=textInput;
function send(text){text=text.trim();if(!text)return;lastInstruction=text;fault=false;$('#vText').hidden=true;$('#vWords').blur();P.heard(text,true);layout();}
$('#vText').onsubmit=e=>{e.preventDefault();send($('#vWords').value);};
$('#vWords').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e.target.value);}};
$('#vUndo').onclick=()=>{P.execute({verb:'undo'});fault=false;};
function stopMovement(){for(const t of [W.input.L,W.input.fly])if(t){t.x=t.y=t.mag=0;t.held=false;}movePointer=null;$('#vMove i').style.transform='translate(0,0)';}
function cancel(){
 if(hold){clearTimeout(hold.timer);hold.cancelled=true;hold=null;}submitAudio=false;P.cancelSurface();stopMovement();stopLook();pointer=null;
 if(W.master&&W.master.busy)$('#wbStop').click();
 if(W.master&&W.master.result)$('#wbDiscard').click();
 fault=false;trace('Stopped.');layout();
}
$('#vCancel').onclick=()=>{cancel();P.resetBindings();};
$('#vStop').onclick=cancel;
$('#vRetry').onclick=()=>{fault=false;if(P.surfaceState().hasAudio)P.transcribeRecording();else if(lastInstruction)send(lastInstruction);};
function coords(e){const r=W.renderer.domElement.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];}
function hit(e){return P.pointIntoWorld(...coords(e));}
function same(a,b){return a&&b&&a.kind===b.kind&&a.id===b.id;}
function down(e){
 if(P.surfaceState().dragging)return;
 if(!W.ready||e.button>0||W.film&&W.film.owns())return;
 if(pointer)return;
 const h=hit(e),s=P.surfaceState();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,hit:h,drag:false,canDrag:same(h,s.selected)};
 e.target.setPointerCapture(e.pointerId);
}
function motion(e){
 if(!pointer||pointer.id!==e.pointerId)return;
 const t=pointer,dx=e.clientX-t.x,dy=e.clientY-t.y;t.x=e.clientX;t.y=e.clientY;
 if(Math.hypot(e.clientX-t.x0,e.clientY-t.y0)<7&&!t.moved)return;t.moved=true;
 if(t.canDrag){
  if(!t.drag){const r=W.renderer.domElement.getBoundingClientRect();t.drag=P.beginDrag(t.hit,(t.x0-r.left)/r.width,(t.y0-r.top)/r.height,'pointer');}
  if(t.drag)P.dragTo(...coords(e));
 }else{W.input.look.dx+=dx*.0045;W.input.look.dy+=dy*.0035;}
}
function up(e){
 if(!pointer||pointer.id!==e.pointerId)return;
 const t=pointer;pointer=null;
 if(t.drag)P.endDrag(e.type==='pointerup');
 else if(!t.moved&&e.type==='pointerup'){
  if(t.hit&&t.hit.kind!=='ground'){P.capture(t.hit);trace('Selected '+(t.hit.name||t.hit.kind));}
  else{if(!P.surfaceState().pending)P.resetBindings();if(t.hit)P.capture(t.hit);traceUntil=0;}
 }
}
function intercept(e){
 if(e.target!==W.renderer?.domElement||!W.ready)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(e.type==='pointerdown')down(e);else if(e.type==='pointermove')motion(e);else up(e);
}
for(const name of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(name,intercept,{capture:true,passive:false});
$('#vObject').onpointerdown=e=>{e.preventDefault();e.stopPropagation();const s=P.surfaceState(),r=W.renderer.domElement.getBoundingClientRect();if(!s.selected)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,hit:s.selected,canDrag:true,drag:P.beginDrag(s.selected,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,'pointer'),moved:true};e.currentTarget.setPointerCapture(e.pointerId);};
$('#vObject').onpointermove=motion;$('#vObject').onpointerup=up;$('#vObject').onpointercancel=up;
function steer(e){
 if(movePointer!==e.pointerId)return;
 const r=$('#vMove').getBoundingClientRect(),radius=r.width*.35,dx=(e.clientX-r.left-r.width/2)/radius,dy=(r.top+r.height/2-e.clientY)/radius,m=Math.hypot(dx,dy),scale=m>1?1/m:1;
 const x=m<.1?0:dx*scale,y=m<.1?0:dy*scale,t=W.mode==='fly'?W.input.fly:W.input.L;
 t.x=x;t.y=y;t.mag=Math.min(1,Math.hypot(x,y));t.held=true;
 $('#vMove i').style.transform='translate('+(x*radius)+'px,'+(-y*radius)+'px)';
}
$('#vMove').onpointerdown=e=>{e.preventDefault();if(movePointer!==null)return;movePointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steer(e);};
$('#vMove').onpointermove=steer;
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#vMove').addEventListener(name,e=>{if(movePointer===e.pointerId)stopMovement();});

function stopLook(){lookPointer=null;lookAxis.x=lookAxis.y=0;if(W.input.look)W.input.look.dx=W.input.look.dy=0;$('#vLook i').style.transform='translate(0,0)';}
function lookSteer(e){
 if(e.pointerId!==lookPointer)return;
 const r=$('#vLook').getBoundingClientRect(),radius=r.width*.35;
 let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;
 const mag=Math.hypot(x,y);if(mag<.12)x=y=0;else {const strength=Math.min(1,(mag-.12)/.88);x=x/mag*strength;y=y/mag*strength;}
 lookAxis={x,y};$('#vLook i').style.transform='translate('+(x*radius)+'px,'+(y*radius)+'px)';
}
$('#vLook').onpointerdown=e=>{e.preventDefault();if(lookPointer!==null||!W.ready)return;lookPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);lookSteer(e);};
$('#vLook').onpointermove=lookSteer;
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#vLook').addEventListener(name,e=>{if(e.pointerId===lookPointer)stopLook();});
function cameraStep(dt){
 if(!W.ready||lookPointer===null||W.film&&W.film.owns())return;
 W.input.look.dx+=lookAxis.x*1.08*dt;W.input.look.dy+=lookAxis.y*.63*dt;
}
function pages(){
 const body=$('#vPanelBody'),content=$('#vPages'),height=body.clientHeight;
 if(!height)return;
 const step=Math.max(44,height-48),max=Math.max(0,content.scrollHeight-height);
 pageOffset=Math.max(0,Math.min(pageOffset,max));
 content.style.transform='translateY('+(-pageOffset)+'px)';
 $('#vPrev').disabled=pageOffset===0;$('#vNext').disabled=pageOffset>=max;
 $('#vPageCount').textContent=(Math.floor(pageOffset/step)+1)+' / '+(Math.ceil(max/step)+1);
}
$('#vPrev').onclick=()=>{pageOffset-=Math.max(44,$('#vPanelBody').clientHeight-48);pages();};
$('#vNext').onclick=()=>{pageOffset+=Math.max(44,$('#vPanelBody').clientHeight-48);pages();};
$('#vPanelBody').addEventListener('wheel',e=>e.preventDefault(),{passive:false});
$('#vPanelBody').addEventListener('touchmove',e=>{if(!/TEXTAREA|INPUT/.test(e.target.tagName))e.preventDefault();},{passive:false});
$('#vPanelBody').addEventListener('focusin',e=>{
 const body=$('#vPanelBody').getBoundingClientRect(),r=e.target.getBoundingClientRect();
 if(r.top<body.top||r.bottom>body.bottom){pageOffset+=r.top-body.top;pages();}
});

$('#vMic').onpointerdown=e=>{
 if(e.button>0||hold)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
 const h=hold={id:e.pointerId,released:false,cancelled:false,started:false};
 h.timer=setTimeout(async()=>{if(h.cancelled)return;h.started=true;submitAudio=true;await P.recordStart();if(h.cancelled){submitAudio=false;P.cancelSurface();}else if(h.released)P.recordStop();},300);
};
function releaseMic(e){
 if(!hold||hold.id!==e.pointerId)return;
 const h=hold;hold=null;h.released=true;clearTimeout(h.timer);
 if(e.type==='pointercancel'){h.cancelled=true;submitAudio=false;P.cancelSurface();return;}
 if(h.started)P.recordStop();else textInput();
}
$('#vMic').onpointerup=releaseMic;$('#vMic').onpointercancel=releaseMic;
$('#vMic').oncontextmenu=e=>e.preventDefault();
$('#vMic').onclick=e=>{if(e.detail===0)textInput();};
window.addEventListener('world-recording-ready',e=>{if(submitAudio&&e.detail.bytes){submitAudio=false;queueMicrotask(()=>P.transcribeRecording());}});
window.addEventListener('world-chat-message',e=>{lastInstruction=e.detail.text;fault=false;trace('“'+e.detail.text+'”',8000);});
window.addEventListener('world-chat-status',e=>{
 const text=e.detail.text;
 fault=/failed|error:|denied|unavailable|could not|not recognised|no speech|add an openai key|add an api key|recording is ready/i.test(text);
 if(/Play back to check/.test(text)&&submitAudio)return;
 trace(text,fault?60000:5000);
});
function releaseAll(){stopLook();if(P.surfaceState().opening||P.surfaceState().recording){submitAudio=false;P.cancelSurface();}stopMovement();if(pointer){P.endDrag(false);pointer=null;}if(hold){clearTimeout(hold.timer);hold.cancelled=true;hold=null;submitAudio=false;P.cancelSurface();}}
window.addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancel();P.resetBindings();$('#vPanel').hidden=true;$('#vText').hidden=true;layout();}});
for(const n of ['pointerdown','pointermove','pointerup','keydown'])root.addEventListener(n,e=>e.stopPropagation());
function layout(){
 const v=window.visualViewport,h=v?v.height:innerHeight,top=v?v.offsetTop:0;
 root.style.top=top+'px';root.style.height=h+'px';
 document.documentElement.style.setProperty('--vh-world',h+'px');
 const panelHeight=$('#vPanel').hidden?0:$('#vPanel').getBoundingClientRect().height;
 const textHeight=$('#vText').hidden?0:$('#vText').getBoundingClientRect().height;
 const floor=Math.max(panelHeight,textHeight),stage=$('#stage');document.documentElement.style.setProperty('--v-floor',floor+'px');
 stage.style.top=top+'px';stage.style.height=Math.max(1,h-floor)+'px';pages();
 const signature=stage.clientWidth+':'+stage.clientHeight;
 if(W.renderer&&W.camera&&signature!==previousSignature){previousSignature=signature;W.renderer.setSize(stage.clientWidth,stage.clientHeight);W.camera.aspect=stage.clientWidth/stage.clientHeight;W.camera.updateProjectionMatrix();}
}
window.addEventListener('resize',layout);
if(window.visualViewport){visualViewport.addEventListener('resize',()=>{if(document.activeElement===$('#vWords'))$('#vPanel').hidden=true;layout();});visualViewport.addEventListener('scroll',layout);}
new ResizeObserver(layout).observe($('#vPanel'));new ResizeObserver(layout).observe($('#vText'));
let marker=null;
let cameraTime=0;
function frame(now){
 const dt=cameraTime?Math.min(.05,(now-cameraTime)/1000):0;cameraTime=now;cameraStep(dt);
 const s=P.surfaceState(),preview=!!W.master?.result,working=!!W.master?.busy||s.inferring||s.transcribing,recording=s.recording||s.opening;
 phase=s.dragging?'DRAGGING':recording?'LISTENING':working?'WORKING':preview?'PREVIEWING':fault?'FAULT':now<traceUntil?'CHANGED':s.selected?'SELECTED':'REST';
 root.dataset.state=phase;
 $('#pttView').hidden=!s.hand;$('#pttState').hidden=!s.hand&&!s.selected&&!recording;
 if(!s.hand&&!hand.disabled)hand.textContent='Hand';
 $('#vUndo').hidden=!s.canUndo;
 $('#vMic').hidden=working&&!recording;
 $('#vMic').textContent=recording?'Release':'Mic';
 $('#vAction').hidden=!['DRAGGING','LISTENING','WORKING','FAULT'].includes(phase);
 $('#vStop').hidden=!working&&!recording;$('#vStop').textContent=recording?'Cancel recording':'Stop';
 $('#vRetry').hidden=!fault;$('#vType').hidden=!fault;
 $('#vPreview').hidden=!preview||working;
 $('#vTrace').hidden=!(now<traceUntil||recording||working);
 if(recording)$('#vTrace').textContent=s.opening?'Waiting for microphone permission…':'Recording · release to send · '+Math.round(s.level*100)+'% level';
 else if(working)$('#vTrace').textContent=s.transcribing?'Transcribing…':s.inferring?'Interpreting…':$('#wbText').textContent||'Building…';
 if(W.ready&&W.camera){
  if(s.selected&&!s.dragging){const c=s.selected.box.getCenter(new THREE.Vector3()).project(W.camera),r=W.renderer.domElement.getBoundingClientRect(),visible=c.z>=-1&&c.z<=1&&Math.abs(c.x)<.9&&Math.abs(c.y)<.9;$('#vObject').hidden=!visible;if(visible){$('#vObject').textContent=(s.selected.name||s.selected.kind)+' · Move';$('#vObject').style.left=(r.left+(c.x+1)*r.width/2)+'px';$('#vObject').style.top=(r.top-topOffset()+(1-c.y)*r.height/2)+'px';}}else $('#vObject').hidden=true;
  if(!marker){marker=new THREE.Mesh(new THREE.RingGeometry(9,13,32),new THREE.MeshBasicMaterial({color:0x5fe4c2,side:THREE.DoubleSide,depthTest:false}));marker.rotation.x=-Math.PI/2;marker.renderOrder=999;W.scene.add(marker);}
  marker.visible=!!s.there;if(s.there)marker.position.copy(s.there.point).add(new THREE.Vector3(0,2,0));
 }
 if(now-lastTime>500){lastTime=now;locationLabel.textContent=($('#mode').textContent||'')+' · '+($('#place').textContent||'');layout();pages();}
 requestAnimationFrame(frame);
}
function topOffset(){return window.visualViewport?visualViewport.offsetTop:0;}
window.WorldSurface={state:()=>phase,close:closePanel,cancel,layout};
layout();requestAnimationFrame(frame);
})();
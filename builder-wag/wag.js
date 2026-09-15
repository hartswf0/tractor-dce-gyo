(function(){
'use strict';
const W=window.__world,C=window.BuilderWag,P=window.PutThatThere,$=s=>document.querySelector(s);
let mode='move',page=0,active='',lastSize='';
const head=document.createElement('header');head.id='wagHeader';head.innerHTML='<div class="wagBrand">BUILDER WAG <span>select → preview → place</span></div>';
const entry=$('#wbRow');head.append(entry);entry.append($('#wbStop'));const tools=document.createElement('nav');tools.setAttribute('aria-label','Builder tools');head.append(tools);const tray=document.createElement('section');tray.id='wagTray';tray.hidden=true;head.append(tray);document.body.append(head);
const foot=document.createElement('footer');foot.id='wagFooter';foot.innerHTML='<div id="wagStatus" role="status"></div><div id="wagPrecision" hidden></div><div id="wagActions"></div><div id="wagVideo"></div>';document.body.append(foot);
$('#wagVideo').append($('#pttView'));$('#pttMode').hidden=true;
const gate=document.createElement('div');gate.id='wagGate';gate.hidden=true;gate.textContent='Tools open · placement paused';$('#stage').append(gate);
function btn(text,fn,parent=tools){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;parent.append(b);return b;}
const held=new Map();
function close(){for(const[n,p]of held)p.append(n);held.clear();tray.replaceChildren();tray.hidden=true;active='';C.panel(false);gate.hidden=true;tools.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded','false'));fit();}
function attach(id){const n=$(id);held.set(n,n.parentNode);tray.append(n);}
function open(name){if(active===name)return close();close();active=name;C.panel(true);gate.hidden=false;tray.hidden=false;tools.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded',String(b.textContent===name)));btn('Return to scene ×',close,tray);
 if(name==='Parts'){
  for(const[id,label]of Build.PARTS.slice(page*4,page*4+4))btn(label,()=>{if(!W.ready)return;close();mode='place';W.setBuild(true);W.choose(id);C.notify(label+': tap a surface for a preview, then Place.');},tray);
  btn('More parts '+(page+1)+'/5',()=>{page=(page+1)%5;active='';open(name);},tray);
  btn('Colour',()=>open('Colour'),tray);btn('Rotate part',()=>{if(!W.ready)return;W.choose(null,null,(W.build.rot+1)%4);close();mode='place';W.setBuild(true);},tray);
 }else if(name==='Colour'){for(const col of Build.COLOURS){const b=btn(String(col),()=>{W.choose(null,col);close();},tray);if(W.ready)b.style.borderColor=W.colours(col).clone().convertLinearToSRGB().getStyle();}}
 else if(name==='Hands'){
  btn('Camera on / off',()=>{close();$('#pttStart').click();},tray);
  btn('Record / stop',()=>{close();$('#pttAsk').click();},tray);
  btn('Calibrate reach',()=>{close();C.calibrate();},tray);
  btn('Practice stacking',()=>{close();mode='move';W.setBuild(false);C.practice();},tray);
 }else if(name==='Inspect'){
  for(const id of ['#wbTop','#wbCode','#wbLog','#wbKeyRow','#wbSheet'])attach(id);
 }else if(name==='World'){
  btn('Who / where',()=>{close();$('#menuBtn').click();},tray);btn('Map',()=>{close();W.mapOpen(true);},tray);btn('Board / land',()=>{close();$('#prompt').click();},tray);btn('Detonator',()=>{close();W.detonate();},tray);
 }
 fit();
}
for(const name of ['Parts','Hands','Inspect','World'])btn(name,()=>open(name));
btn('Move',()=>{close();mode='move';if(W.ready)W.setBuild(false);C.notify('Tap a brick, then drag it. Release holds the preview.');});
const actions=$('#wagActions');const place=btn('Place',()=>{if(C.state.panel)return;if(mode==='place'){const B=W.build,t=B?.target;if(!t||t.blocked)return C.notify('Aim at a clear surface first.');const p=B.place();C.notify(p?'Brick placed. Undo is available.':'Placement failed; nothing changed.');}else C.commit();},actions);
btn('Cancel',()=>{close();C.cancel();if(W.build){W.build.pin=null;W.setBuild(false);}mode='move';},actions);btn('Undo',()=>{if(!W.ready)return;close();C.cancel();C.notify(W.build.undo()?'Last edit undone.':'Nothing to undo.');},actions);
btn('Stack copy',()=>{if(C.state.panel||!W.ready)return;const p=W.build.pieces.get(C.state.selected);if(!p)return C.notify('Select the brick to copy and stack.');C.cancel();mode='place';W.setBuild(true);W.choose(p.part,p.col,p.rot);W.aimAt(p.x,p.box.max.y,p.z);C.notify('Copy preview above the selected brick. Place commits.');},actions);
const precision=$('#wagPrecision');for(const[label,dx,dy,dz]of [['X−',-20,0,0],['X+',20,0,0],['↑',0,8,0],['↓',0,-8,0],['Z−',0,0,-20],['Z+',0,0,20]]){const b=btn(label,()=>C.nudge(dx,dy,dz),precision);b.setAttribute('aria-label',dy>0?'Raise one plate':dy<0?'Lower one plate':label+' one stud');}
const coords=document.createElement('output');precision.prepend(coords);
// The original prompt and generation handlers stay attached to the original entry controls.
for(const id of ['#wbBuild','#wbRead','#wbCommit','#wbDiscard'])$(id).addEventListener('click',()=>{close();},true);
$('#words').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)close();},true);
function paint(){const s=C.state;$('#wagStatus').textContent=s.message;place.disabled=s.panel||!W.ready||(mode==='move'&&(!s.preview.size||[...s.preview.values()].some(t=>t.blocked)));precision.hidden=!s.selected||mode==='place';const p=W.build?.pieces.get(s.selected),d=s.preview.get(s.selected)||p;coords.textContent=d?`X ${Math.round(d.x)} · Y ${Math.round(d.y)} · Z ${Math.round(d.z)}`:'';for(const b of precision.querySelectorAll('button'))b.disabled=s.panel;
 const a=s.hands.get('Left'),b=s.hands.get('Right');head.dataset.hands=(a?.visible?'L ✓':'L —')+' '+(b?.visible?'R ✓':'R —');fit();}
window.addEventListener('wag-state',paint);
function fit(){const top=head.getBoundingClientRect().bottom,bottom=foot.getBoundingClientRect().height;document.documentElement.style.setProperty('--wagTop',top+'px');document.documentElement.style.setProperty('--wagBottom',bottom+'px');const r=$('#stage').getBoundingClientRect(),key=Math.round(r.width)+':'+Math.round(r.height);if(W.ready&&key!==lastSize&&r.height>0){lastSize=key;W.renderer.setSize(r.width,r.height,false);W.camera.aspect=r.width/r.height;W.camera.updateProjectionMatrix();}}
new ResizeObserver(fit).observe(head);new ResizeObserver(fit).observe(foot);window.addEventListener('resize',fit);
for(const n of [head,foot])for(const t of ['pointerdown','pointermove','pointerup'])n.addEventListener(t,e=>e.stopPropagation());
// Editing never shares pointer ownership with locomotion or camera controls.
const stage=$('#stage');let drag=null;
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,e=>{
 if(e.target!==stage&&!e.target.closest('canvas'))return;e.stopImmediatePropagation();e.preventDefault();if(C.state.panel||!W.ready)return;
 const r=stage.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height;
 if(type==='pointerdown'){if(drag)return;stage.setPointerCapture(e.pointerId);if(mode==='place'){const raycaster=new THREE.Raycaster();raycaster.setFromCamera({x:nx*2-1,y:1-ny*2},W.camera);W.build.pin={origin:raycaster.ray.origin.clone(),dir:raycaster.ray.direction.clone()};W.build.aimRay(W.build.pin.origin,W.build.pin.dir);C.notify(W.build.target?.blocked?'Blocked: choose a clear surface.':'Preview held. Place commits.');}else{const h=C.hit(nx,ny);if(h)drag={pointer:e.pointerId,g:C.begin(h,nx,ny,1)};}}
 if(type==='pointermove'&&drag?.pointer===e.pointerId)C.move(drag.g,nx,ny,1);
 if(['pointerup','pointercancel','lostpointercapture'].includes(type)&&drag?.pointer===e.pointerId){drag=null;C.notify('Preview held. Place commits; Cancel returns.');}
},true);
window.addEventListener('keydown',e=>{if(C.state.panel&&e.key!=='Escape'&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'){close();C.cancel();$('#menu').classList.remove('open');W.ready&&W.mapOpen(false);}});
// Persistent twin sticks. Values are velocity inputs, not pixel deltas.
for(const side of ['Move','Look']){const stick=btn(side,()=>{},foot);stick.className='wagStick '+side.toLowerCase();stick.setAttribute('aria-label',side+' joystick');const thumb=document.createElement('i');stick.prepend(thumb);let owner=null,x=0,y=0,last=0;
 function reset(){owner=null;x=y=0;thumb.style.transform='';if(side==='Move'&&W.ready)W.stick(0,0);}
 function pos(e){const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.35),dy=(e.clientY-r.top-r.height/2)/(r.height*.35),m=Math.max(1,Math.hypot(dx,dy));x=dx/m;y=dy/m;if(Math.hypot(x,y)<.12)x=y=0;thumb.style.transform=`translate(${x*20}px,${y*20}px)`;}
 stick.onpointerdown=e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;stick.setPointerCapture(owner);pos(e);};stick.onpointermove=e=>{if(e.pointerId===owner)pos(e);};for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===owner)reset();});window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(owner!==null&&W.ready){if(side==='Move')W.stick(x,-y);else W.look(x*dt*1.08,y*dt*.63);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
// Calibration controls are a single task strip, never a side panel.
const cal=document.createElement('div');cal.id='wagCalibration';cal.hidden=true;head.append(cal);const calText=document.createElement('span');cal.append(calText);
btn('Capture position',()=>C.captureCalibration(),cal);btn('Exit calibration',()=>{C.state.calibration=null;cal.hidden=true;C.notify('Calibration closed.');},cal);
window.addEventListener('wag-state',()=>{cal.hidden=!C.state.calibration;calText.textContent=C.state.message;});
function ready(){if(!W.ready){requestAnimationFrame(ready);return;}C.install();W.wbOpen(true);paint();}requestAnimationFrame(ready);
})();

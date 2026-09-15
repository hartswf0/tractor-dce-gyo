(function(){
'use strict';
const W=window.__world,P=window.PutThatThere,$=s=>document.querySelector(s);
const rail=document.createElement('nav');rail.id='alley';rail.setAttribute('aria-label','Builder tools');
const drawer=document.createElement('section');drawer.id='alleyDrawer';drawer.hidden=true;
const status=document.createElement('div');status.id='alleyStatus';status.setAttribute('role','status');status.textContent='Builder Alley · select a tool at the edge';
document.body.append(rail,drawer,status);
let active='',page=0,selecting=false;
function button(label,fn,parent=drawer){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;parent.append(b);return b;}
const holders=new Map();
function close(){for(const [node,parent]of holders)parent.append(node);holders.clear();drawer.replaceChildren();drawer.hidden=true;active='';rail.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded','false'));}
function move(id){const node=$(id);if(!node)return;holders.set(node,node.parentNode);drawer.append(node);}
function open(name){if(active===name){close();return;}close();active=name;drawer.hidden=false;rail.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded',String(b.textContent===name)));button('Close ×',close);const h=document.createElement('h2');h.textContent=name;drawer.append(h);
 if(name==='Build'){
  if(!W.ready){status.textContent='World is still loading.';return;}
  W.setBuild(true);const parts=Build.PARTS.slice(page*6,page*6+6);for(const [id,label]of parts)button(label,()=>{W.choose(id);status.textContent=label+' · aim at a surface, then Place';});
  button('Parts '+(page+1)+'/3 →',()=>{page=(page+1)%3;active='';open(name);});
  button('Rotate ↻',()=>W.choose(null,null,(W.build.rot+1)%4));button('Lift +',()=>W.lift(W.build.lift+1));button('Lower −',()=>W.lift(W.build.lift-1));button('Place',()=>{W.placeBrick();status.textContent=W.build.target?.blocked?'Blocked: aim at a clear surface.':'Check the ghost: green can place; red is blocked';});
  button('Colour',()=>open('Colour'));button('Done',()=>{W.setBuild(false);close();});
 }else if(name==='Colour'){for(const c of Build.COLOURS){const b=button('Colour '+c,()=>W.choose(null,c));b.style.borderColor=W.colours(c).clone().convertLinearToSRGB().getStyle();}}
 else if(name==='Move'){
  button('Select from scene',()=>{selecting=true;W.setBuild(false);close();status.textContent='Tap a brick to select it. Move and look sticks still work.';});
  for(const [label,x,y,z]of [['X −',-20,0,0],['X +',20,0,0],['Raise',0,8,0],['Lower',0,-8,0],['Z −',0,0,-20],['Z +',0,0,20]])button(label,()=>P.editNudge(x,y,z));
  button('Place move',()=>P.editApply());button('Cancel move',()=>P.editCancel());button('Copy on top',()=>P.copyTop());move('#pttLine');
 }else if(name==='Hands'){button('Swap grab hand',()=>P.swapHands());move('#pttStart');move('#pttView');move('#pttState');move('#pttLine');const p=document.createElement('p');p.textContent='Right fist: grab; move sideways or upward. Left fist: clutch depth; move down for farther, up for nearer. Open right hand to place. Lost right hand cancels the move.';drawer.append(p);}
 else if(name==='Words'){W.wbOpen(true);move('#pttForm');move('#wb');}
 else if(name==='World'){button('Who / Where',()=>{close();$('#menuBtn').click();});button('Detonator',()=>W.detonate());button('Board / land',()=>$('#prompt').click());button('Map',()=>{close();W.mapOpen(true);});button('Reset view',()=>{if(W.rig?.cam)W.rig.cam.set=false;});}
 else if(name==='System'){button('Reset bricks',()=>{if(confirm('Remove all bricks and damage at this place?'))W.resetPlace();});button('Pick / remove brick',()=>{W.setBuild(true);W.setPick(true);status.textContent='Aim at brick, then use Build → Place to remove.';});move('#pttDiagnostics');move('#pttKey');move('#pttSendAudio');move('#pttPlayback');move('#pttBrowserVoice');button('Return to restored demo',()=>location.href='./word-to-world.html?noloc=1');}
}
for(const name of ['Build','Move','Hands','Words','World','System']){const b=button(name,()=>open(name),rail);b.setAttribute('aria-expanded','false');}
button('Undo',()=>P.execute({verb:'undo'}),rail);
const escape=button('×',()=>{close();$('#menu')?.classList.remove('open');$('#find')?.classList.remove('open');W.mapOpen&&W.ready&&W.mapOpen(false);P.editCancel();},rail);escape.setAttribute('aria-label','Close tools and cancel move');
for(const node of [rail,drawer])for(const type of ['pointerdown','pointermove','pointerup'])node.addEventListener(type,e=>e.stopPropagation());
window.addEventListener('keydown',e=>{if(e.key==='Escape'){close();P.editCancel();}});
const stage=$('#stage');let tap=null;
for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])stage.addEventListener(type,e=>{
 if(!selecting)return;e.stopImmediatePropagation();e.preventDefault();
 if(type==='pointerdown'){tap={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);}
 if(type==='pointerup'&&tap?.id===e.pointerId){if(Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<15){const r=stage.getBoundingClientRect();P.capture(P.pointIntoWorld((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height));selecting=false;open('Move');}tap=null;}
 if(type==='pointercancel')tap=null;
},true);
// Two independent pointer owners; only the look stick emits angular velocity.
for(const side of ['Move','Look']){
 const stick=document.createElement('button');stick.className='alleyStick '+side.toLowerCase();stick.setAttribute('aria-label',side+' joystick');stick.innerHTML='<i></i><span>'+side+'</span>';document.body.append(stick);
 let owner=null,x=0,y=0,last=0;
 const reset=()=>{owner=null;x=y=0;stick.firstChild.style.transform='';if(side==='Move'&&W.ready)W.stick(0,0);};
 function position(e){const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.35),dy=(e.clientY-r.top-r.height/2)/(r.height*.35),m=Math.max(1,Math.hypot(dx,dy));x=dx/m;y=dy/m;if(Math.hypot(x,y)<.12)x=y=0;stick.firstChild.style.transform=`translate(${x*25}px,${y*25}px)`;}
 stick.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(owner!==null)return;owner=e.pointerId;stick.setPointerCapture(owner);position(e);};
 stick.onpointermove=e=>{e.stopPropagation();if(e.pointerId===owner)position(e);};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{e.stopPropagation();if(e.pointerId===owner)reset();});window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(owner!==null&&W.ready){if(side==='Move')W.stick(x,-y);else W.look(x*dt*1.08,y*dt*.63);}requestAnimationFrame(tick);}requestAnimationFrame(tick);
 stick.onkeydown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(side==='Look')W.look(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0,e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0);}};
}
})();

/* Builder WAG: a preview is not an edit. All input paths share the same placement gate. */
(function(){
'use strict';
const W=window.__world,V=()=>new THREE.Vector3(),slots=new Map(),history=new Map();
const S={panel:false,selected:null,preview:new Map(),hands:new Map(),gain:1,practice:null,message:'Tap a brick. Drag to preview. Place commits; Cancel returns.',version:0};
let pair=null,axis=null;
function notify(text){if(text)S.message=text;S.version++;window.dispatchEvent(new CustomEvent('wag-state'));}
function ray(nx,ny){const r=new THREE.Raycaster();W.camera.updateMatrixWorld();r.setFromCamera({x:nx*2-1,y:1-ny*2},W.camera);return r.ray;}
function hit(nx,ny,exclude=new Set()){
 if(!W.ready)return null;const r=ray(nx,ny);let best=null;
 for(const p of W.build.pieces.values()){if(exclude.has(p.id))continue;const q=r.intersectBox(p.box,V());if(q){const d=q.distanceTo(r.origin);if(d<1800&&(!best||d<best.distance))best={kind:'piece',id:p.id,item:p,box:p.box,point:q,distance:d};}}
 return best;
}
function select(h){if(!h||!W.build.pieces.has(h.id)){notify('No brick at that point.');return false;}S.selected=h.id;if(axis)W.scene.remove(axis);axis=new THREE.AxesHelper(70);axis.position.copy(h.item.box.getCenter(V()));W.scene.add(axis);notify('Selected '+(W.build.kinds.get(h.item.part)?.name||'brick')+'. Drag or adjust X / height / Z.');return true;}
function display(id,d){const p=W.build.pieces.get(id);if(!p)return null;const t=AlleyPlacement.resolve(W.build,p,d,id);let slot=slots.get(id);if(!slot){const helper=new THREE.Box3Helper(p.box.clone(),0x6cf5c2);helper.material.depthTest=false;helper.renderOrder=1000;W.scene.add(helper);slot={helper};slots.set(id,slot);}slot.helper.box.copy(W.build.boxOf({...p,...t}));slot.helper.material.color.set(t.blocked?0xff625d:0x6cf5c2);S.preview.set(id,t);notify();return t;}
function preview(id,d){if(S.panel)return false;return display(id,d);}
function cancel(){for(const x of slots.values()){W.scene?.remove(x.helper);x.helper.geometry.dispose();x.helper.material.dispose();}slots.clear();S.preview.clear();for(const h of S.hands.values()){h.grab=null;h.awaitOpen=true;h.closed=false;h.candidate=false;h.recent=null;}pair=null;notify('Preview cancelled. Build unchanged.');}
function panel(on){if(on&&S.preview.size)cancel();S.panel=on;if(on&&W.keys)W.keys.clear();if(on&&W.build){W.build.on=false;W.build.ghost.visible=false;}notify(on?'Choose a tool, then return to the scene.':'Ready.');}
function install(){const B=W.build;if(!B||B.wagInstalled)return;B.wagInstalled=true;
 const place=B.place.bind(B),step=B.stepQueue.bind(B),undo=B.undo.bind(B);
 B.place=function(){return S.panel?null:place();};B.stepQueue=function(dt){if(!S.panel)step(dt);};
 B.undo=function(){const key=this.history[this.history.length-1],rows=history.get(key);if(!rows)return undo();this.history.pop();history.delete(key);for(const r of rows)this.take(r[0],true);for(const r of rows)this.add(this.fromRow(r),false);if(this.onEdit)this.onEdit({up:rows});return key;};
}
function commit(){install();if(S.panel){notify('Close tools before placing.');return false;}if(!S.preview.size){notify('Select and move a brick first.');return false;}
 const B=W.build,edits=[];for(const [id,d]of S.preview){const p=B.pieces.get(id);if(!p){notify('A selected brick no longer exists. Cancel this preview.');return false;}const t=AlleyPlacement.resolve(B,p,d,id);if(t.blocked){notify('Blocked. Move the red preview into clear space.');return false;}edits.push({p,t,before:B.toRow(p).slice(),box:B.boxOf({...p,...t})});}
 for(let i=0;i<edits.length;i++)for(let j=i+1;j<edits.length;j++){const a=edits[i].box.clone();a.min.addScalar(.5);a.max.addScalar(-.5);if(a.intersectsBox(edits[j].box)){notify('The two previews overlap. Separate them before placing.');return false;}}
 const added=[];for(const e of edits)B.take(e.p.id,true);for(const e of edits){const q=B.add({...e.p,...e.t},false);if(!q){for(const x of added)B.take(x.id,true);for(const x of edits)B.add(B.fromRow(x.before),false);notify('Placement failed; original positions restored.');return false;}added.push(q);}
 const key='wag-'+Date.now()+'-'+Math.random();history.set(key,edits.map(e=>e.before));B.history.push(key);if(B.onEdit)B.onEdit({up:added.map(p=>B.toRow(p))});cancel();notify(added.length+' brick'+(added.length===1?'':'s')+' placed. Undo restores the move.');checkPractice();return true;
}
function nudge(dx,dy,dz){if(S.panel)return;const p=W.build?.pieces.get(S.selected);if(!p)return notify('Select a brick first.');const d=S.preview.get(p.id)||p;preview(p.id,{x:d.x+dx,y:d.y+dy,z:d.z+dz});}
function begin(h,nx,ny,span){if(S.panel||!h)return null;select(h);const p=W.build.pieces.get(h.id),d=S.preview.get(p.id)||p;return {id:p.id,start:[nx,ny],span,origin:V().set(d.x,d.y,d.z),anchor:ray(nx,ny).at(h.distance||p.box.getCenter(V()).distanceTo(W.camera.position),V()),normal:W.camera.getWorldDirection(V()),depth:0};}
function move(g,nx,ny,span){if(!g||S.panel)return;const r=ray(nx,ny),q=r.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(g.normal,g.anchor),V());if(!q)return;
 const targetDepth=Math.max(-320,Math.min(320,Math.log(g.span/Math.max(.01,span))*240*S.gain));g.depth+=(targetDepth-g.depth)*.2;
 const d=g.origin.clone().add(q.sub(g.anchor)).addScaledVector(g.normal,Math.round(g.depth/20)*20);
 const support=hit(nx,ny,new Set([...S.hands.values()].filter(h=>h.grab).map(h=>h.grab.id).concat([g.id])));
 if(support)d.y=support.box.max.y;preview(g.id,d);
}
function palm(h){return {x:1-(h[0].x+h[5].x+h[9].x+h[17].x)/4,y:(h[0].y+h[5].y+h[9].y+h[17].y)/4,span:Math.hypot(h[5].x-h[17].x,h[5].y-h[17].y)};}
function hands(bySide,now){if(!W.ready)return;install();
 for(const side of ['Left','Right']){
  let s=S.hands.get(side);if(!s){s={closed:false,candidate:false,since:now,grab:null,recent:null,seen:0};S.hands.set(side,s);}const h=bySide.get(side);
  if(!h){if(s.grab&&now-s.seen>300){s.grab=null;notify(side+' hand lost. Preview held; Place or Cancel.');}s.visible=false;s.closed=false;s.candidate=false;s.recent=null;continue;}
  s.seen=now;s.visible=true;const p=palm(h),g=window.PutThatThere.handGesture(h,s.closed);s.palm=p;if(!g.closed)s.awaitOpen=false;if(s.awaitOpen)continue;s.pointer={x:1-h[8].x,y:h[8].y};
  if(S.panel||S.calibration){s.grab=null;s.closed=false;s.candidate=false;continue;}
  if(!g.closed){const aimed=hit(s.pointer.x,s.pointer.y);s.hover=aimed&&aimed.id;if(aimed)s.recent={hit:aimed,t:now};}
  if(g.closed!==s.candidate){s.candidate=g.closed;s.since=now;}
  if(now-s.since>140&&s.closed!==g.closed){s.closed=g.closed;if(s.closed){const aimed=s.recent&&now-s.recent.t<700?s.recent.hit:hit(s.pointer.x,s.pointer.y);const selected=W.build.pieces.get(S.selected);s.grab=begin(aimed||(selected?{id:selected.id,item:selected}:null),p.x,p.y,p.span);if(s.grab)notify(side+' hand holding. Release freezes the preview.');}else if(s.grab){s.grab=null;notify('Preview held. Place commits; Cancel returns.');}}

 }
 const a=S.hands.get('Left'),b=S.hands.get('Right');
 if(a?.grab&&b?.grab&&a.grab.id===b.grab.id){const x=(a.palm.x+b.palm.x)/2,y=(a.palm.y+b.palm.y)/2,span=Math.hypot(a.palm.x-b.palm.x,a.palm.y-b.palm.y);if(!pair){const p=W.build.pieces.get(a.grab.id);pair=begin({id:p.id,item:p},x,y,Math.max(.03,span));notify('Both hands holding: move together; spread for nearer, narrow for farther.');}move(pair,x,y,Math.max(.03,span));}
 else {if(pair){for(const h of S.hands.values())if(h.grab){const p=W.build.pieces.get(h.grab.id);h.grab=begin({id:p.id,item:p},h.palm.x,h.palm.y,h.palm.span);}pair=null;}for(const h of S.hands.values())if(h.grab&&h.visible)move(h.grab,h.palm.x,h.palm.y,h.palm.span);}notify();
}
function practice(){if(!W.ready)return notify('Wait for the world to load.');cancel();panel(false);install();const B=W.build;
 const forward=W.camera.getWorldDirection(V());forward.y=0;forward.normalize();const centre=W.rig.pos.clone().addScaledVector(forward,200);const x=Math.round(centre.x/20)*20,z=Math.round(centre.z/20)*20,y=Math.ceil(W.G.h(x,z)/8)*8;
 const rows=B.addRows([[null,'3001',2,x,y,z,0],[null,'3001',4,x-120,y,z+40,0],[null,'3001',1,x+120,y,z+40,0]],false,true);for(const p of rows)B.history.push(p.id);
 if(rows.length<3)return notify('Practice bricks could not be created.');S.practice={base:rows[0].id,parts:rows.slice(1).map(p=>p.id),forward:forward.clone(),start:rows.slice(1).map(p=>({x:p.x,y:p.y,z:p.z})),lift:false,depth:false,stack:false};select({id:rows[1].id,item:rows[1]});notify('Practice: lift red or blue; move it in depth; stack it on green. Either hand can grab either brick.');
}
function checkPractice(){const p=S.practice;if(!p)return;const B=W.build,base=B.pieces.get(p.base);p.parts.forEach((id,i)=>{const q=B.pieces.get(id);if(!q)return;p.lift ||= q.y>=p.start[i].y+8;p.depth ||= Math.abs((q.z-p.start[i].z)*p.forward.z+(q.x-p.start[i].x)*p.forward.x)>=20;if(base&&Math.abs(q.box.min.y-base.box.max.y)<2&&q.box.max.x>base.box.min.x&&q.box.min.x<base.box.max.x&&q.box.max.z>base.box.min.z&&q.box.min.z<base.box.max.z)p.stack=true;});notify('Practice · lift '+(p.lift?'✓':'—')+' · depth '+(p.depth?'✓':'—')+' · stack '+(p.stack?'✓':'—'));}
try{const gain=Number(localStorage.getItem('builder-wag.depth-gain'));if(gain>=.2&&gain<=3)S.gain=gain;}catch(e){}
function calibrate(){cancel();S.calibration={step:0};notify('Calibration 1/2: hold open palms comfortably in view, then Capture position.');}
function captureCalibration(){const c=S.calibration;if(!c)return;const seen=[...S.hands.entries()].filter(([side,h])=>h.visible&&h.palm&&performance.now()-h.seen<500);if(!seen.length)return notify('No hand detected. Turn the camera on and show an open palm.');
 if(c.step===0){c.spans=Object.fromEntries(seen.map(([side,h])=>[side,h.palm.span]));c.step=1;return notify('Calibration 2/2: bring the same open palms closer to the camera, then Capture position.');}
 const ratios=seen.filter(([side])=>c.spans[side]).map(([side,h])=>Math.log(h.palm.span/c.spans[side]));const ratio=ratios.reduce((a,b)=>a+b,0)/ratios.length;
 if(!Number.isFinite(ratio)||ratio<.12)return notify('Reach change too small. Bring open palms closer; keep their angle steady.');
 S.gain=Math.max(.2,Math.min(3,120/(240*ratio)));try{localStorage.setItem('builder-wag.depth-gain',String(S.gain));}catch(e){}S.calibration=null;notify('Depth reach calibrated to six studs. Try Practice stacking.');
}
window.BuilderWag={calibrate,captureCalibration,state:S,hit,select,preview,begin,move,hands,panel,commit,cancel,nudge,practice,install,notify};
})();

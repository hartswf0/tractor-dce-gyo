/* One-hand pointing setup uses actual plate targets and the builder's picker. */
(function(){
 const C=ButterCalibration,R=ButterSpatialRuntime;
 const I={mode:'hands',profile:null,phase:'idle',index:0,samples:[],window:[],results:[],primary:null,tool:null,pointer:{x:.5,y:.5},mouseTool:null,pointerTool:null,signature:null,verifyAt:0,captureAt:0,armed:true,targets:[],livePoint:null,lastSeen:0};
 const key='wag-butter-pointing-v2';
 const rawPoint=m=>ButterSpatial.inspectionPoint(m);
 imagePoint=function(m){const p=rawPoint(m);return I.profile?C.pointMap(I.profile,p):p;};Butter.imagePoint=imagePoint;
 const signature=()=>{const v=$('#video'),r=$('#stage').getBoundingClientRect(),track=H.stream?.getVideoTracks?.()[0];return [v.videoWidth||640,v.videoHeight||480,Math.round(r.width/r.height*10),track?.getSettings?.().deviceId||'default'].join('|');};
 function normalizedInput(t){const m=t?.marks?.[8];return m&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&m.x>=0&&m.x<=1&&m.y>=0&&m.y<=1?rawPoint(m):null;}
 function point(t){const p=normalizedInput(t);return p&&I.profile?C.pointMap(I.profile,p):p;}
 function rawTool(t){return t.palm;}
 function toolDelta(base,current){return (base.y-current.y)*650*S.gain;}
 function gripDelta(owner,r){const current=owner.point;if(!current)return S.tx.rawDelta.clone();if(S.tx.inputOrigin?.id!==owner.id)S.tx.inputOrigin={id:owner.id,p:{...current},offset:S.tx.rawDelta.clone().addScaledVector(depthDirection(),-H.depthOffset)};const o=S.tx.inputOrigin;return o.offset.clone().add(screenDelta((current.x-o.p.x)*r.width,(current.y-o.p.y)*r.height));}
 function clearTargets(){for(const t of I.targets)if(t.mesh){t.mesh.parent?.remove(t.mesh);t.mesh.material.dispose();}I.targets=[];}
 function start(){if(S.tx)return note('Release the piece before pointing setup.','HELD');if(!S.ready)return;I.footerHeight=$('footer').getBoundingClientRect().height;clearTargets();I.phase='teach';I.index=0;I.samples=[];I.results=[];I.window=[];I.profileBefore=I.profile;I.profile=null;I.primary=null;I.signature=signature();I.verifyAt=I.captureAt=0;I.armed=true;I.livePoint=null;
  // These are plate-local points at the real workbench extents, with actual brick geometry.
  for(let i=0;i<4;i++){const mesh=new THREE.Mesh(catalog.get('3003').geometry,new THREE.MeshBasicMaterial({color:0xc4f46a,transparent:true,opacity:.85}));mesh.position.set(i&1?380:-380,0,i&2?-380:380);mesh.userData.partId='reach-'+i;R.plate.add(mesh);I.targets.push({id:mesh.userData.partId,mesh,label:(i&2?'far':'near')+' '+(i&1?'right':'left')+' · plate corner'});}R.plate.updateMatrixWorld(true);
  $('#reachPanel').style.height=Math.max(132,I.footerHeight)+'px';document.body.dataset.pointing='true';$('#reachPanel').hidden=false;$('#reachCanvas').hidden=false;$('#faceGizmo').inert=true;closeDrawers();paint();
 }
 function cancel(){if(I.phase!=='done')I.profile=I.profileBefore||null;I.phase='idle';clearTargets();document.body.dataset.pointing='false';$('#reachPanel').hidden=true;$('#reachCanvas').hidden=true;$('#faceGizmo').inert=false;H.mustOpen=true;}
 function save(){try{localStorage.setItem(key,JSON.stringify({profile:I.profile,signature:I.signature,results:I.results}));}catch{}}
 function targetPoint(t){if(t.mesh){const d=catalog.get('3003');return t.mesh.position.clone().add(V((d.bounds[0]+d.bounds[1])/2,d.h/2,(d.bounds[2]+d.bounds[3])/2));}const p=S.parts.find(p=>p.id===t.id);return p?bounds(p).getCenter(V()):null;}
 function projectedTarget(){const v=targetPoint(I.targets[I.index]);if(!v)return null;const p=project(v),r=$('#stage').getBoundingClientRect();return {x:p.x/r.width,y:p.y/r.height};}
 function stable(){return I.window.length>=12&&['x','y'].every(k=>Math.max(...I.window.map(p=>p[k]))-Math.min(...I.window.map(p=>p[k]))<.025);}
 function capture(){if(I.phase!=='teach'||!stable())return;const raw={x:C.median(I.window.map(p=>p.x)),y:C.median(I.window.map(p=>p.y))};I.samples.push({raw,target:projectedTarget()});I.lastCaptured=raw;I.window=[];I.captureAt=0;I.armed=false;feedback('tick',.3);
  if(++I.index===4){try{I.profile=C.fitPointing(I.samples);I.signature=signature();I.phase='verify';I.index=0;I.verifyAt=0;I.armed=true;}catch(e){I.phase='failed';I.error=e.message;}}paint();
 }
 function paint(){const t=I.targets[I.index];$('#reachTitle').textContent=I.phase==='teach'?'POINTING SETUP '+(I.index+1)+'/4':I.phase==='verify'?'SELECT REAL TARGET '+(I.index+1)+'/'+I.targets.length:I.phase==='done'?'POINTING VERIFIED':'SETUP NEEDS ANOTHER TRY';
  $('#reachText').textContent=I.phase==='teach'?'Point ONE index finger at the lit brick: '+t.label+'. Hold still to capture automatically. Other hand can rest.':I.phase==='verify'?'Move the white pointer onto the lit '+(t.mesh?'corner brick':'building brick')+'. Hold there to select. This is the builder’s actual hit test.':I.phase==='done'?'Targets and building bricks selected. Returning to building.':I.error;
  $('#reachRetry').hidden=I.phase!=='failed';for(const [i,t]of I.targets.entries())if(t.mesh){t.mesh.material.opacity=i===I.index?.95:.14;t.mesh.material.wireframe=i!==I.index;t.mesh.material.color.setHex(i===I.index?0xc4f46a:0x9cb9b5);}
 }
 function handleHands(tracks,now){
  if(I.profile&&signature()!==I.signature){I.profile=null;R.rebaseHeld();note('Camera or stage changed. Repeat pointing setup.','SETUP');}
  const usable=tracks.filter(t=>normalizedInput(t));if(I.phase==='teach'&&!I.primary){const target=projectedTarget();if(target)usable.sort((a,b)=>{const p=normalizedInput(a),q=normalizedInput(b);return Math.hypot(p.x-target.x,p.y-target.y)-Math.hypot(q.x-target.x,q.y-target.y);});}const primary=usable.find(t=>t.id===(H.owner??I.primary))||(!I.primary?usable[0]:null);
  if(primary){I.primary=primary.id;I.lastSeen=now;}else if(now-I.lastSeen>750){I.primary=null;}
  if(I.phase!=='idle'){
   const raw=primary?normalizedInput(primary):null;I.livePoint=raw?(I.profile?C.pointMap(I.profile,raw):raw):null;
   if(!raw){I.window=[];I.captureAt=I.verifyAt=0;I.status='Fingertip lost · move it back into camera view. Capture paused.';return true;}
   if(I.phase==='teach'){
    if(!I.armed&&I.lastCaptured&&Math.hypot(raw.x-I.lastCaptured.x,raw.y-I.lastCaptured.y)>.05)I.armed=true;
    if(I.armed){I.window.push(raw);if(I.window.length>24)I.window.shift();if(stable()){if(!I.captureAt)I.captureAt=now;if(now-I.captureAt>=800){capture();return true;}}else I.captureAt=0;}
    I.status=!I.armed?'Move to the next lit brick':I.captureAt?'Capturing · keep the fingertip still':'Aim at the lit brick, then hold still';
   }else if(I.phase==='verify'){
    const r=$('#stage').getBoundingClientRect(),id=pick(I.livePoint.x*r.width,I.livePoint.y*r.height,primary.id),target=I.targets[I.index];I.hit=id;
    if(id===target.id){if(!I.verifyAt)I.verifyAt=now;if(now-I.verifyAt>=600){I.results.push({id,holdMs:now-I.verifyAt});I.verifyAt=0;feedback('click',.4);I.index++;
     if(I.index===4){for(const p of S.parts){const q=project(bounds(p).getCenter(V())),hits=R.candidates(q.x,q.y);if(hits[0]?.id===p.id){I.targets.push({id:p.id,label:catalog.get(p.part).name});if(I.targets.length===6)break;}}}
     if(I.index===I.targets.length){if(I.targets.length<5){I.phase='failed';I.error='No unobstructed building brick to verify. Clear a brick and repeat.';}else{I.phase='done';I.doneAt=now;I.signature=signature();save();}}paint();}
    }else I.verifyAt=0;
    I.status=id===target.id?'On the actual target · selecting':id?'That is another brick · move to the lit target':'No target under the fingertip';
   }return true;
  }
  if(S.tx?.source==='pointer'){const tool=usable.find(t=>t.id===I.tool)||usable[0];if(tool&&gestureOf(tool)==='open'){I.tool=tool.id;const p=rawTool(tool);if(I.pointerTool?.id!==tool.id)I.pointerTool={id:tool.id,base:p,offset:S.tx.depthOffset||0};S.tx.depthOffset=I.pointerTool.offset+toolDelta(I.pointerTool.base,p);propose(S.tx.rawDelta.clone(),now);}else I.pointerTool=null;return true;}I.pointerTool=null;
  // trackHands already maps and smooths imagePoint. Do not replace it with raw landmarks.
  return false;
 }
 function pixel(event){const r=$('#stage').getBoundingClientRect();return {x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};}
 document.addEventListener('pointermove',e=>{if(e.target!==canvas&&!I.mouseTool)return;I.pointer=pixel(e);if(!I.mouseTool||e.pointerId!==I.mouseTool.id||!S.tx)return;const dy=I.pointer.y-I.mouseTool.y;S.tx.depthOffset=I.mouseTool.offset+dy*-650;propose(S.tx.rawDelta.clone());e.stopImmediatePropagation();},true);
 document.addEventListener('pointerdown',e=>{
  if(e.target!==canvas)return;
  if(I.phase!=='idle'){e.stopImmediatePropagation();return;}
  if(S.tx?.source==='hand'){I.pointer=pixel(e);I.mouseTool={id:e.pointerId,y:I.pointer.y,offset:S.tx.depthOffset||0};canvas.setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation();}
 },true);
 function endMouse(e){if(I.mouseTool?.id!==e.pointerId)return;I.mouseTool=null;e.stopImmediatePropagation();}
 document.addEventListener('pointerup',endMouse,true);document.addEventListener('pointercancel',endMouse,true);
 window.addEventListener('keydown',e=>{if(I.phase==='idle')return;if(e.code==='Space'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();capture();}if(e.key==='Escape'){e.stopImmediatePropagation();cancel();}},true);
 function draw(now){const el=$('#reachCanvas'),r=$('#stage').getBoundingClientRect();el.width=r.width;el.height=r.height;const ctx=el.getContext('2d'),target=projectedTarget();if(target){ctx.strokeStyle='#c4f46a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(target.x*r.width,target.y*r.height,20,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e8ffb9';ctx.font='12px monospace';ctx.fillText(String(I.index+1),target.x*r.width+24,target.y*r.height);}
  if(I.livePoint){ctx.strokeStyle='#fff';ctx.lineWidth=2;const p=I.livePoint;ctx.beginPath();ctx.arc(p.x*r.width,p.y*r.height,7,0,Math.PI*2);ctx.stroke();}
 }
 function frame(now){if(I.phase==='done'&&now-I.doneAt>1600){I.phase='idle';clearTargets();document.body.dataset.pointing='false';$('#reachPanel').hidden=true;$('#reachCanvas').hidden=true;$('#faceGizmo').inert=false;H.mustOpen=true;note('Pointing verified on building targets. Depth stays on the other input.','READY');}
  if(I.phase==='idle')return;
  $('#reachStatus').textContent=I.status||'Show one pointing finger. No palm pose required.';$('#reachProgress').value=I.captureAt?Math.min(1,(now-I.captureAt)/800):I.verifyAt?Math.min(1,(now-I.verifyAt)/600):0;
  if(['teach','verify'].includes(I.phase))draw(now);
 }
 $('#stage').insertAdjacentHTML('beforeend','<canvas id="reachCanvas" hidden></canvas><section id="reachPanel" hidden aria-label="Pointing setup"><b id="reachTitle"></b><p id="reachText"></p><output id="reachStatus"></output><progress id="reachProgress" max="1" value="0" aria-label="Automatic capture progress"></progress><div><button id="reachRetry" hidden>Repeat</button><button id="reachClose">Skip / close</button></div></section>');
 $('footer').prepend($('#reachPanel'));$('#reachRetry').onclick=start;$('#reachClose').onclick=cancel;$('#setTable').textContent='Set pointing';$('#setTable').onclick=start;$('.header-tools').appendChild($('#setTable'));
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.profile?.version===2&&['x','y'].every(k=>Array.isArray(saved.profile[k])&&saved.profile[k].length===3&&saved.profile[k].every(Number.isFinite))&&saved.results?.length>=5){I.profile=saved.profile;I.signature=saved.signature;I.results=saved.results;}}catch{}
 window.ButterInput={start,cancel,capture,handleHands,frame,toolDelta,gripDelta,point,projectedTarget,targets:()=>I.phase==='verify'||I.phase==='teach'?I.targets.filter(t=>t.mesh).map(t=>t.mesh):[],rebase:()=>{I.pointerTool=null;if(I.mouseTool){I.mouseTool.y=I.pointer.y;I.mouseTool.offset=0;}},state:()=>I};
})();

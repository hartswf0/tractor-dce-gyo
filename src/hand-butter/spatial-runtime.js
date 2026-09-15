/* Renderer/interaction adapter for spatial-core. Keeps existing part, physics,
 * clipboard, and transaction ownership services. Embedded by the build script.
 */
(function(){
 const Core=ButterSpatial;
 const state={face:'desk',viewHand:null,hoverFace:null,picks:new Map(),lastTarget:null,lastFrame:0,lastLandingKey:'',lastCue:0,landing:null,focusId:null};
 const perspective=camera,ortho=new THREE.OrthographicCamera(-500,500,350,-350,1,5000);
 const oldScreenDelta=screenDelta,oldPick=pick,oldRefresh=refresh;
 const landingGroup=new THREE.Group();landingGroup.renderOrder=9;scene.add(landingGroup);
 const positionGuide=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xbce994,transparent:true,opacity:.8,dashSize:5,gapSize:4,depthTest:false}));positionGuide.renderOrder=12;scene.add(positionGuide);
 const floorFoot=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xbce994,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));floorFoot.rotation.x=-Math.PI/2;scene.add(floorFoot);
 const topReference=new THREE.Mesh(new THREE.PlaneGeometry(360,202.5),ROOM.video.material.clone());topReference.rotation.x=-Math.PI/2;topReference.position.set(0,1,-530);scene.add(topReference);topReference.visible=false;
 function config(){return Core.FACES[state.face];}
 function normalizedLandmark(m){const r=$('#stage').getBoundingClientRect(),v=$('#video');return state.face==='desk'?Core.coverPoint(m,{width:v.videoWidth||640,height:v.videoHeight||480},r):Core.inspectionPoint(m);}
 imagePoint=normalizedLandmark;
 worldPoint=function(m,depth){const p=imagePoint(m),ray=new THREE.Raycaster();ray.setFromCamera({x:p.x*2-1,y:1-p.y*2},camera);return ray.ray.at(depth,V());};
 screenDelta=function(dx,dy,plane=S.plane){
  if(['xy','xz','yz'].includes(plane)){const origin=S.tx?S.tx.origin:anchor(),q=project(origin),r=$('#stage').getBoundingClientRect(),normal=V(...({xy:[0,0,1],xz:[0,1,0],yz:[1,0,0]}[plane])),ray=new THREE.Raycaster();ray.setFromCamera({x:2*(q.x+dx)/r.width-1,y:1-2*(q.y+dy)/r.height},camera);const hit=ray.ray.intersectPlane(new THREE.Plane(normal,-normal.dot(origin)),V());return hit?hit.sub(origin).clampScalar(-800,800):V();}

  if(camera.isOrthographicCamera&&plane==='xyz'){const r=$('#stage').getBoundingClientRect(),scale=(camera.top-camera.bottom)/camera.zoom/r.height;return V().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(dx*scale).addScaledVector(V().setFromMatrixColumn(camera.matrixWorld,1),-dy*scale);}
  return oldScreenDelta(dx,dy,plane);
 };
 depthDirection=function(){return V(...config().hidden);};
 function refreshImageTracks(){
  for(const list of [H.tracks,H.memory||[],[...B.ghosts.values()]])for(const t of list){t.recent=null;t.point=imagePoint(t.marks[8]);t.palm=imagePoint({x:(t.marks[0].x+t.marks[5].x+t.marks[9].x+t.marks[17].x)/4,y:(t.marks[0].y+t.marks[5].y+t.marks[9].y+t.marks[17].y)/4});}
  B.lastDraw=0;
 }
 function rebaseHeld(){
  if(!S.tx)return;
  S.tx.base=rows().filter(p=>S.selected.has(p.id));S.tx.origin=anchor();S.tx.rawDelta=V();S.tx.depthOffset=0;S.tx.samples=[];S.tx.velocity=V();S.tx.magnet=null;S.tx.noThrow=true;S.tx.viewRebased=true;S.tx.plane=config().plane;
  const owner=H.tracks.find(t=>t.id===H.owner);if(owner)H.origin={...owner.palm};H.secondary=null;H.secondaryMode=null;H.depthOffset=0;pointerDown=null;$('#depth').value=0;showSnapGhost();
 }
 function applyCamera(rebase=false){
  const r=$('#stage').getBoundingClientRect(),aspect=r.width/Math.max(1,r.height),cfg=config();
  camera=cfg.projection==='perspective'?perspective:ortho;controls.object=camera;controls.enableDamping=false;
  const sceneBox=union(S.parts),extent=sceneBox.isEmpty()?V(240,120,240):sceneBox.getSize(V());const center=cfg.projection==='orthographic'&&!sceneBox.isEmpty()?sceneBox.getCenter(V()):state.face==='desk'?V(0,0,0):V(0,115,0);if(state.face==='top')center.y=0;
  controls.target.copy(center);camera.up.set(...(cfg.up||[0,1,0]));
  if(camera.isPerspectiveCamera){camera.aspect=aspect;camera.fov=38;const d=ROOM.distance*Math.max(1,(state.face==='room'?1.25:1.05)/aspect);camera.position.copy(center).addScaledVector(V(...cfg.eye).normalize(),d);camera.clearViewOffset();if(B.table&&state.face==='desk')camera.setViewOffset(r.width,r.height,(.5-B.table.x)*r.width,(.5-B.table.y)*r.height,r.width,r.height);}
  else{const horizontal=['left','right'].includes(state.face)?extent.z:extent.x,vertical=state.face==='top'?extent.z:extent.y,half=Math.max(130,vertical/2+100,(horizontal/2+100)/aspect);camera.clearViewOffset();camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.zoom=1;camera.setViewOffset(r.width,r.height,r.width<600?32:0,0,r.width,r.height);camera.position.copy(center).addScaledVector(V(...cfg.eye),1600);}
  camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  ROOM.yaw=cfg.yaw;ROOM.group.rotation.y=cfg.yaw;ROOM.group.updateMatrixWorld(true);
  if(camera.isOrthographicCamera){const height=camera.top-camera.bottom,width=camera.right-camera.left,ratio=$('#video').videoWidth/$('#video').videoHeight||4/3,vh=Math.min(height*.34,width*.65/ratio),vw=vh*ratio;ROOM.video.scale.set(vw/600,vh/360,1);ROOM.video.position.set(roomLocal(center).x,center.y+height*.30,-399);
   const ray=new THREE.Raycaster();ray.setFromCamera({x:0,y:.70},camera);const pos=ray.ray.intersectPlane(new THREE.Plane(V(0,1,0),-1),V());if(pos)topReference.position.copy(pos);const th=height*.23,tw=Math.min(width*.65,th*ratio);topReference.scale.set(tw/360,th/202.5,1);
  }else{ROOM.video.scale.set(1,1,1);ROOM.video.position.set(0,230,-399);}

  S.plane=cfg.plane;controls.enableRotate=false;controls.enablePan=false;controls.enableZoom=false;controls.enabled=!S.tx;
  refreshImageTracks();if(rebase)rebaseHeld();feedbackGeometry();refresh();
 }
 function setFace(face){
  if(!Core.FACES[face])return false;
  const before=checkpoint();state.face=face;state.picks.clear();state.lastTarget=null;hover(null);document.body.dataset.spatialFace=face;applyCamera(true);
  $('#faceName').textContent=config().name;$$('[data-spatial-face]').filter(e=>e.tagName==='BUTTON').forEach(b=>b.setAttribute('aria-pressed',b.dataset.spatialFace===face));
  $('#viewInstruction').textContent=face==='desk'?'Camera registered · estimated desk plane':'Inspect '+config().name.toLowerCase()+' · pinch a cube face to switch';
  const spans=$('footer>.depth-row').querySelectorAll(':scope > span');spans[0].textContent=config().low;spans[1].textContent=config().high;
  $('#depth').setAttribute('aria-label',config().axis+' of selection');$('#depthReadout').textContent=config().instruction;
  if(checkpoint()!==before)throw Error('View transition moved world objects');
  feedback('tick',.2,.85);note(config().name+' · '+config().instruction+(S.tx?' · held pieces stay in place':''),'VIEW');return true;
 }
 updateRoomCamera=function(){applyCamera(true);};applyRegistration=function(){applyCamera(true);};
 orbitRoom=function(degrees,tilt=0){return setFace(tilt?tilt>0?'top':'front':Core.nextFace(state.face,degrees<0?-1:1));};
 resetRoom=function(){return setFace('desk');};
 view=function(name){return setFace(({iso:'desk',front:'front',top:'top',side:'right'})[name]||'desk');};
 $('#fit').onclick=()=>setFace('desk');$$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
 // The event router treats gizmo faces as named actions shared by touch and hands.
 function faceUnderPoint(point){const r=$('#stage').getBoundingClientRect(),x=r.left+point.x*r.width,y=r.top+point.y*r.height;for(const b of $$('#faceGizmo button')){const q=b.getBoundingClientRect();if(x>=q.left&&x<=q.right&&y>=q.top&&y<=q.bottom)return b;}return null;}
 function handleHands(tracks,now){
  const owner=tracks.find(t=>t.id===H.owner);
  if(owner&&S.tx&&owner.justOpened){releaseHand('Released');}
  if(state.viewHand!=null){const t=tracks.find(t=>t.id===state.viewHand);if(t?.closed){rebaseHeld();toolReadout('View snapped · open the view hand to resume');return true;}state.viewHand=null;rebaseHeld();H.command=null;H.commandArmed=false;}
  $$('#faceGizmo button').forEach(b=>b.classList.remove('hand-hover'));state.hoverFace=null;
  for(const t of tracks){if(t.id===H.owner&&S.tx)continue;const b=faceUnderPoint(t.point);if(!b)continue;state.hoverFace=b.dataset.spatialFace||b.dataset.step;b.classList.add('hand-hover');
   if(t.justClosed){state.viewHand=t.id;b.click();rebaseHeld();toolReadout('View snapped · open the view hand to resume');return true;}
  }
  return false;
 }
 function candidates(x,y){const r=$('#stage').getBoundingClientRect();raycaster.setFromCamera({x:x/r.width*2-1,y:1-y/r.height*2},camera);const unique=new Map();for(const h of raycaster.intersectObjects(S.parts.map(p=>p.mesh),false)){const id=h.object.userData.partId;if(!unique.has(id))unique.set(id,{id,distance:h.distance});}return [...unique.values()];}
 pick=function(x,y,source='pointer'){const hits=candidates(x,y),channel=source,prev=state.picks.get(channel),id=Core.chooseTarget(hits,prev,{x,y});if(id){state.picks.set(channel,{id,x:prev?.id===id?prev.x:x,y:prev?.id===id?prev.y:y});state.lastTarget={id,channel,count:hits.length,time:performance.now()};}else{state.picks.delete(channel);if(state.lastTarget?.channel===channel)state.lastTarget=null;}return id;};
 function targetPart(){return S.tx?selected()[0]:state.lastTarget&&performance.now()-state.lastTarget.time<250?S.parts.find(p=>p.id===state.lastTarget.id):selected()[0];}
 function landing(){
  if(!S.tx||!selected().length)return null;
  const box=union(),center=box.getCenter(V());let support=0;
  for(const p of S.parts){if(S.selected.has(p.id))continue;const b=bounds(p);if(b.max.y<=box.min.y+.5&&overlapXZ(box,b))support=Math.max(support,b.max.y);}
  const saved=selected().map(p=>({p,x:p.x,y:p.y,z:p.z})),drop=support-box.min.y;
  try{for(const row of saved)row.p.y+=drop;const magnet=S.snap?findMagnet(12):null,delta=V(0,drop,0);if(magnet)delta.add(magnet.delta);for(const row of saved){row.p.x=row.x+delta.x;row.p.y=row.y+delta.y;row.p.z=row.z+delta.z;}
   const fail=validate();return {delta,point:center.clone().add(delta),support:box.min.y+delta.y,gap:-delta.y,valid:!fail,connected:!!magnet,key:magnet?.key||'floor',poses:saved.map(({p})=>({part:p.part,pos:V(p.x,p.y,p.z),q:partQuaternion(p)}))};
  }finally{for(const row of saved){row.p.x=row.x;row.p.y=row.y;row.p.z=row.z;}}
 }
 function paintLanding(result){
  const signature=result?result.poses.map(p=>p.part).join('|'):'';
  if(landingGroup.userData.signature!==signature){while(landingGroup.children.length){const m=landingGroup.children.pop();m.material.dispose();m.parent=null;}if(result)for(const pose of result.poses)landingGroup.add(new THREE.Mesh(catalog.get(pose.part).geometry,new THREE.MeshBasicMaterial({color:0xc4f46a,transparent:true,opacity:.23,wireframe:true,depthWrite:false,depthTest:false})));landingGroup.userData.signature=signature;}
  landingGroup.visible=!!result&&result.gap>1&&(state.face!=='top'||Math.hypot(result.delta.x,result.delta.z)>1); if(!result)return;
  landingGroup.children.forEach((m,i)=>{m.position.copy(result.poses[i].pos);m.quaternion.copy(result.poses[i].q);m.material.color.setHex(result.valid?result.connected?0xc4f46a:0x86c7e8:0xff8580);});
 }
 function drawSpatialCue(now){
  const throwing=S.tx&&!S.tx.noThrow&&S.tx.velocity.length()>180,p=targetPart(),result=throwing?null:landing();state.landing=result;paintLanding(result);
  if(!p){positionGuide.visible=floorFoot.visible=false;$('#spatialReadout').hidden=true;$('#stageCue').textContent='POINT AT A PIECE';return;}
  const box=S.tx?union():bounds(p),c=box.getCenter(V()),size=box.getSize(V()),base=box.min.y;
  const foot=V(c.x,.7,c.z),near=V(c.x,.7,400),bottom=V(c.x,base,c.z);
  positionGuide.geometry.setFromPoints([bottom,foot,foot,near]);positionGuide.computeLineDistances();positionGuide.visible=true;
  floorFoot.position.copy(foot);floorFoot.scale.set(Math.max(12,size.x),Math.max(12,size.z),1);floorFoot.visible=true;
  const el=$('#spatialReadout');el.hidden=false;const where=project(box.max.clone().add(V(8,4,0))),r=$('#stage').getBoundingClientRect();const labelWidth=r.width<600?178:208,reserve=r.width<600?92:104;el.style.left=Math.max(8,Math.min(r.width-reserve-labelWidth,where.x+8))+'px';el.style.top=Math.max(42,Math.min(r.height-80,where.y-75))+'px';
  const label=S.tx?'HELD':state.lastTarget?.id===p.id?'TARGET':'SELECTED';el.firstElementChild.textContent=label+' · '+(S.tx&&selected().length>1?selected().length+' pieces':(COLORS.find(v=>v.code===p.color)?.code===1?'BLUE ':p.color===4?'RED ':'')+catalog.get(p.part).name);
  el.lastElementChild.textContent=Core.describePosition({height:base,depth:c.z,gap:result?.gap});
  if(state.lastTarget?.count>1&&!S.tx)el.lastElementChild.textContent+=' · '+state.lastTarget.count+' along this ray; TOP separates them';
  if(S.tx){const error=validate(),aligned=!!S.tx.magnet;$('#stageCue').textContent=error?'BLOCKED · move to the clear ghost':throwing?'THROW · release to toss':aligned?'ALIGNED · release to connect':result?.valid?(state.face==='top'?'COLUMN · lower ':'LOWER TO GHOST · ')+Math.max(0,result.gap/8).toFixed(1)+' plates':'MOVE CLEAR OF OTHER PIECES';
   const cue=error?'blocked':aligned?'aligned:'+S.tx.magnet.key:result?.valid&&result.connected&&result.gap<40?'approach:'+Math.floor(result.gap/8):'';
   if(cue&&cue!==state.lastLandingKey&&now-state.lastCue>220){feedback(error?'blocked':'tick',.15,aligned?1.6:1+Math.max(0,40-(result?.gap||0))/80);state.lastCue=now;}state.lastLandingKey=cue;
  }else{state.lastLandingKey='';$('#stageCue').textContent=state.lastTarget?.id===p.id?'TARGET · pinch to select':selected().length+' SELECTED · pinch or drag to move';}
 }
 // No per-pixel or grid-crossing chatter. Acquisition, approach, fit, and contact differ.
 surfaceCue=function(){};
 function applyVisualFrame(){
  const desk=state.face==='desk',model=B.mode==='model';ROOM.group.visible=!desk||model;
  ROOM.video.visible=!desk&&state.face!=='top'&&H.active&&!model;
  topReference.visible=state.face==='top'&&H.active&&!model;
  if(state.face==='top')ROOM.group.visible=false;
  floor.material.opacity=desk&&!model?.08:1;floor.material.depthWrite=!desk||model;grid.material.opacity=desk&&!model?.24:.42;
  scene.background=null;
  // The registered view uses the actual mirrored camera pixels. The projected
  // cutout is reserved for virtual inspection, where it represents an action.
  for(const v of B.visuals.values())if(v.soft)v.soft.mesh.visible=!desk&&v.soft.mesh.visible;
  $('#viewInstruction').textContent=desk?'Camera registered · estimated desk plane':config().name+' · '+config().plane.toUpperCase()+' visible · '+config().axis+' on other hand';
  if(S.tx)$('#selectionHint').textContent=state.viewHand!=null?'Open the view hand to resume moving':config().instruction+' · free hand can pinch a cube face';
 }
 function frame(now){if(S.tx?.viewRebased&&['hand','pointer'].includes(S.tx.source)&&S.tx.samples.length>=3&&S.tx.samples.at(-1).time-S.tx.samples[0].time>=100){S.tx.noThrow=false;S.tx.viewRebased=false;}applyVisualFrame();if(now-state.lastFrame<55)return;state.lastFrame=now;drawSpatialCue(now);}
 function prepareUI(){
  document.title='WAG / HAND BUTTER 03';$('.stage-label').innerHTML='<b>BUTTER 03</b>';$('.left-rail').remove();$('.right-rail').remove();
  $('#stage').insertAdjacentHTML('beforeend','<nav id="faceGizmo" aria-label="Snap view to a face"><output id="faceName">DESK</output><div class="view-cube"><button data-spatial-face="top" aria-label="Snap to top view">TOP</button><button data-spatial-face="front" aria-label="Snap to front view">FRONT</button><button data-spatial-face="right" aria-label="Snap to right view">SIDE</button></div><div class="face-turn"><button data-step="-1" aria-label="Previous side, 90 degrees">↶</button><button data-step="1" aria-label="Next side, 90 degrees">↷</button></div><button data-spatial-face="desk" aria-label="Return to registered desk view">DESK</button><small>point + pinch</small></nav><div id="viewInstruction"></div><div id="spatialReadout" hidden><b></b><span></span></div>');
  $$('#faceGizmo [data-spatial-face]').forEach(b=>b.onclick=()=>setFace(b.dataset.spatialFace));$$('#faceGizmo [data-step]').forEach(b=>b.onclick=()=>setFace(Core.nextFace(state.face,+b.dataset.step)));
  $('#roomMode').textContent='3D ROOM';$('#roomMode').onclick=()=>setFace('room');const displayMode=document.createElement('button');displayMode.id='displayMode';displayMode.textContent='Camera: room';displayMode.onclick=()=>{setRoomMode(['room','ghost','model'][(['room','ghost','model'].indexOf(B.mode)+1)%3]);displayMode.textContent='Camera: '+B.mode;$('#roomMode').textContent='3D ROOM';};$('.advanced-buttons').appendChild(displayMode);
  $('#setTable').textContent='Set desk';$('#setTable').onclick=()=>{if(S.tx)return note('Release before setting the desk.','HELD');setFace('desk');B.setting=!B.setting;$('#setTable').textContent=B.setting?'Cancel desk':'Set desk';closeDrawers();note(B.setting?'Tap where the center of your desk should meet the virtual grid.':'Desk registration cancelled.','DESK');};
  setTableAt=function(p){if(S.tx)return;B.table={x:Math.max(.1,Math.min(.9,p.x)),y:Math.max(.2,Math.min(.9,p.y))};B.setting=false;applyCamera();$('#setTable').textContent='Set desk';note('Desk position registered visually · keep the camera still.','DESK');};
  // Keep essential actions in one row. Extra group edits remain in a drawer.
  const edit=document.createElement('button');edit.id='selectionEdit';edit.textContent='Edit';edit.setAttribute('aria-expanded','false');$('#selectionTools').insertBefore(edit,$('#selectionActions'));
  for(const id of ['boxSelect','allSelect','copy','rotate','assembly','clear','remove'])$('.advanced-buttons').appendChild($('#'+id));
  $('#seat').textContent='Land';$('#seat').title='Lower to the visible landing ghost';$('#seat').onclick=()=>{if(S.tx){const result=landing();if(!result?.valid)return note('Move to a clear landing position first.','BLOCKED');const t=S.tx;t.noThrow=true;t.magnet=null;selected().forEach(p=>{p.x+=result.delta.x;p.y+=result.delta.y;p.z+=result.delta.z;sync(p);});releaseHand('Landed');}else seat();};
  edit.remove();$('#selectionTools').insertBefore($('#moreTools'),$('#selectionActions'));$('#moreTools').textContent='Edit';$('#group').addEventListener('click',()=>{if(S.multi)note('Tap pieces to add them. Done selecting lets the group move together.','SELECT');});
  $('#help').insertAdjacentHTML('afterbegin','<p><b>SPATIAL VIEWS:</b> DESK registers camera pixels and hand pointing. TOP separates near/far; FRONT separates high/low; SIDE shows height and depth. Pinch a labeled cube face with your free hand to snap the view while holding. Open palm up pushes away in DESK/FRONT; in TOP it lifts. Height and depth never share the same movement vector. Set desk is visual registration, not a measured digital twin.</p>');
 }
 prepareUI();
 window.ButterSpatialRuntime={state:()=>({face:state.face,projection:camera.type,axis:config().axis,viewHand:state.viewHand,landing:state.landing?{gap:state.landing.gap,valid:state.landing.valid,connected:state.landing.connected}:null}),setFace,handleHands,frame,candidates,normalizedLandmark,hiddenDelta:amount=>Core.hiddenDelta(state.face,amount),landing,rebaseHeld};
 ButterStage.orbit=orbitRoom;ButterStage.home=resetRoom;Butter.setTableAt=setTableAt;Butter.imagePoint=imagePoint;Butter.projectHand=(m,d)=>project(worldPoint(m,d));
 setFace('desk');
})();

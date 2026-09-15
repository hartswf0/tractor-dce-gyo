/* Renderer/interaction adapter for spatial-core. Keeps existing part, physics,
 * clipboard, and transaction ownership services. Embedded by the build script.
 */
(function(){
 const Core=ButterSpatial;
 const state={face:'room',quarter:0,viewHand:null,hoverFace:null,picks:new Map(),lastTarget:null,lastFrame:0,lastLandingKey:'',lastCue:0,landing:null,focusId:null};
 const perspective=camera;
 const plate=new THREE.Group();plate.name='construction-frame';scene.add(plate);
 const originalAdd=scene.add.bind(scene),originalRemove=scene.remove.bind(scene);
 scene.add=function(...objects){for(const o of objects)(o.userData.partId?plate:{add:originalAdd}).add(o);return scene;};
 scene.remove=function(...objects){for(const o of objects){if(o.parent===plate)plate.remove(o);else originalRemove(o);}return scene;};
 for(const o of [floor,grid,outlines,selectedBox,hoverBox,snapGhost,contactMarker,...shadows,...guides,...S.parts.map(p=>p.mesh)])plate.add(o);
 const rawProject=project;project=function(p){plate.updateMatrixWorld(true);return rawProject(plate.localToWorld(p.clone()));};
 rearImagePoint=function(m){const p=ROOM.video.localToWorld(V((.5-m.x)*600,(.5-m.y)*360,0)),v=rawProject(p),r=$('#stage').getBoundingClientRect();return {x:v.x/r.width,y:v.y/r.height};};
 for(const o of [...guides,shadows[1],shadows[2]])originalAdd(o);
 roomGuides=function(){
  const a=selected();selectedBox.visible=!!a.length;shadows.forEach(o=>o.visible=!!a.length);guides.forEach(o=>o.visible=!!a.length);if(!a.length)return;
  const b=union(),local=b.getCenter(V()),c=plate.localToWorld(local.clone()),size=b.getSize(V());
  selectedBox.box.copy(b);selectedBox.material.color.setHex(S.tx&&validate()?0xff8580:0xc4f46a);selectedBox.updateMatrixWorld(true);
  shadows[0].rotation.set(-Math.PI/2,0,0);shadows[0].position.set(local.x,.6,local.z);shadows[0].scale.set(size.x,size.z,1);
  const ends=[V(-399,c.y,c.z),V(c.x,.6,c.z),V(399,c.y,c.z)];
  for(const i of [1,2]){shadows[i].position.copy(ends[i===1?0:2]);shadows[i].rotation.set(0,Math.PI/2,0);shadows[i].scale.set(Math.max(size.x,size.z),size.y,1);}
  guides.forEach((g,i)=>g.geometry.setFromPoints([c,ends[i]]));
  if(ROOM.heightLine){ROOM.heightLine.visible=true;ROOM.heightLine.geometry.setFromPoints([V(-399,c.y,-400),V(-399,c.y,400)]);}
 };
 wallTap=function(hit){if(!selected().length)return note('Select a piece first.','GRID');if(S.tx&&!['wall','paste'].includes(S.tx.source))return note('Use the other input for depth while holding.','HELD');if(!S.tx&&!begin('wall'))return;
  const current=plate.localToWorld(anchor()),height=hit.object.userData.axis==='height',delta=height?V(0,snapValue(Math.max(0,hit.point.y),8)-current.y,0):V(0,0,snapValue(hit.point.z,20)-current.z);
  delta.applyQuaternion(plate.quaternion.clone().invert());S.tx.noThrow=true;propose(S.tx.rawDelta.clone().add(delta));
 };
 const oldScreenDelta=screenDelta,oldPick=pick,oldRefresh=refresh;
 const landingGroup=new THREE.Group();landingGroup.renderOrder=9;plate.add(landingGroup);
 const positionGuide=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xbce994,transparent:true,opacity:.8,dashSize:5,gapSize:4,depthTest:false}));positionGuide.renderOrder=12;plate.add(positionGuide);
 const floorFoot=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xbce994,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));floorFoot.rotation.x=-Math.PI/2;plate.add(floorFoot);
 const topReference=new THREE.Mesh(new THREE.PlaneGeometry(360,202.5),ROOM.video.material.clone());topReference.rotation.x=-Math.PI/2;topReference.position.set(0,1,-530);scene.add(topReference);topReference.visible=false;
 function config(){return {...Core.FACES.room,plane:'xyz',instruction:'Grip moves across screen · other input moves in / out'};}
 function normalizedLandmark(m){const r=$('#stage').getBoundingClientRect(),v=$('#video');return state.face==='desk'?Core.coverPoint(m,{width:v.videoWidth||640,height:v.videoHeight||480},r):Core.inspectionPoint(m);}
 imagePoint=normalizedLandmark;
 worldPoint=function(m,depth){const p=imagePoint(m),ray=new THREE.Raycaster();ray.setFromCamera({x:p.x*2-1,y:1-p.y*2},camera);return ray.ray.at(depth,V());};
 screenDelta=function(dx,dy){
  const origin=plate.localToWorld((S.tx?S.tx.origin:anchor()).clone()),q=rawProject(origin),r=$('#stage').getBoundingClientRect(),normal=camera.getWorldDirection(V()),ray=new THREE.Raycaster();
  ray.setFromCamera({x:2*(q.x+dx)/r.width-1,y:1-2*(q.y+dy)/r.height},camera);
  const hit=ray.ray.intersectPlane(new THREE.Plane(normal,-normal.dot(origin)),V());
  return hit?hit.sub(origin).applyQuaternion(plate.quaternion.clone().invert()).clampScalar(-800,800):V();
 };
 depthDirection=function(){return camera.getWorldDirection(V()).applyQuaternion(plate.quaternion.clone().invert());};
 function refreshImageTracks(){
  for(const list of [H.tracks,H.memory||[],[...B.ghosts.values()]])for(const t of list){t.recent=null;t.point=imagePoint(t.marks[8]);t.palm=imagePoint({x:(t.marks[0].x+t.marks[5].x+t.marks[9].x+t.marks[17].x)/4,y:(t.marks[0].y+t.marks[5].y+t.marks[9].y+t.marks[17].y)/4});}
  B.lastDraw=0;
 }
 function rebaseHeld(){
  if(!S.tx)return;
  delete S.tx.inputOrigin;
  S.tx.base=rows().filter(p=>S.selected.has(p.id));S.tx.origin=anchor();S.tx.rawDelta=V();S.tx.depthOffset=0;S.tx.samples=[];S.tx.velocity=V();S.tx.magnet=null;S.tx.noThrow=true;S.tx.viewRebased=true;S.tx.plane=config().plane;
  const owner=H.tracks.find(t=>t.id===H.owner);if(owner)H.origin={...owner.palm};H.secondary=null;H.secondaryMode=null;H.depthOffset=0;if(pointerDown&&S.tx.source==='pointer'){pointerDown.x=pointerDown.lastX??pointerDown.x;pointerDown.y=pointerDown.lastY??pointerDown.y;}else pointerDown=null;window.ButterInput?.rebase();$('#depth').value=0;showSnapGhost();
 }
 function applyCamera(rebase=false){
  const r=$('#stage').getBoundingClientRect(),aspect=r.width/Math.max(1,r.height);
  camera=perspective;controls.object=camera;controls.enableDamping=false;
  camera.aspect=aspect;camera.fov=38;camera.clearViewOffset();controls.target.set(0,115,0);
  camera.up.set(0,1,0);camera.position.copy(controls.target).addScaledVector(V(0,.4,.9165).normalize(),1200*Math.max(1,1.25/aspect));
  camera.lookAt(controls.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  ROOM.yaw=0;ROOM.group.rotation.set(0,0,0);ROOM.group.updateMatrixWorld(true);
  ROOM.video.scale.set(1,1,1);ROOM.video.position.set(0,230,-399);
  S.plane='xyz';controls.enableRotate=controls.enablePan=controls.enableZoom=false;controls.enabled=false;
  refreshImageTracks();if(rebase)rebaseHeld();feedbackGeometry();refresh();
 }
 function setFace(face){
  const turns={front:0,right:1,back:2,left:3,room:state.quarter,desk:0,top:state.quarter};
  if(!(face in turns))return false;
  state.face='room';state.quarter=turns[face];state.picks.clear();state.lastTarget=null;hover(null);
  plate.rotation.y=state.quarter*Math.PI/2;plate.updateMatrixWorld(true);rebaseHeld();
  document.body.dataset.spatialFace='room';$('#faceName').textContent=state.quarter*90+'°';
  feedbackGeometry();refresh();feedback('tick',.2,.85);note('Plate '+state.quarter*90+'° · room and camera stay fixed','PLATE');return true;
 }
 function rotatePlate(step){return setFace(['front','right','back','left'][(state.quarter+step+4)%4]);}
 updateRoomCamera=function(){applyCamera(true);};applyRegistration=function(){applyCamera(true);};
 orbitRoom=function(degrees){return rotatePlate(degrees<0?-1:1);};resetRoom=function(){return setFace('front');};
 view=function(name){return setFace(({iso:'front',front:'front',top:'room',side:'right'})[name]||'front');};
 $('#fit').onclick=()=>setFace('front');$$('[data-view]').forEach(b=>{b.onclick=()=>view(b.dataset.view);b.hidden=true;});
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
 function candidates(x,y){const r=$('#stage').getBoundingClientRect();raycaster.setFromCamera({x:x/r.width*2-1,y:1-y/r.height*2},camera);const unique=new Map();for(const h of raycaster.intersectObjects([...S.parts.map(p=>p.mesh),...(window.ButterInput?.targets()||[])],false)){const id=h.object.userData.partId;if(!unique.has(id))unique.set(id,{id,distance:h.distance});}return [...unique.values()];}
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
  ROOM.group.visible=true;ROOM.video.visible=H.active&&B.mode!=='model';topReference.visible=false;
  floor.material.opacity=1;floor.material.depthWrite=true;grid.material.opacity=.42;scene.background=new THREE.Color(0x111c20);
  $('#viewInstruction').textContent='Fixed room · turn the plate · two inputs, three directions';
  if(S.tx)$('#selectionHint').textContent='Grip moves across screen · other palm or mouse drag moves in / out';
 }
 function frame(now){if(S.tx?.viewRebased&&['hand','pointer'].includes(S.tx.source)&&S.tx.samples.length>=3&&S.tx.samples.at(-1).time-S.tx.samples[0].time>=100){S.tx.noThrow=false;S.tx.viewRebased=false;}applyVisualFrame();if(now-state.lastFrame<55)return;state.lastFrame=now;drawSpatialCue(now);}
 function prepareUI(){
  document.title='WAG / HAND BUTTER 06';$('.stage-label').innerHTML='<b>BUTTER 06</b>';$('.left-rail').remove();$('.right-rail').remove();
  $('#stage').insertAdjacentHTML('beforeend','<nav id="faceGizmo" aria-label="Rotate build plate"><output id="faceName">0°</output><div class="face-turn"><button data-step="-1" aria-label="Turn plate left 90 degrees">↶</button><button data-step="1" aria-label="Turn plate right 90 degrees">↷</button></div><button data-spatial-face="front" aria-label="Reset plate orientation">PLATE</button><small>point + pinch</small></nav><div id="viewInstruction"></div><div id="spatialReadout" hidden><b></b><span></span></div>');
  $$('#faceGizmo [data-spatial-face]').forEach(b=>b.onclick=()=>setFace(b.dataset.spatialFace));$$('#faceGizmo [data-step]').forEach(b=>b.onclick=()=>rotatePlate(+b.dataset.step));
  $('#roomMode').textContent='ROOM';$('#roomMode').onclick=()=>{setRoomMode(['room','ghost','model'][(['room','ghost','model'].indexOf(B.mode)+1)%3]);};
  $('#setTable').textContent='Calibrate';$('#setTable').onclick=()=>window.ButterInput?.start();
  // Keep essential actions in one row. Extra group edits remain in a drawer.
  const edit=document.createElement('button');edit.id='selectionEdit';edit.textContent='Edit';edit.setAttribute('aria-expanded','false');$('#selectionTools').insertBefore(edit,$('#selectionActions'));
  for(const id of ['boxSelect','allSelect','copy','rotate','assembly','clear','remove'])$('.advanced-buttons').appendChild($('#'+id));
  $('#seat').textContent='Land';$('#seat').title='Lower to the visible landing ghost';$('#seat').onclick=()=>{if(S.tx){const result=landing();if(!result?.valid)return note('Move to a clear landing position first.','BLOCKED');const t=S.tx;t.noThrow=true;t.magnet=null;selected().forEach(p=>{p.x+=result.delta.x;p.y+=result.delta.y;p.z+=result.delta.z;sync(p);});releaseHand('Landed');}else seat();};
  edit.remove();$('#selectionTools').insertBefore($('#moreTools'),$('#selectionActions'));$('#moreTools').textContent='Edit';$('#group').addEventListener('click',()=>{if(S.multi)note('Tap pieces to add them. Done selecting lets the group move together.','SELECT');});
  $('#help').insertAdjacentHTML('afterbegin','<p><b>FIXED ROOM:</b> The plate turns by 90° while the camera and back wall stay fixed. One input holds; the other moves through the screen. Use two hands, or a hand and mouse. Calibrate teaches comfortable reach; a separate eight-corner check measures control.</p>');
 }
 prepareUI();
 window.ButterSpatialRuntime={state:()=>({face:state.face,projection:camera.type,axis:config().axis,viewHand:state.viewHand,landing:state.landing?{gap:state.landing.gap,valid:state.landing.valid,connected:state.landing.connected}:null}),setFace,rotatePlate,plate,rawProject,handleHands,frame,candidates,normalizedLandmark,hiddenDelta:amount=>depthDirection().multiplyScalar(amount).toArray(),landing,rebaseHeld};
 ButterStage.orbit=orbitRoom;ButterStage.home=resetRoom;Butter.setTableAt=setTableAt;Butter.imagePoint=imagePoint;Butter.projectHand=(m,d)=>rawProject(worldPoint(m,d));
 applyCamera();setFace('front');
})();

/* One grip role and one tool role, independent of input hardware. */
(function(){
 const C=ButterCalibration,R=ButterSpatialRuntime;
 const I={mode:'hands',profile:null,phase:'idle',index:0,samples:[],window:[],results:[],primary:null,tool:null,pointer:{x:.5,y:.5},mouseTool:null,pointerTool:null,lastNow:0,signature:null,verifyAt:0,armed:true,palmReference:null,palmCue:null};
 const key='wag-butter-reach-v1';
 const rawPoint=m=>ButterSpatial.inspectionPoint(m);
 const signature=()=>{const v=$('#video'),r=$('#stage').getBoundingClientRect(),track=H.stream?.getVideoTracks?.()[0];return [v.videoWidth||640,v.videoHeight||480,Math.round(r.width/r.height*10),track?.getSettings?.().deviceId||'default',I.mode].join('|');};
 function normalizedInput(t){return rawPoint(t.marks[8]);}
 function rawTool(t){const h=t.marks;return rawPoint({x:(h[0].x+h[5].x+h[9].x+h[17].x)/4,y:(h[0].y+h[5].y+h[9].y+h[17].y)/4});}
 function roles(tracks){
  if(I.mode==='mouse-hand'){const tool=tracks.find(t=>t.id===I.tool)||tracks[0];if(tool)I.tool=tool.id;return {primary:null,tool};}
  const primary=tracks.find(t=>t.id===(H.owner??I.primary))||tracks[0];if(primary)I.primary=primary.id;
  const tool=I.mode==='hands'?(tracks.find(t=>t.id===I.tool&&t.id!==primary?.id)||tracks.find(t=>t.id!==primary?.id)):null;if(tool)I.tool=tool.id;return {primary,tool};
 }
 function observation(tracks){const {primary,tool}=roles(tracks);if(I.mode!=='mouse-hand'&&!primary||I.mode!=='hand-mouse'&&!tool)return null;const p=primary?normalizedInput(primary):I.pointer;return {raw:[p.x,p.y,tool?rawTool(tool).y:I.pointer.y],primary,tool};}
 function point(t){const p=normalizedInput(t);if(!I.profile||I.mode==='mouse-hand')return p;return {x:.15+.70*(p.x-I.profile.axes[0].a)/(I.profile.axes[0].b-I.profile.axes[0].a),y:.18+.64*(p.y-I.profile.axes[1].a)/(I.profile.axes[1].b-I.profile.axes[1].a)};}
 function toolDelta(base,current){const gain=I.profile?360/(I.profile.axes[2].b-I.profile.axes[2].a):-650*S.gain;return (current.y-base.y)*gain;}
 function gripDelta(owner,r){const current=point(owner);if(S.tx.inputOrigin?.id!==owner.id)S.tx.inputOrigin={id:owner.id,p:{...current},offset:S.tx.rawDelta.clone().addScaledVector(depthDirection(),-H.depthOffset)};
  const o=S.tx.inputOrigin;return o.offset.clone().add(screenDelta((current.x-o.p.x)*r.width,(current.y-o.p.y)*r.height));}
 function start(){if(S.tx)return note('Release the piece before calibration.','HELD');I.phase='teach';I.index=0;I.samples=[];I.results=[];I.window=[];I.profileBefore=I.profile;I.profile=null;I.primary=I.tool=null;I.signature=signature();I.verifyAt=0;I.armed=true;I.palmReference=null;$('#reachPanel').hidden=false;closeDrawers();paint();}
 function cancel(){I.profile=I.profileBefore||null;I.phase='idle';I.window=[];$('#reachPanel').hidden=true;$('#reachCanvas').hidden=true;H.mustOpen=true;save();}
 function save(){try{localStorage.setItem(key,JSON.stringify({mode:I.mode,profile:I.profile,signature:I.signature,results:I.results,palmReference:I.palmReference}));}catch{}}
 function capture(){
  if(I.phase!=='teach')return;
  if(!C.stable(I.window))return note('Show both assigned inputs and hold steady before capturing.','CALIBRATE');
  const raw=[0,1,2].map(k=>C.median(I.window.map(p=>p[k])));I.samples.push({raw,target:C.CORNERS[I.index]});I.lastCaptured=raw;I.window=[];I.armed=false;
  if(++I.index===8){try{I.profile=C.fit(I.samples);I.phase='verify';I.index=0;I.results=[];I.verifyAt=0;I.armed=true;}catch(e){I.phase='failed';$('#reachText').textContent=e.message;}}
  feedback('tick',.3,1.2);paint();
 }
 function paint(){const c=C.CORNERS[I.index]||C.CORNERS[0];$('#reachTitle').textContent=I.phase==='teach'?'TEACH REACH · '+(I.index+1)+' / 8':I.phase==='verify'?'CHECK REACH · '+(I.index+1)+' / 8':I.phase==='done'?'REACH CHECK COMPLETE':'REPEAT CALIBRATION';
  if(['teach','verify'].includes(I.phase))$('#reachText').textContent=(I.phase==='teach'?'Put the grip input comfortably ':'Reach the highlighted corner: ')+(c.x?'right':'left')+', '+(c.y?'low':'high')+'. Tool input '+(c.z?'up / away':'down / near')+'. '+(I.phase==='teach'?'Hold steady, then Capture or press Space.':'Hold the cursor inside the target for 0.6 seconds.');
  $('#reachCapture').hidden=I.phase!=='teach';$('#reachRetry').hidden=!['failed','done'].includes(I.phase);$('#reachMode').disabled=['verify'].includes(I.phase);$('#reachCanvas').hidden=!['teach','verify'].includes(I.phase);
 }
 function handleHands(tracks,now){
  if(I.profile&&signature()!==I.signature){I.profile=null;R.rebaseHeld();note('Camera or stage changed. Calibrate this setup again.','CALIBRATE');}
  const obs=observation(tracks);I.observation=obs;I.lastNow=now;
  if(obs?.primary){const scales=C.palmScale(obs.primary.marks);if(!I.palmReference&&I.phase==='teach')I.palmReference=scales;I.palmCue=I.palmReference?C.relativePalm(I.palmReference,scales):null;}
  if(['teach','verify','failed','done'].includes(I.phase)){
   if(obs){if(!I.armed&&I.lastCaptured&&Math.hypot(...obs.raw.map((v,i)=>v-I.lastCaptured[i]))>.09)I.armed=true;
    if(I.phase==='teach'&&I.armed){I.window.push(obs.raw);if(I.window.length>24)I.window.shift();}else I.window=[];
    if(I.phase==='verify'){const mapped=C.map(I.profile,obs.raw),error=C.error(mapped,C.CORNERS[I.index]);I.liveError=error;I.mapped=mapped;
     if(error<.08){if(!I.verifyAt){I.verifyAt=now;I.verifyErrors=[];}I.verifyErrors.push(error);if(now-I.verifyAt>=600){I.results.push({corner:I.index,error:Math.max(...I.verifyErrors),holdMs:now-I.verifyAt});I.verifyAt=0;feedback('click',.4);if(++I.index===8){I.phase='done';I.signature=signature();save();$('#reachText').textContent='8 / 8 reached within 8% axis tolerance. Worst held error '+Math.round(Math.max(...I.results.map(r=>r.error))*100)+'% of axis range. This checks control reach, not physical distance.';}paint();}}else I.verifyAt=0;
    }
   }else{I.window=[];I.verifyAt=0;}return true;
  }
  // The pointer transaction retains ownership while a tracked palm supplies depth.
  if(S.tx?.source==='pointer'){
   const tool=tracks.find(t=>t.id===I.tool)||tracks[0];if(tool&&gestureOf(tool)==='open'){
    const p=rawTool(tool);if(I.pointerTool?.id!==tool.id)I.pointerTool={id:tool.id,base:p,offset:S.tx.depthOffset||0};
    S.tx.depthOffset=I.pointerTool.offset+toolDelta(I.pointerTool.base,p);propose(S.tx.rawDelta.clone(),now);
   }else I.pointerTool=null;
   return true;
  }I.pointerTool=null;
  // Mouse-as-grip mode never lets a tool hand silently acquire a second owner.
  if(I.mode==='mouse-hand'&&!S.tx)return true;
  for(const t of tracks)t.point=point(t);
  return false;
 }
 function pixel(event){const r=$('#stage').getBoundingClientRect();return {x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};}
 document.addEventListener('pointermove',e=>{if(e.target!==canvas&&!I.mouseTool)return;I.pointer=pixel(e);if(!I.mouseTool||e.pointerId!==I.mouseTool.id||!S.tx)return;const dy=I.pointer.y-I.mouseTool.y;S.tx.depthOffset=I.mouseTool.offset+dy*(I.profile?360/(I.profile.axes[2].b-I.profile.axes[2].a):-650);propose(S.tx.rawDelta.clone());e.stopImmediatePropagation();},true);
 document.addEventListener('pointerdown',e=>{
  if(e.target!==canvas)return;
  if(I.phase!=='idle'){e.stopImmediatePropagation();return;}
  if(S.tx?.source==='hand'){I.pointer=pixel(e);I.mouseTool={id:e.pointerId,y:I.pointer.y,offset:S.tx.depthOffset||0};canvas.setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation();}
 },true);
 function endMouse(e){if(I.mouseTool?.id!==e.pointerId)return;I.mouseTool=null;e.stopImmediatePropagation();}
 document.addEventListener('pointerup',endMouse,true);document.addEventListener('pointercancel',endMouse,true);
 window.addEventListener('keydown',e=>{if(I.phase==='idle')return;if(e.code==='Space'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();capture();}if(e.key==='Escape'){e.stopImmediatePropagation();cancel();}},true);
 function draw(){const el=$('#reachCanvas'),r=$('#stage').getBoundingClientRect();el.width=r.width;el.height=r.height;const ctx=el.getContext('2d');
  const pos=c=>({x:(c.z?.28:.20)+(c.x?(c.z?.44:.60):0),y:(c.z?.40:.49)+(c.y?(c.z?.32:.41):0)});
  const points=C.CORNERS.map(c=>pos(c));ctx.strokeStyle='#b4d2ce80';ctx.lineWidth=1;for(let i=0;i<8;i++)for(const bit of [1,2,4])if((i^bit)>i){const a=points[i],b=points[i^bit];ctx.beginPath();ctx.moveTo(a.x*r.width,a.y*r.height);ctx.lineTo(b.x*r.width,b.y*r.height);ctx.stroke();}
  points.forEach((p,i)=>{ctx.fillStyle=i===I.index?'#c4f46a':'#365455';ctx.beginPath();ctx.arc(p.x*r.width,p.y*r.height,i===I.index?15:5,0,Math.PI*2);ctx.fill();if(i===I.index){ctx.fillStyle='#13221c';ctx.font='bold 12px monospace';ctx.fillText(String(i+1),p.x*r.width-4,p.y*r.height+4);}});
  if(I.phase==='verify'&&I.mapped){const [x,y,z]=I.mapped,c={x:0,y:0,z:0};const nx=.20+x*.60,ny=.49+y*.41,fx=.28+x*.44,fy=.40+y*.32;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc((nx+(fx-nx)*z)*r.width,(ny+(fy-ny)*z)*r.height,9,0,Math.PI*2);ctx.stroke();}
 }
 function frame(now){if(H.active&&!I.offered){I.offered=true;if(!I.profile&&!S.tx)start();}for(const [id,v] of B.visuals){if(!v.tag.hidden&&I.phase!=='idle')v.tag.textContent=id===I.primary?'GRIP · reach the corner':id===I.tool?'TOOL · near / away':v.tag.textContent;}if(I.phase==='teach'){$('#reachCapture').disabled=!C.stable(I.window);$('#reachStatus').textContent=!I.observation?'Show the assigned inputs':!I.armed?'Move to the next corner':C.stable(I.window)?'Steady · ready to capture':'Hold steady';if(I.palmCue)$('#reachStatus').textContent+=' · Palm '+(I.palmCue.valid?I.palmCue.relativeDistance.toFixed(2)+'× relative distance cue':'shape changed; size cue ignored');}
  if(I.phase==='verify')$('#reachStatus').textContent=I.observation?'Error '+Math.round((I.liveError||0)*100)+'% · hold '+Math.min(100,Math.round((I.verifyAt?(now-I.verifyAt):0)/6))+'%':'Input lost · waiting';
  if(['teach','verify'].includes(I.phase))draw();
  if(S.tx&&!H.owner&&I.mode==='mouse-hand')$('#selectionHint').textContent='Mouse holds · open palm up / down moves in / out';
 }
 $('#stage').insertAdjacentHTML('beforeend','<canvas id="reachCanvas" hidden></canvas><section id="reachPanel" hidden aria-label="Reach calibration"><b id="reachTitle"></b><select id="reachMode" aria-label="Input roles"><option value="hands">Two hands</option><option value="mouse-hand">Mouse holds · hand depth</option><option value="hand-mouse">Hand holds · mouse depth</option></select><p id="reachText"></p><output id="reachStatus"></output><div><button id="reachCapture">Capture</button><button id="reachRetry" hidden>Repeat</button><button id="reachClose">Close</button></div></section>');
 $('#reachMode').onchange=e=>{I.mode=e.target.value;I.profile=null;I.palmReference=null;start();};$('#reachCapture').onclick=capture;$('#reachRetry').onclick=start;$('#reachClose').onclick=()=>{if(I.phase==='done'){I.phase='idle';$('#reachPanel').hidden=true;$('#reachCanvas').hidden=true;H.mustOpen=true;}else cancel();};
 $('#setTable').onclick=start;$('#setTable').hidden=false;$('.header-tools').appendChild($('#setTable'));
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.profile?.version===1&&saved.profile.axes?.length===3&&saved.profile.axes.every(a=>Number.isFinite(a.a)&&Number.isFinite(a.b)&&Math.abs(a.b-a.a)>.06)&&saved.results?.length===8&&['hands','mouse-hand','hand-mouse'].includes(saved.mode)){Object.assign(I,{mode:saved.mode,profile:saved.profile,signature:saved.signature,results:saved.results,palmReference:saved.palmReference});$('#reachMode').value=I.mode;}}catch{}
 const oldRebase=R.rebaseHeld;R.rebaseHeld=function(){oldRebase();if(S.tx)delete S.tx.inputOrigin;};
 window.ButterInput={start,cancel,capture,handleHands,frame,toolDelta,gripDelta,point,rebase:()=>{I.pointerTool=null;if(I.mouseTool){I.mouseTool.y=I.pointer.y;I.mouseTool.offset=0;}},state:()=>I};
})();

/* world/put-that-there.js — Put That There for the LEGO world.
   Speech supplies an operation. A hand ray supplies its referent and destination.
   Every binding is shown before the world changes; uncertainty becomes a question. */
(function () {
'use strict';

const $ = s => document.querySelector(s);
const W = window.__world;
const M = 40;
const V = () => new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const state = {
  on: false, mode: 'point', stream: null, hand: null, pose: null, recognition: null,
  lastVideoTime: -1, frame: 0, hover: null, that: null, there: null, pending: null,
  pinched: false, lastBind: 0, walking: false, speechRestart: 0, landmarks: null, poseMarks: null,
  helper: null, trace: [], inferring: false, recorder: null, chunks: [],
};

const events=[];
function debug(event,data={}) {
  const row={time:new Date().toISOString(),event,...data};events.push(row);if(events.length>200)events.shift();
  console.info('[PTT]',event,data);
  const el=$('#pttLog');if(el)el.textContent=events.slice(-12).map(x=>JSON.stringify(x)).join('\n');
}
const sayLine = (text, kind) => {
  const el = $('#pttLine'); if (!el) return; el.textContent = text; el.dataset.kind = kind || '';
  if (kind === 'speak' && 'speechSynthesis' in window) {
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.06; speechSynthesis.speak(u); } catch (e) { }
  }
};
const label = hit => !hit ? '—' : hit.kind === 'piece' ? (hit.name || 'brick') : hit.kind === 'prop' ? (hit.name || 'model') : hit.kind === 'building' ? (hit.name || 'building') : 'ground';
function paintBindings() {
  const a = $('#pttThat'), b = $('#pttThere');
  a.textContent = 'THAT: ' + label(state.that); a.classList.toggle('set', !!state.that);
  b.textContent = 'THERE: ' + (state.there ? 'ground' : '—'); b.classList.toggle('go', !!state.there);
}

function worldRay(nx, ny) {
  if (!W || !W.ready || !W.camera) return null;
  W.camera.updateMatrixWorld();
  raycaster.setFromCamera({ x: nx * 2 - 1, y: 1 - ny * 2 }, W.camera);
  return raycaster.ray.clone();
}
function intersectBox(ray, box, max, out, hit) {
  if(!box)return; const p = ray.intersectBox(box, V()); if (!p) return;
  const d = p.distanceTo(ray.origin); if (d <= max && (!out.best || d < out.best.distance)) out.best = { ...hit, point: p.clone(), distance: d, box };
}
function pointIntoWorld(nx, ny) {
  const ray = worldRay(nx, ny); if (!ray) return null;
  const max = 45 * M, out = { best: null };
  if (W.build) for (const p of W.build.pieces.values()) if(!(state.grab && state.grab.hit.kind==='piece' && state.grab.hit.id===p.id)) intersectBox(ray, p.box, max, out, { kind: 'piece', id: p.id, item: p, name: (W.build.kinds.get(p.part) || {}).name || 'brick' });
  if (W.props) for (const p of W.props.items.values()) if (p.box && !(p.src && p.src.landmark) && !(state.grab && state.grab.hit.kind==='prop' && state.grab.hit.id===p.id)) intersectBox(ray, p.box, max, out, { kind: 'prop', id: p.id, item: p, name: p.src && (p.src.kind || p.src.as || p.src.kit || p.src.op) || 'model' });
  if (W.city) for (const b of W.city.near(ray.origin.x, ray.origin.z, max)) {
    const box = b.aabb || b.box || null; if (state.grab && state.grab.hit.kind==='building' && state.grab.hit.id===b.id) continue; if (box) intersectBox(ray, box, max, out, { kind: 'building', id: b.id, item: b, name: b.name || 'building' });
  }
  // Terrain intersection: short march followed by a binary search, matching the build reticle.
  if (W.G) {
    let lo = 0, hi = null;
    for (let d = .3 * M; d <= max; d += .35 * M) { const p = ray.at(d, V()); if (p.y <= W.G.h(p.x, p.z)) { hi = d; break; } lo = d; }
    if (hi != null && (!out.best || hi < out.best.distance)) {
      for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2, p = ray.at(mid, V()); if (p.y <= W.G.h(p.x, p.z)) hi = mid; else lo = mid; }
      const p = ray.at(hi, V()); p.y = W.G.h(p.x, p.z); out.best = { kind: 'ground', point: p, distance: hi, name: 'ground' };
    }
  }
  return out.best;
}

function capture(hit) {
  if (!hit) { sayLine('I cannot see what you mean. Point at a brick, model, or the ground.', 'speak'); return; }
  state.lastBind = performance.now(); debug('bind',{kind:hit.kind,id:hit.id});
  if (hit.kind === 'ground') {
    state.there = { kind: 'ground', point: hit.point.clone() }; sayLine('THERE is bound. Say the operation.', '');
  } else {
    state.that = { ...hit, point: hit.point.clone() }; state.there = null; sayLine('THAT is ' + label(hit) + '. Now point where.', '');
    showSelection(hit.box);
  }
  paintBindings(); if (state.pending) execute(state.pending);
}

function showSelection(box) {
  if(box&&state.helper){state.helper.box.copy(box);state.helper.position.set(0,0,0);return;}
  if(state.helper){if(W.scene)W.scene.remove(state.helper);state.helper.geometry.dispose();state.helper.material.dispose();} state.helper=null;
  if (box && W.scene) { state.helper = new THREE.Box3Helper(new THREE.Box3().copy(box), 0x58a7ff); state.helper.name = 'THAT'; state.helper.renderOrder = 999; state.helper.material.depthTest=false; state.helper.material.depthWrite=false; W.scene.add(state.helper); }
}

function groundPoint(p) { return { x: Math.round(p.x / 20) * 20, y: W.G.h(p.x, p.z), z: Math.round(p.z / 20) * 20 }; }
function pinDestination() { if(!state.there||!W.build||!W.camera)return;const dir=state.there.point.clone().sub(W.camera.position).normalize();W.build.on=true;W.build.pin={origin:W.camera.position.clone(),dir};W.build.aimRay(W.build.pin.origin,dir); }
function movePiece(hit, dst, copy) {
  const B=W.build, old=B&&B.pieces.get(hit.id); if(!old)return false;
  const t=AlleyPlacement.resolve(B,old,dst,copy?null:old.id); if(t.blocked){sayLine('Blocked: choose a clear position.','');return false;}
  const before=B.toRow(old).slice();
  if(copy){const rows=B.addRows([[null,old.part,old.col,t.x,t.y,t.z,old.rot]],false,true);if(!rows.length)return false;B.history.push(rows[0].id);return true;}
  B.take(old.id,true); const q=B.add({...old,x:t.x,y:t.y,z:t.z},false);
  if(!q){B.add(B.fromRow(before),false);return false;}
  if(!B.alleyUndo){const undo=B.undo.bind(B);B.alleyUndo=new Map();B.undo=function(){const key=this.history[this.history.length-1],row=this.alleyUndo.get(key);if(!row)return undo();this.history.pop();this.alleyUndo.delete(key);this.take(row[0],true);this.add(this.fromRow(row),false);if(this.onEdit)this.onEdit({up:[row]});return row[0];};}
  const key='alley-move-'+Date.now()+'-'+Math.random();B.alleyUndo.set(key,before);B.history.push(key);
  if(B.onEdit)B.onEdit({up:[B.toRow(q)]});return true;
}
function moveProp(hit, dst, copy) {
  const P = W.props, it = hit.item; if (!P || !it || !P.items.has(it.id)) return false; const g = groundPoint(dst);
  if (copy) return P.place(it.mpd, g.x, g.y, g.z, it.yaw, false, it.src).then(Boolean);
  P.moveTo(it, g.x, g.y, g.z, it.yaw, false); return true;
}
function turn(hit) {
  if (hit.kind === 'piece') {
    const p = hit.item, B = W.build; B.take(p.id, true); p.rot = (p.rot + 1) & 3; const q = B.add(p, false); if (q && B.onEdit) B.onEdit({ up: [B.toRow(q)] }); return !!q;
  }
  if (hit.kind === 'prop') { const p = hit.item; W.props.moveTo(p, p.x, p.y, p.z, p.yaw + 1, false); return true; }
  return false;
}
function remove(hit) {
  if (hit.kind === 'piece') return !!W.build.remove(hit.id);
  if (hit.kind === 'prop') return W.props.remove(hit.id);
  return false;
}
function parse(text) {
  text = String(text || '').toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  let verb = 'unknown';
  if (/\b(commit|confirm|keep it)\b/.test(text)) verb = 'commit';
  else if (/\b(undo|go back)\b/.test(text)) verb = 'undo';
  else if (/\b(stop|halt|freeze)\b/.test(text)) verb = 'stop';
  else if (/\b(walk|go|come)\b/.test(text)) verb = 'walk';
  else if (/\b(remove|delete|destroy|pick up)\b/.test(text)) verb = 'remove';
  else if (/\b(turn|rotate|spin)\b/.test(text)) verb = 'turn';
  else if (/\b(taller|higher|raise)\b/.test(text)) verb = 'taller';
  else if (/\b(copy|duplicate|another)\b/.test(text)) verb = 'copy';
  else if (/\b(put|move|place)\b/.test(text)) verb = 'move';
  else if (/\b(make|build|create|add)\b/.test(text)) verb = 'build';
  return { verb, text, needsThat: /^(move|copy|remove|turn|taller)$/.test(verb), needsThere: /^(move|copy|walk)$/.test(verb), thisWord: /\b(this|that|these|those|it)\b/.test(text), thereWord: /\b(here|there)\b/.test(text) };
}

function tracePacket(words) {
  const now=performance.now(), seen=new Map();
  for(const q of state.trace) if(q.hit&&q.hit.id) seen.set(q.hit.id,{id:q.hit.id,kind:q.hit.kind,name:q.hit.name||q.hit.kind});
  if(state.that&&state.that.id) seen.set(state.that.id,{id:state.that.id,kind:state.that.kind,name:label(state.that),bound_as:'THAT'});
  const near=[];
  if(W.build&&W.rig) for(const p of W.build.nearPoint(W.rig.pos.x,W.rig.pos.z,24*M)) { if(near.length>=32)break; near.push({id:p.id,kind:'piece',name:(W.build.kinds.get(p.part)||{}).name||'brick',at:[Math.round(p.x),Math.round(p.y),Math.round(p.z)]}); }
  if(W.props&&W.rig) for(const p of W.props.near(W.rig.pos.x,W.rig.pos.z,24*M)) { if(near.length>=48)break; near.push({id:p.id,kind:'prop',name:p.src&&(p.src.kind||p.src.as||p.src.kit||p.src.op)||'model',at:[Math.round(p.x),Math.round(p.y),Math.round(p.z)]}); }
  return {version:1,wake_word:/^\s*(world|lego|builder)\b/i.test(words)?words.trim().split(/\s+/)[0].toLowerCase():(/^\s*put that\b/i.test(words)?'put that':null),utterance:words,mode:state.mode,place:W.place&&W.place.name,player:W.rig?{at:W.rig.pos.toArray().map(Math.round),heading:+W.rig.heading.toFixed(3)}:null,bound:{that:state.that&&state.that.id||null,there:state.there&&state.there.point.toArray().map(Math.round)||null},candidates:[...seen.values()],nearby:near,trace:state.trace.filter(q=>now-q.t<6000).map(q=>({ms:Math.round(q.t-now),pointer:q.pointer,pinch:q.pinch,hit:q.hit}))};
}

function findReferent(id) {
  if(id==null)return state.that;
  const building=W.city&&W.city.buildings.find(b=>String(b.id)===String(id));
  if(building)return {kind:'building',id:building.id,item:building,box:building.aabb,name:building.name||'building'};
  if(W.build&&W.build.pieces.has(id)){const p=W.build.pieces.get(id);return{kind:'piece',id,item:p,name:(W.build.kinds.get(p.part)||{}).name||'brick',box:p.box};}
  if(W.props&&W.props.items.has(id)){const p=W.props.items.get(id);return{kind:'prop',id,item:p,name:p.src&&(p.src.kind||p.src.as||p.src.kit||p.src.op)||'model',box:p.box};}
  return null;
}
async function infer(words, capturedPacket) {
  debug('inference.request',{characters:String(words).length,keyAvailable:!!(window.Ai&&Ai.key())});
  if(state.inferring){sayLine('Finish the current request first.','');return;}
  if(!W.ready){sayLine('Wait for the world to load.','');return;}
  const local=parse(words);
  if(/^(stop|undo|commit)$/.test(local.verb)){execute(local);return;}
  if(!window.Ai||!Ai.key()){
    if(local.verb==='build'||local.verb==='unknown'){sayLine('Add an OpenAI key for new creations, or use + Brick to test placement.','');W.wbOpen&&W.wbOpen(true);return;}
    execute(local);return;
  }
  state.inferring=true;$('#pttMic').textContent='LLM: inferring';sayLine('Resolving words and gesture…','');
  try {
    const packet=capturedPacket ? {...capturedPacket,utterance:words} : tracePacket(words),a=await Ai.inferAct(packet);
    if(a.act==='clarify'||a.clarification||Number(a.confidence)<.58){sayLine(a.clarification||a.say||'Show me which one.','speak');return;}
    const allowed=new Set([...(packet.candidates||[]),...(packet.nearby||[])].map(x=>String(x.id)));
    if(a.referent_id&&!allowed.has(String(a.referent_id))){sayLine('The model named something outside the visible world. Point again.','speak');return;}
    const ref=findReferent(a.referent_id);if(a.referent_id&&!ref){sayLine('That reference is no longer in the world. Point again.','speak');return;}
    if(ref){state.that=ref;showSelection(ref.box);}if(Array.isArray(a.destination)&&a.destination.length===3&&a.destination.every(Number.isFinite)){const p=new THREE.Vector3(...a.destination),origin=W.rig&&W.rig.pos;if(origin&&Math.hypot(p.x-origin.x,p.z-origin.z)>60*M){sayLine('That destination is outside the reachable scene. Point closer.','speak');return;}p.y=W.G.h(p.x,p.z);state.there={kind:'ground',point:p};}paintBindings();
    if(a.act==='build'&&a.program&&Array.isArray(a.program.ops)&&W.mbLoad){pinDestination();W.mbLoad(a.program);sayLine(a.say||'The build is ready to preview.','speak');resetBindings();return;}
    if(a.act==='build'&&a.words&&W.say){pinDestination();await W.say(a.words);sayLine(a.say||'The build is ready to preview.','speak');return;}
    if(a.act==='change'&&a.words&&W.say){await W.say(a.words);sayLine(a.say||'The change is ready to preview.','speak');return;}
    const cmd={verb:a.act,text:a.words||words,needsThat:/^(move|copy|remove|turn|taller)$/.test(a.act),needsThere:/^(move|copy|walk)$/.test(a.act),thisWord:false,thereWord:false};
    const ok=await execute(cmd);if(ok&&a.say)sayLine(a.say,'speak');
  } catch(e){debug('inference.error',{message:e.message||String(e)});sayLine('Model error: '+(e.message||e)+'. Your world was not changed.','');}
  finally{state.inferring=false;$('#pttMic').textContent=state.voiceError?'VOICE: '+state.voiceError:state.voiceOff?'VOICE: tap Talk':'VOICE: browser listening';}
}

function resetBindings() { state.that = state.there = state.pending = null; paintBindings();showSelection(null); }
function execute(cmd) {
  debug('action',{verb:cmd.verb,selected:state.that&&state.that.id,destination:!!state.there});
  state.pending = null;
  if (cmd.verb === 'commit') { if(W.master&&W.master.result&&W.mbCommit){W.mbCommit();sayLine('Committing the preview.','');return true;}sayLine('There is no preview to commit.','');return false; }
  if (cmd.verb === 'stop') { state.walkTarget=null;state.grab=null;setMode('point');stopWalk(); sayLine('Stopped.', ''); return true; }
  if (cmd.verb === 'undo') { if(state.cityUndo){restoreCity(state.cityUndo);state.cityUndo=null;sayLine('Building move undone.','');}else if(W.build&&W.build.undo())sayLine('Last build edit undone.','');else sayLine('Nothing to undo in the placement history.',''); return true; }
  if (cmd.thisWord && !state.that && state.hover && state.hover.kind !== 'ground') state.that = { ...state.hover, point: state.hover.point.clone() };
  if (cmd.thereWord && !state.there && state.hover && state.hover.kind === 'ground') state.there = { kind: 'ground', point: state.hover.point.clone() };
  if (cmd.needsThat && !state.that) { state.pending = cmd; sayLine('Which thing? Point at it and close your fist.', 'speak'); paintBindings(); return false; }
  if (cmd.needsThere && !state.there) { state.pending = cmd; sayLine('Where? Point at the ground and close your fist.', 'speak'); paintBindings(); return false; }
  let ok = false;
  if (cmd.verb === 'move' || cmd.verb === 'copy') {
    if (state.that.kind === 'piece') ok = movePiece(state.that, state.there.point, cmd.verb === 'copy');
    else if (state.that.kind === 'prop') ok = moveProp(state.that, state.there.point, cmd.verb === 'copy');
    else if (state.that.kind === 'building') ok = moveBuilding(state.that, state.there.point, cmd.verb === 'copy');
  } else if (cmd.verb === 'remove') ok = remove(state.that);
  else if (cmd.verb === 'turn') ok = turn(state.that);
  else if (cmd.verb === 'taller' && state.that.kind === 'piece') {
    const p=state.that.item,B=W.build,h=B.ext(p.part,p.rot)[4]; ok=!!B.addRows([[p.id,p.part,p.col,p.x,p.y+h,p.z,p.rot]],false,true).length;
  }
  else if (cmd.verb === 'walk') { state.walkTarget=state.there.point.clone();state.walkStarted=performance.now();state.walkLast=W.rig.pos.clone();state.walkStuck=0;sayLine('Walking toward THERE. Say stop to stop.','');resetBindings();return true; }
  else if (cmd.verb === 'build') {
    pinDestination();
    if (W.say) { W.wbOpen&&W.wbOpen(true);W.say(cmd.text.replace(/\b(here|there)\b/g, '').trim());sayLine('Building a preview. Use Commit to place it.','');return true; }
  }
  if(ok&&typeof ok.then==='function')return ok.then(done=>{sayLine(done?'Copy placed.':'Could not load the copied model.','');if(done)resetBindings();return done;}).catch(e=>{sayLine('Copy failed: '+e.message,'');return false;});
  if (ok) { sayLine(cmd.verb.toUpperCase() + ' complete.', ''); resetBindings(); }
  else if (state.that && state.that.kind === 'building') sayLine('That building belongs to the place. Point at your LEGO bricks or a built model.', 'speak');
  else sayLine('I could not perform that move.', 'speak');
  return ok;
}
function heard(text, explicit = false, capturedPacket) {
  text = String(text || '').trim(); if (!text) return; $('#pttMic').textContent = 'VOICE: “' + text.slice(0, 34) + '”'; $('#pttMic').classList.add('set'); sayLine('“' + text + '”', '');
  const awake=explicit||/^\s*(world|lego|builder)\b/i.test(text)||/^\s*put that\b/i.test(text);
  if(!awake){sayLine('Say “World” before the request, or begin “Put that…”.','');return;}
  return infer(text.replace(/^\s*(world|lego|builder)[,:]?\s*/i,''), capturedPacket);
}

function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('#pttMic').textContent = 'VOICE: type below'; sayLine('Voice recognition is unavailable here. Type the same command in the word bar.', ''); return; }
  if(state.recognition)try{state.recognition.onend=null;state.recognition.abort();}catch(e){}
  const r = new SR(); state.recognition = r; r.continuous = true; r.interimResults = true; r.lang = document.documentElement.lang || 'en-US';
  r.onstart = () => { state.voiceError=null;$('#pttMic').textContent = 'VOICE: browser listening'; $('#pttMic').classList.add('set'); $('#pttStart').classList.add('listening'); };
  r.onresult = e => { if(state.recorder || state.transcribing || window.speechSynthesis&&speechSynthesis.speaking)return; let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) {state.lastHeard=Date.now();heard(t,true);} else interim += t; } if (interim) sayLine(interim + '…', ''); };
  r.onerror = e => { debug('browser.voice.error',{error:e.error});state.voiceError=e.error;$('#pttMic').textContent='VOICE: '+e.error;if(e.error!=='aborted')sayLine('Browser voice: '+e.error+'. Use Talk with your OpenAI key, or type below.','');if(/not-allowed|service-not-allowed/.test(e.error))state.voiceOff=true; };
  r.onend = () => { $('#pttStart').classList.remove('listening'); if (state.on && !state.recorder && !state.transcribing && !state.voiceOff) { clearTimeout(state.speechRestart); state.speechRestart = setTimeout(() => { try { r.start(); } catch (e) {debug('browser.voice.restart.error',{message:e.message});} }, 450); } };
  try { r.start(); } catch (e) {debug('browser.voice.start.error',{message:e.message});sayLine('Browser voice: '+e.message,'');}
}

function micStatus(text){$('#pttMic').textContent='VOICE: '+text;debug('voice.state',{status:text});}
function stopMeter(){clearInterval(state.meterTimer);if(state.audioContext)state.audioContext.close().catch(()=>{});state.audioContext=null;}
async function recordStart(e) {
  if(e)e.preventDefault();
  if(!state.on||state.recorder||state.transcribing||state.recordOpening)return;
  if(!window.MediaRecorder){sayLine('MediaRecorder unavailable. Use Browser voice or type.','');return;}
  state.recordOpening=true;state.voiceOff=true;clearTimeout(state.speechRestart);
  if(state.recognition)try{state.recognition.abort();}catch(e){}
  if(window.speechSynthesis)speechSynthesis.cancel();
  try{
    let tracks=state.stream&&state.stream.getAudioTracks().filter(t=>t.readyState==='live');
    if(!tracks||!tracks.length){micStatus('requesting microphone');const audio=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});if(!state.on){audio.getTracks().forEach(t=>t.stop());return;}audio.getAudioTracks().forEach(t=>state.stream.addTrack(t));tracks=audio.getAudioTracks();}
    tracks.forEach(t=>t.enabled=true);
    const stream=new MediaStream(tracks),mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
    state.chunks=[];state.recordBytes=0;state.recordStarted=performance.now();state.recordPacket=tracePacket('');
    const r=new MediaRecorder(stream,mime?{mimeType:mime}:{});state.recorder=r;
    r.ondataavailable=x=>{if(x.data&&x.data.size){state.chunks.push(x.data);state.recordBytes+=x.data.size;}};
    r.onerror=x=>{debug('record.error',{message:x.error&&x.error.message});sayLine('Recorder failed. Check the diagnostic log.','');};
    r.onstop=finishRecording;r.start(250);state.recordTimer=setTimeout(recordStop,30000);
    $('#pttAsk').classList.add('on');$('#pttAsk').textContent='Stop recording';micStatus('recording');
    sayLine('Recording locally. Stop, play it back, then Send audio to run the instruction.','');
    debug('record.start',{mime:r.mimeType,tracks:tracks.map(t=>({enabled:t.enabled,muted:t.muted,state:t.readyState}))});
    const AC=window.AudioContext||window.webkitAudioContext;
    let analyser,data;
    if(AC)try{const ac=state.audioContext=new AC();await ac.resume();analyser=ac.createAnalyser();analyser.fftSize=256;ac.createMediaStreamSource(stream).connect(analyser);data=new Uint8Array(analyser.fftSize);}catch(e){debug('meter.error',{message:e.message});}
    if(!state.recorder||state.recorder.state!=='recording'){stopMeter();return;}
    state.meterTimer=setInterval(()=>{
      let rms=0;if(analyser){analyser.getByteTimeDomainData(data);rms=Math.sqrt(data.reduce((n,v)=>n+((v-128)/128)**2,0)/data.length);}
      $('#pttLevel').value=Math.min(1,rms*5);
      $('#pttMic').textContent='REC '+((performance.now()-state.recordStarted)/1000).toFixed(1)+'s · '+Math.round(state.recordBytes/1024)+' KB'+(analyser&&rms<.005?' · quiet':'');
    },100);
  }catch(x){state.recorder=null;micStatus(x.name||'record failed');debug('record.error',{message:x.message});sayLine('Microphone: '+x.message,'');}
  finally{state.recordOpening=false;}
}
function recordStop(e){if(e)e.preventDefault();clearTimeout(state.recordTimer);stopMeter();if(state.recorder&&state.recorder.state==='recording')state.recorder.stop();}
function finishRecording(){
  const r=state.recorder;state.recorder=null;stopMeter();state.recordPacket=tracePacket('');
  const blob=new Blob(state.chunks,{type:r&&r.mimeType||'audio/webm'});state.chunks=[];state.audioBlob=blob;
  if(state.audioURL)URL.revokeObjectURL(state.audioURL);state.audioURL=URL.createObjectURL(blob);
  $('#pttPlayback').src=state.audioURL;$('#pttPlayback').hidden=false;$('#pttSendAudio').disabled=!blob.size;
  $('#pttAsk').classList.remove('on');$('#pttAsk').textContent='Record';
  micStatus(blob.size?'recorded '+Math.round(blob.size/1024)+' KB':'empty recording');
  debug('record.stop',{bytes:blob.size,mime:blob.type});
  sayLine(blob.size?'Play back to check the microphone. Send audio uses your API key.':'No audio captured. Try microphone permission again.','');
}
async function transcribeRecording(){
  if(state.transcribing||!state.audioBlob)return;
  if(!window.Ai||!Ai.key()){sayLine('Recording is ready. Add an API key, then Send audio.','');$('#pttKey').click();return;}
  state.transcribing=true;$('#pttSendAudio').disabled=true;micStatus('transcribing');
  const blob=state.audioBlob,packet=state.recordPacket||tracePacket(''),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),45000);
  try{
    const f=new FormData();f.append('file',blob,/mp4/.test(blob.type)?'speech.mp4':/ogg/.test(blob.type)?'speech.ogg':'speech.webm');f.append('model','gpt-4o-transcribe');
    debug('transcription.start',{bytes:blob.size});
    const res=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+Ai.key()},body:f,signal:abort.signal});
    debug('transcription.response',{status:res.status,requestId:res.headers.get('x-request-id')});
    const j=await res.json();if(!res.ok)throw new Error(j.error&&j.error.message||res.status);
    if(!j.text||!j.text.trim())throw new Error('No speech recognised. Check playback.');
    $('#pttWords').value=j.text;micStatus('transcribed');debug('transcription.done',{characters:j.text.length});
    if(state.on)await heard(j.text,true,packet);
  }catch(e){micStatus('transcription failed');debug('transcription.error',{message:e.message});sayLine('Transcription: '+e.message+'. Recording retained; you can retry.','');}
  finally{clearTimeout(timer);state.transcribing=false;$('#pttSendAudio').disabled=false;}
}

function drawHand(hand, pose) {
  const c = $('#pttDraw'), r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height); g.lineCap = 'round';
  const plot = (marks, links, colour) => { if (!marks) return; g.strokeStyle = colour; g.fillStyle = '#fff'; g.lineWidth = 2; for (const [a,b] of links) { g.beginPath(); g.moveTo((1-marks[a].x)*r.width, marks[a].y*r.height); g.lineTo((1-marks[b].x)*r.width, marks[b].y*r.height); g.stroke(); } for (const p of marks) { g.beginPath(); g.arc((1-p.x)*r.width,p.y*r.height,2.2,0,Math.PI*2);g.fill(); } };
  const H = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  const P = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[24,26]];
  plot(pose, P, '#55e57b'); plot(hand, H, '#58a7ff');plot(state.otherHand,H,'#ffc540');
}
function poseWalk(marks) {
  if (!marks || state.mode !== 'walk' || !W || !W.ready || W.mode !== 'walk') { stopWalk(); return; }
  const ls=marks[11],rs=marks[12],lw=marks[15],rw=marks[16],lh=marks[23],rh=marks[24]; if (![ls,rs,lw,rw,lh,rh].every(p=>p&&(p.visibility==null||p.visibility>.6))) { stopWalk(); return; }
  const up = lw.y < ls.y && rw.y < rs.y, back = lw.y > lh.y && rw.y > rh.y;
  const steer = Math.max(-1,Math.min(1,((1-(ls.x+rs.x)/2)-.5)*4)); const speed = up ? .72 : back ? -.38 : 0;
  W.input.L.x = steer*.72; W.input.L.y = speed; W.input.L.mag = Math.min(1,Math.hypot(W.input.L.x,speed)); W.input.L.held = W.input.L.mag > .03; state.walking = W.input.L.held;
  if (state.walking) sayLine((speed < 0 ? 'BACK' : 'WALK') + (steer < -.12 ? ' · LEFT' : steer > .12 ? ' · RIGHT' : ' · FORWARD'), ''); else sayLine('Raise both hands to walk. Lean left or right to steer.', '');
}
function stopWalk() { if (!state.walking || !W || !W.input) return; W.input.L.x=W.input.L.y=W.input.L.mag=0; W.input.L.held=false; state.walking=false; }


function handGesture(h,held=false) {
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
  const span=Math.max(.025,dist(h[5],h[17]));
  let curled=0;
  for(const [m,p,t] of [[5,6,8],[9,10,12],[13,14,16],[17,18,20]]) {
    const a={x:h[p].x-h[m].x,y:h[p].y-h[m].y,z:(h[p].z||0)-(h[m].z||0)};
    const b={x:h[t].x-h[p].x,y:h[t].y-h[p].y,z:(h[t].z||0)-(h[p].z||0)};
    const cos=(a.x*b.x+a.y*b.y+a.z*b.z)/(Math.hypot(a.x,a.y,a.z)*Math.hypot(b.x,b.y,b.z)||1);
    if(cos<.35||dist(h[t],h[0])<dist(h[p],h[0])*1.12)curled++;
  }
  const pinch=dist(h[8],h[4])/span;
  return {closed:curled>=(held?2:3)||pinch<(held?.62:.38),name:curled>=3?'FIST':pinch<.62?'PINCH':'OPEN',curled,pinch};
}
function updateHand(hand,now) {
  const g=handGesture(hand,state.pinched),palm={x:1-(hand[0].x+hand[5].x+hand[9].x+hand[17].x)/4,y:(hand[0].y+hand[5].y+hand[9].y+hand[17].y)/4};
  let nx=1-hand[8].x,ny=hand[8].y;
  if(state.grab){nx=state.grab.start[0]+palm.x-state.grab.palm.x;ny=state.grab.start[1]+palm.y-state.grab.palm.y;}
  const prev=state.pointer||{x:nx,y:ny};
  state.pointer={x:prev.x+(nx-prev.x)*.45,y:prev.y+(ny-prev.y)*.45};nx=state.pointer.x;ny=state.pointer.y;
  state.hover=pointIntoWorld(nx,ny);
  // Keep the last aimed object through finger closure, not indefinitely.
  if(!g.closed&&!state.grab&&state.hover&&state.hover.kind!=='ground')state.recentHit={hit:state.hover,t:now,pointer:[nx,ny]};
  const recent=state.recentHit&&now-state.recentHit.t<650?state.recentHit.hit:null;
  const target=g.closed&&recent?recent:state.hover&&state.hover.kind!=='ground'?state.hover:recent;
  if(!state.that&&!state.grab){if(target)showSelection(target.box);else if(state.helper)showSelection(null);}
  const cur=$('#pttCursor');cur.style.left=nx*innerWidth+'px';cur.style.top=ny*innerHeight+'px';cur.className='on '+(state.grab?'object':state.hover?state.hover.kind==='ground'?'ground':'object':'');
  $('#pttGesture').textContent=g.name+(state.grab?' · HELD':target?' · '+label(target):' · aim at an object');
  if(g.closed!==state.gestureCandidate){state.gestureCandidate=g.closed;state.gestureSince=now;}
  if(now-state.gestureSince>100&&g.closed!==state.pinched){
    state.pinched=g.closed;
    if(g.closed){
      const hit=target||state.hover;capture(hit);
      if(hit&&hit.kind!=='ground'){
        const start=state.recentHit&&state.recentHit.hit.id===hit.id?state.recentHit.pointer:[nx,ny];
        state.grab={hit,start,palm,destination:null,depth:0};state.pointer={x:start[0],y:start[1]};debug('grab.begin',{gesture:g.name,kind:hit.kind,id:hit.id});sayLine('Held '+label(hit)+'. Right hand moves sideways/up. Close left hand and move it down/up for farther/nearer. Open right to place.','');
      }
    }else if(state.grab){
      const grab=state.grab;state.grab=null;debug('grab.release',{moved:!!grab.destination});
      if(grab.destination){state.that=grab.hit;state.there={kind:'ground',point:grab.destination};execute({verb:'move',needsThat:true,needsThere:true});}
    }
  }
  if(state.pinched&&state.grab){
    const grab=state.grab,ray=worldRay(nx,ny);
    const other=state.otherHand;
    if(other&&handGesture(other).closed){if(!grab.clutch)grab.clutch={y:other[0].y,depth:grab.depth};grab.depth=Math.max(-400,Math.min(400,grab.clutch.depth+(other[0].y-grab.clutch.y)*800));}else grab.clutch=null;
    if(ray&&(Math.hypot(palm.x-grab.palm.x,palm.y-grab.palm.y)>.025||Math.abs(grab.depth)>2)){
      const box=grab.hit.box,centre=new THREE.Box3().copy(box).getCenter(V());centre.y=box.min.y;
      // Camera-facing drag plane works even when the cursor is not over terrain.
      const normal=W.camera.getWorldDirection(V()),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,grab.hit.point),p=ray.intersectPlane(plane,V());
      if(p){const delta=p.sub(grab.hit.point);const dst=centre.clone().add(delta).addScaledVector(normal,grab.depth);
        if(grab.hit.kind==='piece'){
          const item=grab.hit.item;dst.x+=item.x-centre.x;dst.z+=item.z-centre.z;
          const surface=state.hover;if(surface&&surface.box&&surface.id!==item.id)dst.y=surface.box.max.y;
          const t=AlleyPlacement.resolve(W.build,item,dst,item.id);grab.destination=t.blocked?null:V().set(t.x,t.y,t.z);
          dst.set(t.x+centre.x-item.x,t.y,t.z+centre.z-item.z);if(state.helper)state.helper.material.color.set(t.blocked?0xff5544:0x58ffbb);
          sayLine((t.blocked?'Blocked':'Ready')+' · height '+Math.round(t.y)+' · depth '+Math.round(grab.depth)+' · open right hand to place','');
        }else{dst.y=W.G.h(dst.x,dst.z);grab.destination=dst;}
        if(state.helper)state.helper.box.copy(box).translate(dst.clone().sub(centre));
      }
    }
  }
  if(!state.trace.length||now-state.trace[state.trace.length-1].t>90){const h=state.hover;state.trace.push({t:now,pointer:[nx,ny],pinch:state.pinched,gesture:g.name,hit:h?{kind:h.kind,id:h.id||null,name:label(h),point:h.point.toArray().map(Math.round)}:null});while(state.trace.length&&now-state.trace[0].t>6500)state.trace.shift();}
  if(now-(state.lastDiagnostic||0)>1000){state.lastDiagnostic=now;debug('tracking',{gesture:g.name,curled:g.curled,pinch:+g.pinch.toFixed(2),hit:state.hover&&state.hover.kind,selected:state.that&&state.that.id,held:!!state.grab});}
}

async function visionLoop() {
  if (!state.on) return; const v = $('#pttVideo');
  if (v.readyState >= 2 && v.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = v.currentTime; const now = performance.now(); state.frame++;
    try {
      const hr=state.hand.detectForVideo(v,now), hands=hr.landmarks||[], labels=hr.handedness||hr.handednesses||[];
      const bySide=new Map(hands.map((h,i)=>[labels[i]&&labels[i][0]&&labels[i][0].categoryName,h]));
      const hand=bySide.get(state.swapHands?'Left':'Right')||null;state.otherHand=bySide.get(state.swapHands?'Right':'Left')||null;state.landmarks=hand;
      let pose = state.poseMarks; if (state.frame % 3 === 0) { const pr = state.pose.detectForVideo(v, now); pose = state.poseMarks = pr.landmarks && pr.landmarks[0] || null; state.poseWorld=pr.worldLandmarks&&pr.worldLandmarks[0]||null; }
      if(state.frame%3===0)state.poseAt=now;state.handAt=hand?now:0;
      drawHand(hand, pose);
      if(window.BuilderWag){BuilderWag.hands(bySide,now);}
      else if (state.mode === 'walk') poseWalk(pose);
      else {
        stopWalk(); if (hand) {
          updateHand(hand,now);

        } else { state.hover=null;if(state.grab)debug('grab.cancel',{reason:'tracking lost'});state.grab=null;state.pointer=null;state.recentHit=null;state.gestureSince=0;if(state.helper&&state.that)state.helper.box.copy(state.that.box); $('#pttCursor').className=''; state.pinched=false; }
      }
    } catch (e) { if(now-(state.lastVisionError||0)>2000){state.lastVisionError=now;debug('vision.error',{message:e.message});sayLine('Tracking error: '+e.message,'');} }
  }
  requestAnimationFrame(visionLoop);
}

async function start() {
  if (state.on) { stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { sayLine('This browser cannot open a camera. Use HTTPS on a current phone or computer.', ''); return; }
  state.voiceOff=false;
  const b=$('#pttStart'); b.disabled=true; b.textContent='Opening…'; $('#ptt').classList.add('on'); sayLine('Allow camera access. Microphone is requested separately when you tap Record.','');
  try {
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
    const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm');
    const files=await mod.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    const make=async(K,options)=>{try{return await K.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'GPU'}});}catch(e){console.info('[put-that-there] GPU delegate unavailable; using CPU');return K.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}};
    state.hand=await make(mod.HandLandmarker,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.45,minTrackingConfidence:.45});
    state.pose=await make(mod.PoseLandmarker,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.4,minTrackingConfidence:.4});
    const v=$('#pttVideo');v.srcObject=state.stream;await v.play();state.on=true;document.body.classList.add('ptt-on');$('#ptt').classList.add('on');b.classList.add('on');b.setAttribute('aria-pressed','true');b.textContent='Stop pointing';sayLine('Aim at an object, close your fist, move, then open to place. Record or type to create.','');micStatus('tap Record');visionLoop();
  } catch(e) { console.error('[put-that-there] start',e); if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;sayLine(/denied|permission/i.test(String(e))?'Camera permission was denied. Enable it in the browser, then try again.':'Could not start hand tracking. The typed builder still works.',''); }
  finally { b.disabled=false; if(!state.on)b.textContent='Point + speak'; }
}
function stop() {
  if(window.BuilderWag)BuilderWag.cancel();
  state.on=false;stopMeter();state.pinched=false;state.pointer=null;state.recentHit=null;state.walkTarget=null;state.grab=null;clearTimeout(state.recordTimer);stopWalk();resetPose();clearTimeout(state.speechRestart);if(state.recorder)try{state.recorder.onstop=null;state.recorder.stop();}catch(e){}state.recorder=null;if(state.recognition)try{state.recognition.abort();}catch(e){}state.recognition=null;if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;
  if(state.hand)state.hand.close();if(state.pose)state.pose.close();state.hand=state.pose=null;resetBindings();document.body.classList.remove('ptt-on');$('#ptt').classList.remove('on');$('#pttCursor').className='';const b=$('#pttStart');b.classList.remove('on','listening');b.setAttribute('aria-pressed','false');b.textContent='Point + speak';
}
function setMode(mode){state.grab=null;state.pinched=false;state.pointer=null;state.recentHit=null;state.mode=mode==='walk'?'walk':'point';document.querySelectorAll('[data-ptt-mode]').forEach(b=>b.classList.toggle('on',b.dataset.pttMode===state.mode));if(state.mode==='walk'){resetBindings();sayLine('Raise both hands to walk. Lean left or right to steer.','');$('#pttCursor').className='';}else{stopWalk();sayLine('Point, close your fist to grab, move, then open to place.','');}}

$('#pttStart').addEventListener('click',start);document.querySelectorAll('[data-ptt-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.pttMode)));window.addEventListener('pagehide',stop);
$('#pttAsk').textContent='Record';$('#pttAsk').addEventListener('click',e=>state.recorder?recordStop(e):recordStart(e));$('#pttAsk').addEventListener('contextmenu',e=>e.preventDefault());
// In browsers without speech recognition, the same small language works through the existing text field.
$('#wbBuild').addEventListener('click',e=>{if(!state.on)return;const t=$('#words').value,cmd=parse(t);e.preventDefault();e.stopImmediatePropagation();$('#words').value='';heard(t,true);},true);
$('#words').addEventListener('keydown',e=>{if(!state.on||e.key!=='Enter'||e.shiftKey)return;const cmd=parse(e.target.value);e.preventDefault();e.stopImmediatePropagation();const t=e.target.value;e.target.value='';heard(t,true);},true);

function snapshotCity(){
  return {source:W.city.source.map(s=>({...s,ring:s.ring.map(p=>({...p}))})),damage:W.city.buildings.map(b=>[b.id,[...b.removed]])};
}
function restoreCity(snapshot){
  W.city.set(snapshot.source.map(s=>({...s,ring:s.ring.map(p=>({...p}))})));
  for(const [id,ks] of snapshot.damage){const b=W.city.buildings.find(x=>x.id===id);if(b&&ks.length)W.city.applyRemoved(b,ks);}
}
function moveBuilding(hit,dst,copy){
  if(!W.city||!dst)return false;
  if(W.room&&W.room.role){sayLine('Map-building moves are local only. Leave the shared room first.','');return false;}
  const b=W.city.buildings.find(x=>String(x.id)===String(hit.id)),src=b&&W.city.source.find(x=>x.id===b.id);if(!src)return false;
  const saved=snapshotCity(),dx=dst.x/M-b.cx,dz=dst.z/M-b.cz;
  const moved={...src,ring:src.ring.map(p=>({...p,x:p.x+dx,z:p.z+dz}))};
  if(copy)moved.id=-Date.now();
  const next=copy?[...saved.source,moved]:saved.source.map(x=>x.id===src.id?moved:x);
  try{restoreCity({source:next,damage:saved.damage});state.cityUndo=saved;return true;}
  catch(e){restoreCity(saved);sayLine('Building move failed: '+e.message,'');return false;}
}
// One rigid LEGO arm: solve the actual shoulder-to-grip vector, not independent Euler guesses.
// No elbow pivot exists in this mesh; a two-bone solve would detach the hand.
function poseAngles(m){
  if(!m)return null;
  const good=p=>p&&(p.visibility==null||p.visibility>.55);
  if(!good(m[11])||!good(m[12]))return null;
  const arm=(s,e,w)=>{
    const end=good(m[w])?m[w]:good(m[e])?m[e]:null;if(!end)return null;
    const dir=new THREE.Vector3(end.x-m[s].x,end.y-m[s].y,(end.z||0)-(m[s].z||0));
    return dir.lengthSq()>.0001?dir.normalize():null;
  };
  return {left:arm(11,13,15),right:arm(12,14,16),lean:Math.max(-.25,Math.min(.25,Math.atan2(m[12].y-m[11].y,Math.abs(m[12].x-m[11].x))))};
}
function resetPose(){
  if(!W.rig)return;
  for(const p of [W.rig.armLP,W.rig.armRP])if(p){p.rotation.y=0;p.rotation.z=0;}
  state.armSmooth=null;
  if(W.rig.torsoP)W.rig.torsoP.rotation.z=0;
}
function afterPose(dt){
  if(!W.rig)return;
  if(!state.on||W.mode!=='walk'||W.dead||W.rig.air||W.film&&W.film.owns()){resetPose();return;}
  const pose=performance.now()-(state.poseAt||0)<450?poseAngles(state.poseWorld||state.poseMarks):null;
  if(!pose){resetPose();return;}
  const k=1-Math.exp(-Math.min(dt,.05)*12);
  state.armSmooth=state.armSmooth||{};
  for(const [key,joint,rest] of [['left',W.rig.armLP,[8.3114,17.5956,-10.321]],['right',W.rig.armRP,[-8.3114,17.5956,-10.321]]]){
    if(!joint)continue;
    let dir=pose[key];
    if(!dir){joint.rotation.y=joint.rotation.z=0;delete state.armSmooth[key];continue;}
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...rest).normalize(),dir);
    const smooth=state.armSmooth[key]||(state.armSmooth[key]=joint.quaternion.clone());
    smooth.slerp(q,k);joint.quaternion.copy(smooth);
  }
  W.rig.torsoP.rotation.z=pose.lean*.3;
}

function beforeStep(dt){
  if(!state.on)return;
  if(state.mode==='walk'&&performance.now()-(state.poseAt||0)>450)stopWalk();
  if(!state.walkTarget)return;
  if(W.mode!=='walk'||W.dead||W.film&&W.film.owns()){state.walkTarget=null;stopWalk();return;}
  const p=W.rig.pos,dx=state.walkTarget.x-p.x,dz=state.walkTarget.z-p.z,d=Math.hypot(dx,dz);
  state.walkStuck=p.distanceTo(state.walkLast)<.05?state.walkStuck+dt:0;state.walkLast.copy(p);
  if(d<.8*M||state.walkStuck>2||performance.now()-state.walkStarted>30000){
    sayLine(d<.8*M?'Arrived.':'Path blocked. Point at a reachable place.','');state.walkTarget=null;stopWalk();return;
  }
  const y=W.rig.cam.yaw;W.input.L.x=(-Math.sin(y)*dz+Math.cos(y)*dx)/d*.65;
  W.input.L.y=(-Math.sin(y)*dx-Math.cos(y)*dz)/d*.65;W.input.L.mag=.65;W.input.L.held=true;state.walking=true;
}
function addTestBrick(){
  if(!W.ready||!W.build)return;
  const B=W.build,part=B.kinds.has('3001')?'3001':B.part;
  let p=state.there&&state.there.point;
  if(!p){const f=V();Minifig.facing(W.rig,f);p=W.rig.pos.clone().addScaledVector(f,4*M);}
  const g=groundPoint(p),rows=B.addRows([[null,part,4,g.x,g.y,g.z,0]],false,true);
  if(rows.length){B.history.push(rows[0].id);sayLine('Brick placed. Pinch it, drag to ground, then release.','');}
  else sayLine('Could not place that brick.','');
}
const controls=document.createElement('div');controls.id='pttActions';
controls.innerHTML='<div><button id="pttSelect">Select aimed</button><button id="pttBrick">+ Brick</button><button id="pttMove">Move there</button><button id="pttCopy">Copy there</button><button id="pttUndo">Undo</button><button id="pttKey">API key</button></div><form id="pttForm"><input id="pttWords" aria-label="World instruction" placeholder="Make a house here" autocomplete="off"><button>Send</button></form><div id="pttGesture">OPEN · aim at an object</div><div><meter id="pttLevel" min="0" max="1" value="0" aria-label="Microphone level"></meter><button id="pttSendAudio" disabled>Send audio</button><button id="pttBrowserVoice">Browser voice</button></div><audio id="pttPlayback" controls hidden></audio><details id="pttDiagnostics"><summary>Diagnostics · v5</summary><button id="pttCopyLog">Copy log</button><pre id="pttLog"></pre></details>';
$('#ptt').appendChild(controls);
const css=document.createElement('style');css.textContent='#pttActions{pointer-events:auto}#pttActions>div{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}#pttActions button{padding:8px;border:1px solid #526071;border-radius:7px;background:#fff;color:#172230;font:12px system-ui;cursor:pointer}#pttForm{display:flex;gap:4px}#pttWords{min-width:0;flex:1;padding:10px;font:16px system-ui;border-radius:7px;border:1px solid #526071;user-select:text}#ptt{max-height:80vh;overflow:auto}body.ptt-on #hint,body.ptt-on #keys{display:none}#pttDiagnostics{pointer-events:auto;background:#fff;color:#172230;padding:6px;font:11px monospace}#pttLog{max-height:150px;overflow:auto;white-space:pre-wrap;user-select:text}#pttPlayback{width:100%;height:32px}#pttGesture{background:#172230;color:white;padding:6px;font:12px monospace}#pttLevel{width:65px}#pttCursor.object{box-shadow:0 0 0 4px #ffcd32,0 0 20px #ffcd32}';
document.head.appendChild(css);
$('#pttSelect').onclick=()=>capture(state.hover||state.recentHit&&state.recentHit.hit);
$('#pttSendAudio').onclick=transcribeRecording;
$('#pttBrowserVoice').onclick=()=>{if(state.recorder||state.transcribing)return;state.voiceOff=false;startSpeech();};
$('#pttCopyLog').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(events,null,2));sayLine('Diagnostic log copied. It excludes audio, transcripts and API keys.','');}catch(e){sayLine('Clipboard unavailable. Select the log text below.','');}};
$('#pttBrick').onclick=addTestBrick;
$('#pttMove').onclick=()=>execute({verb:'move',needsThat:true,needsThere:true});
$('#pttCopy').onclick=()=>execute({verb:'copy',needsThat:true,needsThere:true});
$('#pttUndo').onclick=()=>execute({verb:'undo'});
$('#pttKey').onclick=()=>{W.wbOpen&&W.wbOpen(true);$('#wbKeyBtn').click();};
$('#pttForm').onsubmit=e=>{e.preventDefault();const input=$('#pttWords');const t=input.value.trim();if(t){heard(t,true);input.value='';}};
for(const name of ['pointerdown','pointerup','pointermove','keydown'])controls.addEventListener(name,e=>e.stopPropagation());

function editNudge(dx,dy,dz){
 const h=state.that;if(!h||h.kind!=='piece'){sayLine('Select a brick first.','');return false;}
 const p=W.build.pieces.get(h.id);if(!p)return false;
 if(!state.edit)state.edit={hit:{...h,item:p},dst:V().set(p.x,p.y,p.z)};
 state.edit.dst.add(V().set(dx,dy,dz));const t=AlleyPlacement.resolve(W.build,p,state.edit.dst,p.id);
 state.edit.target=t;showSelection(W.build.boxOf({...p,...t}));state.helper.material.color.set(t.blocked?0xff5544:0x58ffbb);
 sayLine((t.blocked?'Blocked':'Preview')+' · X '+t.x+' · height '+t.y+' · Z '+t.z+' · Place or Cancel','');return true;
}
function editApply(){if(!state.edit||!state.edit.target||state.edit.target.blocked)return false;const e=state.edit,ok=movePiece(e.hit,e.target,false);if(ok){state.edit=null;resetBindings();sayLine('Brick moved. Undo restores its previous position.','');}return ok;}
function editCancel(){state.edit=null;state.grab=null;resetBindings();sayLine('Cancelled. No bricks changed.','');}
window.PutThatThere={movePiece,swapHands:()=>{state.swapHands=!state.swapHands;editCancel();sayLine('Grab hand switched.','');},copyTop:()=>{const h=state.that;if(!h||h.kind!=='piece')return sayLine('Select a brick first.','');const p=W.build.pieces.get(h.id);if(p&&movePiece({...h,item:p},{x:p.x,y:p.box.max.y,z:p.z},true))sayLine('Copy stacked above. Undo removes it.','');},editNudge,editApply,editCancel,handGesture,updateHand,recordStart,recordStop,transcribeRecording,diagnostics:()=>events.slice(),beforeStep,afterPose,poseAngles,addTestBrick,parse,heard,infer,tracePacket,execute,capture,pointIntoWorld,setMode,start,stop,state:()=>({on:state.on,mode:state.mode,that:label(state.that),there:!!state.there,pending:state.pending&&state.pending.verb,walking:state.walking,inferring:state.inferring,trace:state.trace.length})};
})();

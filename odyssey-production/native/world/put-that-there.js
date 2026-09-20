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

const sayLine = (text, kind) => {
  const el = $('#pttLine'); if (!el) return; el.textContent = text; el.dataset.kind = kind || '';
  if (kind === 'speak' && 'speechSynthesis' in window) {
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.06; speechSynthesis.speak(u); } catch (e) { }
  }
};
const label = hit => !hit ? '—' : hit.kind === 'assembly' ? (hit.name || 'assembly') : hit.kind === 'piece' ? (hit.name || 'brick') : hit.kind === 'prop' ? (hit.name || 'model') : hit.kind === 'building' ? (hit.name || 'building') : 'ground';
function paintBindings() {
  const a = $('#pttThat'), b = $('#pttThere');
  a.textContent = 'THAT: ' + label(state.that); a.classList.toggle('set', !!state.that);
  b.textContent = 'THERE: ' + (state.there ? 'ground' : '—'); b.classList.toggle('go', !!state.there);
}

function worldRay(nx, ny) {
  if (!W || !W.ready || !W.camera) return null;
  raycaster.setFromCamera({ x: nx * 2 - 1, y: 1 - ny * 2 }, W.camera);
  return raycaster.ray.clone();
}
function intersectBox(ray, box, max, out, hit) {
  const p = ray.intersectBox(box, V()); if (!p) return;
  const d = p.distanceTo(ray.origin); if (d <= max && (!out.best || d < out.best.distance)) out.best = { ...hit, point: p.clone(), distance: d, box };
}
function pointIntoWorld(nx, ny) {
  const ray = worldRay(nx, ny); if (!ray) return null;
  const max = 45 * M, out = { best: null };
  if (W.build) for (const p of W.build.pieces.values()) intersectBox(ray, p.box, max, out, { kind: 'piece', id: p.id, item: p, name: (W.build.kinds.get(p.part) || {}).name || 'brick' });
  if (W.props) for (const p of W.props.items.values()) if (p.box && !(p.src && p.src.landmark)) intersectBox(ray, p.box, max, out, { kind: 'prop', id: p.id, item: p, name: p.src && (p.src.kind || p.src.as || p.src.kit || p.src.op) || 'model' });
  if (W.city) for (const b of W.city.near(ray.origin.x, ray.origin.z, max)) {
    const box = b.aabb || b.box || null; if (box) intersectBox(ray, box, max, out, { kind: 'building', id: b.id, item: b, name: b.name || 'building' });
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
  const now = performance.now(); if (now - state.lastBind < 500) return; state.lastBind = now;
  if (hit.kind === 'ground' || (state.that && hit.kind !== 'piece' && hit.kind !== 'prop')) {
    state.there = { kind: 'ground', point: hit.point.clone() }; sayLine('THERE is bound. Say the operation.', '');
  } else {
    const raw = { ...hit, point: hit.point.clone() }, assembly = window.WorldAssemblies && WorldAssemblies.resolve(raw); state.that = assembly || raw; state.there = null; const verbs = window.WorldBehavior ? WorldBehavior.describeShort(state.that) : ''; sayLine('THAT is ' + label(state.that) + (verbs ? ' · ' + verbs : '') + '. Say an operation or point where.', '');
    showSelection(window.WorldAssemblies ? (WorldAssemblies.box(state.that) || hit.box) : hit.box);
  }
  paintBindings(); if (state.pending) execute(state.pending);
}

function showSelection(box) {
  if (state.helper && W.scene) W.scene.remove(state.helper); state.helper = null;
  if (box && W.scene) { state.helper = new THREE.Box3Helper(box.clone(), 0x58a7ff); state.helper.name = 'THAT'; state.helper.renderOrder = 9; W.scene.add(state.helper); }
}

function groundPoint(p) { return { x: Math.round(p.x / 20) * 20, y: W.G.h(p.x, p.z), z: Math.round(p.z / 20) * 20 }; }
function pinDestination() { if(!state.there||!W.build||!W.camera)return;const dir=state.there.point.clone().sub(W.camera.position).normalize();W.build.on=true;W.build.pin={origin:W.camera.position.clone(),dir};W.build.aimRay(W.build.pin.origin,dir); }
function movePiece(hit, dst, copy) {
  const B = W.build, old = hit.item; if (!B || !old || !B.pieces.has(old.id)) return false;
  const e = B.ext(old.part, old.rot), g = groundPoint(dst), x = g.x, z = g.z, y = g.y;
  if (copy) return !!B.addRows([[old.id, old.part, old.col, x, y, z, old.rot]], false, true).length;
  B.take(old.id, true); old.x = x; old.y = y; old.z = z; old.box = null; const p = B.add(old, false);
  if (p && B.onEdit) B.onEdit({ up: [B.toRow(p)] }); return !!p;
}
function moveProp(hit, dst, copy) {
  const P = W.props, it = hit.item; if (!P || !it || !P.items.has(it.id)) return false; const g = groundPoint(dst);
  if (copy) { P.place(it.mpd, g.x, g.y, g.z, it.yaw, false, it.src); return true; }
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
  if (/\b(undo|go back)\b/.test(text)) verb = 'undo';
  else if (/\b(stop|halt|freeze)\b/.test(text)) verb = 'stop';
  else if (/\bwhen\b.*\b(that|this|it)\b.*\b(activates?|opens?|closes?|breaks?|depletes?|is destroyed)\b/.test(text)) verb = 'arm';
  else if (/\bopen\b.*\bwhen\b.*\b(triggered|activated|ready)\b/.test(text)) verb = 'link-open';
  else if (/\bclose\b.*\bwhen\b.*\b(triggered|activated|ready)\b/.test(text)) verb = 'link-close';
  else if (/\bactivate\b.*\bwhen\b.*\b(triggered|activated|ready)\b/.test(text)) verb = 'link-activate';
  else if (/\b(remove|delete|destroy)\b.*\bwhen\b.*\b(triggered|activated|ready)\b/.test(text)) verb = 'link-remove';
  else if (/\b(make|teach|mark|turn)\b.*\b(openable|door|gate|hatch|target|damageable|breakable|rideable|vehicle|mount|activatable|switch|trigger|moveable|movable|rotatable|turnable)\b/.test(text)) verb = 'teach';
  else if (/\b(inspect|describe|read|what is|what can)\b/.test(text)) verb = 'inspect';
  else if (/\b(open)\b/.test(text)) verb = 'open';
  else if (/\b(close|shut)\b/.test(text)) verb = 'close';
  else if (/\b(activate|use|trigger|switch)\b/.test(text)) verb = 'activate';
  else if (/\b(hit|strike|cut|slash|attack|damage)\b/.test(text)) verb = 'hit';
  else if (/\b(mount|ride|board)\b/.test(text)) verb = 'mount';
  else if (/\b(walk|go|come)\b/.test(text)) verb = 'walk';
  else if (/\b(remove|delete|destroy|pick up)\b/.test(text)) verb = 'remove';
  else if (/\b(turn|rotate|spin)\b/.test(text)) verb = 'turn';
  else if (/\b(taller|higher|raise)\b/.test(text)) verb = 'taller';
  else if (/\b(copy|duplicate|another)\b/.test(text)) verb = 'copy';
  else if (/\b(put|move|place)\b/.test(text)) verb = 'move';
  else if (/\b(make|build|create|add)\b/.test(text)) verb = 'build';
  return { verb, text, needsThat: /^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount|arm|link-open|link-close|link-activate|link-remove)$/.test(verb), needsThere: /^(move|copy|walk)$/.test(verb), thisWord: /\b(this|that|these|those|it)\b/.test(text), thereWord: /\b(here|there)\b/.test(text) };
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
  if(!id)return state.that;
  if(W.build&&W.build.pieces.has(id)){const p=W.build.pieces.get(id);return{kind:'piece',id,item:p,name:(W.build.kinds.get(p.part)||{}).name||'brick',box:p.box};}
  if(W.props&&W.props.items.has(id)){const p=W.props.items.get(id);return{kind:'prop',id,item:p,name:p.src&&(p.src.kind||p.src.as||p.src.kit||p.src.op)||'model',box:p.box};}
  return null;
}
async function infer(words) {
  if(window.OdysseyPerformance && /^(walk forward|ride forward|reverse|turn left|turn right|stop)$/i.test(words.trim())){OdysseyPerformance.command(words);return;}
  const local=parse(words);if((window.WorldBehavior&&/^(teach|inspect|open|close|activate|hit|mount)$/.test(local.verb))||(window.WorldAssemblies&&/^(arm|link-open|link-close|link-activate|link-remove)$/.test(local.verb))){execute(local);return;}
  if(state.inferring)return; if(!window.Ai||!Ai.key()){execute(parse(words));return;}
  state.inferring=true;$('#pttMic').textContent='LLM: inferring';sayLine('Resolving words and gesture…','');
  try {
    const packet=tracePacket(words),a=await Ai.inferAct(packet);
    if(a.act==='clarify'||a.clarification||Number(a.confidence)<.58){sayLine(a.clarification||a.say||'Show me which one.','speak');return;}
    const allowed=new Set([...(packet.candidates||[]),...(packet.nearby||[])].map(x=>x.id).filter(Boolean));
    if(a.referent_id&&!allowed.has(a.referent_id)){sayLine('The model named something outside the visible world. Point again.','speak');return;}
    const ref=findReferent(a.referent_id);if(a.referent_id&&!ref){sayLine('That reference is no longer in the world. Point again.','speak');return;}
    if(ref){const assembly=window.WorldAssemblies&&WorldAssemblies.resolve(ref);state.that=assembly||ref;showSelection(window.WorldAssemblies?(WorldAssemblies.box(state.that)||ref.box):ref.box);}if(Array.isArray(a.destination)&&a.destination.length===3&&a.destination.every(Number.isFinite)){const p=new THREE.Vector3(...a.destination),origin=W.rig&&W.rig.pos;if(origin&&Math.hypot(p.x-origin.x,p.z-origin.z)>60*M){sayLine('That destination is outside the reachable scene. Point closer.','speak');return;}p.y=W.G.h(p.x,p.z);state.there={kind:'ground',point:p};}paintBindings();
    if(a.act==='build'&&a.program&&Array.isArray(a.program.ops)&&W.mbLoad){pinDestination();W.mbLoad(a.program);sayLine(a.say||'The build is ready to preview.','speak');resetBindings();return;}
    if(a.act==='build'&&a.words&&W.say){pinDestination();await W.say(a.words);sayLine(a.say||'The build is ready to preview.','speak');return;}
    if(a.act==='change'&&a.words&&W.say){await W.say(a.words);sayLine(a.say||'The change is ready to preview.','speak');return;}
    const cmd={verb:a.act,text:a.words||words,needsThat:/^(move|copy|remove|turn|taller|teach|inspect|open|close|activate|hit|mount|arm|link-open|link-close|link-activate|link-remove)$/.test(a.act),needsThere:/^(move|copy|walk)$/.test(a.act),thisWord:false,thereWord:false};
    const ok=execute(cmd);if(ok&&a.say)sayLine(a.say,'speak');
  } catch(e){console.warn('[put-that-there] inference',e);sayLine('The model could not resolve that. Using the local language game.','');execute(parse(words));}
  finally{state.inferring=false;$('#pttMic').textContent='VOICE: listening';}
}

function resetBindings() { state.that = state.there = state.pending = null; paintBindings(); if (state.helper && W.scene) W.scene.remove(state.helper); state.helper = null; }
function execute(cmd) {
  state.pending = null;
  if (cmd.verb === 'stop') { window.OdysseyPerformance?.command('stop');W.performanceTarget=null;stopWalk(); sayLine('Stopped.', ''); return true; }
  if (cmd.verb === 'undo') { if (W.build) W.build.undo(); sayLine('Undone.', ''); return true; }
  if (cmd.thisWord && !state.that && state.hover && state.hover.kind !== 'ground') state.that = { ...state.hover, point: state.hover.point.clone() };
  if (cmd.thereWord && !state.there && state.hover && state.hover.kind === 'ground') state.there = { kind: 'ground', point: state.hover.point.clone() };
  if (cmd.needsThat && !state.that) { state.pending = cmd; sayLine('Which thing? Point at it and pinch.', 'speak'); paintBindings(); return false; }
  if (cmd.needsThere && !state.there) { state.pending = cmd; sayLine('Where? Point at the ground and pinch.', 'speak'); paintBindings(); return false; }
  if (window.WorldAssemblies && /^(arm|link-open|link-close|link-activate|link-remove)$/.test(cmd.verb)) {
    const result = WorldAssemblies.perform(cmd.verb, state.that, { text: cmd.text, world: W, kind: 'voice' });
    sayLine(result.message || (result.ok ? 'Complete.' : 'That link is not available.'), result.ok ? '' : 'speak'); if (result.ok) resetBindings(); return !!result.ok;
  }
  if (window.WorldAssemblies && WorldAssemblies.isAssembly(state.that) && /^(move|copy|remove|turn)$/.test(cmd.verb)) {
    const result = WorldAssemblies.manipulate(cmd.verb, state.that, { destination: state.there && state.there.point, text: cmd.text, world: W });
    const finish = r => { sayLine((r && r.message) || (r && r.ok ? cmd.verb.toUpperCase() + ' complete.' : 'That assembly operation failed.'), r && r.ok ? '' : 'speak'); if (r && r.ok) resetBindings(); };
    if (result && typeof result.then === 'function') { result.then(finish).catch(e => sayLine(e.message || 'That assembly operation failed.', 'speak')); return true; } finish(result); return !!(result && result.ok);
  }
  if (window.WorldBehavior && /^(teach|inspect|open|close|activate|hit|mount)$/.test(cmd.verb)) {
    const result = WorldBehavior.perform(cmd.verb, state.that, { text: cmd.text, world: W, kind: 'voice' });
    sayLine(result.message || (result.ok ? 'Complete.' : 'That operation is not available.'), result.ok ? '' : 'speak');
    if (result.ok && cmd.verb !== 'inspect') resetBindings();
    return !!result.ok;
  }
  let ok = false;
  if (cmd.verb === 'move' || cmd.verb === 'copy') {
    if (state.that.kind === 'piece') ok = movePiece(state.that, state.there.point, cmd.verb === 'copy');
    else if (state.that.kind === 'prop') ok = moveProp(state.that, state.there.point, cmd.verb === 'copy');
  } else if (cmd.verb === 'remove') ok = remove(state.that);
  else if (cmd.verb === 'turn') ok = turn(state.that);
  else if (cmd.verb === 'taller' && state.that.kind === 'piece') {
    const p=state.that.item,B=W.build,h=B.ext(p.part,p.rot)[4]; ok=!!B.addRows([[p.id,p.part,p.col,p.x,p.y+h,p.z,p.rot]],false,true).length;
  }
  else if (cmd.verb === 'walk') { const p = state.there.point; if(W.mode!=='walk'){sayLine('Dismount first.','');return false;}W.performanceTarget={x:p.x,z:p.z,until:W.t+20}; if (W.map && W.map.setWaypoint) W.map.setWaypoint(p.x / M, p.z / M); else if (W.teleport) W.teleport(p.x, p.z); ok = true; }
  else if (cmd.verb === 'build') {
    pinDestination();
    if (W.say) { W.say(cmd.text.replace(/\b(here|there)\b/g, '').trim()); ok = true; }
  }
  if (ok) { sayLine(cmd.verb.toUpperCase() + ' complete.', ''); resetBindings(); }
  else if (state.that && state.that.kind === 'building') sayLine('That building belongs to the place. Point at your LEGO bricks or a built model.', 'speak');
  else sayLine('I could not perform that move.', 'speak');
  return ok;
}
function heard(text) {
  text = String(text || '').trim(); if (!text) return; $('#pttMic').textContent = 'VOICE: “' + text.slice(0, 34) + '”'; $('#pttMic').classList.add('set'); sayLine('“' + text + '”', '');
  const awake=/^\s*(world|lego|builder)\b/i.test(text)||/^\s*put that\b/i.test(text);
  if(!awake){sayLine('Say “World” before the request, or begin “Put that…”.','');return;}
  infer(text.replace(/^\s*(world|lego|builder)[,:]?\s*/i,''));
}

function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('#pttMic').textContent = 'VOICE: type below'; sayLine('Voice recognition is unavailable here. Type the same command in the word bar.', ''); return; }
  const r = new SR(); state.recognition = r; r.continuous = true; r.interimResults = true; r.lang = document.documentElement.lang || 'en-US';
  r.onstart = () => { $('#pttMic').textContent = 'VOICE: listening'; $('#pttMic').classList.add('set'); $('#pttStart').classList.add('listening'); };
  r.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) heard(t); else interim += t; } if (interim) sayLine(interim + '…', ''); };
  r.onerror = e => { if (e.error !== 'aborted' && e.error !== 'no-speech') sayLine('Voice: ' + e.error + '. You can still point and type.', ''); };
  r.onend = () => { $('#pttStart').classList.remove('listening'); if (state.on) { clearTimeout(state.speechRestart); state.speechRestart = setTimeout(() => { try { r.start(); } catch (e) { } }, 450); } };
  try { r.start(); } catch (e) { }
}

function recordStart(e) {
  if(e)e.preventDefault();if(!state.on||state.recorder||!window.MediaRecorder)return;
  const tracks=state.stream&&state.stream.getAudioTracks();if(!tracks||!tracks.length){sayLine('No microphone track. Restart and allow microphone access.','');return;}
  try{state.chunks=[];state.recorder=new MediaRecorder(new MediaStream(tracks),{mimeType:MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':undefined});state.recorder.ondataavailable=x=>{if(x.data&&x.data.size)state.chunks.push(x.data);};state.recorder.onstop=transcribeRecording;state.recorder.start(200);$('#pttAsk').classList.add('on');$('#pttAsk').textContent='Release';sayLine('Listening for the whole speech act…','');}catch(x){state.recorder=null;sayLine('Could not start the microphone recording.','');}
}
function recordStop(e){if(e)e.preventDefault();if(state.recorder&&state.recorder.state==='recording')state.recorder.stop();}
async function transcribeRecording(){const r=state.recorder;state.recorder=null;$('#pttAsk').classList.remove('on');$('#pttAsk').textContent='Hold ask';const blob=new Blob(state.chunks,{type:r&&r.mimeType||'audio/webm'});state.chunks=[];if(blob.size<500)return;if(!Ai||!Ai.key()){sayLine('Add an OpenAI key to use voice transcription.','');return;}sayLine('Transcribing the speech act…','');try{const f=new FormData();f.append('file',blob,'speech.webm');f.append('model','gpt-4o-transcribe');const res=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+Ai.key()},body:f});if(!res.ok){let m=res.status;try{const j=await res.json();m=j.error&&j.error.message||m;}catch(x){}throw new Error(m);}const j=await res.json();heard(j.text||'');}catch(e){console.warn('[put-that-there] transcription',e);sayLine('OpenAI transcription failed. Browser voice remains available.','');}}

function drawHand(hand, pose) {
  const c = $('#pttDraw'), r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height); g.lineCap = 'round';
  const plot = (marks, links, colour) => { if (!marks) return; g.strokeStyle = colour; g.fillStyle = '#fff'; g.lineWidth = 2; for (const [a,b] of links) { g.beginPath(); g.moveTo((1-marks[a].x)*r.width, marks[a].y*r.height); g.lineTo((1-marks[b].x)*r.width, marks[b].y*r.height); g.stroke(); } for (const p of marks) { g.beginPath(); g.arc((1-p.x)*r.width,p.y*r.height,2.2,0,Math.PI*2);g.fill(); } };
  const H = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  const P = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[24,26]];
  plot(pose, P, '#55e57b'); plot(hand, H, '#58a7ff');
}
function poseWalk(marks) {
  if (!marks || state.mode !== 'walk' || !W || !W.ready || W.mode !== 'walk') { stopWalk(); return; }
  const ls=marks[11],rs=marks[12],lw=marks[15],rw=marks[16],lh=marks[23],rh=marks[24]; if (![ls,rs,lw,rw,lh,rh].every(Boolean)) { stopWalk(); return; }
  const up = lw.y < ls.y && rw.y < rs.y, back = lw.y > lh.y && rw.y > rh.y;
  const steer = Math.max(-1,Math.min(1,((1-(ls.x+rs.x)/2)-.5)*4)); const speed = up ? .72 : back ? -.38 : 0;
  W.input.L.x = steer*.72; W.input.L.y = speed; W.input.L.mag = Math.min(1,Math.hypot(W.input.L.x,speed)); W.input.L.held = W.input.L.mag > .03; state.walking = W.input.L.held;
  if (state.walking) sayLine((speed < 0 ? 'BACK' : 'WALK') + (steer < -.12 ? ' · LEFT' : steer > .12 ? ' · RIGHT' : ' · FORWARD'), ''); else sayLine('Raise both hands to walk. Lean left or right to steer.', '');
}
function stopWalk() { if (!state.walking || !W || !W.input) return; W.input.L.x=W.input.L.y=W.input.L.mag=0; W.input.L.held=false; state.walking=false; }

async function visionLoop() {
  if (!state.on) return; const v = $('#pttVideo');
  if (v.readyState >= 2 && v.currentTime !== state.lastVideoTime) {
    state.lastVideoTime = v.currentTime; const now = performance.now(); state.frame++;
    try {
      const hr = state.hand.detectForVideo(v, now), hand = hr.landmarks && hr.landmarks[0] || null; state.landmarks = hand;
      let pose = state.poseMarks; if (state.frame % 3 === 0) { const pr = state.pose.detectForVideo(v, now); pose = state.poseMarks = pr.landmarks && pr.landmarks[0] || null; }
      drawHand(hand, pose);
      if (state.mode === 'walk') poseWalk(pose);
      else {
        stopWalk(); if (hand) {
          const tip=hand[8], thumb=hand[4], palm=hand[0], span=Math.hypot(hand[5].x-hand[17].x,hand[5].y-hand[17].y)||.1;
          const nx=1-tip.x, ny=tip.y, pinch=Math.hypot(tip.x-thumb.x,tip.y-thumb.y) < span*.42;
          state.hover=pointIntoWorld(nx,ny); const cur=$('#pttCursor'); cur.style.left=(nx*innerWidth)+'px';cur.style.top=(ny*innerHeight)+'px';cur.className='on '+(state.hover ? state.hover.kind==='ground'?'ground':'object':'');
          if(!state.trace.length||now-state.trace[state.trace.length-1].t>90){const h=state.hover;state.trace.push({t:now,pointer:[+nx.toFixed(3),+ny.toFixed(3)],pinch,hit:h?{kind:h.kind,id:h.id||null,name:label(h),point:h.point.toArray().map(v=>Math.round(v))}:null});while(state.trace.length&&now-state.trace[0].t>6500)state.trace.shift();}
          if (pinch && !state.pinched) capture(state.hover); state.pinched=pinch;
          if (!pinch && palm && Math.hypot(tip.x-thumb.x,tip.y-thumb.y)>span*.65) state.pinched=false;
        } else { state.hover=null; $('#pttCursor').className=''; state.pinched=false; }
      }
    } catch (e) { console.warn('[put-that-there] vision frame',e); }
  }
  requestAnimationFrame(visionLoop);
}

async function start() {
  if (state.on) { stop(); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { sayLine('This browser cannot open a camera. Use HTTPS on a current phone or computer.', ''); return; }
  const b=$('#pttStart'); b.disabled=true; b.textContent='Opening…';
  try {
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm');
    const files=await mod.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    const make=async(K,options)=>{try{return await K.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'GPU'}});}catch(e){console.info('[put-that-there] GPU delegate unavailable; using CPU');return K.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}};
    state.hand=await make(mod.HandLandmarker,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.45,minTrackingConfidence:.45});
    state.pose=await make(mod.PoseLandmarker,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.4,minTrackingConfidence:.4});
    const v=$('#pttVideo');v.srcObject=state.stream;await v.play();state.on=true;document.body.classList.add('ptt-on');$('#ptt').classList.add('on');b.classList.add('on');b.setAttribute('aria-pressed','true');b.textContent='Stop pointing';sayLine('Point. Pinch to bind THAT, then pinch the ground to bind THERE.','');startSpeech();visionLoop();
  } catch(e) { console.error('[put-that-there] start',e); if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;sayLine(/denied|permission/i.test(String(e))?'Camera permission was denied. Enable it in the browser, then try again.':'Could not start hand tracking. The typed builder still works.',''); }
  finally { b.disabled=false; if(!state.on)b.textContent='Point + speak'; }
}
function stop() {
  state.on=false;stopWalk();clearTimeout(state.speechRestart);if(state.recorder)try{state.recorder.onstop=null;state.recorder.stop();}catch(e){}state.recorder=null;if(state.recognition)try{state.recognition.abort();}catch(e){}state.recognition=null;if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;
  if(state.hand)state.hand.close();if(state.pose)state.pose.close();state.hand=state.pose=null;resetBindings();document.body.classList.remove('ptt-on');$('#ptt').classList.remove('on');$('#pttCursor').className='';const b=$('#pttStart');b.classList.remove('on','listening');b.setAttribute('aria-pressed','false');b.textContent='Point + speak';
}
function setMode(mode){state.mode=mode==='walk'?'walk':'point';document.querySelectorAll('[data-ptt-mode]').forEach(b=>b.classList.toggle('on',b.dataset.pttMode===state.mode));if(state.mode==='walk'){resetBindings();sayLine('Raise both hands to walk. Lean left or right to steer.','');$('#pttCursor').className='';}else{stopWalk();sayLine('Point and pinch to bind THAT and THERE.','');}}

$('#pttStart').addEventListener('click',start);document.querySelectorAll('[data-ptt-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.pttMode)));window.addEventListener('pagehide',stop);
$('#pttAsk').addEventListener('pointerdown',recordStart);$('#pttAsk').addEventListener('pointerup',recordStop);$('#pttAsk').addEventListener('pointercancel',recordStop);$('#pttAsk').addEventListener('contextmenu',e=>e.preventDefault());
// In browsers without speech recognition, the same small language works through the existing text field.
$('#wbBuild').addEventListener('click',e=>{if(!state.on)return;const t=$('#words').value,cmd=parse(t);if(cmd.verb==='unknown')return;e.preventDefault();e.stopImmediatePropagation();$('#words').value='';heard(t);},true);
$('#words').addEventListener('keydown',e=>{if(!state.on||e.key!=='Enter'||e.shiftKey)return;const cmd=parse(e.target.value);if(cmd.verb==='unknown')return;e.preventDefault();e.stopImmediatePropagation();const t=e.target.value;e.target.value='';heard(t);},true);
window.PutThatThere={pauseSpeech(){clearTimeout(state.speechRestart);if(state.recognition){state.recognition.onend=null;try{state.recognition.abort();}catch{}state.recognition=null;}},parse,heard,infer,tracePacket,execute,capture,pointIntoWorld,setMode,start,stop,state:()=>({on:state.on,mode:state.mode,that:label(state.that),there:!!state.there,pending:state.pending&&state.pending.verb,walking:state.walking,inferring:state.inferring,trace:state.trace.length})};
})();

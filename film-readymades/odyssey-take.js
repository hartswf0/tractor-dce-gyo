/* Take mode: a Film Butter Odyssey location played as a scene of film, on the halfworld's recorded performance.
   Runs in the Butter workspace closure beside odyssey-runtime.js (scene, camera, renderer, controls, filmAsset and the kf*
   keyframe functions are in scope); window.Face (world/face.js), window.HalfFace (world/halfworld-face.js) and window.Perform
   (world/cinerium.js) are injected ahead of it as their own scripts.

   The clock is the voice: the scene recording (filmAsset().take.voice, drive/voice-manifest.json's segments), either whole
   ('full') or as the Regulars' Cut keeps it ('cut': kept segments laid on the cut clock). Everything else is a pure function
   of the clock t, so a frame rendered offline at t is the frame the player shows at t:
     blocking  each keyframe key (odyssey/keyframes/<id>.json) is staged once exactly as the gate stages it and snapshotted;
               the key belongs to the turn it stills, so a key holds while its turn's segments sound and the cast eases
               (walks, rises, sits) from one key's marks to the next across the seam
     camera    the keyframe cameras are the shot list; the syncwatch grammar (RHYTHM by book, GRAMMAR SPK/REACT/OBJ/WIDE by
               hash32(sceneId:gi), shotFor WIDE/MID/CLOSE) cuts inside each segment onto its speaker (the turn's true
               subject) and addressee; every generated framing is scored with the gate's own measures before it is used; where
               the cineosis sign score gives the scene a direction (odyssey/cineosis/WIRING.md), that cuts it instead: rhythm,
               floor, kinds, move, insert, and the sound-forward cut off the seams
     faces     the twelve halfworld faces as decals on plain heads (Face.attach 'halfworld:<who>'), lips on the viseme track
               gated by the voice's envelope, the listener's carriage on the addressee, the key beat played on its
               _direction.mjs emotion (Perform.phrase), idle life and blinks (Perform)
     captions  the syncwatch set: the name in heavy tracked capitals, the recorded line in roman, narration in grey italic
     sound     the voice, and under it the book's BRONZE COUNCIL track at 0.18, ducked to 0.10 under every voice segment
               with 150 ms raised-cosine edges (not ducked where the sign score says sound forward); the page reports it as a
               sound log for the exporter to render */
(function(){
const root=new URL('../../',location.href).href,V3=THREE.Vector3;
const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},cl01=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,u)=>a+(b-a)*u;
const angLerp=(a,b,u)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*u;};
/* ── the syncwatch cutting grammar (odyssey-halfworld/odyssey-syncwatch.html, pane C), verbatim in its constants ── */
const RHYTHM={fast:[1.6,2.4,1.2,2.0,3.0,1.4],mid:[3.2,4.4,2.4,5.0,3.6,2.8],slow:[6.0,8.5,5.0,9.5,7.0]};
const FAST=new Set([9,10,12,16,17,20,21,22]),SLOW=new Set([5,6,11,13,19,23]);
const GRAMMAR=['SPK','REACT','SPK','OBJ','WIDE','SPK','REACT','SPK','WIDE','OBJ'];
function hash32(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
/* the inserts the syncwatch authored (a thing, sized by how much of the frame it fills); 'on' names a halfworld instance,
   resolved here to an actor, a prop or a set piece of the location by its name */
const INSERTS={'OD-B09-S07':[{at:.52,on:'polyphemus',fill:1.00,with:'odysseus',hold:3.2}],'OD-B09-S08':[{at:.58,on:'stake',fill:.80,hold:2.6}],'OD-B05-S04':[{at:.50,on:'raft',fill:.30,hold:3.0}],
  'OD-B10-S08':[{at:.45,on:'wind',fill:.95,hold:2.8}],'OD-B11-S02':[{at:.55,on:'oar',fill:.72,hold:2.6}],'OD-B11-S03':[{at:.50,on:'path',fill:.90,hold:2.8}],'OD-B19-S04':[{at:.62,on:'scar',fill:.62,hold:3.0}],
  'OD-B23-S01':[{at:.40,on:'scar',fill:.58,hold:2.6}],'OD-B21-S07':[{at:.48,on:'bow',fill:.85,hold:2.6}],'OD-B12-S03':[{at:.50,on:'mast',fill:.88,with:'odysseus',hold:2.6}]};
/* engine/speech.mjs listenCarriage: the addressee moves on the speaker's voice, a third of a second late, mouth shut */
function listenCarriage(env,hz,t,seed){const E=Face.envelopeAt,now=cl01(E(env,hz,t)),heard=cl01(E(env,hz,t-0.33)),before=cl01(E(env,hz,t-0.9)),rising=cl01((heard-before)*1.6);
  return {pitch:sm(heard)*0.030+rising*0.022,yaw:Math.sin(t*0.62+seed*1.9)*0.022,roll:Math.sin(t*0.47+seed*1.1)*0.014,brow:cl01((heard-0.55)*1.8)*0.42,press:0.22+0.12*Math.sin(t*0.8+seed),blinkGate:1-sm(cl01(now*1.4))};}

const JOINTS=['armRP','armLP','headP','torsoP','legRP','legLP'];
let T=null;   /* the prepared take */
const actorOf=id=>kfActor(id),rigOf=id=>kfActor(id)?.rig;
function stage(spec,k){OdysseyFilm.hide(k.hide||[]);OdysseyFilm.props([...(spec.props||[]),...(k.props||[])]);OdysseyFilm.block(spec.blocking);if(spec.spread)OdysseyFilm.spread(spec.spread);OdysseyFilm.block(k.blocking||[]);
  OdysseyFilm.propsAfter([...(spec.props||[]),...(k.props||[])]);OdysseyFilm.light(Object.assign({},spec.look||{},k.look));OdysseyFilm.look(Object.assign({},spec.look||{},k.look));OdysseyFilm.rope(k.rope||null);}
function snap(){const out={};for(const a of ButterCast.cast){const r=a.rig,f=r.figure;out[kfShort(a.kind)]={vis:f.visible!==false&&!r.absent,p:[r.pos.x,r.pos.y,r.pos.z],h:r.heading,rot:[f.rotation.x,f.rotation.z],j:Object.fromEntries(JOINTS.map(k=>[k,[r[k].rotation.x,r[k].rotation.y,r[k].rotation.z]])),sat:!!r.sat,air:!!r.air,placed:!!r.placed};}return out;}
function figHeight(id){const r=rigOf(id);if(!r)return 60;r.figure.updateMatrixWorld(true);return Math.max(20,(kfHead(id).y-r.pos.y)*1.2);}   /* the body to the crown, not the spear held over it */

/* ── the clock: clips on the take's clock ── */
function clipsOf(tk,mode){const byGi=new Map(tk.voice.segments.map(s=>[s.gi,s]));
  if(mode==='cut')return {clips:tk.cut.segments.map(c=>({...byGi.get(c.gi),start:c.start,dur:c.dur,at:c.at})),total:tk.cut.seconds,audio:tk.cut.segments.map(c=>({at:c.at,start:c.start,dur:c.dur}))};
  return {clips:tk.voice.segments.map(s=>({...s,at:s.start})),total:tk.voice.total,audio:[{at:0,start:0,dur:tk.voice.total}]};}
/* which clip is SOUNDING at t; in a gap, the one that just ended (syncwatch segAt) */
function clipAt(t){let cur=null;for(const c of T.clips){if(t>=c.at&&t<c.at+c.dur)return c;if(c.at<=t)cur=c;}return cur||T.clips[0];}
/* the bed's gain at t: open, ducked under every voice span with raised-cosine edges (harness/build-film-audio.mjs) */
function bedGain(t){const b=T.tk.bed,r=b.ramp;if(T.dir&&T.dir.d.sound_forward)return b.open;   /* the sign score's sound_forward: the sound carries the scene, the bed is not ducked */
  let w=0;for(const c of T.voiceSpans){const a=c.at,e=c.at+c.dur;let x=0;if(t>=a&&t<=e)x=1;else if(t>a-r&&t<a)x=0.5-0.5*Math.cos(Math.PI*(t-(a-r))/r);else if(t>e&&t<e+r)x=0.5+0.5*Math.cos(Math.PI*(t-e)/r);w=Math.max(w,x);}return b.open-(b.open-b.duck)*w;}

/* ── the shot plan: a pure function of t ── */
/* THE SIGN SCORE (odyssey/cineosis/score.json, WIRING.md): where the take carries a direction (tk.direction, attached by
   odyssey_take.py; else read from the score in prepare), it cuts the scene: cut_rhythm is the tempo, hold_min_s the floor of every
   shot (a shorter one merges into its neighbour, so the cut skips that seam), shot_bias draws each kind (WIDE→WIDE, MID→SPK,
   CLOSE→REACT or a close SPK, OBJ→OBJ), sound_forward lays one grid on the scene clock whose cuts avoid the lines' starts, and in
   a tempo conflict the book's rhythm cuts the entry and the exit shot (the sign governs inside). Mk/Dm cut a matched series
   (Dm broken by its last shot). Without a direction the syncwatch grammar below runs as it always did. */
const EDGE={fast:3.0,mid:4.4,slow:7.0};
function bookTempo(){const b=T.tk.book;return FAST.has(b)?'fast':SLOW.has(b)?'slow':'mid';}
function tempoOf(){return (T.dir&&RHYTHM[T.dir.d.cut_rhythm]&&T.dir.d.cut_rhythm)||bookTempo();}
function rand32(seed){return ()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function cutList(){if(T.cutList)return T.cutList;const D=T.dir.d,R=RHYTHM[tempoOf()],floor=Math.max(1,D.hold_min_s||0),fwd=!!D.sound_forward;
  const cl=T.clips.filter(c=>c.kind!=='SCENE_HEADER'),a0=cl.length?cl[0].at:0,starts=cl.slice(1).map(c=>c.at);
  const blocks=fwd?[[a0,T.total,'fwd']]:cl.map((c,i)=>[c.at,i<cl.length-1?cl[i+1].at:T.total,c.gi]);let L=[];
  for(const [a,b,k] of blocks){const r=rand32(hash32(T.sid+':'+k));let x=a;while(x<b-0.01){let d=Math.max(floor,R[Math.floor(r()*R.length)]);if(b-(x+d)<floor)d=b-x;L.push({t0:x,t1:x+d});x+=d;}}
  if(fwd){for(const s of L.slice(1)){const m=starts.find(m=>Math.abs(s.t0-m)<0.9);if(m!=null)s.t0=m+1.2;}for(let i=1;i<L.length;i++)L[i-1].t1=L[i].t0;}
  for(let i=0;i<L.length&&L.length>1;i++){const s=L[i];if(s.t1-s.t0>=floor-1e-6)continue;if(i===0)L[1].t0=s.t0;else L[i-1].t1=s.t1;L.splice(i,1);i--;}
  if(D.tempo_conflict&&EDGE[D.book_tempo]&&L.length){const e=EDGE[D.book_tempo],f=L[0];
    if(f.t1-f.t0>e+0.5){if(f.t1-f.t0>=e+floor||!L[1])L.splice(1,0,{t0:f.t0+e,t1:f.t1});else L[1].t0=f.t0+e;f.t1=f.t0+e;}f.edge='in';
    const z=L[L.length-1];if(L.length>1&&z.t1-z.t0>e+0.5){const c=z.t1-e;if(c-z.t0>=floor){L.push({t0:c,t1:z.t1});z.t1=c;}else{L[L.length-2].t1=c;z.t0=c;}}L[L.length-1].edge='out';}
  const B=D.shot_bias||{WIDE:.3,MID:.4,CLOSE:.3},W=['WIDE','MID','CLOSE','OBJ'].map(k=>[k,B[k]||0]),sum=W.reduce((a,[,w])=>a+w,0)||1;
  const draw=r=>{let u=r()*sum;for(const [k,w] of W)if((u-=w)<0)return k;return 'MID';},MAP={WIDE:'WIDE',MID:'SPK',CLOSE:'REACT',OBJ:'OBJ'};
  L.forEach((s,i)=>{s.i=i;s.dur=s.t1-s.t0;const c=clipAt(s.t0+0.01);s.gi=c?c.gi:-1;const r=rand32(hash32(T.sid+':'+s.gi+':'+i));let k=draw(r);if(i&&k===L[i-1].sign)k=draw(r);s.sign=k;s.kind=MAP[k];s.close=k==='CLOSE';});
  if(L.length){L[0].sign='WIDE';L[0].kind='WIDE';L[0].close=false;}
  /* a series (Mk, Dm): one set-up and one length every time; a demark's break in the same set-up, held two lengths */
  const P=T.dir.p;if((P==='Mk'||P==='Dm')&&L.length>2){const sk=(B.MID||0)>=(B.WIDE||0)?'SPK':'WIDE',L0=Math.max(floor,R.reduce((a,b)=>a+b,0)/R.length),tail=L[L.length-1].edge==='out'?L.pop():null;
    const a=L[1].t0,b=L[L.length-1].t1,brk=P==='Dm'?Math.min(2*L0,(b-a)/2):0,m=Math.max(1,Math.round((b-a-brk)/L0)),w=(b-a-brk)/m;L.length=1;
    for(let j=0;j<m;j++)L.push({t0:a+j*w,t1:a+(j+1)*w,kind:sk,series:true});if(brk)L.push({t0:b-brk,t1:b,kind:sk,series:true,brk:true});if(tail)L.push(tail);
    L.forEach((s,i)=>{s.i=i;s.dur=s.t1-s.t0;const c=clipAt(s.t0+0.01);s.gi=c?c.gi:-1;});}
  return T.cutList=L;}
/* the scene's direction: the take's own (odyssey_take.py attaches it), else the score's; {d: direction, p: primary sign, s: secondaries} */
async function directionOf(tk){if(tk.direction)return {d:tk.direction,p:(tk.signs||[])[0]||null,s:(tk.signs||[]).slice(1)};
  try{const sc=(await (await fetch(root+'odyssey/cineosis/score.json')).json()).scenes.find(s=>s.id===tk.scene);if(sc&&sc.direction)return {d:sc.direction,p:sc.primary&&sc.primary.symbol,s:(sc.secondary||[]).map(x=>x.symbol)};}catch(e){console.warn('[take] no sign score',e);}return null;}
function cutAt(c,t){if(T.dir){const L=cutList();const q=L.find(s=>t>=s.t0&&t<s.t1)||L[L.length-1];return q;}
  const R=RHYTHM[tempoOf()],seed=hash32(T.sid+':'+c.gi),t0=c.at,end=t0+Math.max(.8,c.dur);let x=t0,i=0;
  while(x<end&&i<64){const d=R[(seed+i*7)%R.length];if(t>=x&&t<x+d)return {i,t0:x,dur:d,kind:GRAMMAR[(seed+i*3)%GRAMMAR.length]};x+=d;i++;}
  return {i:Math.max(0,i-1),t0:x,dur:2,kind:'SPK',hold:true};}
function sizeOf(c,t){if(t<2||!c||c.kind==='SCENE_HEADER'||!c.speaker)return 'WIDE';if(T.tk.keyGi>=0&&c.gi===T.tk.keyGi)return 'CLOSE';return 'MID';}
/* the authored inserts; where a scene has none, the sign score's insert_object: one insert, seeded between 40% and 60% of the scene, held the floor */
function insertAt(t){const D=T.dir&&T.dir.d,L=INSERTS[T.sid]||(D&&D.insert_object?(T.insDir||(T.insDir=[{at:0.4+0.2*(hash32(T.sid+':insert')%1000)/1000,on:String(D.insert_object).toLowerCase().split(/[^a-z]+/).filter(w=>w.length>2).pop()||'thing',what:D.insert_object,fill:0.8,hold:Math.max(2.6,D.hold_min_s||0)}])):null);if(!L)return null;for(const x of L){const t0=x.at*T.total;if(t>=t0&&t<t0+(x.hold||2.5))return x;}return null;}
function shotAt(t){let c=clipAt(t);if(!c)return {id:'wide',kind:'WIDE',t0:0,dur:T.total,c:null};
  if(c.kind==='SCENE_HEADER'){const nx=T.clips[T.clips.indexOf(c)+1];return {id:'header:'+c.gi,kind:'HEADER',t0:c.at,dur:(nx?nx.at:c.at+c.dur)-c.at,c};}
  const ins=insertAt(t);if(ins)return {id:'insert:'+ins.on,kind:'INSERT',ins,t0:ins.at*T.total,dur:ins.hold,c};
  /* the syncwatch's resolution of a cut: no addressee, the speaker; no speaker, the wide; the key beat holds the speaker (its
     inserts aside); a reaction is a close-up of the one addressed */
  const q=cutAt(c,t);if(T.dir){const c0=clipAt(q.t0+0.01);if(c0&&c0.kind!=='SCENE_HEADER')c=c0;
    /* narration names no one: the score's subject is whom its close and insert shots are on */
    if(T.subj===undefined){const w=T.dir.d.subject;T.subj=(w&&Object.keys(T.tk.cast||{}).find(id=>T.tk.cast[id]===w&&kfActor(id)))||null;}
    if(!c.speaker&&T.subj&&q.kind!=='WIDE')c={...c,speaker:T.subj,addressee:null};}   /* a directed shot keeps the clip it began on: under sound_forward or a merge it runs over the seam */
  const isKey=T.tk.keyGi>=0&&c.gi===T.tk.keyGi;let kind=q.kind;
  if(kind==='REACT'&&!c.addressee)kind='SPK';if(kind==='SPK'&&!c.speaker)kind='WIDE';if(isKey&&kind!=='OBJ')kind='SPK';if(kind==='OBJ'&&!c.speaker)kind='WIDE';
  let size=kind==='REACT'?'CLOSE':kind==='WIDE'?'WIDE':kind==='OBJ'?'INSERT':sizeOf(c,t);if(T.dir&&q.close&&kind==='SPK')size='CLOSE';if(T.dir&&q.series&&kind==='SPK')size='MID';if(kind==='SPK'&&size==='WIDE')kind='WIDE';
  return {id:(T.dir?'d':c.gi)+':'+q.i+':'+kind+':'+size,kind,size,t0:q.t0,dur:q.dur,c,cut:q};}

/* ── cameras: the key's own (gate-approved) framing, and framings on the speaker, the addressee and the thing held, each
   scored with the gate's measures (odyssey-runtime.js kfScore, kfLens, kfClutter) at the key's staging before it is used ── */
function keyCam(k){return Object.assign({},k.camera);}
function resolved(spec){OdysseyFilm.rig(spec);const d=camera.getWorldDirection(new V3()),p=camera.position.clone();const tg=typeof spec.target==='string'?kfHead(spec.target):Array.isArray(spec.target)?new V3(...spec.target):spec.a&&kfActor(spec.a)?kfHead(spec.a):p.clone().add(d.clone().multiplyScalar(100));   /* a hero or orbit key names its subject, not a target */return {pos:p.toArray(),target:p.clone().add(d.multiplyScalar(p.distanceTo(tg))).toArray(),fov:camera.fov};}
function judge(spec,subject,k,{face=false,soft=false,whole=true}={}){OdysseyFilm.rig(spec);const allow=[...(k.lensAllow||[])];if(!kfActor(subject))return {ok:true};
  const s=OdysseyFilm.score([{id:subject}])[subject];if(!s||s.missing||s.behind)return {ok:false,why:'behind'};const why=[];
  if(s.visible<(soft?0.5:0.75))why.push('hidden');if(whole&&!s.inFrame)why.push('cut');if(!(s.head[0]>0.04&&s.head[0]<0.96&&s.head[1]>0.04&&s.head[1]<0.9))why.push('headout');if(face&&s.facing<0.35)why.push('face');
  const lens=OdysseyFilm.lens(subject,allow);if(lens>0.1)why.push('lens');const clut=OdysseyFilm.clutter(subject,allow);if(clut.length)why.push('clutter');return {ok:!why.length,why,s};}
/* how much of the frame is covered by anything nearer the lens than the subject (a shoulder, a spear, a column): a grid of rays */
function frameBlock(subject){const d=kfHead(subject).distanceTo(camera.position),r=rigOf(subject),mine=new Set();if(r)r.figure.traverse(o=>mine.add(o));const ms=[];scene.traverse(o=>{if(kfSolid(o)&&!mine.has(o))ms.push(o);});
  const ray=new THREE.Raycaster();let hit=0,n=0;for(let i=0;i<7;i++)for(let j=0;j<5;j++){ray.setFromCamera(new THREE.Vector2(-0.9+i*0.3,-0.8+j*0.4),camera);ray.far=d*0.85;n++;if(ray.intersectObjects(ms,true).length)hit++;}return hit/n;}
function sideOf(pos,a,b){if(!a||!b)return 0;const A=kfHead(a),B=kfHead(b),d=B.clone().sub(A),q=new V3(...pos).sub(A);return Math.sign(d.x*q.z-d.z*q.x)||1;}
function heroFor(who,size,k,other,side){const H=figHeight(who),r=rigOf(who);if(!r)return null;
  const D={CLOSE:1.3,MID:2.4,REACT:1.45,OBJ:1.0}[size]||2.4,cands=[];
  for(const dm of [1,1.3,0.8])for(const yaw of [0.45,-0.45,0.2,-0.2,0.8,-0.8,0])for(const hh of [0.10,0.28])cands.push({type:'hero',a:who,yaw,dist:D*H*dm,height:hh*H,fov:size==='CLOSE'?32:36,subject:who,eye:size==='CLOSE'?0.36:0.4});
  const pick=[];for(const c of cands){const s=judge(c,who,k,{face:true,whole:false});if(!s.ok||frameBlock(who)>0.2)continue;
    const sd=other?sideOf(camera.position.toArray(),who,other):0;
    /* the subject on the thirds line on the side away from the one addressed: they look into the frame */
    let place='C';if(other&&kfActor(other)){const q=kfHead(other).project(camera),p=kfHead(who).project(camera);place=q.x>p.x?'L':'R';}
    pick.push({...c,place,side:sd});if(pick.length>=8)break;}
  if(!pick.length)return null;return pick.find(c=>!side||c.side===side)||pick[0];}
function objFor(who,k){const r=rigOf(who);if(!r)return null;const H=figHeight(who);
  for(const yaw of [0.6,-0.6,0.3,-0.3,1.0,-1.0])for(const hh of [0.25,0.05]){const hand=kfHand(who,'R');if(!hand)return null;const fwd=new V3(Math.sin(r.heading+yaw),0,Math.cos(r.heading+yaw));
    const off={yaw,dist:H*1.6,h:hh*H};const aim=hand.clone().lerp(kfHead(who),0.35),pos=aim.clone().add(fwd.multiplyScalar(off.dist)).add(new V3(0,off.h,0));const spec={type:'wide',pos:pos.toArray(),target:aim.toArray(),fov:32};
    OdysseyFilm.rig(spec);const lens=OdysseyFilm.lens(who,k.lensAllow||[]);if(lens>0.1)continue;
    const ray=new THREE.Raycaster(camera.position.clone(),hand.clone().sub(camera.position).normalize());ray.far=camera.position.distanceTo(hand)-2;const ms=[];scene.traverse(o=>{if(kfSolid(o))ms.push(o);});const figs=new Set();r.figure.traverse(o=>figs.add(o));
    if(ray.intersectObjects(ms,true).some(h=>!figs.has(h.object)))continue;return {type:'obj',a:who,...off};}
  return null;}
function wideFor(k){const kc=keyCam(k),R0=resolved(kc),p=new V3(...R0.pos),tg=new V3(...R0.target);
  for(const m of [1.35,1.2]){const spec={type:'wide',pos:tg.clone().add(p.clone().sub(tg).multiplyScalar(m)).toArray(),target:R0.target,fov:Math.min(60,R0.fov+5)};const prim=kc.subject||(k.subjects&&k.subjects[0]&&k.subjects[0].id);
    if(!prim||!kfActor(prim))return spec;OdysseyFilm.rig(spec);const s=OdysseyFilm.score([{id:prim}])[prim];if(s&&!s.behind&&s.visible>=0.5&&OdysseyFilm.lens(prim,k.lensAllow||[])<=0.1)return spec;}
  return null;}
/* the camera for a shot at t, with the cast where it is at t: the plan's spec resolved against the live rigs, eased by u */
function shootAt(sh,t){const u=sm(cl01((t-sh.t0)/Math.max(0.5,sh.dur))),P=T.plan.get(sh.id);
  if(sh.kind==='HEADER'&&P){const a=P.from,b=P.to,v=sm(cl01((t-sh.t0)/Math.max(0.5,sh.dur)));
    kfShoot({pos:a.pos.map((x,i)=>lerp(x,b.pos[i],v)),target:a.target.map((x,i)=>lerp(x,b.target[i],v)),fov:lerp(a.fov,b.fov,v)});return;}
  const sub=sh.c&&(sh.kind==='REACT'?sh.c.addressee:sh.c.speaker),mv=T.moving&&T.win&&sub&&T.win.moves[sub];
  /*[choreo]*/if(!(mv&&mv.walk)&&T.choreo&&sub&&sh.kind!=='HEADER'&&sh.kind!=='WIDE'&&T.choreo.walking(sub,t)){const H=T.H[sub]||60,prev=T.keys.map(k=>k.moves&&k.moves[sub]&&k.moves[sub].follow).filter(Boolean)[0];OdysseyFilm.rig(prev?prev.cam:{type:'hero',a:sub,yaw:0.6,dist:2.9*H,height:0.35*H,fov:40,subject:sub,eye:0.42});return;}/*[/choreo]*/
  if(mv&&mv.walk&&sh.kind!=='HEADER'){const H=T.H[sub]||60,f=mv.follow||{cam:{type:'hero',a:sub,yaw:0.6,dist:2.9*H,height:0.35*H,fov:40,subject:sub,eye:0.42}};OdysseyFilm.rig(f.cam);return;}   /* a figure crossing the set: a tracking shot that keeps ahead of him */
  const c=P&&P.cam||keyCam(T.keyOf(t));
  /* the move: the sign score's (push, pull, orbit, crane, track, hold); without a direction the old slow push */
  const M=T.dir&&T.dir.d.move||'push',v=u-0.5,k=M==='push'?1-(T.dir?0.12:0.08)*u:M==='pull'?1+0.1*u:1,yaw=M==='orbit'?0.25*v:M==='track'?0.12*v:0,lift=M==='crane'?0.3*v:0;
  if(c.type==='hero'){const H=T.H[c.a]||60;OdysseyFilm.rig({...c,dist:c.dist*k,yaw:(c.yaw||0)+yaw,height:(c.height||0)+lift*H});return;}
  if(c.type==='obj'){const r=rigOf(c.a),hand=kfHand(c.a,'R');if(r&&hand){const kk=M==='push'?1-0.1*u:k,aim=hand.clone().lerp(kfHead(c.a),0.35),fwd=new V3(Math.sin(r.heading+c.yaw+yaw),0,Math.cos(r.heading+c.yaw+yaw)),pos=aim.clone().add(fwd.multiplyScalar(c.dist*kk)).add(new V3(0,c.h+lift*c.dist*0.5,0));kfShoot({pos:pos.toArray(),target:aim.toArray(),fov:32});return;}}
  /* a key camera without a fixed mark (an orbit about a prop, as the Blinding's first keys have): the rig places it as it is */
  if(!Array.isArray(c.pos)||c.target==null){OdysseyFilm.rig(c);return;}
  /* a fixed mark: moved about its target (push 4% by default), the target followed if it is an actor */
  const tg=typeof c.target==='string'?kfHead(c.target):new V3(...c.target),p0=new V3(...c.pos),rel=p0.clone().sub(tg),dd=rel.length();let pos;
  if(M==='push')pos=p0.clone().lerp(tg,(T.dir?0.06:0.04)*u);else if(M==='pull')pos=tg.clone().add(rel.multiplyScalar(1+0.06*u));
  else if(M==='orbit'||M==='track'){const a=M==='orbit'?0.12*v:0,side=new V3(rel.z,0,-rel.x).normalize();pos=tg.clone().add(new V3(rel.x*Math.cos(a)+rel.z*Math.sin(a),rel.y,-rel.x*Math.sin(a)+rel.z*Math.cos(a)));if(M==='track')pos.addScaledVector(side,dd*0.06*v);}
  else if(M==='crane')pos=p0.clone().add(new V3(0,dd*0.08*v,0));else pos=p0;
  OdysseyFilm.rig({...c,pos:pos.toArray()});}

/* ── the cast at t: each key's snapshot, eased across the seams; walking where the marks are apart ── */
function keyIndexAt(t){let i=0;for(let j=0;j<T.keys.length;j++)if(T.keys[j].t<=t)i=j;return i;}
function castAt(t){const out={},K=T.keys,i=keyIndexAt(t),next=K[i+1];
  /* inside a seam's window: the window of the key that starts next, or of the one that has just begun */
  const win=(j)=>{const k=K[j];return k&&k.win&&t>=k.win[0]&&t<=k.win[1]?k:null;};
  const w=win(i+1)||win(i);T.moving=!!w;T.win=w;
  if(!w){const S=K[i].snap;for(const id in S)out[id]={...S[id],j:{...S[id].j},walk:0};return {state:out,key:K[i]};}
  const j=K.indexOf(w),A=K[j-1].snap,B=w.snap,u=cl01((t-w.win[0])/(w.win[1]-w.win[0]));
  for(const id in B){const a=A[id]||B[id],b=B[id],m=w.moves[id];if(!m){out[id]={...(u<0.5?a:b),j:{...(u<0.5?a:b).j},walk:0};continue;}
    const H=m.H,s={vis:u<0.5?a.vis:b.vis,sat:false,air:b.air,placed:b.placed,rot:[lerp(a.rot[0],b.rot[0],u),lerp(a.rot[1],b.rot[1],u)],j:{},walk:0};
    const r0=a.sat?0.22:0,s0=b.sat?0.22:0,span=Math.max(0.05,1-r0-s0);   /* rise, walk, sit */
    const zero={armRP:[0,0,0],armLP:[0,0,0],headP:[0,0,0],torsoP:[0,0,0],legRP:[0,0,0],legLP:[0,0,0]},stand=b.sat?zero:b.j,from=a.sat?zero:a.j;
    if(u<r0){const v=sm(u/r0);s.p=[a.p[0],lerp(a.p[1],m.yStand0,v),a.p[2]];s.h=a.h;for(const k of JOINTS)s.j[k]=a.j[k].map((x,q)=>lerp(x,stand[k][q],v));s.sat=true;}
    else if(u>1-s0){const v=sm((u-(1-s0))/s0);s.p=[b.p[0],lerp(m.yStand1,b.p[1],v),b.p[2]];s.h=angLerp(m.dir,b.h,v);for(const k of JOINTS)s.j[k]=stand[k].map((x,q)=>lerp(x,b.j[k][q],v));s.sat=v>0.5;}
    else{const v=(u-r0)/span,e=m.walk?v*v*(3-2*v)*0.25+v*0.75:sm(v);   /* a walk keeps its pace, eased only at its ends */
      s.p=[lerp(a.p[0],b.p[0],e),lerp(m.yStand0,m.yStand1,e),lerp(a.p[2],b.p[2],e)];
      if(m.walk){const turn=sm(cl01(v*6)),back=sm(cl01((v-0.82)/0.18));s.h=angLerp(angLerp(a.h,m.dir,turn),b.sat?m.dir:b.h,b.sat?0:back);
        const amt=sm(cl01(v*8))*sm(cl01((1-v)*8)),ph=e*m.d/(0.42*H)*Math.PI;s.walk=amt;
        for(const k of JOINTS)s.j[k]=(a.sat?stand:from)[k].map((x,q)=>lerp(x,stand[k][q],sm(v)));
        s.j.legRP=[s.j.legRP[0]+0.62*amt*Math.sin(ph),0,0];s.j.legLP=[s.j.legLP[0]-0.62*amt*Math.sin(ph),0,0];
        s.j.armRP=[s.j.armRP[0]-0.45*amt*Math.sin(ph),s.j.armRP[1],s.j.armRP[2]];s.j.armLP=[s.j.armLP[0]+0.45*amt*Math.sin(ph),s.j.armLP[1],s.j.armLP[2]];}
      else{s.h=angLerp(a.h,b.h,sm(v));for(const k of JOINTS)s.j[k]=from[k].map((x,q)=>lerp(x,stand[k][q],sm(v)));}}
    out[id]=s;}
  return {state:out,key:u<0.5&&K[j-1]?K[j-1]:w};}
function poseCast(st,t){for(const a of ButterCast.cast){const id=kfShort(a.kind),s=st[id];if(!s)continue;const r=a.rig;
  r.figure.visible=s.vis;r.absent=!s.vis;if(!s.vis)continue;r.pos.set(...s.p);r.heading=s.h;r.figure.position.copy(r.pos);r.figure.rotation.set(s.rot[0],s.h,s.rot[1],'YXZ');r.sat=s.sat;r.air=s.air;
  for(const k of JOINTS)r[k].rotation.set(...s.j[k]);if(T.hips.has(r))r.hipsP.position.y=T.hips.get(r);
  const P=T.perf.get(id);if(!P)continue;
  /* the performance on top of the blocking: the head's held yaw as its base, the line's mouth and carriage while it sounds,
     the listener's carriage while the other speaks, the key beat's emotion, idle life and blinks */
  P.base={'head.yaw':-s.j.headP[1]};P.life=s.walk>0.1?0:0.08;P.rig.gait=s.walk;
  const c=clipAt(t),sp=P.speeches.find(x=>t>=x.t0-0.05&&t<=x.t0+x.sec+0.35);P.speech=sp||null;
  if(c&&c.kind==='DIALOGUE'&&c.addressee===id&&c.voice&&c.voice!==id&&t>=c.at&&t<=c.at+c.dur+0.6){const L=listenCarriage(T.tk.voice.env,T.tk.voice.hz,c.start+(t-c.at),P.seed*10);
    Object.assign(P.base,{'torso.lean':L.pitch*0.8,'head.yaw':P.base['head.yaw']+L.yaw,'torso.roll':L.roll,'brow.up':L.brow*0.5,'mouth.press':L.press});P.blinkGate=L.blinkGate;}else P.blinkGate=1;
  P.last=null;const saveSeated=r.seated;r.seated=s.sat||s.walk>0.1;   /* a seated or walking body keeps the blocking's legs; the performance keeps to the face and the head */
  const v=Perform.apply(P,t);r.seated=saveSeated;
  if(r.seated&&v){if(v['head.yaw']!=null)r.headP.rotation.y=-v['head.yaw'];if(v['torso.lean'])r.torsoP.rotation.x+=v['torso.lean'];}}
  /*[choreo]*/if(T.choreo)T.choreo.apply(t);if(T.creatures)T.creatures.apply(t);/*[/choreo]*/}
/* the key's world beyond the cast: props, the hidden pieces, the light and the sky, re-staged only when the key changes */
function worldFor(key){if(T.world===key.id)return;T.world=key.id;const k=key.k,spec=T.spec;
  OdysseyFilm.hide(k.hide||[]);const pl=JSON.stringify([...(spec.props||[]),...(k.props||[])]);if(pl!==T.propsNow){T.propsNow=pl;OdysseyFilm.props(JSON.parse(pl));OdysseyFilm.propsAfter(JSON.parse(pl));}
  const lk=JSON.stringify(Object.assign({},spec.look||{},k.look));if(lk!==T.lookNow){T.lookNow=lk;OdysseyFilm.light(JSON.parse(lk));OdysseyFilm.look(JSON.parse(lk));for(const f of T.faces.values())f.mesh.castShadow=false;T.env={bg:scene.background,fog:scene.fog,tone:renderer.toneMapping,exp:renderer.toneMappingExposure,sh:renderer.shadowMap.enabled};}
  OdysseyFilm.rope(k.rope||null);}

/* ── captions, in the syncwatch's type ── */
function tracked(g,s,x,y,size,track,weight){g.font=(weight||900)+' '+size+'px ui-monospace,Menlo,"DejaVu Sans Mono",monospace';const ch=[...s],w=ch.reduce((n,c)=>n+g.measureText(c).width,0)+track*(ch.length-1);let cx=x-w/2;for(const c of ch){g.fillText(c,cx+g.measureText(c).width/2,y);cx+=g.measureText(c).width+track;}}
function wrap(g,txt,w){const out=[];let line='';for(const word of String(txt).split(/\s+/)){const t=line?line+' '+word:word;if(g.measureText(t).width>w&&line){out.push(line);line=word;}else line=t;}if(line)out.push(line);return out;}
function captionAt(t){for(const c of T.clips){if(c.kind==='SPEAKER_CUE')continue;if(t>=c.at-0.1&&t<=c.at+c.dur+0.4)return {c,a:Math.min(cl01((t-c.at+0.1)/0.2),cl01((c.at+c.dur+0.4-t)/0.25))};}return null;}
function drawCaption(g,W,H,t){const cap=captionAt(t);if(!cap||cap.a<=0)return;const c=cap.c,k=H/720;g.save();g.globalAlpha=cap.a;g.textAlign='center';g.textBaseline='alphabetic';
  if(c.kind==='SCENE_HEADER'){const roman=n=>{const R=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [v,l] of R)while(n>=v){s+=l;n-=v;}return s;};
    const PW=W*0.56,PH=150*k,px=(W-PW)/2,py=H*0.30;g.fillStyle='rgba(253,253,250,0.93)';g.fillRect(px,py,PW,PH);g.strokeStyle='#141414';g.lineWidth=2.5*k;g.strokeRect(px,py,PW,PH);g.fillStyle='#141414';
    tracked(g,('BOOK '+roman(T.tk.book)+' · '+(T.tk.bookTitle||'')).toUpperCase(),W/2,py+42*k,13*k,3*k,700);tracked(g,String(T.tk.title||'').toUpperCase(),W/2,py+92*k,26*k,3.2*k,900);
    g.font='italic 500 '+(15*k)+'px ui-monospace,Menlo,"DejaVu Sans Mono",monospace';g.fillStyle='#5c5c58';g.fillText(c.caption,W/2,py+126*k);g.restore();return;}
  const isLine=c.isLine,name=(isLine?(c.speakerName||''):'the narrator').toUpperCase();g.font=(isLine?'600 ':'italic 500 ')+(isLine?22:19)*k+'px ui-monospace,Menlo,"DejaVu Sans Mono",monospace';
  const lines=wrap(g,c.caption,W*0.70).slice(0,4),lh=(isLine?30:26)*k,PH=46*k+lines.length*lh+10*k,PW=W*0.76,px=(W-PW)/2,py=H-PH-28*k;
  g.fillStyle='rgba(253,253,250,0.92)';g.fillRect(px,py,PW,PH);g.strokeStyle='#141414';g.lineWidth=2.5*k;g.strokeRect(px,py,PW,PH);
  g.fillStyle='#141414';tracked(g,name,W/2,py+26*k,15*k,2.6*k,900);if(isLine&&c.addressee){g.fillStyle='#5c5c58';tracked(g,'SPEAKING',W/2,py+40*k,8*k,3.2*k,700);}
  g.font=(isLine?'600 ':'italic 500 ')+(isLine?22:19)*k+'px ui-monospace,Menlo,"DejaVu Sans Mono",monospace';g.fillStyle=isLine?'#141414':'#5c5c58';let y=py+46*k+lh*0.72;for(const L of lines){g.fillText(L,W/2,y);y+=lh;}g.restore();}

/* ── prepare: stage every key once, snapshot it, dress the named cast in their halfworld faces, lay out the lines and the shots ── */
async function prepare(o={}){const A=filmAsset(),tk=A&&A.take;if(!tk)throw Error('this location carries no take (rebuild with film-readymades/build_odyssey.py)');
  if(T)end();const sid=tk.scene,mode=o.mode==='cut'?'cut':'full';if(mode==='cut'&&!tk.cut.segments.length)throw Error(sid+' is not in the Regulars\' Cut');
  const spec=await (await fetch(root+'odyssey/keyframes/'+sid+'.json')).json();await OdysseyFilm.loadProps();
  const {clips,total,audio}=clipsOf(tk,mode);T={sid,mode,tk,spec,clips,total,audio,voiceSpans:clips,plan:new Map(),perf:new Map(),faces:new Map(),heads:[],hips:new Map(),world:null,propsNow:null,lookNow:null};
  T.dir=o.grammar?null:await directionOf(tk);   /* the sign score's direction cuts the take (o.grammar: the syncwatch grammar alone) */
  for(const a of ButterCast.cast)T.hips.set(a.rig,a.rig.hipsP.position.y);T.H={};
  /* the keys on the clock: a key begins where the first segment of its turn begins */
  const kById=new Map(spec.keys.map(k=>[k.id,k])),first=new Map();for(const c of clips)if(c.key&&!first.has(c.key))first.set(c.key,c.at);
  const order=spec.keys.filter(k=>first.has(k.id)).map(k=>({id:k.id,k,t:first.get(k.id)}));if(!order.length)order.push({id:spec.keys[0].id,k:spec.keys[0],t:0});order.sort((a,b)=>a.t-b.t);order[0].t=0;T.keys=order;
  T.keyOf=t=>T.keys[keyIndexAt(t)].k;
  for(const K of order){stage(spec,K.k);K.snap=snap();if(K===order[0])for(const a of ButterCast.cast)T.H[kfShort(a.kind)]=figHeight(kfShort(a.kind));}
  /* the seams: who moves between two keys, how far, and how long a walk that is */
  for(let j=1;j<order.length;j++){const A_=order[j-1].snap,B=order[j].snap,moves={};let D=0.8;
    for(const id in B){const a=A_[id],b=B[id];if(!a||!b)continue;const d=Math.hypot(b.p[0]-a.p[0],b.p[2]-a.p[2]),dj=JOINTS.some(k=>a.j[k].some((x,q)=>Math.abs(x-b.j[k][q])>0.05));if(d<0.5&&!dj&&Math.abs(a.p[1]-b.p[1])<0.5&&Math.abs(angLerp(a.h,b.h,1)-a.h)<0.02&&a.vis===b.vis)continue;
      const H=figHeight(id),walk=d>0.35*H,dir=walk?Math.atan2(b.p[0]-a.p[0],b.p[2]-a.p[2]):b.h,yS0=a.sat?(b.sat?a.p[1]:b.p[1]):a.p[1],yS1=b.sat?(a.sat?b.p[1]:yS0):b.p[1];
      moves[id]={d,H,walk,dir,yStand0:yS0,yStand1:yS1};D=Math.max(D,(walk?Math.min(5,Math.max(1.4,d/(1.15*H))):0.9)+(a.sat?0.6:0)+(b.sat?0.6:0));}
    const ks=order[j].t,lo=order[j-1].t+0.6,hi=order[j+1]?order[j+1].t-0.6:T.total;let w0=Math.max(lo,ks-0.7*D),w1=Math.min(hi,w0+D);if(w1-w0<0.6)w1=Math.min(hi,w0+0.6);
    order[j].win=[w0,w1];order[j].moves=moves;}
  /* the faces: the twelve drawn faces on plain heads (the printed head hidden), lips and carriage from the voice */
  const cat=(window.ButterAssetCatalog&&ButterAssetCatalog.characters)||[];
  for(const a of ButterCast.cast){const id=kfShort(a.kind),who=tk.cast[id],r=a.rig;const P=Perform.attach({name:id},r);P.speeches=[];P.seed=(hash32(id)%1000)/1000;T.perf.set(id,P);
    if(!who||!window.Face||!window.HalfFace||!HalfFace.FACES[who])continue;
    try{const hg=r.headP.children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot'));const old=hg[0],skin=(cat.find(c=>c.id===a.kind)||{}).production?.skin??14;
      const plain=await ButterMovieator.parse('3626b.dat',skin);plain.matrixAutoUpdate=false;plain.matrix.copy(old.matrix);plain.name='take:plain-head';plain.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of [].concat(o.material))m.side=THREE.DoubleSide;}});
      old.visible=false;r.headP.add(plain);T.heads.push({old,plain,rig:r});
      const f=Face.attach(r,'halfworld:'+who,THREE);if(f){f.mesh.castShadow=false;f.mesh.receiveShadow=false;f.mesh.material.fog=true;T.faces.set(id,f);P.face=f;}}catch(e){console.warn('[take] no face for',id,e);}}
  /* the lines: each dialogue segment spoken by its voice, the text as visemes, the envelope slice gating the jaw; the key beat on its emotion */
  const env=tk.voice.env,hz=tk.voice.hz;
  for(const c of clips){if(c.kind!=='DIALOGUE'||!c.voice)continue;const P=T.perf.get(c.voice);if(!P)continue;const K=T.keys[keyIndexAt(c.at+0.01)],s=K.snap[c.voice];
    P.base={'arm.R.pitch':s?s.j.armRP[0]:0,'arm.L.pitch':s?s.j.armLP[0]:0};const sl=env.slice(Math.floor(c.start*hz),Math.ceil((c.start+c.dur)*hz)+2);
    Perform.speak(P,{t:c.at,sec:c.dur,text:c.caption,env:sl,hz});P.speeches.push(P.speech);P.speech=null;P.base={};
    if(tk.beat&&c.gi===tk.keyGi&&Perform.PHRASES[tk.beat.emotion])Perform.phrase(P,tk.beat.emotion,c.at-0.25,{enter:0.6,hold:c.dur,release:0.9});}
  /* the walks: a tracking shot for each figure that crosses the set, its bearing chosen so that nothing (an olive, a column)
     comes between it and the walker anywhere along the way */
  for(const K of order){if(!K.win)continue;for(const [id,m] of Object.entries(K.moves)){if(!m.walk)continue;const H=T.H[id]||60;let best=null;
    /* a camera that travels with him, or one of the two keys' own marks turning to follow him (the gate's still frames him arriving) */
    const cands=[];for(const yaw of [0.6,-0.6,1.0,-1.0])for(const h of [0.4,1.3])cands.push({yaw,h,cam:{type:'hero',a:id,yaw,dist:2.9*H,height:h*H,fov:40,subject:id,eye:0.42}});
    for(const kk of spec.keys){const kc=keyCam(kk);if(Array.isArray(kc.pos))cands.push({fixed:true,cam:{type:'wide',pos:kc.pos,target:id,fov:Math.max(kc.fov||40,40),subject:id,eye:0.42}});}
    for(const c of cands){let worst=0;
      for(const f of [0.25,0.5,0.75,0.95]){const tt=K.win[0]+(K.win[1]-K.win[0])*f;poseCast(castAt(tt).state,tt);scene.updateMatrixWorld(true);
        OdysseyFilm.rig(c.cam);const sc=OdysseyFilm.score([{id}])[id],near=camera.position.distanceTo(kfHead(id))<1.6*H?1:0;worst=Math.max(worst,near+frameBlock(id)+(sc&&!sc.behind?1-sc.visible+(sc.facing<0?0.3:0):1));}
      if(!best||worst<best.worst)best={...c,worst};}
    m.follow=best;}}
  /* the shot plan: every shot the clock can reach, its camera found and scored at its key's staging */
  const ids=new Map();for(let t=0;t<T.total;t+=0.05){const sh=shotAt(t);if(!ids.has(sh.id))ids.set(sh.id,{sh,t});}
  const byKey=new Map();for(const [id,v] of ids){const K=T.keys[keyIndexAt(v.t)];if(!byKey.has(K))byKey.set(K,[]);byKey.get(K).push(v);}
  const stats={};for(const [K,list] of byKey){worldFor(K);poseCast(K.snap?Object.fromEntries(Object.entries(K.snap).map(([i,s])=>[i,{...s,walk:0}])):{},K.t);scene.updateMatrixWorld(true);
    const kc=keyCam(K.k),prim=kc.subject||((K.k.subjects||[]).find(s=>s.primary)||{}).id;
    for(const {sh} of list){let cam=null;const c=sh.c;
      if(sh.kind==='HEADER'){const est=(filmAsset().cameras||[])[0],to=resolved(keyCam(K.k));T.plan.set(sh.id,{from:est?{pos:est.pos,target:est.target,fov:est.fov||38}:to,to});stats.HEADER=(stats.HEADER||0)+1;continue;}
      if(sh.kind==='WIDE')cam=wideFor(K.k);
      else if(sh.kind==='SPK'){const who=c.speaker;if(who===prim&&sh.size==='MID'&&judge(kc,who,K.k,{face:true,whole:false}).ok)cam=null;else if(who)cam=heroFor(who,sh.size,K.k,c.addressee,c.addressee?sideOf(resolved(kc).pos,who,c.addressee):0);}
      else if(sh.kind==='REACT'&&c.addressee)cam=heroFor(c.addressee,'REACT',K.k,c.speaker,sideOf(resolved(kc).pos,c.speaker,c.addressee));
      else if(sh.kind==='OBJ'&&c.speaker)cam=objFor(c.speaker,K.k);
      else if(sh.kind==='INSERT'&&T.dir&&!INSERTS[T.sid])cam=kfActor(sh.ins.on)?heroFor(sh.ins.on,'CLOSE',K.k):c&&c.speaker?objFor(c.speaker,K.k):null;   /* the score's insert: on the thing if it is cast, else the hands that hold it */
      T.plan.set(sh.id,{cam,kind:sh.kind,fallback:!cam});const tag=sh.kind+(cam?'':'→key');stats[tag]=(stats[tag]||0)+1;}}
  T.world=null;T.stats=stats;
  /*[choreo]*/ /* the choreography (odyssey/choreo/<scene>.json, film-readymades/choreo.js): every servo of every actor on the voice clock, over the blocking; o.choreo an object, false for none */
  if(window.OdysseyChoreo&&o.choreo!==false){let C=typeof o.choreo==='object'?o.choreo:null;if(!C)try{const r=await fetch(root+'odyssey/choreo/'+sid+'.json',{cache:'no-store'});if(r.ok)C=await r.json();}catch(e){}
    if(C&&(C.clock||'cut')===mode)T.choreo=OdysseyChoreo.player(C,{THREE,scene,rigOf:id=>rigOf(id),hipsOf:r=>T.hips.get(r),pieceMeshes:label=>choreoPieces(label)});else if(C)console.warn('[take] the choreography is on the',C.clock,'clock, not',mode);
    if(C&&C.creatures&&(C.clock||'cut')===mode&&window.OdysseyCreatures)try{T.creatures=await creaturesStage(C);}catch(e){console.warn('[take] creatures',e);}}/*[/choreo]*/
  /*[motion]*/ /* a key that names motion, fields, swaps or optics (its own spec, or the exporter's plan o.motion.keys[id]): film-readymades/motion.js */
  if(window.OdysseyMotion)T.motion=await OdysseyMotion.takeStage(T,o.motion,{scene,renderer,actorOf:id=>kfActor(id),cast:()=>ButterCast.cast.filter(a=>a.rig.figure.visible!==false&&!a.rig.absent).map(a=>kfShort(a.kind)),scale:filmAsset().scale,pieces:()=>OdysseyFilm.pieces()});/*[/motion]*/
  return info();}
function info(){return {follow:T.keys.filter(k=>k.moves).map(k=>Object.entries(k.moves).filter(([i,m])=>m.follow).map(([i,m])=>i+':'+JSON.stringify({fixed:!!m.follow.fixed,yaw:m.follow.yaw,worst:+m.follow.worst.toFixed(2)}))).flat(),scene:T.sid,mode:T.mode,total:T.total,direction:T.dir?{sign:T.dir.p,...T.dir.d}:null,cut:T.cutList?T.cutList.map(q=>({t0:+q.t0.toFixed(2),dur:+q.dur.toFixed(2),kind:q.kind,close:!!q.close,series:!!q.series,edge:q.edge||null})):null,keys:T.keys.map(k=>({id:k.id,t:+k.t.toFixed(2),win:k.win&&k.win.map(v=>+v.toFixed(2))})),faces:[...T.faces.keys()],shots:T.stats,clips:T.clips.map(c=>({gi:c.gi,at:c.at,dur:c.dur,kind:c.kind,key:c.key,speaker:c.speaker,addressee:c.addressee}))};}

/*[choreo]*/ /* creatures (film-readymades/creatures.js, CREATURES.md "Wiring it into the film"): a sheet's `creatures` as rigs in the take. Each
   rig's pieces are parsed once (library parts from the part packs, as the props are; the cut pieces from odyssey/creatures/parts/<kind>.mpd),
   attached under one group at the scene's root (the rig's world is the take's), posed every drawing from OdysseyCreatures.sample; the staged
   prop of the same id (prop:<id>) is hidden while its rig plays; a rider's figure is set in the anchor's frame (a man in a fist, under a ram) */
async function creaturesStage(C){const Cr=OdysseyCreatures,root=new URL('../../',location.href).href,rigs={},want=new Map(),cache=new Map(),mpd={};
  for(const [id,A] of Object.entries(C.creatures)){const rig=Cr.define(A.kind,{id,scale:A.scale,colour:A.colour});rigs[id]=rig;rig.attach(THREE,new THREE.Group(),(f,c)=>{want.set(f+'|'+c,{f,c,kind:rig.K.cutFrom||rig.kind});return null;});}
  const partKey=f=>/\.ldr$/.test(f)?f:'parts/'+String(f).replace(/\.dat$/,'')+'.dat';
  for(const {f,kind} of want.values()){if(/\.ldr$/.test(f)){if(!mpd[kind]){mpd[kind]={};try{const txt=await (await fetch(root+'odyssey/creatures/parts/'+kind+'.mpd')).text();let cur=null,buf=[];for(const ln of txt.split(/\r?\n/)){const m=ln.match(/^0 FILE (.+)$/);if(m){if(cur)mpd[kind][cur]=buf.join('\n');cur=m[1].trim();buf=[];}else buf.push(ln);}if(cur)mpd[kind][cur]=buf.join('\n');}catch(e){console.warn('[creatures] no parts for',kind);}}continue;}
    const id=String(f).replace(/\.dat$/,'');if(ButterLDraw.parts['parts/'+id+'.dat'])continue;try{const pk=await (await fetch(root+'odyssey/packs/'+id.replace('/','_')+'.json')).json();for(const [k,v] of Object.entries(pk)){ButterLDraw.parts[k]=v;ButterLDraw.parts[(k.startsWith('parts/')||k.startsWith('p/'))?k:'parts/'+k]=v;if(k.startsWith('p/'))ButterLDraw.parts[k.slice(2)]=v;}}catch(e){console.warn('[creatures] no pack',id);}}
  for(const [key,{f,c,kind}] of want){const ldr=/\.ldr$/.test(f);if(!ldr&&!ButterLDraw.parts[partKey(f)]){const base=String(f).replace(/p[0-9a-z]+$/,'');if(ButterLDraw.parts['parts/'+base+'.dat'])want.set(key,{f:base,c,kind,alias:true});else continue;}
    const w=want.get(key),l=new THREE.LDrawLoader();l.setFileMap({});Object.assign(l.subobjectCache,ButterLDraw.parts);if(ldr&&mpd[kind]&&mpd[kind][f]!=null){l.subobjectCache[f]=mpd[kind][f];l.subobjectCache[f.toLowerCase()]=mpd[kind][f];}else if(ldr)continue;
    try{const g=await new Promise((res,rej)=>l.parse(ButterLDraw.colors+'\n1 '+c+' 0 0 0 1 0 0 0 1 0 0 0 1 '+(ldr?f:partKey(w.f)),'creature.ldr',res,rej));g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}for(const m of [].concat(o.material||[]))if(m&&m.color&&!m.userData.lin){m.userData.lin=1;if(renderer.outputEncoding===THREE.sRGBEncoding)m.color.convertSRGBToLinear();}});cache.set(key,g);}catch(e){console.warn('[creatures] parse',f,e);}}
  const group=new THREE.Group();group.name='creatures';scene.add(group);
  for(const [id,rig] of Object.entries(rigs)){const g=new THREE.Group();g.name='creature:'+id;group.add(g);rig.attach(THREE,g,(f,c)=>{const t=cache.get(f+'|'+c);return t?t.clone(true):null;});}
  const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sv=new THREE.Vector3(),Pv=new THREE.Vector3();
  return {rigs,group,
    apply(t){for(const [id,rig] of Object.entries(rigs)){const s=Cr.sample(C,id,t);rig.apply(s.v);const pr=scene.getObjectByName('prop:'+id);if(pr)pr.visible=false;
      for(const r of s.riders||[]){const a=kfActor(r.actor);if(!a||!a.rig||a.rig.figure.visible===false)continue;const m=r.m,f=a.rig.figure;M4.set(m[3],m[4],m[5],m[0],m[6],m[7],m[8],m[1],m[9],m[10],m[11],m[2],0,0,0,1);M4.decompose(Pv,Q,Sv);f.position.copy(Pv);f.quaternion.copy(Q);if(a.rig.pos)a.rig.pos.copy(Pv);}}
      group.updateMatrixWorld(true);},
    dispose(){scene.remove(group);for(const id of Object.keys(rigs)){const pr=scene.getObjectByName('prop:'+id);if(pr)pr.visible=true;}}};}
/*[choreo]*/ /* the set pieces a sheet's rig names (a ship), as motion.js finds them: the mesh whose box is the piece's box */
function choreoPieces(label){const want=OdysseyFilm.pieces().filter(p=>p.box&&(p.label===label||p.label.toLowerCase().includes(String(label).toLowerCase())));const out=[];const cands=[];scene.traverse(o=>{if(o.isMesh&&o.userData&&o.userData.partId!=null)cands.push(o);});
  for(const p of want){let best=null,bd=1e9;for(const m of cands){const b=new THREE.Box3().setFromObject(m),d=Math.abs(b.min.x-p.box[0])+Math.abs(b.min.y-p.box[1])+Math.abs(b.min.z-p.box[2])+Math.abs(b.max.x-p.box[3])+Math.abs(b.max.y-p.box[4])+Math.abs(b.max.z-p.box[5]);if(d<bd){bd=d;best=m;}}if(best&&bd<12)out.push(best);}return out;}
/* what the choreographer reads (tools/choreograph.js): the keys on the clock with each actor's staged mark, the figures' heights,
   what each hand holds, the set pieces, the clips with their words, the beat and the envelope */
function marks(){const r2=v=>Array.isArray(v)?v.map(r2):typeof v==='number'?+v.toFixed(4):v;
  const held={};for(const a of ButterCast.cast){const id=kfShort(a.kind),r=a.rig;held[id]={R:r.armRP.children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot')).length-2,L:r.armLP.children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot')).length-2,hipsY:T.hips.get(r),scale:r.figure.scale.x};}
  return {scene:T.sid,mode:T.mode,total:T.total,scale:filmAsset().scale||1,H:T.H,held,keys:T.keys.map(k=>({id:k.id,t:k.t,win:k.win||null,beat:k.k.beat||'',snap:r2(k.snap),moves:k.moves?Object.fromEntries(Object.entries(k.moves).map(([i,m])=>[i,{d:r2(m.d),walk:m.walk,dir:r2(m.dir)}])):null})),
    pieces:OdysseyFilm.pieces().filter(p=>p.box).map(p=>({label:p.label,box:r2(p.box)})),clips:T.clips.map(c=>({gi:c.gi,at:c.at,start:c.start,dur:c.dur,kind:c.kind,key:c.key,voice:c.voice,speaker:c.speaker,addressee:c.addressee,caption:c.caption,isLine:c.isLine,act:c.act,delivery:c.delivery})),
    beat:T.tk.beat,keyGi:T.tk.keyGi,direction:T.dir?{sign:T.dir.p,...T.dir.d}:null,env:T.tk.voice.env,hz:T.tk.voice.hz,cut:T.cutList?T.cutList.map(q=>({t0:q.t0,dur:q.dur,kind:q.kind})):null};}
/* the acting-density probe: the cast at t as points on the body in the world, whether each figure is in the frame, the camera */
function pose(t){const sh=apply(t);scene.updateMatrixWorld(true);camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const out={t,shot:sh.id,kind:sh.kind,actors:{}},V=new V3();
  const pts=[['headP',[0,-12,-11]],['headP',[0,-26,0]],['torsoP',[0,10,-10]],['armRP',[-8,22,-10]],['armLP',[8,22,-10]],['legRP',[-6,26,-6]],['legLP',[6,26,-6]]];
  for(const a of ButterCast.cast){const id=kfShort(a.kind),r=a.rig;if(r.figure.visible===false||r.absent)continue;
    const P=pts.map(([k,l])=>r[k].localToWorld(V.set(...l)).toArray().map(v=>+v.toFixed(3)));const H=T.H[id]||60;
    let on=false;for(const q of [r.headP.getWorldPosition(new V3()),r.hipsP.getWorldPosition(new V3())]){const c=q.clone().applyMatrix4(camera.matrixWorldInverse);if(c.z>=0)continue;const p=q.clone().project(camera);if(Math.abs(p.x)<=1&&Math.abs(p.y)<=1)on=true;}
    out.actors[id]={on,H:+H.toFixed(2),p:P,j:JOINTS.map(k=>[r[k].rotation.x,r[k].rotation.y,r[k].rotation.z].map(v=>+v.toFixed(4))),root:[r.figure.position.x,r.figure.position.y,r.figure.position.z,r.figure.rotation.x,r.figure.rotation.y,r.figure.rotation.z].map(v=>+v.toFixed(4))};}
  return out;}
/*[/choreo]*/
/* ── one frame at t: the world, the cast, the camera; drawn, then captioned ── */
function apply(t){const {state,key}=castAt(t);worldFor(key);if(T.env){scene.background=T.env.bg;scene.fog=T.env.fog;renderer.toneMapping=T.env.tone;renderer.toneMappingExposure=T.env.exp;renderer.shadowMap.enabled=T.env.sh;}poseCast(state,t);/*[motion]*/if(T.motion){T.motion.frame(t,key);renderer.shadowMap.needsUpdate=true;}/*[/motion]*/const sh=shotAt(t);shootAt(sh,t);scene.updateMatrixWorld(true);return sh;}
let comp=null;
function frame(t,{quality=0.9,captions=true}={}){if(!T)throw Error('no take prepared');const m0=performance.now(),sh=apply(t),m1=performance.now();if(T.render){renderer.shadowMap.autoUpdate=false;T.fi=(T.fi||0)+1;if(T.moving||T.choreo||sh.id!==T.lastShot||T.fi%4===0)renderer.shadowMap.needsUpdate=true;T.lastShot=sh.id;}(T.render||renderer.render.bind(renderer))(scene,camera);renderer.getContext().finish();const m2=performance.now();
  const W=renderer.domElement.width,H=renderer.domElement.height;if(!comp){comp=document.createElement('canvas');}comp.width=W;comp.height=H;const g=comp.getContext('2d');g.drawImage(renderer.domElement,0,0);/*[motion]*/if(T.motion&&T.motion.ov)OdysseyMotion.overlay(g,W,H,T.motion.ov);/*[/motion]*/if(captions)drawCaption(g,W,H,t);
  const jpeg=comp.toDataURL('image/jpeg',quality).split(',')[1];return {jpeg,shot:sh.id,kind:sh.kind,key:T.keyOf(t).id,ms:[m1-m0,m2-m1,performance.now()-m2].map(v=>Math.round(v))};}
/* the sound as the exporter renders it: the voice clips on the clock, the bed and its law, the offset into the book's track */
function soundLog(){const b=T.tk.bed;return {total:T.total,voice:{file:T.tk.voice.file,clips:T.audio},bed:{file:b.file,open:b.open,duck:b.duck,ramp:b.ramp,offset:T.mode==='cut'?b.offsetCut||0:b.offsetFull||0},forward:!!(T.dir&&T.dir.d.sound_forward),spans:T.dir&&T.dir.d.sound_forward?[]:T.voiceSpans.map(c=>({at:c.at,dur:c.dur}))};}   /* sound forward: no spans, so the exporter's bed is not ducked either */
function captions(){return T.clips.filter(c=>c.kind!=='SPEAKER_CUE').map(c=>({t0:c.at,t1:c.at+c.dur,name:c.kind==='SCENE_HEADER'?'':c.isLine?c.speakerName:'Narrator',text:c.kind==='SCENE_HEADER'?(T.tk.title+' — '+c.caption):c.caption,isLine:c.isLine}));}
function end(){if(!T)return;stop();/*[choreo]*/if(T.creatures)T.creatures.dispose();if(T.choreo)T.choreo.dispose();/*[/choreo]*//*[motion]*/if(T.motion)T.motion.dispose();/*[/motion]*/for(const h of T.heads){h.old.visible=true;h.plain.parent&&h.plain.parent.remove(h.plain);}for(const f of T.faces.values())Face.detach(f);T=null;}

/* ── live: the player's own take mode. The voice carries the clock; the bed chases the duck; the frame is posed just before the
   page draws it, and the caption sits over the picture ── */
let live=null;
function play(o={}){return prepare(o).then(inf=>{const orig=renderer.render.bind(renderer),voice=new Audio(root+T.tk.voice.file),bed=new Audio(root+T.tk.bed.file);bed.loop=true;bed.volume=T.tk.bed.open;
  const cap=document.createElement('canvas');cap.id='takeCaptions';Object.assign(cap.style,{position:'fixed',pointerEvents:'none',zIndex:60});document.body.appendChild(cap);
  const t0=performance.now()-(o.from||0)*1000;live={orig,voice,bed,cap,t0,raf:0};bed.currentTime=(soundLog().bed.offset||0);bed.play().catch(()=>{});
  const clock=()=>(performance.now()-live.t0)/1000;
  renderer.render=(s,c)=>{const t=clock();if(t>T.total+0.5){stop();return orig(s,c);}apply(t);
    const c_=T.clips.find(x=>t>=x.at&&t<x.at+x.dur),want=c_?c_.start+(t-c_.at):null;
    if(T.mode==='full'){if(voice.paused&&t<T.total){voice.currentTime=t;voice.play().catch(()=>{});}else if(Math.abs(voice.currentTime-t)>0.25)voice.currentTime=t;}
    else if(want==null){if(!voice.paused)voice.pause();}else{if(voice.paused){voice.currentTime=want;voice.play().catch(()=>{});}else if(Math.abs(voice.currentTime-want)>0.25)voice.currentTime=want;}
    bed.volume=Math.max(0,Math.min(1,bedGain(t)));orig(s,camera);
    const R=renderer.domElement.getBoundingClientRect();cap.width=Math.round(R.width);cap.height=Math.round(R.height);Object.assign(cap.style,{left:R.left+'px',top:R.top+'px',width:R.width+'px',height:R.height+'px'});drawCaption(cap.getContext('2d'),cap.width,cap.height,t);};
  return inf;});}
function stop(){if(!live)return;renderer.render=live.orig;live.voice.pause();live.bed.pause();live.cap.remove();live=null;}
/* the export: the page's own drawing stopped (as the keyframe gate stops it); frames drawn only on request */
function exportStart(o={}){const orig=renderer.render.bind(renderer);renderer.render=()=>{};renderer.setPixelRatio(1);renderer.setSize(o.w||1280,o.h||720,false);camera.aspect=(o.w||1280)/(o.h||720);camera.updateProjectionMatrix();return prepare(o).then(inf=>{T.render=orig;return inf;});}
window.OdysseyTake={prepare,exportStart,frame,apply,play,stop,end,soundLog,captions,/*[choreo]*/creatures:()=>{if(!T||!T.creatures)return null;const out={};for(const [id,rig] of Object.entries(T.creatures.rigs)){let n=0;const g=T.creatures.group.getObjectByName('creature:'+id);if(g)g.traverse(o=>{if(o.isMesh)n++;});out[id]={kind:rig.kind,meshes:n};}return out;},marks:()=>T&&marks(),pose:t=>T&&pose(t),useChoreo:C=>{if(!T)return false;if(T.choreo){T.choreo.dispose();T.choreo=null;}if(C)T.choreo=OdysseyChoreo.player(C,{THREE,scene,rigOf:id=>rigOf(id),hipsOf:r=>T.hips.get(r),pieceMeshes:label=>choreoPieces(label)});T.world=null;return !!T.choreo;},get choreo(){return T&&T.choreo?T.choreo.C:null;},/*[/choreo]*/info:()=>T&&info(),shotAt:t=>T&&shotAt(t),get take(){return filmAsset()?.take||null;}};
/* a Take button beside the forage shelf; ?take (or ?take=cut) plays the current location's scene on load */
{const b=document.createElement('button');b.id='takeOpen';b.textContent='Take';b.title='Play this scene on its recorded performance (voice, faces, captions, cut)';b.onclick=()=>{if(live){stop();return;}play({mode:new URLSearchParams(location.search).get('take')==='cut'?'cut':'full'}).catch(e=>alert(e.message));};
 (document.getElementById('filmWorldTools')||document.body).appendChild(b);if(b.parentElement===document.body)Object.assign(b.style,{position:'fixed',right:'12px',top:'12px',zIndex:61});}
})();

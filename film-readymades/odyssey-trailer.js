/* Trailer mode: a shot of an Odyssey trailer edit list (odyssey/trailers/<id>.json) staged and drawn in the Film Butter player.
   Needs only the page's globals (scene, camera, renderer, controls, ButterCast, ButterFilms, OdysseyFilm, Face, HalfFace, Perform,
   ButterMovieator), so tools/export-trailer.js can inject it into any build of the player; film-readymades/patch_trailer.py also
   embeds it (between the odyssey-trailer markers) so the player carries it.

   A shot is a pure function of its local clock u (seconds into the shot), as in take mode:
     staging  the shot's key (odyssey/keyframes/<scene>.json) is staged exactly as the gate stages it (hide, props, blocking,
              spread, props after, light, look, rope), then the shot's `look` override is laid over the key's look: sky, fog,
              exposure and fill as given; `key` as a directional light whose direction is read from its words ("moon, high left",
              "low sun behind", "embers ... low") relative to the camera; night and dusk dim the set's own lights. The key's own
              practicals (fire, lamps) stay and flicker.
     camera   the key's gate-approved camera is the start; the move (push, pull, orbit, crane, track, hold) runs over the shot with
              its ease (in, out, inOut, linear); `stepped: n` holds each position for 1/n s (stop-motion on twos); amounts are
              fractions of the lens-to-target distance (orbit: radians about the target; crane: up, negative down, the aim
              rising a little more than the lens so the frame tilts toward the sky)
     cast     the staged pose is snapshotted and restored every frame; the twelve halfworld faces go on the named cast (take mode's
              faces: plain head, drawn face), idle life and blinks from Perform, and when the shot has a voice line and its speaker
              stands in the key, his lips run on the clip's viseme track gated by its envelope (Perform.speak)
     cards    CARD and BLACK are drawn by the page on a 2D canvas: nolan (small tracked serif capitals), nolan-title (9% of the
              frame), bronze (engraved gold serif, a slow 3% push), brick (letters of 1x2 plates snapping on, 12 a second)
   No captions: a trailer's words are heard. */
(function(){
const V3=THREE.Vector3,root=new URL('../../',location.href).href;
const cl01=v=>Math.max(0,Math.min(1,v)),sm=x=>{x=cl01(x);return x*x*(3-2*x);},lerp=(a,b,u)=>a+(b-a)*u;
const short=k=>String(k).replace(/^odyssey-od-b\d\d-s\d\d-/,''),actorOf=id=>ButterCast.cast.find(a=>short(a.kind)===id);
const JOINTS=['armRP','armLP','headP','torsoP','legRP','legLP'];
function hash32(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
let S=null,SH=null,W=1280,H=720,orig=null,comp=null,TR={};   /* TR: the trailer-wide settings (doc.grade), set by start() */

/* ── the page, taken over for offline drawing (as the keyframe gate and take mode do) ── */
function start(o={}){W=o.w||1280;H=o.h||720;TR={grade:o.grade||null};if(!orig){orig=renderer.render.bind(renderer);renderer.render=()=>{};}
  renderer.setPixelRatio(1);renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();return {w:W,h:H};}

/* ── a location: the keyframe spec, the faces on the named cast ── */
async function enter(sid){if(S&&S.sid===sid&&ButterFilms.current?.sourceId===S.loc)return info();if(S)endScene();
  const spec=await (await fetch(root+'odyssey/keyframes/'+sid+'.json')).json();await OdysseyFilm.loadProps();
  const tk=OdysseyFilm.asset()?.take||{};S={sid,loc:ButterFilms.current?.sourceId,spec,tk,perf:new Map(),faces:new Map(),heads:[],hips:new Map()};
  for(const a of ButterCast.cast)S.hips.set(a.rig,a.rig.hipsP.position.y);
  const cat=(window.ButterAssetCatalog&&ButterAssetCatalog.characters)||[];
  for(const a of ButterCast.cast){const id=short(a.kind),who=(tk.cast||{})[id],r=a.rig;const P=Perform.attach({name:id},r);P.speeches=[];P.seed=(hash32(id)%1000)/1000;S.perf.set(id,P);
    if(!who||!window.Face||!window.HalfFace||!HalfFace.FACES[who])continue;
    try{const hg=r.headP.children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot'));const old=hg[0],skin=(cat.find(c=>c.id===a.kind)||{}).production?.skin??14;
      const plain=await ButterMovieator.parse('3626b.dat',skin);plain.matrixAutoUpdate=false;plain.matrix.copy(old.matrix);plain.name='trailer:plain-head';plain.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of [].concat(o.material))m.side=THREE.DoubleSide;}});
      old.visible=false;r.headP.add(plain);S.heads.push({old,plain});
      const f=Face.attach(r,'halfworld:'+who,THREE);if(f){f.mesh.castShadow=false;f.mesh.receiveShadow=false;f.mesh.material.fog=true;S.faces.set(id,f);P.face=f;}}catch(e){console.warn('[trailer] no face for',id,e);}}
  return info();}
function endScene(){if(!S)return;for(const h of S.heads){h.old.visible=true;h.plain.parent&&h.plain.parent.remove(h.plain);}for(const f of S.faces.values())Face.detach(f);for(const a of ButterCast.cast)if(S.hips.has(a.rig))a.rig.hipsP.position.y=S.hips.get(a.rig);S=null;SH=null;}
function info(){return S&&{scene:S.sid,loc:S.loc,faces:[...S.faces.keys()],cast:ButterCast.cast.map(a=>short(a.kind)),keys:S.spec.keys.map(k=>k.id)};}

/* ── the look: the key's, with the trailer's override laid over it ── */
function keyDir(from,cam,elevDeg){const s=String(from||'').toLowerCase(),f=cam.target.clone().sub(cam.pos).setY(0).normalize(),r=new V3(-f.z,0,f.x);   /* r: the frame's right */
  let d=new V3();if(/behind|back|backlit|rim|beyond/.test(s))d.add(f);if(/front|camera|toward us/.test(s))d.sub(f);if(/left/.test(s))d.sub(r);if(/right/.test(s))d.add(r);
  if(d.lengthSq()<0.01)d.add(r.clone().multiplyScalar(-0.6)).sub(f.clone().multiplyScalar(0.4));   /* unplaced: from front left, the painter's key */
  d.normalize();const el=elevDeg!=null?elevDeg*Math.PI/180:/overhead|top|above/.test(s)?1.25:/high/.test(s)?0.85:/low|horizon|setting|dusk|embers/.test(s)?0.2:0.5;return [d.x*Math.cos(el),Math.sin(el),d.z*Math.cos(el)];}
function lookFor(k,ov,cam){const L=Object.assign({},S.spec.look||{},k.look||{});if(!ov)return L;const o=Object.assign({},L);
  for(const x of ['sky','fog','exposure','fill','dim','tone'])if(ov[x]!=null)o[x]=ov[x];
  const tm=String(ov.time||'').toLowerCase();if(ov.dim==null&&/night/.test(tm))o.dim=Math.min(o.dim??1,0.2);else if(ov.dim==null&&/dusk|evening|sunset|storm/.test(tm))o.dim=Math.min(o.dim??1,0.45);
  if(/night/.test(tm)&&ov.fill==null&&o.fill)o.fill=Object.assign({},o.fill,{intensity:(o.fill.intensity??0.5)*0.35});   /* night: the key's daylight fill falls too */
  if(ov.key){const kk=ov.key;o.sun={dir:kk.dir||keyDir(kk.from,cam,kk.elev_deg),color:kk.color||'#fff1d6',intensity:kk.intensity??1.4};}
  o.lights=ov.no_lights?[...(ov.lights||[])]:[...(o.lights||[]),...(ov.lights||[])];   /* no_lights: the key's practicals replaced by the shot's own */return o;}

/* ── a shot: staged once, snapshotted; the camera's start read from the key's own rig ── */
function snap(){const out=new Map();for(const a of ButterCast.cast){const r=a.rig,f=r.figure;out.set(a,{vis:f.visible,p:r.pos.clone(),h:r.heading,rot:f.rotation.clone(),j:Object.fromEntries(JOINTS.map(k=>[k,r[k].rotation.clone()]))});}return out;}
async function shot(sh,o={}){if(!S)throw Error('no location');const k=S.spec.keys.find(q=>q.id===sh.key);if(!k)throw Error(S.sid+' has no key '+sh.key);const spec=S.spec;
  const m0=performance.now();for(const a of S.hidden||[]){a.rig.figure.visible=true;a.rig.absent=false;}S.hidden=[];
  OdysseyFilm.hide(k.hide||[]);OdysseyFilm.props([...(spec.props||[]),...(k.props||[])]);OdysseyFilm.block(spec.blocking||[]);if(spec.spread)OdysseyFilm.spread(spec.spread);OdysseyFilm.block(k.blocking||[]);
  OdysseyFilm.propsAfter([...(spec.props||[]),...(k.props||[])]);
  /* a trailer may clear the frame of figures the key stages (one man beside the giant, not five): shot.stage.hide_actors */
  for(const id of ((sh.stage||{}).hide_actors||[])){const a=actorOf(id);if(a){a.rig.figure.visible=false;a.rig.absent=true;S.hidden.push(a);}}
  const kc=Object.assign({},k.camera,(sh.camera&&sh.camera.override)||{});OdysseyFilm.rig(kc);camera.updateMatrixWorld();const cam={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};
  const L=lookFor(k,sh.look,cam);OdysseyFilm.light(L);OdysseyFilm.look(L);OdysseyFilm.rope(k.rope||null);
  for(const f of S.faces.values())f.mesh.castShadow=false;
  /* the practicals that flicker: the warm point lights (fire, torch, lamp) */
  const flick=[];scene.traverse(x=>{if(x.isPointLight&&x.userData.kf){const c=x.color;if(c.r>c.b*1.4)flick.push({l:x,i0:x.intensity,seed:flick.length*7.3});}});
  const pose=snap();
  /* the speaker: the voice line's speaker when he stands in the key (a name matched to the cast's ids) */
  for(const P of S.perf.values()){P.speeches=[];P.speech=null;P.phrases&&(P.phrases.length=0);}
  let speaker=null;const v=sh.voice;
  if(v&&o.env){const name=String(sh.speaker_actor||v.speaker||'').toLowerCase().replace(/[^a-z ]/g,'').trim(),ids=ButterCast.cast.filter(a=>a.rig.figure.visible!==false&&!a.rig.absent).map(a=>short(a.kind));
    speaker=sh.speaker_actor&&ids.includes(sh.speaker_actor)?sh.speaker_actor:ids.find(i=>i===name.replace(/ /g,'-'))||ids.find(i=>i.split('-as-')[0]===name.split(' ')[0])||ids.find(i=>i.startsWith(name.split(' ')[0]+'-'))||null;
    if(/narrator/.test(name))speaker=null;
    const P=speaker&&S.perf.get(speaker);if(P){Perform.speak(P,{t:v.at,sec:v.clip.out-v.clip.in,text:v.words,env:o.env,hz:o.hz||50});P.speeches=[P.speech];P.speech=null;}}
  /* the move */
  const mv=(sh.camera&&sh.camera.move)||{type:'hold',amount:0,ease:'inOut'};
  SH={sh,k,cam,mv,pose,flick,speaker,env:{bg:scene.background,fog:scene.fog,tone:renderer.toneMapping,exp:renderer.toneMappingExposure,sh:renderer.shadowMap.enabled},fi:0};
  return {key:k.id,speaker,cam:{pos:cam.pos.toArray().map(v=>+v.toFixed(1)),target:cam.target.toArray().map(v=>+v.toFixed(1)),fov:+cam.fov.toFixed(1)},look:L,flicker:flick.length,ms:Math.round(performance.now()-m0)};}

const EASE={linear:u=>u,in:u=>u*u,out:u=>1-(1-u)*(1-u),inOut:sm};
function camAt(u){const {cam,mv,sh}=SH,dur=sh.dur;let x=cl01(u/dur);if(mv.stepped)x=cl01(Math.floor(u*mv.stepped)/mv.stepped/dur);const e=(EASE[mv.ease]||sm)(x),a=(mv.amount||0)*e;
  const P=cam.pos.clone(),T=cam.target.clone(),d=T.clone().sub(P),D=d.length(),f=d.clone().normalize(),r=new V3(-f.z,0,f.x).normalize();let fov=cam.fov;
  switch(mv.type){
    case 'push':P.add(d.clone().multiplyScalar(a));break;
    case 'pull':P.sub(d.clone().multiplyScalar(a));break;
    case 'zoom':fov=cam.fov*(1-a);break;
    case 'orbit':{const q=P.clone().sub(T),c=Math.cos(a),s=Math.sin(a);P.set(T.x+q.x*c-q.z*s,P.y,T.z+q.x*s+q.z*c);break;}
    case 'crane':P.y+=a*D;T.y+=a*D*(mv.tilt??1.3);break;
    case 'track':P.add(r.clone().multiplyScalar(a*D));T.add(r.clone().multiplyScalar(a*D));break;
    case 'hold':default:{const b=0.012*e;P.add(d.clone().multiplyScalar(b));}}   /* a hold breathes: a 1.2% drift in, never a frozen frame */
  /* the photographer's weight: a very small wobble, the same on every render of the frame */
  if(mv.wobble){const w=mv.wobble*D*0.002;P.x+=Math.sin(u*1.7+1)*w;P.y+=Math.sin(u*1.3+2)*w;}
  return {pos:P,target:T,fov};}

function pose(u){for(const a of ButterCast.cast){const s=SH.pose.get(a);if(!s)continue;const r=a.rig;r.figure.visible=s.vis;if(!s.vis)continue;r.pos.copy(s.p);r.heading=s.h;r.figure.position.copy(s.p);r.figure.rotation.copy(s.rot);for(const k of JOINTS)r[k].rotation.copy(s.j[k]);
    const P=S.perf.get(short(a.kind));if(!P)continue;
    P.base={'head.yaw':-s.j.headP.y};P.life=0.08;P.speech=P.speeches.find(x=>u>=x.t0-0.05&&u<=x.t0+x.sec+0.35)||null;P.last=null;
    const saved=r.seated;r.seated=true;   /* the blocking keeps the body; the performance plays on the face and the head */
    const v=Perform.apply(P,u);r.seated=saved;if(v){if(v['head.yaw']!=null)r.headP.rotation.y=-v['head.yaw'];if(v['torso.lean'])r.torsoP.rotation.x+=v['torso.lean'];}}}

function frame(u,{quality=0.9}={}){if(!SH)throw Error('no shot');const m0=performance.now();const e=SH.env;scene.background=e.bg;scene.fog=e.fog;renderer.toneMapping=e.tone;renderer.toneMappingExposure=e.exp;renderer.shadowMap.enabled=e.sh;
  pose(u);for(const F of SH.flick){const t=u*9+F.seed;F.l.intensity=F.i0*(1+0.10*Math.sin(t)*Math.sin(t*0.37+1)+0.06*Math.sin(t*2.3+F.seed));}
  const c=camAt(u);OdysseyFilm.shoot({pos:c.pos.toArray(),target:c.target.toArray(),fov:c.fov});scene.updateMatrixWorld(true);
  renderer.shadowMap.autoUpdate=false;if(SH.fi++===0)renderer.shadowMap.needsUpdate=true;
  const m1=performance.now();orig(scene,camera);renderer.getContext().finish();const m2=performance.now();
  if(!comp)comp=document.createElement('canvas');comp.width=W;comp.height=H;const g=comp.getContext('2d');g.drawImage(renderer.domElement,0,0);
  const G=Object.assign({},TR.grade||{},SH.sh.grade||{});if(Object.keys(G).length)grade(g,G);
  return {jpeg:comp.toDataURL('image/jpeg',quality).split(',')[1],ms:[m1-m0,m2-m1,performance.now()-m2].map(Math.round)};}
/* an optional grade drawn over the frame: a vignette (0..1) and a colour wash, for a shot that asks */
function grade(g,G){if(G.vignette){const r=g.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.95);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,'+G.vignette+')');g.fillStyle=r;g.fillRect(0,0,W,H);}
  if(G.wash){g.save();g.globalCompositeOperation='soft-light';g.fillStyle=G.wash;g.globalAlpha=G.washAlpha??0.35;g.fillRect(0,0,W,H);g.restore();}
  if(G.letterbox){const bar=Math.round((H-W/G.letterbox)/2);if(bar>0){g.fillStyle='#000';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);}}}

/* ── cards and black, drawn by the page ── */
const SERIF='"FreeSerif","Liberation Serif","DejaVu Serif",serif';
function trackedText(g,s,cx,cy,px,track){const ch=[...s],w=ch.reduce((n,c)=>n+g.measureText(c).width,0)+track*(ch.length-1);let x=cx-w/2;for(const c of ch){g.fillText(c,x,cy);x+=g.measureText(c).width+track;}return w;}
function fadeA(c,u,dur){const fi=c.fade_in||0,fo=c.fade_out||0;return Math.min(fi>0?cl01(u/fi):1,fo>0?cl01((dur-u)/fo):1);}
const PLATE=['#c91a09','#f2cd37','#0055bf','#c91a09','#0055bf','#f2cd37'];
/* the brick letters: a 5x7 grid font, each lit cell a 1x2 plate (two studs) */
const GLYPH={A:'01110100011000111111100011000110001',B:'11110100011000111110100011000111110',C:'01110100011000010000100001000101110',D:'11110100011000110001100011000111110',E:'11111100001000011110100001000011111',F:'11111100001000011110100001000010000',G:'01110100011000010111100011000101111',H:'10001100011000111111100011000110001',I:'01110001000010000100001000010001110',L:'10000100001000010000100001000011111',M:'10001110111010110101100011000110001',N:'10001110011010110011100011000110001',O:'01110100011000110001100011000101110',P:'11110100011000111110100001000010000',R:'11110100011000111110101001001010001',S:'01111100001000001110000010000111110',T:'11111001000010000100001000010000100',U:'10001100011000110001100011000101110',W:'10001100011000110101101011101110001',Y:'10001100010101000100001000010000100',',':'00000000000000000000001100010001000',' ':'00000000000000000000000000000000000'};
function brick(g,text,u,dur,sh){const lines=String(text).split('\n'),cell=Math.round(H*0.022),gap=Math.round(cell*0.5),cols=lines.reduce((m,l)=>Math.max(m,l.length*6-1),0);
  const cw=Math.max(4,Math.min(Math.floor(H*0.06),Math.floor(W*0.84/cols)));   /* the letters fill most of the width: a title, not a caption */const totalH=lines.length*8*cw-cw,y0=(H-totalH)/2;const cells=[];
  lines.forEach((l,li)=>{const lx=(W-(l.length*6-1)*cw)/2;[...l.toUpperCase()].forEach((ch,ci)=>{const G=GLYPH[ch]||GLYPH[' '];for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(G[r*5+c]==='1')cells.push({x:lx+(ci*6+c)*cw,y:y0+(li*8+r)*cw,col:PLATE[(ci+li)%PLATE.length],order:ci*100+r*5+c+li*1e4});});});
  cells.sort((a,b)=>a.order-b.order);const build=Math.max(0.4,dur*0.72),n=cells.length,shown=Math.min(n,Math.floor(Math.floor(u*12)/12/build*n+0.001));
  for(let i=0;i<shown;i++){const c=cells[i],drop=i>shown-4?(shown-i)*cw*0.12:0;g.fillStyle=c.col;g.fillRect(c.x,c.y-drop,cw-1,cw-1);g.fillStyle='rgba(255,255,255,0.28)';g.beginPath();g.arc(c.x+cw*0.5,c.y-drop+cw*0.45,cw*0.26,0,7);g.fill();g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(c.x,c.y-drop+cw-3,cw-1,2);}}
function card(sh,u,{quality=0.9}={}){if(!comp)comp=document.createElement('canvas');comp.width=W;comp.height=H;const g=comp.getContext('2d');const c=sh.card||{},dur=sh.dur,st=c.style||'nolan';
  const bg=(String(c.color||'').match(/on (#[0-9a-f]{3,6})/i)||[])[1]||'#000',fg=(String(c.color||'').match(/^(#[0-9a-f]{3,6})/i)||[])[1]||'#eee8dc';
  g.fillStyle=sh.kind==='BLACK'?'#000':bg;g.fillRect(0,0,W,H);
  if(sh.kind==='BLACK'){if(/firelight|flicker|ember/i.test(sh.action||'')){const f=0.5+0.5*Math.sin(u*9)*Math.sin(u*3.7+1);const r=g.createRadialGradient(W*0.3,H*0.85,10,W*0.3,H*0.85,H*0.9);r.addColorStop(0,`rgba(255,120,40,${0.05+0.035*f})`);r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,W,H);}
    return {jpeg:comp.toDataURL('image/jpeg',quality).split(',')[1]};}
  const a=fadeA(c,u,dur),lines=String(c.text||'').split('\n');g.save();g.globalAlpha=a;g.textBaseline='middle';
  if(st==='brick'){g.globalAlpha=1;brick(g,c.text||'',u,dur,sh);}
  else if(st==='bronze'){const push=1+0.03*sm(u/dur),px=H*0.085*push;g.font=`600 ${px}px ${SERIF}`;const y=H/2;
    g.fillStyle='#2a1d0c';trackedText(g,lines[0],W/2+2,y+3,px,px*0.28);const gr=g.createLinearGradient(0,y-px/2,0,y+px/2);gr.addColorStop(0,'#f3dc96');gr.addColorStop(0.5,fg);gr.addColorStop(1,'#8a6424');g.fillStyle=gr;trackedText(g,lines[0],W/2,y,px,px*0.28);
    g.globalAlpha=a*0.5;g.fillStyle='#fff6d8';g.fillRect(W/2-px*2.6,y+px*0.72,px*5.2,Math.max(1,H*0.0025));}
  else{const title=st==='nolan-title',px=H*(title?0.09:0.04);g.font=`${title?500:400} ${px}px ${SERIF}`;g.fillStyle=fg;
    lines.forEach((l,i)=>trackedText(g,l,W/2,H/2+(i-(lines.length-1)/2)*px*1.6,px,px*(title?0.42:0.55)));}
  g.restore();return {jpeg:comp.toDataURL('image/jpeg',quality).split(',')[1]};}

window.OdysseyTrailer={start,location:enter,shot,frame,card,info,end:endScene,get state(){return SH&&{key:SH.k.id,speaker:SH.speaker,move:SH.mv};}};
})();

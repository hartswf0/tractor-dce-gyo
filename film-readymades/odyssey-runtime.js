/* The forage shelf: runs in the Butter workspace closure (create, S, catalog, refresh, persist, controls are in scope).
   Every card of the Odyssey forage, searchable; choosing one sets its build down where the camera looks, as real parts that
   stay put (pinned) until a piece is picked up, all of them selected so the build moves as one. */
(function(){
 const root=new URL('../../',location.href).href;
 const panel=document.createElement('section');panel.id='forageShelf';panel.hidden=true;
 panel.innerHTML='<div class="fs-head"><strong>Forage</strong><input id="fsQuery" type="search" placeholder="Search the Odyssey cards" aria-label="Search the forage"><button id="fsClose" aria-label="Close the forage">×</button></div><div id="fsTypes"></div><div id="fsList" role="list"></div><p id="fsNote">Choose a card: its build is set down where the camera looks, selected, ready to move.</p>';
 document.body.appendChild(panel);
 const open=document.createElement('button');open.id='fsOpen';open.textContent='Forage';open.title='Add a build from the Odyssey forage';
 (document.getElementById('filmWorldTools')||document.body).appendChild(open);if(!open.parentElement||open.parentElement===document.body)open.classList.add('fs-float');
 let cards=[],type='character';
 const TYPES=[['character','Cast'],['ensemble','Crowds'],['creature','Creatures'],['prop','Props'],['set_piece','Set pieces'],['location','Locations'],['vehicle','Vehicles'],['divine_fx','Divine'],['environment','Weather']];
 async function load(){if(cards.length)return;try{cards=(await (await fetch(root+'odyssey/forage.json')).json()).cards.filter(c=>c.type!=='scene');}catch(e){$('#fsNote').textContent='The forage index could not be read ('+e.message+').';}draw();}
 function draw(){const q=$('#fsQuery').value.trim().toLowerCase();$('#fsTypes').innerHTML=TYPES.map(([k,l])=>`<button data-t="${k}" class="${k===type?'on':''}">${l}</button>`).join('');
  const list=cards.filter(c=>(q?true:c.type===type)&&(!q||c.name.toLowerCase().includes(q))).slice(0,60);
  $('#fsList').innerHTML=list.map(c=>`<button role="listitem" data-id="${c.id}">${c.thumb?`<img alt="" loading="lazy" src="${root}odyssey/thumbs/${c.id}.webp">`:'<span class="fs-sym">'+c.name.slice(0,2)+'</span>'}<span>${c.name}</span><small>${c.pieces} pieces</small></button>`).join('')||'<p>No card matches.</p>';}
 $('#fsTypes').onclick=e=>{const b=e.target.closest('[data-t]');if(b){type=b.dataset.t;$('#fsQuery').value='';draw();}};
 $('#fsQuery').oninput=draw;
 open.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)load();};$('#fsClose').onclick=()=>panel.hidden=true;
 $('#fsList').onclick=async e=>{const b=e.target.closest('[data-id]');if(!b)return;const id=b.dataset.id;$('#fsNote').textContent='Fetching '+id+'…';
  try{const doc=await (await fetch(root+'odyssey/butter/'+id+'.json')).json();
   for(const pid of new Set(doc.parts.map(p=>p.part)))if(!catalog.has(pid))await ButterRepository.load(pid);
   const at=controls.target,added=[];let n=S.next||1;
   for(const p of doc.parts){const row={id:'p'+(n++),part:p.part,color:p.color,x:p.x+at.x,y:p.y+Math.max(0,at.y*0),z:p.z+at.z,r:p.r||0,...(p.q?{q:p.q.slice()}:{})};added.push(create(row));}
   S.next=n;try{PH.pinned=PH.pinned||new Set();for(const p of added)PH.pinned.add(p.id);}catch(_){ }
   S.selected=new Set(added.map(p=>p.id));refresh();persist();$('#fsNote').textContent=`${doc.name}: ${added.length} parts set down and selected. Move them as one; a part picked up alone comes loose.`;}
  catch(err){$('#fsNote').textContent='Could not add '+id+': '+err.message;console.error('[forage shelf]',err);}};
})();
/* Keyframes: the critical stills of a scene, blocked and framed by hand and scored before anything is rendered as film.
   block() stands an actor, turns it to face a point or another actor, and holds a pose (pivot rotations, radians) that the
   walk cycle leaves alone; shoot() places the camera; score() measures what the still shows of each subject. */
const kfShort=k=>k.replace(/^odyssey-od-b\d\d-s\d\d-/,'');
const kfActor=id=>ButterCast.cast.find(a=>kfShort(a.kind)===id);
const kfWorld=o=>o.getWorldPosition(new THREE.Vector3());
const kfShown=o=>{for(;o;o=o.parent)if(o.visible===false)return false;return true;};
const kfSolid=o=>o.isMesh&&kfShown(o)&&!o.userData.rope&&!(o.geometry&&o.geometry.type==='PlaneGeometry')&&!(o.userData&&o.userData.axis)&&!(o.material&&o.material.transparent&&o.material.opacity<0.3);   /* the set and the cast, not the workspace's helper planes */
function kfCast(){return ButterCast.cast.map(a=>{const b=new THREE.Box3().setFromObject(a.rig.figure);return {id:kfShort(a.kind),x:+a.rig.pos.x.toFixed(1),y:+a.rig.pos.y.toFixed(1),z:+a.rig.pos.z.toFixed(1),heading:+a.rig.heading.toFixed(2),height:+(b.max.y-b.min.y).toFixed(1)};});}
function kfPieces(){const A=filmAsset();return (A.pages||[]).map((pg,i)=>({label:pg.label,x:+A.rows[i].x.toFixed(1),z:+A.rows[i].z.toFixed(1),box:pg.box||null}));}
/* the floor under a figure: the first surface below its knee (a deck, a crag, the plate), not a yard or a roof above it */
function kfFloor(a){const r=a.rig,k=r.headP.getWorldScale(new THREE.Vector3()).y,meshes=[],figs=new Set();ButterCast.cast.forEach(b=>b.rig.figure.traverse(o=>figs.add(o)));scene.traverse(o=>{if(kfSolid(o)&&!figs.has(o))meshes.push(o);});
  const ray=new THREE.Raycaster(new THREE.Vector3(r.pos.x,r.pos.y+40*k,r.pos.z),new THREE.Vector3(0,-1,0));ray.far=400;const h=ray.intersectObjects(meshes,true)[0];return h?h.point.y:r.pos.y;}
/* a crowd given room: figures nearer than min (world units) are pushed apart, evenly, until none are, then stood on their floor */
function kfSpread(min,ids){const acts=ButterCast.cast.filter(a=>!ids||ids.includes(kfShort(a.kind)));
  for(let it=0;it<60;it++){let moved=false;for(let i=0;i<acts.length;i++)for(let j=i+1;j<acts.length;j++){const p=acts[i].rig.pos,q=acts[j].rig.pos,dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);
    if(d<min){const push=(min-d)/2+0.5,ux=d>1e-3?dx/d:Math.cos(i+j),uz=d>1e-3?dz/d:Math.sin(i+j);p.x-=ux*push;p.z-=uz*push;q.x+=ux*push;q.z+=uz*push;moved=true;}}if(!moved)break;}
  for(const a of acts){a.rig.pos.y=kfFloor(a);a.rig.figure.position.copy(a.rig.pos);}}
const kfInside=(o,r)=>{for(;o;o=o.parent)if(o===r)return true;return false;};
function kfBlock(list){for(const e of list){const a=kfActor(e.id);if(!a){console.warn('[keyframe] no actor',e.id);continue;}const r=a.rig;
  /* absent: the actor is not in this still (the men already swine): hidden, and left out of the physics */
  r.absent=!!e.absent;r.figure.visible=!e.absent;if(e.absent)continue;
  if(typeof e.at==='string'){const p=kfPoint(e.at).add(new THREE.Vector3(...(e.off||[0,0,0])));r.pos.x=p.x;r.pos.z=p.z;}
  if(e.x!=null)r.pos.x=e.x;if(e.z!=null)r.pos.z=e.z;if(e.y==='ground')r.pos.y=kfGround(r.pos.x,r.pos.z);else if(e.y==='floor')r.pos.y=kfFloor(a);
  else if(e.y==='surface'){const from=(typeof e.at==='string'?kfPoint(e.at).y:r.pos.y+200)-(e.reach??25);const figs=new Set();ButterCast.cast.forEach(b=>b.rig.figure.traverse(o=>figs.add(o)));const ms=[];scene.traverse(o=>{if(kfSolid(o)&&!figs.has(o)&&!(o.parent&&kfPropObjs.get('stake')&&kfInside(o,kfPropObjs.get('stake'))))ms.push(o);});
    const h=new THREE.Raycaster(new THREE.Vector3(r.pos.x,from,r.pos.z),new THREE.Vector3(0,-1,0)).intersectObjects(ms,true)[0];r.pos.y=h?h.point.y:r.pos.y;}   /* stood on the highest body under a grip: a man on the giant's chest */else if(e.y!=null)r.pos.y=e.y;
  const f=typeof e.face==='string'?(e.face.startsWith('@')?kfAnchor(e.face.slice(1)):kfActor(e.face)?.rig.pos):Array.isArray(e.face)?{x:e.face[0],z:e.face[1]}:null;
  if(f)r.heading=Math.atan2(f.x-r.pos.x,f.z-r.pos.z);else if(e.heading!=null)r.heading=e.heading;
  r.figure.position.copy(r.pos);r.figure.rotation.y=r.heading;r.hold=e.pose||r.hold||{};
  for(const k of ['armRP','armLP','headP','torsoP','legRP','legLP']){const v=r.hold[k]||[0,0,0];r[k].rotation.set(v[0],v[1],v[2]);}
  /* sit: the thighs level, the hips on the highest seat under the figure (a bench, a throne), the feet hanging; the support check then looks under the hips */
  r.sat=!!e.sit;if(e.sit){const figs=new Set();ButterCast.cast.forEach(b=>b.rig.figure.traverse(o=>figs.add(o)));const ms=[];scene.traverse(o=>{if(kfSolid(o)&&!figs.has(o))ms.push(o);});
    const h=new THREE.Raycaster(new THREE.Vector3(r.pos.x,r.pos.y+(e.reach??60),r.pos.z),new THREE.Vector3(0,-1,0)).intersectObjects(ms,true)[0];
    if(h){r.figure.updateMatrixWorld(true);const hy=kfWorld(r.legRP).y-r.figure.position.y;r.pos.y=h.point.y-hy+(e.lift??1.5);r.figure.position.copy(r.pos);}}
  /* props: false empties the hands (a man bound to a mast holds no sword): each arm pivot carries its arm, its hand, then what it holds */
  /* the arm pivot holds three empty slots (arm, hand, weapon), then the parts: the arm, the hand, then what it holds. Only that last is hidden. */
  if(e.props!=null)for(const k of ['armRP','armLP']){const g=r[k].children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot'));g.forEach((c,i)=>c.visible=i<2||e.props!==false);}
  /* mask: headgear from the prop library worn in place of the hat (the pig headdress on a man half turned); the head pivot holds the head, then the hat, in LDraw units */
  const hp=r.headP;hp.children.filter(c=>c.name==='kfmask').forEach(c=>hp.remove(c));const hg=hp.children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot'));
  if(hg[1])hg[1].visible=!e.mask;if(e.mask&&kfPropLib&&kfPropLib[e.mask]){const m=kfPropLib[e.mask].template.clone(true);m.name='kfmask';hp.add(m);}}}
function kfShoot(c){camera.position.set(...c.pos);if(c.fov)camera.fov=c.fov;camera.updateProjectionMatrix();controls.target.set(...c.target);camera.lookAt(controls.target);camera.updateMatrixWorld();}
/* a set piece as a subject (a troll, a giant, the ship): rays to its crown, middle and flanks; its box on screen */
function kfScorePiece(label,meshes,ray,cam,scr){const b=kfPiece(label);if(!b)return {missing:true};const V=THREE.Vector3,cx=(b[0]+b[3])/2,cz=(b[2]+b[5])/2,h=b[4]-b[1];
  const pts=[new V(cx,b[1]+h*0.85,cz),new V(cx,b[1]+h*0.55,cz),new V(b[0]+(b[3]-b[0])*0.25,b[1]+h*0.5,cz),new V(b[0]+(b[3]-b[0])*0.75,b[1]+h*0.5,cz)];let seen=0;
  for(const p of pts){const d=p.clone().sub(cam),dist=d.length();ray.set(cam,d.normalize());ray.far=dist;const hits=ray.intersectObjects(meshes,true);
    const first=hits[0];if(!first||first.distance>dist-Math.max(b[3]-b[0],b[5]-b[2])*0.6)seen++;}   /* a hit inside the piece's own depth is the piece */
  const cs=[];for(const x of [b[0],b[3]])for(const y of [b[1],b[4]])for(const z of [b[2],b[5]])cs.push(scr(new V(x,y,z)));
  const u0=Math.min(...cs.map(c=>c[0])),u1=Math.max(...cs.map(c=>c[0])),v0=Math.min(...cs.map(c=>c[1])),v1=Math.max(...cs.map(c=>c[1])),hs=scr(pts[0]);
  const thirds=Math.min(...[1/3,2/3].map(t=>Math.abs(hs[0]-t)),...[1/3,2/3].map(t=>Math.abs(hs[1]-t)));
  return {visible:+(seen/pts.length).toFixed(2),size:+(v1-v0).toFixed(3),inFrame:u0>=-0.01&&u1<=1.01&&v0>=-0.01&&v1<=1.01,head:[+hs[0].toFixed(3),+hs[1].toFixed(3)],facing:1,thirds:+thirds.toFixed(3),headroom:+v0.toFixed(3),behind:cs.some(c=>c[2]>1)};}
function kfScore(subs){scene.updateMatrixWorld(true);camera.updateMatrixWorld();const meshes=[];scene.traverse(o=>{if(kfSolid(o))meshes.push(o);});
  const ray=new THREE.Raycaster(),cam=camera.position.clone(),scr=v=>{const q=v.clone().project(camera);return [(q.x+1)/2,(1-q.y)/2,q.z];};
  const inside=(o,root)=>{for(;o;o=o.parent)if(o===root)return true;return false;};
  const out={};for(const s of subs){if(s.id.startsWith('piece:')||s.id.startsWith('prop:')){out[s.id]=kfScorePiece(s.id.startsWith('prop:')?s.id:s.id.slice(6),meshes,ray,cam,scr);continue;}const a=kfActor(s.id);if(!a){out[s.id]={missing:true};continue;}const fig=a.rig.figure;
   const head=kfHead(s.id),torso=kfWorld(a.rig.torsoP),hips=kfWorld(a.rig.hipsP),tall=head.y-a.rig.pos.y;
   /* the body, not its props: crown, feet, both shoulders */
   const body=[head.clone().add(new THREE.Vector3(0,tall*0.12,0)),a.rig.pos.clone(),kfWorld(a.rig.armRP),kfWorld(a.rig.armLP)].map(scr);
   const u0=Math.min(...body.map(c=>c[0])),u1=Math.max(...body.map(c=>c[0])),v0=Math.min(...body.map(c=>c[1])),v1=Math.max(...body.map(c=>c[1]));
   const pts=[head,torso.clone().lerp(head,0.3),torso,hips];let seen=0;
   for(const p of pts){const d=p.clone().sub(cam),dist=d.length();ray.set(cam,d.normalize());ray.far=dist-1;const hit=ray.intersectObjects(meshes,true).find(h=>!inside(h.object,fig));if(!hit)seen++;}
   const hs=scr(head),fwd=new THREE.Vector3(Math.sin(a.rig.heading),0,Math.cos(a.rig.heading)),to=cam.clone().sub(a.rig.pos).setY(0).normalize();
   const thirds=Math.min(...[1/3,2/3].map(t=>Math.abs(hs[0]-t)),...[1/3,2/3].map(t=>Math.abs(hs[1]-t)));
   out[s.id]={visible:+(seen/pts.length).toFixed(2),size:+(v1-v0).toFixed(3),inFrame:u0>=-0.01&&u1<=1.01&&v0>=-0.01&&v1<=1.01,head:[+hs[0].toFixed(3),+hs[1].toFixed(3)],facing:+fwd.dot(to).toFixed(2),thirds:+thirds.toFixed(3),headroom:+v0.toFixed(3),behind:hs[2]>1||body.some(c=>c[2]>1)};}
  return out;}
/* ground: the top of whatever is under (x, z), figures aside */
function kfGround(x,z){const meshes=[],figs=new Set();ButterCast.cast.forEach(a=>a.rig.figure.traverse(o=>figs.add(o)));scene.traverse(o=>{if(kfSolid(o)&&!figs.has(o))meshes.push(o);});
  const ray=new THREE.Raycaster(new THREE.Vector3(x,2000,z),new THREE.Vector3(0,-1,0));const h=ray.intersectObjects(meshes,true)[0];return h?h.point.y:0;}
/* camera rigs, from the blocking: two (a two-shot across the line between a and b, biased to a's face), hero (in front of a's
   face, low or high), ots (over a's shoulder at b), wide (a free position looking at a point); place puts the subject's head on a
   thirds line (L, R) or the centre, by turning the camera about its own axis */
function kfPiece(label){if(label.startsWith('prop:')){const h=kfPropObjs.get(label.slice(5));if(!h)return null;const b=new THREE.Box3().setFromObject(h);return [b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z];}const A=filmAsset(),i=(A.pages||[]).findIndex(pg=>pg.label===label)>=0?(A.pages||[]).findIndex(pg=>pg.label===label):(A.pages||[]).findIndex(pg=>pg.label.includes(label));return i>=0&&A.pages[i].box?A.pages[i].box:null;}
function kfPieceHead(label){const b=kfPiece(label);return b?new THREE.Vector3((b[0]+b[3])/2,b[1]+(b[4]-b[1])*0.8,(b[2]+b[5])/2):null;}
function kfHead(id){if(typeof id==='string'&&id.startsWith('@'))return kfAnchor(id.slice(1));if(typeof id==='string'&&id.startsWith('piece:'))return kfPieceHead(id.slice(6));if(typeof id==='string'&&id.startsWith('prop:')){const b=kfPiece(id);return b?new THREE.Vector3((b[0]+b[3])/2,b[1]+(b[4]-b[1])*0.8,(b[2]+b[5])/2):null;}const a=kfActor(id),k=a.rig.headP.getWorldScale(new THREE.Vector3()).y;return kfWorld(a.rig.headP).add(new THREE.Vector3(0,-12*k*(a.rig.headP.position.y<0?1:-1),0));}   /* the middle of the head, 12 LDU above the neck (the rig's y runs down) */
function kfRig(c){const V=THREE.Vector3;let pos,target;
  if(c.type==='two'){const A=kfHead(c.a),Bh=kfHead(c.b),mid=A.clone().lerp(Bh,0.5),ab=Bh.clone().sub(A).setY(0),span=ab.length(),n=new V(-ab.z,0,ab.x).normalize().multiplyScalar(c.side||1);
    const fa=kfActor(c.a)?.rig||{heading:0},face=new V(Math.sin(fa.heading),0,Math.cos(fa.heading));pos=mid.clone().add(n.clone().multiplyScalar(c.dist||span*1.6)).add(face.multiplyScalar((c.bias??0.35)*(c.dist||span*1.6))).add(new V(0,c.height||0,0));target=mid;}
  else if(c.type==='hero'){const A=kfHead(c.a),r=kfActor(c.a)?.rig||{heading:0},yaw=r.heading+(c.yaw||0),face=new V(Math.sin(yaw),0,Math.cos(yaw));pos=A.clone().add(face.multiplyScalar(c.dist||120)).add(new V(0,c.height||0,0));target=A.clone().add(new V(0,c.aimY||0,0));}
  else if(c.type==='ots'){const A=kfHead(c.over),T=typeof c.at==='string'?kfHead(c.at):new V(...c.at),d=T.clone().sub(A).setY(0).normalize(),n=new V(-d.z,0,d.x).multiplyScalar(c.side||1);
    pos=A.clone().sub(d.clone().multiplyScalar(c.dist||60)).add(n.multiplyScalar(c.off||18)).add(new V(0,c.height||8,0));target=T;}
  else if(c.type==='orbit'){const C=kfPoint(c.around),A=c.az;pos=new V(C.x+Math.sin(A)*c.r,c.h,C.z+Math.cos(A)*c.r);target=c.target?kfPoint(c.target):C;}   /* round an anchor, as the turnaround saw it */
  else {pos=new V(...c.pos);target=typeof c.target==='string'?kfHead(c.target):new V(...c.target);}
  kfShoot({pos:pos.toArray(),target:target.toArray(),fov:c.fov||35});
  if(c.place&&c.subject){const want=c.place==='L'?1/3:c.place==='R'?2/3:0.5;for(let i=0;i<6;i++){const h=kfHead(c.subject).project(camera),u=(h.x+1)/2,err=u-want;if(Math.abs(err)<0.005)break;camera.rotateY(-err*2*Math.atan(Math.tan(THREE.MathUtils.degToRad(c.fov||35)/2)*camera.aspect)*0.9);camera.updateMatrixWorld();}}
  if(c.eye&&c.subject){for(let i=0;i<6;i++){const h=kfHead(c.subject).project(camera),v=(1-h.y)/2,err=v-c.eye;if(Math.abs(err)<0.005)break;camera.rotateX(-err*THREE.MathUtils.degToRad(c.fov||35)*0.9);camera.updateMatrixWorld();}}
  return {pos:camera.position.toArray().map(v=>+v.toFixed(1))};}
/* what crowds the lens: a grid of rays from the camera; anything nearer than near x the subject's distance that is not an allowed
   figure (the shoulder in an over-the-shoulder) is a foreground intrusion */
function kfLens(subject,allow=[],near=0.3){const meshes=[];scene.traverse(o=>{if(kfSolid(o))meshes.push(o);});const skip=new Set();allow.forEach(id=>kfActor(id)?.rig.figure.traverse(o=>skip.add(o)));
  const d=kfHead(subject).distanceTo(camera.position),ray=new THREE.Raycaster();let hits=0,n=0;
  for(let i=0;i<7;i++)for(let j=0;j<5;j++){const ndc=new THREE.Vector2(-0.9+i*0.3,-0.8+j*0.4);ray.setFromCamera(ndc,camera);ray.far=Math.min(d*near,45);n++;const h=ray.intersectObjects(meshes,true).find(h=>!skip.has(h.object));if(h)hits++;}
  return +(hits/n).toFixed(2);}
/* foreground clutter: another figure nearer the lens than three quarters of the subject's distance, its head inside the frame */
function kfClutter(subject,allow=[]){const d=kfHead(subject).distanceTo(camera.position),out=[],meshes=[],ray=new THREE.Raycaster();scene.traverse(o=>{if(kfSolid(o))meshes.push(o);});
  const inside=(o,r)=>{for(;o;o=o.parent)if(o===r)return true;return false;};
  for(const a of ButterCast.cast){const id=kfShort(a.kind);if(id===subject||allow.includes(id))continue;
    for(const pt of [kfHead(id),kfWorld(a.rig.torsoP)]){const q=pt.clone().project(camera),dist=pt.distanceTo(camera.position);if(!(q.z<1&&Math.abs(q.x)<0.98&&Math.abs(q.y)<0.98&&dist<0.75*d))continue;
      ray.set(camera.position,pt.clone().sub(camera.position).normalize());ray.far=dist+2;const h=ray.intersectObjects(meshes,true)[0];if(h&&inside(h.object,a.rig.figure)){out.push(id);break;}}}
  return out;}
/* the look of a still: a sky graded from zenith to horizon, a haze toward the horizon */
function kfLook(l={}){const sky=l.sky||['#6fa3d8','#e9dcc0'];const c=document.createElement('canvas');c.width=2;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,sky[0]);gr.addColorStop(1,sky[1]);g.fillStyle=gr;g.fillRect(0,0,2,256);
  const t=new THREE.CanvasTexture(c);scene.background=t;if(l.fog!==false)scene.fog=new THREE.Fog(new THREE.Color(sky[1]),(l.fog||[900,2600])[0],(l.fog||[900,2600])[1]);}
/* ── the body in three dimensions ──
   Every LDraw part of a figure (torso, hips, legs, arms, hands, head, hair, what it holds) as an oriented box: its own local bounds,
   shrunk a little so parts that merely touch pass, carried by the part's world matrix. Two figures collide when any box of one
   meets any box of the other (the separating-axis test); a figure is supported when a surface lies under its feet. */
function kfBoxes(a,shrink=0.12){const out=[];a.rig.figure.updateMatrixWorld(true);a.rig.figure.traverse(o=>{if(!o.isMesh||!o.visible||!o.geometry)return;let v=o;for(;v;v=v.parent)if(v.visible===false)return;
   if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,c=b.getCenter(new THREE.Vector3()),h=b.getSize(new THREE.Vector3()).multiplyScalar(0.5*(1-shrink));
   const m=o.matrixWorld,e=m.elements,ax=[new THREE.Vector3(e[0],e[1],e[2]),new THREE.Vector3(e[4],e[5],e[6]),new THREE.Vector3(e[8],e[9],e[10])],sc=ax.map(x=>x.length());
   out.push({c:c.clone().applyMatrix4(m),ax:ax.map(x=>x.normalize()),h:[h.x*sc[0],h.y*sc[1],h.z*sc[2]],name:(o.parent&&o.parent.userData&&o.parent.userData.file)||''});});return out;}
function kfSat(A,B){const T=B.c.clone().sub(A.c),axes=[...A.ax,...B.ax];for(const a of A.ax)for(const b of B.ax){const x=a.clone().cross(b);if(x.lengthSq()>1e-8)axes.push(x.normalize());}
  for(const L of axes){const ra=A.h[0]*Math.abs(A.ax[0].dot(L))+A.h[1]*Math.abs(A.ax[1].dot(L))+A.h[2]*Math.abs(A.ax[2].dot(L)),rb=B.h[0]*Math.abs(B.ax[0].dot(L))+B.h[1]*Math.abs(B.ax[1].dot(L))+B.h[2]*Math.abs(B.ax[2].dot(L));if(Math.abs(T.dot(L))>ra+rb)return false;}return true;}
function kfPhysics(ids,touch=[]){const set=new Set(ids),acts=ButterCast.cast.filter(a=>set.has(kfShort(a.kind))&&!a.rig.absent),boxes=new Map(acts.map(a=>[a,kfBoxes(a)])),collide=[],floating=[];
  const ok=(p,q)=>touch.some(([x,y])=>(x===p&&y===q)||(x===q&&y===p));
  for(let i=0;i<acts.length;i++)for(let j=i+1;j<acts.length;j++){const a=acts[i],b=acts[j],p=kfShort(a.kind),q=kfShort(b.kind);if(a.rig.pos.distanceTo(b.rig.pos)>140||ok(p,q))continue;
    let n=0;for(const A of boxes.get(a))for(const B of boxes.get(b))if(kfSat(A,B))n++;if(n)collide.push([p,q,n]);}
  const meshes=[],figs=new Set();ButterCast.cast.forEach(a=>a.rig.figure.traverse(o=>figs.add(o)));scene.traverse(o=>{if(kfSolid(o)&&!figs.has(o))meshes.push(o);});
  for(const a of acts){const k=a.rig.headP.getWorldScale(new THREE.Vector3()).y;
    if(a.rig.sat){a.rig.figure.updateMatrixWorld(true);const hp=kfWorld(a.rig.legRP),lp=kfWorld(a.rig.legLP),c=hp.clone().add(lp).multiplyScalar(0.5),h=new THREE.Raycaster(c.clone().add(new THREE.Vector3(0,2*k,0)),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,true)[0],gap=h?c.y-h.point.y:Infinity;
      if(gap<-2*k||gap>14*k)floating.push([kfShort(a.kind),h?+gap.toFixed(1):null]);continue;}   /* seated: the hips on the seat, the thighs' own depth above it */
    const from=a.rig.pos.clone().add(new THREE.Vector3(0,30*k,0)),ray=new THREE.Raycaster(from,new THREE.Vector3(0,-1,0));ray.far=200;
    const h=ray.intersectObjects(meshes,true)[0],gap=h?a.rig.pos.y-h.point.y:Infinity;if(Math.abs(gap)>3*k)floating.push([kfShort(a.kind),h?+gap.toFixed(1):null]);}
  return {collide,floating};}
/* rope: a braided string as LDraw models one (a chain of short cylinders along a path), here wound in loops round a figure and the
   post it is bound to, at heights along the figure (fractions of its height above the feet), knotted with a hanging tail */
const kfRopes=[];
/* a figure's hand in the world: the hand part (the second part on the arm pivot) of its right arm, or its left */
function kfHand(id,side='R'){const a=kfActor(id);if(!a)return null;const g=a.rig['arm'+side+'P'].children.filter(c=>c.type==='Group'&&!String(c.name).startsWith('slot'))[1];return g?new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()):null;}
function kfRope(r){for(const m of kfRopes.splice(0))m.parent&&m.parent.remove(m);if(!r)return;for(const b of [].concat(r)){const a=kfActor(b.who);if(!a)continue;
  const k=a.rig.headP.getWorldScale(new THREE.Vector3()).y,feet=a.rig.pos,post=new THREE.Vector3(b.post[0],feet.y,b.post[1]),tall=kfHead(b.who).y-feet.y+10*k;
  const c=feet.clone().add(post).multiplyScalar(0.5),d=post.clone().sub(feet).setY(0),len=d.length(),u=d.clone().normalize(),n=new THREE.Vector3(-u.z,0,u.x);
  const A=len/2+(b.radius||14)*k,Bn=(b.radius||14)*k,mat=new THREE.MeshStandardMaterial({color:b.color||'#8a6a3e',roughness:0.9});
  for(const f of b.at||[0.72,0.5,0.22]){const pts=[];for(let i=0;i<=48;i++){const t=i/48*Math.PI*2*1.9,y=feet.y+tall*f+(i/48-0.5)*3*k;pts.push(c.clone().add(u.clone().multiplyScalar(Math.cos(t)*A)).add(n.clone().multiplyScalar(Math.sin(t)*Bn)).setY(y));}
    const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,(b.thick||1.6)*k,8,false),mat);tube.userData.rope=true;scene.add(tube);kfRopes.push(tube);}
  /* rope ends hauled: from the knot to each named figure's hand */
  const knotP=c.clone().add(u.clone().multiplyScalar(A)).setY(feet.y+tall*0.5);
  for(const who of b.pull||[]){const h=kfHand(who);if(!h)continue;const mid=knotP.clone().lerp(h,0.5).add(new THREE.Vector3(0,-6*k,0));
    const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([knotP,mid,h]),40,(b.thick||1.6)*k,8,false),mat);t.userData.rope=true;scene.add(t);kfRopes.push(t);}
  const knot=c.clone().add(u.clone().multiplyScalar(A)).setY(feet.y+tall*0.5),tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([knot,knot.clone().add(new THREE.Vector3(0,-14*k,2*k)),knot.clone().add(new THREE.Vector3(3*k,-26*k,5*k))]),24,(b.thick||1.6)*k,8,false),mat);tail.userData.rope=true;scene.add(tail);kfRopes.push(tail);}}
/* ── props: what a still stages beyond the set (odyssey/keyframes/props.json), parsed from the part packs, placed in the location's
   frame (LDraw y down, scaled and flipped as the set's pieces are), with anchors a still can aim at, stand on, look at or light ── */
let kfPropLib=null;const kfPropObjs=new Map(),kfLights=[];const KV=THREE.Vector3;
async function kfLoadProps(){if(kfPropLib)return;const root=new URL('../../',location.href).href;kfPropLib=await (await fetch(root+'odyssey/keyframes/props.json')).json();
  const ids=new Set();for(const p of Object.values(kfPropLib))for(const r of p.parts)ids.add(r.part.replace(/\.dat$/,''));
  for(const id of ids){if(ButterLDraw.parts['parts/'+id+'.dat'])continue;try{const pk=await (await fetch(root+'odyssey/packs/'+id.replace('/','_')+'.json')).json();
    for(const [k,v] of Object.entries(pk)){ButterLDraw.parts[k]=v;ButterLDraw.parts[(k.startsWith('parts/')||k.startsWith('p/'))?k:'parts/'+k]=v;if(k.startsWith('p/'))ButterLDraw.parts[k.slice(2)]=v;}}catch(e){console.warn('[props] no pack',id);}}
  for(const p of Object.values(kfPropLib))p.template=await new Promise((res,rej)=>{const l=new THREE.LDrawLoader();l.setFileMap({});Object.assign(l.subobjectCache,ButterLDraw.parts);
    l.parse(ButterLDraw.colors+'\n'+p.parts.map(r=>'1 '+r.color+' '+r.m.join(' ')+' parts/'+r.part).join('\n'),'prop.ldr',res,rej);});
  /* LDraw colours are sRGB; the renderer encodes to sRGB on output, so the props' colours go linear once (as the baked set's do), or a dark grey wolf renders near white */
  const lin=new Set();for(const p of Object.values(kfPropLib))p.template.traverse(o=>{for(const m of [].concat(o.material||[]))if(m&&m.color&&!lin.has(m)){lin.add(m);if(renderer.outputEncoding===THREE.sRGBEncoding)m.color.convertSRGBToLinear();}});}
function kfAnchor(n){let o=null;scene.traverse(q=>{if(!o&&q.name==='@'+n)o=q;});return o?o.getWorldPosition(new KV()):null;}
function kfPoint(p){if(Array.isArray(p))return new KV(...p);if(typeof p==='string'&&p.startsWith('@'))return kfAnchor(p.slice(1));return kfHead(p);}
function kfProps(list){for(const o of kfPropObjs.values())scene.remove(o);kfPropObjs.clear();const sc=filmAsset().scale;
  for(const e of list||[]){const P=kfPropLib[e.name];if(!P){console.warn('[props] unknown',e.name);continue;}const id=e.id||e.name,g=P.template.clone(true),m=e.scale||1;g.scale.set(sc*m,-sc*m,-sc*m);
    for(const [an,v] of Object.entries(P.anchors||{})){const o=new THREE.Object3D();o.position.set(...v);o.name='@'+id+'.'+an;g.add(o);}
    const h=new THREE.Group();h.add(g);h.name='prop:'+id;
    const at=e.at?kfPoint(e.at).add(new KV(...(e.off||[0,0,0]))):new KV();for(const o of kfPropObjs.values())o.visible=false;const ground=e.floor?kfGround(at.x,at.z):null;for(const o of kfPropObjs.values())o.visible=true;   /* a prop rests on the set, not on another prop */
    if(e.rot)h.rotation.set(e.rot[0],e.rot[1],e.rot[2],'YXZ');scene.add(h);kfPropObjs.set(id,h);h.updateMatrixWorld(true);
    if(e.aim){const to=kfPoint(e.aim.to).add(new KV(...(e.aim.off||[0,0,0]))),dir=(e.aim.from?to.clone().sub(kfPoint(e.aim.from)):new KV(...e.aim.dir)).normalize();
      h.quaternion.setFromUnitVectors(new KV(0,-1,0),dir);if(e.aim.spin)h.rotateOnWorldAxis(dir,e.aim.spin);h.updateMatrixWorld(true);
      const tip=kfAnchor(id+'.'+e.aim.anchor);h.position.add(to.clone().sub(tip)).add(dir.clone().multiplyScalar(e.aim.sink||0));}
    else{h.position.copy(at);if(e.floor){h.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(h);h.position.y+=ground-b.min.y-(e.sink||0);}}
    h.updateMatrixWorld(true);}}
function kfHide(labels){const A=filmAsset(),hide=new Set((labels||[]).map(l=>l.toLowerCase()));(A.pages||[]).forEach((pg,i)=>{const p=S.parts.find(q=>q.id===A.rows[i].id);if(p&&p.mesh)p.mesh.visible=!hide.has(pg.label.toLowerCase());});}
/* light: dim the day (the location's own lights) and add point lights, firelight, at points or anchors */
/* every surface drawn both ways: LDraw parts are one-sided shells, and a still seen from behind or inside one shows its holes */
function kfTwoSided(){scene.traverse(o=>{if(!o.isMesh||!o.material)return;for(const m of [].concat(o.material))if(m.side!==THREE.DoubleSide){m.side=THREE.DoubleSide;m.needsUpdate=true;}});}
function kfLight(l={}){kfTwoSided();for(const x of kfLights.splice(0))scene.remove(x);scene.traverse(o=>{if(o.isLight&&!o.userData.kf){if(o.userData.kfI0==null)o.userData.kfI0=o.intensity;o.intensity=o.userData.kfI0*(l.dim??1);}});
  /* a cool fill so shadows keep their colour (grey rock stays grey), a warm key that casts shadows, a filmic curve */
  if(l.fill){const h=new THREE.HemisphereLight(l.fill.sky||'#61749a',l.fill.ground||'#221b15',l.fill.intensity??0.5);h.userData.kf=true;scene.add(h);kfLights.push(h);}
  /* a sun: a directional key with a shadow, for the stills in daylight */
  if(l.sun){const d=new THREE.DirectionalLight(l.sun.color||'#fff1d6',l.sun.intensity??1.6);d.userData.kf=true;d.position.set(...(l.sun.dir||[-0.6,0.8,0.4]).map(v=>v*800));d.target.position.set(0,0,0);
    d.castShadow=true;d.shadow.mapSize.set(2048,2048);const c=d.shadow.camera;c.left=c.bottom=-450;c.right=c.top=450;c.near=10;c.far=2000;d.shadow.bias=-0.0008;scene.add(d);scene.add(d.target);kfLights.push(d,d.target);}
  const shadows=(l.lights||[]).some(L=>L.shadow)||!!l.sun;renderer.shadowMap.enabled=shadows;renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  if(shadows)scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  for(const L of l.lights||[]){const pl=new THREE.PointLight(L.color||'#ff9a40',L.intensity??2.2,L.distance??600,L.decay??1.4);pl.userData.kf=true;pl.position.copy(kfPoint(L.at).add(new KV(...(L.off||[0,0,0]))));
    if(L.shadow){pl.castShadow=true;pl.shadow.mapSize.set(1024,1024);pl.shadow.bias=-0.002;pl.shadow.radius=3;pl.shadow.camera.near=4;pl.shadow.camera.far=L.distance??600;}scene.add(pl);kfLights.push(pl);}
  renderer.toneMapping=l.tone===false?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=l.exposure??1.15;
  scene.traverse(o=>{if(o.isMesh&&o.material)for(const m of [].concat(o.material))m.needsUpdate=true;});}
function kfAnchors(){const out={};scene.traverse(q=>{if(q.name&&q.name.startsWith('@')){const v=q.getWorldPosition(new KV());out[q.name]=[+v.x.toFixed(0),+v.y.toFixed(0),+v.z.toFixed(0)];}});return out;}
window.OdysseyFilm={anchors:kfAnchors,loadProps:kfLoadProps,props:kfProps,hide:kfHide,light:kfLight,anchor:kfAnchor,spread:kfSpread,floor:kfFloor,physics:kfPhysics,rope:kfRope,clutter:kfClutter,look:kfLook,ground:kfGround,rig:kfRig,lens:kfLens,asset:()=>filmAsset(),setCamera:c=>filmSetCamera(c),fit:()=>filmFit(),get cameras(){return filmAsset()?.cameras||[];},cast:kfCast,pieces:kfPieces,block:kfBlock,shoot:kfShoot,score:kfScore};

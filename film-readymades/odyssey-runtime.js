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
const kfSolid=o=>o.isMesh&&o.visible&&!(o.geometry&&o.geometry.type==='PlaneGeometry')&&!(o.userData&&o.userData.axis)&&!(o.material&&o.material.transparent&&o.material.opacity<0.3);   /* the set and the cast, not the workspace's helper planes */
function kfCast(){return ButterCast.cast.map(a=>{const b=new THREE.Box3().setFromObject(a.rig.figure);return {id:kfShort(a.kind),x:+a.rig.pos.x.toFixed(1),y:+a.rig.pos.y.toFixed(1),z:+a.rig.pos.z.toFixed(1),heading:+a.rig.heading.toFixed(2),height:+(b.max.y-b.min.y).toFixed(1)};});}
function kfPieces(){const A=filmAsset();return (A.pages||[]).map((pg,i)=>({label:pg.label,x:+A.rows[i].x.toFixed(1),z:+A.rows[i].z.toFixed(1),box:pg.box||null}));}
function kfBlock(list){for(const e of list){const a=kfActor(e.id);if(!a){console.warn('[keyframe] no actor',e.id);continue;}const r=a.rig;
  if(e.x!=null)r.pos.x=e.x;if(e.z!=null)r.pos.z=e.z;if(e.y==='ground')r.pos.y=kfGround(r.pos.x,r.pos.z);else if(e.y!=null)r.pos.y=e.y;
  const f=typeof e.face==='string'?kfActor(e.face)?.rig.pos:Array.isArray(e.face)?{x:e.face[0],z:e.face[1]}:null;
  if(f)r.heading=Math.atan2(f.x-r.pos.x,f.z-r.pos.z);else if(e.heading!=null)r.heading=e.heading;
  r.figure.position.copy(r.pos);r.figure.rotation.y=r.heading;r.hold=e.pose||r.hold||{};
  for(const k of ['armRP','armLP','headP','torsoP','legRP','legLP']){const v=r.hold[k]||[0,0,0];r[k].rotation.set(v[0],v[1],v[2]);}
  /* props: false empties the hands (a man bound to a mast holds no sword): each arm pivot carries its arm, its hand, then what it holds */
  if(e.props!=null)for(const k of ['armRP','armLP']){const g=r[k].children.filter(c=>c.type==='Group');g.slice(2).forEach(c=>c.visible=e.props!==false);}}}
function kfShoot(c){camera.position.set(...c.pos);if(c.fov)camera.fov=c.fov;camera.updateProjectionMatrix();controls.target.set(...c.target);camera.lookAt(controls.target);camera.updateMatrixWorld();}
function kfScore(subs){scene.updateMatrixWorld(true);camera.updateMatrixWorld();const meshes=[];scene.traverse(o=>{if(kfSolid(o))meshes.push(o);});
  const ray=new THREE.Raycaster(),cam=camera.position.clone(),scr=v=>{const q=v.clone().project(camera);return [(q.x+1)/2,(1-q.y)/2,q.z];};
  const inside=(o,root)=>{for(;o;o=o.parent)if(o===root)return true;return false;};
  const out={};for(const s of subs){const a=kfActor(s.id);if(!a){out[s.id]={missing:true};continue;}const fig=a.rig.figure;
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
function kfHead(id){const a=kfActor(id),k=a.rig.headP.getWorldScale(new THREE.Vector3()).y;return kfWorld(a.rig.headP).add(new THREE.Vector3(0,-12*k*(a.rig.headP.position.y<0?1:-1),0));}   /* the middle of the head, 12 LDU above the neck (the rig's y runs down) */
function kfRig(c){const V=THREE.Vector3;let pos,target;
  if(c.type==='two'){const A=kfHead(c.a),Bh=kfHead(c.b),mid=A.clone().lerp(Bh,0.5),ab=Bh.clone().sub(A).setY(0),span=ab.length(),n=new V(-ab.z,0,ab.x).normalize().multiplyScalar(c.side||1);
    const fa=kfActor(c.a).rig,face=new V(Math.sin(fa.heading),0,Math.cos(fa.heading));pos=mid.clone().add(n.clone().multiplyScalar(c.dist||span*1.6)).add(face.multiplyScalar((c.bias??0.35)*(c.dist||span*1.6))).add(new V(0,c.height||0,0));target=mid;}
  else if(c.type==='hero'){const A=kfHead(c.a),r=kfActor(c.a).rig,yaw=r.heading+(c.yaw||0),face=new V(Math.sin(yaw),0,Math.cos(yaw));pos=A.clone().add(face.multiplyScalar(c.dist||120)).add(new V(0,c.height||0,0));target=A.clone().add(new V(0,c.aimY||0,0));}
  else if(c.type==='ots'){const A=kfHead(c.over),T=typeof c.at==='string'?kfHead(c.at):new V(...c.at),d=T.clone().sub(A).setY(0).normalize(),n=new V(-d.z,0,d.x).multiplyScalar(c.side||1);
    pos=A.clone().sub(d.clone().multiplyScalar(c.dist||60)).add(n.multiplyScalar(c.off||18)).add(new V(0,c.height||8,0));target=T;}
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
window.OdysseyFilm={clutter:kfClutter,look:kfLook,ground:kfGround,rig:kfRig,lens:kfLens,asset:()=>filmAsset(),setCamera:c=>filmSetCamera(c),fit:()=>filmFit(),get cameras(){return filmAsset()?.cameras||[];},cast:kfCast,pieces:kfPieces,block:kfBlock,shoot:kfShoot,score:kfScore};

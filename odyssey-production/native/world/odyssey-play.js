/* Playable Odyssey rehearsal: native LDraw geometry, explicit stage water, no geospatial claim. */
(function(){
'use strict';
const M=40;let seq=0,st=null,projectile=null,busy=false;
const I='1 0 0 0 1 0 0 0 1';
const line=(part,col,x,y,z,m=I)=>`1 ${col} ${x} ${-y} ${-z} ${m} ${part}.dat`;
const mpd=(name,lines)=>`0 FILE ${name}.ldr\n0 !LDRAW_ORG Unofficial_Model\n`+lines.join('\n');
function block(lines,x,y,z,nx,ny,nz,col){for(let h=0;h<ny;h++)for(let a=0;a<nx;a++)for(let b=0;b<nz;b++)lines.push(line('3001',col,x+a*80,y+(h+1)*24,z+b*40));}
const nativeCache=new Map();
async function prop(W,name,lines,x,y,z,src={}){
 const id=`od-play-${++seq}-${name}`,group=new THREE.Group(),wrap=new THREE.Group();wrap.rotation.x=Math.PI;group.add(wrap);group.position.set(x,y,z);const batches=new Map();
 for(const l of lines){const a=l.split(' '),key=a[1]+':'+a[14];if(!batches.has(key))batches.set(key,[]);const m=new THREE.Matrix4().set(+a[5],+a[6],+a[7],+a[2],+a[8],+a[9],+a[10],+a[3],+a[11],+a[12],+a[13],+a[4],0,0,0,1);batches.get(key).push(m);}
 const meshes=[];for(const[key,matrices]of batches){let native=nativeCache.get(key);if(!native){const[col,part]=key.split(':');native=await W.props.parse(mpd('native-'+seq,[`1 ${col} 0 0 0 ${I} ${part}`]),'native-'+seq+'.mpd');native.updateMatrixWorld(true);nativeCache.set(key,native);}native.traverse(o=>{if(!o.isMesh)return;const mesh=new THREE.InstancedMesh(o.geometry,o.material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(m,o.matrixWorld)));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;wrap.add(mesh);meshes.push(mesh);});}
 // THREE r128 Box3 does not expand instance matrices, so calculate bounds explicitly.
 const local=new THREE.Box3();for(const mesh of meshes){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();for(let i=0;i<mesh.count;i++){const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);local.union(mesh.geometry.boundingBox.clone().applyMatrix4(m));}}
 group.updateMatrixWorld(true);const box=local.clone().applyMatrix4(wrap.matrixWorld);W.scene.add(group);const it={id,mpd:mpd(name,lines),x,y,z,yaw:0,src:{film:true,rehearsal:true,...src},group,box,localBox:box.clone().translate(new THREE.Vector3(-x,-y,-z)),meshes,total:lines.length,ready:true,kit:'rehearsal'};W.props.items.set(id,it);return it;
}
function note(t){document.getElementById('playStatus').textContent=t;}
function feet(W){return W.rig.figure.getWorldPosition(new THREE.Vector3());}
function hitTarget(t,damage,kind){if(t.hp<=0)return;t.hp=Math.max(0,t.hp-damage);st.hits.push({target:t.name,kind,hp:t.hp,time:performance.now()});if(!t.hp)t.it.group.rotation.z=.7;note(`${t.name}: ${t.hp} / ${t.max} · ${kind}`);}
// Slab intersection returns the first segment fraction, so fast arrows cannot skip targets.
function segmentBox(a,b,box){let lo=0,hi=1;for(const k of ['x','y','z']){const d=b[k]-a[k];if(Math.abs(d)<1e-9){if(a[k]<box.min[k]||a[k]>box.max[k])return null;}else{let x=(box.min[k]-a[k])/d,y=(box.max[k]-a[k])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return null;}}return lo;}
function slash(W){const p=feet(W),f=new THREE.Vector3(Math.sin(W.rig.heading),0,Math.cos(W.rig.heading));let n=0;
 for(const t of st?.targets||[]){const c=t.it.box.getCenter(new THREE.Vector3()),d=c.clone().sub(p);d.y=0;if(t.hp>0&&d.length()<110&&d.normalize().dot(f)>.45&&Math.abs(c.y-p.y)<100){hitTarget(t,35,'sword');n++;}}
 for(const npc of W.crowd?.npcs||[]){const d=npc.pos.clone().sub(p);if(npc.alive&&d.length()<90&&d.normalize().dot(f)>.45){W.crowd.burst(npc,f.clone().multiplyScalar(80),W.debris);n++;}}
 if(window.WorldBehavior)n+=WorldBehavior.attackCone({world:W,origin:p,facing:f,range:110,vertical:100,damage:35,kind:'sword'});
 return n;
}
async function prepare(W){if(projectile)return;const g=await W.props.parse(mpd('projectile',[line('18041',70,0,0,0)]),'od-arrow.mpd');g.traverse(o=>{if(o.isLine||o.isLineSegments)o.visible=false;});projectile=g;}
function shoot(W){if(!projectile){prepare(W);note('Loading arrow geometry; shoot again when ready');return false;}if(W.t-(W.odLastArrow||-9)<.65)return false;W.odLastArrow=W.t;
 const p=feet(W);p.y+=50;const f=new THREE.Vector3(Math.sin(W.rig.heading),.12,Math.cos(W.rig.heading)).normalize();p.addScaledVector(f,35);
 const mesh=projectile.clone(true);mesh.position.copy(p);W.scene.add(mesh);W.odArrows=W.odArrows||[];W.odArrows.push({mesh,p,vel:f.multiplyScalar(900),age:0});return true;
}
function step(W,dt){if(st&&st.place!==W.place){clear(W);return;}for(const a of W.odArrows||[]){if(a.dead)continue;const prev=a.p.clone();a.age+=dt;a.vel.y-=9.81*M*dt;a.p.addScaledVector(a.vel,dt);let nearest=null,u=Infinity;
 for(const t of st?.targets||[]){const q=t.hp>0?segmentBox(prev,a.p,t.it.box):null;if(q!==null&&q<u){nearest=t;u=q;}}
 for(const npc of W.crowd?.npcs||[]){if(!npc.alive)continue;const b=new THREE.Box3(npc.pos.clone().add(new THREE.Vector3(-16,0,-16)),npc.pos.clone().add(new THREE.Vector3(16,75,16))),q=segmentBox(prev,a.p,b);if(q!==null&&q<u){nearest={npc};u=q;}}
 let wall=Infinity;const boxes=[...(W.city?.aabbs(a.p.x,a.p.z,100)||[]),...(W.build?.aabbs(a.p.x,a.p.z,100)||[]),...(W.props?.aabbs(a.p.x,a.p.z,100)||[])];
 for(const b of boxes){if(st?.targets.some(t=>t.it.box===b))continue;if(W.veh?.prop.box===b)continue;const q=segmentBox(prev,a.p,b);if(q!==null)wall=Math.min(wall,q);}
 if(nearest&&u<=wall){if(nearest.npc)W.crowd.burst(nearest.npc,a.vel.clone().multiplyScalar(.08),W.debris);else hitTarget(nearest,25,'arrow');a.dead=true;}else if(wall<Infinity||a.age>5||a.p.y<W.G.h(a.p.x,a.p.z))a.dead=true;
 a.mesh.position.copy(a.p);a.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),a.vel.clone().normalize());if(a.dead)W.scene.remove(a.mesh);
 }W.odArrows=(W.odArrows||[]).filter(a=>!a.dead);
}
function clear(W){for(const it of [...W.props.items.values()])if(it.src?.rehearsal)W.props.remove(it.id,true);if(st?.waterMesh)W.scene.remove(st.waterMesh);if(st?.light)W.scene.remove(st.light);for(const a of W.odArrows||[])W.scene.remove(a.mesh);W.odArrows=[];st=null;}
async function horse(W){if(W.mode!=='walk')return note('Dismount first');const p=feet(W);p.x+=120;const it=await prop(W,'horse',[line('4493c01',70,0,0,0)],p.x,p.y,p.z,{op:'vehicle',kind:'horse'});if(!it)throw Error('Horse unavailable');it.group.children[0].position.y+=p.y-it.box.min.y;it.group.updateMatrixWorld(true);it.box.translate(new THREE.Vector3(0,p.y-it.box.min.y,0));it.localBox=it.box.clone().translate(new THREE.Vector3(-it.x,-it.y,-it.z));if(window.HorseMotion)await HorseMotion.rig(it);note('Horse ready · articulated walk / gallop · approach and press E');return it;}
async function stage(W,kind){if(busy||!W.ready)return;if(W.mode!=='walk')return note('Dismount before changing scenes');busy=true;note('Building native rehearsal geometry…');try{
 clear(W);const p=feet(W),x=p.x,z=p.z,y=Math.max(...[-960,0,2000].flatMap(dx=>[-640,640,1280].map(dz=>W.G.h(x+dx,z+dz))))+80;
 st={kind,place:W.place,origin:{x,y,z},targets:[],hits:[],contract:kind==='cave'?{land:'exposed pale limestone',build:'wide low cave throat; giant scale',air:'cool outside / warm hearth',motion:'escape from enclosure'}:{land:'ochre urban forecourt',build:'tall gate and close towers',air:'dusk / fire',motion:'mounted breach approach'}};
 const floor=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=2;b++)floor.push(line('3811',kind==='cave'?19:28,a*640,0,b*640));
 const floorIt=await prop(W,'stage-floor',floor,x,y,z);const fy=floorIt.box.max.y;st.origin.y=fy;
 async function piece(name,lines,dx,dz,dy=0){const it=await prop(W,name,lines,x+dx,fy+dy,z+dz);if(!it)throw Error(name+' unavailable');return it;}
 if(kind==='cave'){
  for(const side of [-1,1]){const rock=[];for(let tier=0;tier<5;tier++){block(rock,0,tier*72,0,3,3,8,tier%2?71:19);for(let k=0;k<4;k++)rock.push(line('4445',19,side<0?200:-40,tier*72+72,k*80));}await piece('cave-buttress',rock,side<0?-540:360,420);}
  const crown=[];block(crown,0,0,0,9,3,5,19);await piece('cave-lintel',crown,-280,480,360);
  const back=[];block(back,0,0,0,12,12,2,72);await piece('cave-back',back,-500,1060);
  const giant=[];block(giant,-80,0,0,1,4,2,70);block(giant,40,0,0,1,4,2,70);block(giant,-80,96,0,3,4,2,84);block(giant,-160,96,0,1,3,1,84);block(giant,160,120,0,1,3,1,84);block(giant,0,192,0,1,3,2,84);giant.push(line('14769p01',15,40,244,-25,'1 0 0 0 0 1 0 -1 0'));
  await piece('polyphemus-scale-maquette',giant,20,860);
  await piece('hearth',[line('4740',70,0,0,0),line('37775',57,0,15,0)],-160,760);
  const light=new THREE.PointLight(0xff9a45,2,900,2);light.position.set(x-160,fy+80,z+760);W.scene.add(light);st.light=light;
 }else{
  for(const side of [-1,1]){const tower=[];block(tower,0,0,0,3,23,5,28);for(let k=0;k<3;k++)block(tower,k*80,552,0,1,k%2?1:3,5,19);await piece('troy-gate-tower',tower,side<0?-460:300,560);}
  const beam=[];block(beam,0,0,0,8,3,2,70);await piece('troy-gate-beam',beam,-220,600,400);
  for(const dx of [-380,440])await piece('gate-fire',[line('4740',70,0,0,0),line('37775',57,0,20,0)],dx,460);
 }
 for(const [name,dx,dz]of[['Sword target',-160,80],['Bow target',160,340]]){const lines=[];block(lines,-40,0,0,1,3,1,70);lines.push(line('14769p01',15,0,52,-22,'1 0 0 0 0 1 0 -1 0'));const it=await piece(name.replaceAll(' ','-'),lines,dx,dz);st.targets.push({name,it,hp:100,max:100});}
 // Explicit rehearsal water rectangle. It is not a geographic coastline reconstruction.
 const water={minX:x+1040,maxX:x+2200,minZ:z-450,maxZ:z+1100,y:fy,dock:{x:x+1300,z:z,landX:x+1120,landZ:z,y:fy}};
 const waterMesh=new THREE.Mesh(new THREE.PlaneGeometry(1160,1550),new THREE.MeshStandardMaterial({color:0x256b7b,roughness:.25,metalness:.15}));waterMesh.rotation.x=-Math.PI/2;waterMesh.position.set(x+1620,fy,z+325);W.scene.add(waterMesh);st.waterMesh=waterMesh;
 const dockPlates=[];for(let dx=980;dx<=1140;dx+=80)dockPlates.push(line('3020',70,dx,0,0));await piece('timber-dock',dockPlates,0,0);
 const hull=[];for(const a of [-40,40])for(let b=-6;b<=6;b++)hull.push(line('3020',70,a,8,b*40));for(const a of [-80,80])for(let b=-3;b<=3;b++)hull.push(line('3001',70,a,32,b*80,'0 0 1 0 1 0 -1 0 0'));for(const b of [-160,0,160])for(const a of [-40,40])hull.push(line('3001',70,a,32,b));
 const boat=await prop(W,'rowing-boat',hull,water.dock.x,fy,water.dock.z,{op:'vehicle',kind:'boat',water});st.boat=boat.id;
 W.rig.pos.set(x,fy,z-200);W.rig.heading=0;W.rig.cam.set=false;W.rig.cam.yaw=Math.PI;W.setCharacter('odysseus-sword');await horse(W);await prepare(W);
 note(`${kind==='cave'?'Book 9 · Cyclops cave':'Troy · gate breach'} rehearsal ready. WASD · E mount/board · Space attack. Maquette geometry; not final art.`);
 }catch(e){note('Build failed: '+e.message);console.error(e);}finally{busy=false;}}
async function capture(W){const evidence={player:feet(W).toArray(),origin:st?.origin,scene:st?.kind,contract:st?.contract,place:W.place,mode:W.mode,ride:W.ride(),rideChecks:W.odRideChecks||[],targets:st?.targets.map(t=>({name:t.name,hp:t.hp})),hits:st?.hits,arrows:W.odArrows?.length,limits:['New spawned horses have segmented lower-leg rig; old mapped horses remain rigid','Cave, giant and Troy are blocking maquettes','Boat constrained to explicit rehearsal basin','93231 bow and 18041 harpoon are functional placeholders']};const name='odyssey-play-'+(st?.kind||'rides');await fetch(`/evidence/${name}.json`,{method:'POST',body:JSON.stringify(evidence,null,2)});await new Promise(resolve=>requestAnimationFrame(()=>W.renderer.domElement.toBlob(async b=>{if(b)await fetch(`/evidence/${name}.png`,{method:'POST',body:b});resolve();})));note('Captured '+name);}
window.OdysseyPlay={stage,horse,slash,shoot,step,segmentBox,capture};
const panel=document.createElement('section');panel.id='odysseyPlay';panel.style.cssText='position:fixed;left:14px;top:96px;z-index:36;background:#211b16ed;color:#fff0d2;padding:12px;max-width:350px;font:12px monospace;border-radius:10px';panel.innerHTML='<b>ODYSSEY · PLAYABLE REHEARSAL</b><p><button data-act="cave">Cyclops cave</button> <button data-act="troy">Troy gate</button> <button data-act="horse">Place horse</button></p><p><button data-act="sword">Sword</button> <button data-act="bow">Bow</button> <button data-act="attack">Attack</button> <button data-act="board">Mount / dismount</button></p><p><button data-act="scene-mark">Scene view</button> <button data-act="melee-mark">Sword mark</button> <button data-act="bow-mark">Bow mark</button> <button data-act="dock">Walk to dock</button> <button data-act="capture">Capture rehearsal</button> <button data-act="ride-check">Rehearse ride (reset)</button></p><p id="playStatus">WASD move · E board · Space attack. Choose a rehearsal scene.</p><small>Native geometry · articulated horse rehearsal · prototype bow/arrow · stage basin</small>';document.body.append(panel);
panel.onclick=async e=>{const a=e.target.dataset.act,W=window.__world;if(!a||!W?.ready)return;try{if(a==='cave'||a==='troy')await stage(W,a);else if(a==='horse')await horse(W);else if(a==='sword'||a==='bow'){if(W.mode!=='walk')return note('Dismount to change weapon');W.setCharacter('odysseus-'+a);await prepare(W);}else if(a==='attack'){if(W.mode==='ride')W.rideFire(false);else W.saber();}else if(a==='board')W.promptAction();else if(a==='ride-check'&&W.mode==='ride'){const V=W.veh,start=V.pos.clone(),heading=V.heading;W.stick(0,1);W.step(2);const distance=V.pos.distanceTo(start),surface=V.pos.y;W.stick(.4,1);W.step(.5);const turn=V.heading-heading;W.stick(0,0);W.step(2);const result={kind:V.kind,distance,turn,stopped:Math.abs(V.speed)<.01,surface,bounded:V.kind!=='boat'||Drive.waterContains(V.prop.src.water,V.pos.x,V.pos.z,V.r)};W.odRideChecks=W.odRideChecks||[];W.odRideChecks.push(result);V.pos.copy(start);V.heading=heading;Drive.park(V);note(`${V.kind}: ${(distance/40).toFixed(1)} m, turn ${turn.toFixed(2)}, stopped ${result.stopped}; reset to start`);}else if(a==='capture')await capture(W);else if((a==='melee-mark'||a==='bow-mark')&&st&&W.mode==='walk'){const t=st.targets[a==='melee-mark'?0:1],c=t.it.box.getCenter(new THREE.Vector3());W.rig.pos.set(c.x,st.origin.y,c.z-(a==='melee-mark'?85:260));W.rig.heading=0;W.rig.cam.yaw=Math.PI;W.rig.cam.set=false;}else if(a==='scene-mark'&&st&&W.mode==='walk'){W.rig.pos.set(st.origin.x-40,st.origin.y,st.origin.z+180);W.rig.heading=0;W.rig.cam.yaw=Math.PI;W.rig.cam.set=false;}else if(a==='dock'&&st&&W.mode==='walk'){W.rig.pos.set(st.origin.x+1120,st.origin.y+8,st.origin.z);W.rig.heading=Math.PI/2;W.rig.cam.set=false;}}catch(e){note(e.message);}};
panel.hidden=false;
})();

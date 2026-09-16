/* Native rowed hull on a controlled water stage at the scouting location. */
window.OdysseyBoat={
 program(time,weather){return {name:'Book 9 · Clear the headland',world:'odyssey',ground:'real',time,weather,me:'off',builds:[],actors:[{name:'helmsman',figure:'odysseus-wet',x:0,z:0},...Array.from({length:4},(_,i)=>({name:'rower-'+i,figure:'sailor',x:0,z:0}))],shots:[{name:'01 · Hull, crew and waterline',pos:[23,13,29],tgt:[0,2,0],sec:6,lens:40},{name:'02 · Oars pull together',pos:[10,7,8],tgt:[0,2,0],sec:6,lens:48},{name:'03 · Stern clears the shore',pos:[-21,12,-25],tgt:[0,2,0],sec:6,lens:42}],story:{title:'Clear the headland',description:'Five crew; four working oars; 18-second native boat blocking test. Controlled water patch on real coastal terrain. Hull and animation are a rehearsal, not a historical galley or hydrodynamic simulation.'}};},
 async assemble(W, options={}){
 const F=W.film,T=THREE,sp={x:F.sceneSpawn.x+(options.x||0)*40,z:F.sceneSpawn.z+(options.z||0)*40};
 const root=new T.Group(),boat=new T.Group();W.scene.add(root);F.meshes.push(root);root.add(boat);
 // Keep the entire water stage above local relief, rather than burying the hull.
 let y=-Infinity;for(let x=-900;x<=900;x+=180)for(let z=-1100;z<=1100;z+=220)y=Math.max(y,W.G.h(sp.x+x,sp.z+z));y+=12;
 root.position.set(sp.x,y,sp.z);
 const water=new T.Mesh(new T.PlaneGeometry(4000,4800,30,36),new T.MeshPhongMaterial({color:0x235966,shininess:75,transparent:true,opacity:.94,side:T.DoubleSide}));water.rotation.x=-Math.PI/2;root.add(water);
 async function raw(id,col){const text=`0 FILE boat-${id}.ldr\n0 !LDRAW_ORG Unofficial_Model\n1 ${col} 0 0 0 1 0 0 0 1 0 0 0 1 ${id}.dat`;const g=await W.props.parse(text,'boat-'+id+'.ldr');const flip=new T.Group();flip.rotation.x=Math.PI;flip.add(g);const wrap=new T.Group();wrap.add(flip);const lines=[];wrap.traverse(o=>{if(o.isLine||o.isLineSegments)lines.push(o);if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});lines.forEach(o=>o.parent.remove(o));return wrap;}
 const hull=await raw('52572',70);hull.updateMatrixWorld(true);const b=new T.Box3().setFromObject(hull),c=b.getCenter(new T.Vector3());hull.position.set(-c.x,-b.min.y-24,-c.z);boat.add(hull);
 // Hull orientation is measured rather than assumed from its DAT attachment frame.
 if(b.getSize(new T.Vector3()).x>b.getSize(new T.Vector3()).z){const pivot=new T.Group();boat.remove(hull);pivot.add(hull);pivot.rotation.y=Math.PI/2;boat.add(pivot);}
 const plank=await raw('3031',70);for(const z of[-200,-70,70,200]){const p=plank.clone(true);p.position.set(0,56,z);boat.add(p);}
 const pivots=[];const oarRaw=await raw('2542',70);
 for(const z of[-120,120])for(const side of[-1,1]){const pivot=new T.Group();pivot.position.set(side*55,65,z);const oar=oarRaw.clone(true);oar.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),new T.Vector3(side*.93,-.36,0).normalize()); pivot.add(oar);boat.add(pivot);pivots.push({pivot,side});}
 const rigs=[...F.actors.values()].filter(a=>!options.prefix||a.name.startsWith(options.prefix)).map(a=>a.rig).filter(Boolean);if(rigs.length!==5)throw Error('Boat crew did not load');
 for(const r of rigs){if(r.slots.weaponR)r.slots.weaponR.visible=false;if(r.slots.weaponL)r.slots.weaponL.visible=false;}
 const seats=[[0,63,-340],[-25,65,-120],[25,65,-120],[-25,65,120],[25,65,120]];
 const baseLate=F.late;let last=0;
 F.late=function(dt){baseLate(dt);if(F.scene?.name!==(options.sceneName||'Book 9 · Clear the headland'))return;let t=F.play.on?F.reelOffset(F.play.i)+F.play.t:F.sel>=0?F.reelOffset(F.sel):last;t=Math.max(0,Math.min(options.duration||18,t-(options.start||0)));last=t;
 const pull=Math.sin(t*2.8);boat.position.set(0,4*Math.sin(t*1.7),120-Math.min(t,18)*14);boat.rotation.z=.012*Math.sin(t*1.4);boat.updateMatrixWorld(true);
 pivots.forEach(({pivot,side})=>{pivot.rotation.y=side*.38*pull;pivot.rotation.z=side*(.12+.13*Math.cos(t*2.8));});
 rigs.forEach((r,i)=>{const local=new T.Vector3(...seats[i]);boat.localToWorld(local);r.pos.copy(local);r.figure.position.copy(local);r.figure.rotation.set(0,i===0?0:Math.PI,boat.rotation.z);r.armLP.rotation.x=r.armRP.rotation.x=i===0?-.5:-.9+.35*pull;r.legLP.rotation.x=r.legRP.rotation.x=i===0?0:-Math.PI/2;});
 };
 // Camera heights use one stage datum, not different hill heights under each camera.
 for(const shot of (options.shots||F.shots))for(const k of shot.keys){k.pos.y+=y-W.G.h(k.pos.x,k.pos.z)-Ground.layerAt(W.G,k.pos.x,k.pos.z);k.tgt.y+=y-W.G.h(k.tgt.x,k.tgt.z)-Ground.layerAt(W.G,k.tgt.x,k.tgt.z);}
 F.late(0);F.save();
 }
};

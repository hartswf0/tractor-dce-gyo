/* Odyssey environment adaptation. Source tree geometry: Philippe Hurbain, 21343,
   CC BY 2.0 / CC BY 4.0. Extracted submodel, original geometry preserved. */
(function(){
'use strict';
let generation=0,active=null,cache=null;
async function templates(W){if(cache)return cache;cache=(async()=>{
 const out={};async function model(key,text){if(key.startsWith('pinetree')){text=text.replace(/^1 15 /gm,'1 2 ');const root=/^0 FILE (.+)$/m.exec(text)[1];text=`0 FILE odyssey-green-${key}.ldr\n0 !LDRAW_ORG Unofficial_Model\n1 2 0 0 0 1 0 0 0 1 0 0 0 1 ${root}\n`+text;}const parsed=await W.props.parse(text,'odyssey-'+key+'.mpd');const flip=new THREE.Group();flip.rotation.x=Math.PI;flip.add(parsed);const root=new THREE.Group();root.add(flip);const lines=[];root.traverse(o=>{if(o.isLine||o.isLineSegments)lines.push(o);if(o.isMesh)o.castShadow=o.receiveShadow=true;});lines.forEach(o=>o.parent.remove(o));root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root);flip.position.y=-b.min.y;root.userData.height=b.max.y-b.min.y;out[key]=root;}
 for(const key of ['pinetree','pinetree2','GreatHallPillar']) {const r=await fetch('./odyssey-donors/'+key+'.mpd');if(!r.ok)throw Error(key+' missing');await model(key,await r.text());}
 for(const[key,id,col]of[['horse','4493c01',70],['pig','87621',13],['cow','64452',19],['torch','37775',57],['bowl','4740',70]])await model(key,`0 FILE odyssey-${key}.ldr\n0 !LDRAW_ORG Unofficial_Model\n1 ${col} 0 0 0 1 0 0 0 1 0 0 0 1 ${id}.dat`);
 return out;})();return cache;}
async function lay(W,G,win){const token=++generation;if(active){W.scene.remove(active.group);active=null;}if(W.world!=='odyssey'){if(W.flora?.group)W.flora.group.visible=true;return;}if(W.lamps?.group)W.lamps.group.visible=false;if(W.flora?.group)W.flora.group.visible=false;if(W.ship)W.ship.visible=false;
 const group=new THREE.Group();group.name='Odyssey-native-environment';W.scene.add(group);const state={group,horses:[],lights:[],trees:0,status:'loading'};active=state;W.odyssey=state;
 try{const models=await templates(W);if(token!==generation)return;
 const add=(key,x,z)=>{const g=models[key].clone(true);g.position.set(x,G.h(x,z)+Ground.layerAt(G,x,z),z);group.add(g);return g;};
 const origin=W.rig?.pos||new THREE.Vector3();
 const trees=(W.flora?.trees||[]).slice().sort((a,b)=>Math.hypot(a.x-origin.x,a.z-origin.z)-Math.hypot(b.x-origin.x,b.z-origin.z)).slice(0,100);
 for(const[t,s]of trees.entries()){const g=add(t%2?'pinetree':'pinetree2',s.x,s.z);g.rotation.y=s.yaw;state.trees++;}
 const roads=(win.roads||[]).filter(r=>r.pts?.length>1&&!['river','motorway','trunk'].includes(r.kind));
 for(let i=0;i<Math.min(12,roads.length);i++){const r=roads[i],a=r.pts[0],b=r.pts[1],u=.25+(i%3)*.2;const horse=add('horse',(a.x+(b.x-a.x)*u)*40,(a.z+(b.z-a.z)*u)*40);horse.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);state.horses.push(horse);}
 for(const[s,i]of (W.lamps?.spots||[]).slice(0,30).map((s,i)=>[s,i])){const bowl=add('bowl',s.x*40,s.z*40);const g=add('torch',s.x*40,s.z*40);g.position.y+=models.bowl.userData.height;
 if(i<8){const light=new THREE.PointLight(0xffa34b,0,7*40,2);light.position.copy(g.position);light.position.y+=8;group.add(light);state.lights.push(light);}}
 state.status='ready';state.geometry='21343 pinetree submodels; 4493c01 horses; native flame and 4740 dish lamp';
 }catch(e){state.status='ERROR '+e.message;console.error('Odyssey mode',e);}
}
function step(W,dt){if(!active||W.world!=='odyssey')return;if(W.ship)W.ship.visible=false;if(W.lamps?.group)W.lamps.group.visible=false;if(W.flora?.group)W.flora.group.visible=false;for(const l of active.lights)l.intensity=(W.night||0)*2.5;}
async function stage(W){if(!active)return;const models=await templates(W),yaw=W.rig.heading,forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),right=new THREE.Vector3(forward.z,0,-forward.x);for(const[key,side,dist]of[['pinetree',-150,240],['pinetree2',-250,350],['horse',100,180],['GreatHallPillar',240,300]]){const g=models[key].clone(true),p=W.rig.pos.clone().addScaledVector(forward,dist).addScaledVector(right,side);g.position.set(p.x,W.G.h(p.x,p.z)+Ground.layerAt(W.G,p.x,p.z),p.z);g.rotation.y=yaw;active.group.add(g);}active.status='ready · staged donor comparison';}
window.OdysseyWorld={lay,step,stage};
})();
/* Visible scouting controls and evidence export. */
(function(){
const panel=document.createElement('div');panel.id='odysseyScout';panel.style.cssText='position:fixed;right:14px;top:96px;z-index:35;background:#18241fee;color:#eff1db;padding:12px;max-width:330px;font:12px monospace;border-radius:10px';
panel.innerHTML='<b>ODYSSEY SCOUT</b><p id="scoutStatus">Loading</p><button id="scoutPlane">Blocking plane</button> <button id="scoutBuildings">Hide buildings</button> <button id="scoutCapture">Capture scout</button> <button id="scoutDonors">Stage donor test</button><p>Roadside horses are static; use Place horse for a rideable horse. Modern footprints are adapted, not ancient reconstructions.</p>';
document.body.append(panel);let plane=null,hide=false;
panel.querySelector('#scoutDonors').onclick=()=>OdysseyWorld.stage(window.__world);
panel.querySelector('#scoutPlane').onclick=()=>{const W=window.__world;if(!W?.ready)return;if(plane){W.scene.remove(plane);plane=null;return;}plane=new THREE.GridHelper(480,12,0xf8c569,0xf8c569);plane.position.copy(W.rig.pos);plane.position.y+=3;W.scene.add(plane);};
panel.querySelector('#scoutBuildings').onclick=()=>{const W=window.__world;if(!W?.city)return;hide=!hide;W.odysseyHideBuildings=hide;panel.querySelector('#scoutBuildings').textContent=hide?'Show buildings':'Hide buildings';};
panel.querySelector('#scoutCapture').onclick=async()=>{const W=window.__world;if(!W?.ready)return;const evidence={place:W.place,network:W.net,world:W.world,ground:W.groundMode,weather:W.weather,sky:W.skyMode,odyssey:{status:W.odyssey?.status,trees:W.odyssey?.trees,horses:W.odyssey?.horses.length,lamps:W.odyssey?.lights.length},map:{roads:W.win?.roads?.length,buildings:W.win?.buildings?.length,villageFallback:W.win?.village},limits:['Roadside horses static; spawned horses rideable with rigid legs','Rethemed modern footprints, not reconstructed ancient architecture','Donor pine trees are construction candidates, not a botanical match for every place']};await fetch('/evidence/odyssey-scout.json',{method:'POST',body:JSON.stringify(evidence,null,2)});const canvas=W.renderer.domElement;await new Promise(resolve=>requestAnimationFrame(()=>{canvas.toBlob(async b=>{if(b)await fetch('/evidence/odyssey-scout.png',{method:'POST',body:b});resolve();});}));panel.querySelector('#scoutCapture').textContent='Captured';};
setInterval(()=>{const W=window.__world;panel.hidden=false;if(!W)return;panel.querySelector('#scoutStatus').textContent=`Terrain: ${W.net.elevation===true?'live':W.net.elevation===false?'FALLBACK':'loading'} · map: ${W.net.osm===true?'live':W.net.osm===false?'FALLBACK':'pending'}\nImagery: ${W.net.imagery===true?'live':W.net.imagery===false?'unavailable':'pending'}\nDonors: ${W.odyssey?.status||'waiting'} · trees ${W.odyssey?.trees||0} · horses ${W.odyssey?.horses.length||0}`;
if(W.city?.root)W.city.root.visible=!hide;},1000);
})();

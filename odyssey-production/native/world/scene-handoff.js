/* Shared scene snapshots for the independent Hand Butter loader. Same-origin only. */
window.SceneHandoff={
 db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('odyssey-scene-exchange',1);r.onupgradeneeded=()=>r.result.createObjectStore('scenes');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});},
 async put(id,value){const db=await this.db();await new Promise((resolve,reject)=>{const tx=db.transaction('scenes','readwrite');tx.objectStore('scenes').put(value,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();},
 async get(id){const db=await this.db();return new Promise((resolve,reject)=>{const r=db.transaction('scenes').objectStore('scenes').get(id);r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>reject(r.error);});},
 async list(){const db=await this.db();return new Promise((resolve,reject)=>{const out=[],r=db.transaction('scenes').objectStore('scenes').openCursor();r.onsuccess=()=>{const c=r.result;if(c){out.push({id:c.key,name:c.value.name});c.continue();}else{db.close();resolve(out.reverse());}};r.onerror=()=>reject(r.error);});},
 async openButter(W){const F=W.film;if(!F?.scene?.ready)throw Error('Wait for the scene to finish loading.');F.stop();await W.props.queue;await new Promise(r=>setTimeout(r,50));const objects=[],seen=new Set();function keep(root,name,kind){if(!root||seen.has(root))return;seen.add(root);root.updateWorldMatrix(true,true);const c=root.clone(true);root.matrixWorld.decompose(c.position,c.quaternion,c.scale);c.updateMatrix();objects.push({name,kind,object:c.toJSON()});}
 for(const b of F.builds.values()){
 const group=new THREE.Group();
 for(const id of b.ids){const p=W.build.pieces.get(id);if(!p)continue;const k=W.build.kinds.get(p.part),mat=W.build.mat.clone();mat.vertexColors=false;mat.color.copy(W.build.colours(p.col));const mesh=new THREE.Mesh(k.geom,mat);mesh.position.set(p.x,p.y,p.z);mesh.rotation.y=p.rot*Math.PI/2;group.add(mesh);}
 if(group.children.length)keep(group,b.name,'assembly');
 }
 for(const it of W.props.items.values())if(it.src?.film)keep(it.group,it.src?.name||'Scene prop','assembly');
 for(const [name,a]of F.actors)keep(a.rig?.figure||a.it?.group,name,'cast snapshot');
 for(const root of F.meshes)keep(root,root.name||'Scene geometry','assembly');
 if(!objects.length)throw Error('No loaded scene geometry to hand off.');const id='scene-'+Date.now();const data={format:'odyssey-butter-scene',version:1,name:F.scene.name,source:location.href,light:W.skyMode,weather:W.weather,film:F.text(),objects};await this.put(id,data);location.href='./hand-butter-scenes.html?scene='+encodeURIComponent(id);}
};
(function(){const W=window.__world;if(!W)return;const host=document.getElementById('cinTransport')||document.getElementById('sceneActions');if(!host)return;const button=document.createElement('button');button.textContent='Open in Hand Butter';button.id='sceneToButter';button.onclick=async()=>{button.disabled=true;button.textContent='Preparing scene…';try{await SceneHandoff.openButter(W);}catch(e){button.textContent=e.message;button.disabled=false;}};host.append(button);const a=document.createElement('a');const u=new URL(location.href),world=location.pathname.endsWith('word-to-world.html');u.pathname=u.pathname.replace(/[^/]+$/,world?'cinerium.html':'word-to-world.html');a.href=u;a.textContent=world?'Watch in Cinerium':'Play in Word to World';host.append(a);})();

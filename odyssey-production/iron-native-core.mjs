/* Reusable native geometry boundary. All visible solid models come from LDraw. */
export async function nativeCore(canvas,options={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#151b25');
 const camera=new THREE.PerspectiveCamera(38,16/9,1,6000);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene.add(new THREE.HemisphereLight(0xe5e9ff,0x514534,.95));
 const key=new THREE.DirectionalLight(0xffdfa9,1.45);key.position.set(-250,550,450);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-700,right:700,top:700,bottom:-700,near:1,far:2000});scene.add(key);
 const fill=new THREE.DirectionalLight(0x9bb9ff,.8);fill.position.set(300,220,-300);scene.add(fill);
 const loaded=new Set(),missing=[];const manager=new THREE.LoadingManager();manager.onProgress=url=>loaded.add(url);manager.onError=url=>missing.push(url);
 const loader=new THREE.LDrawLoader(manager);loader.path=options.ldrawPath||'./native/ldraw/';loader.separateObjects=true;loader.smoothNormals=false;loader.setFileMap(await(await fetch('ldraw-map.json')).json());
 await new Promise((resolve,reject)=>loader.load('LDConfig.ldr',resolve,undefined,reject));
 const props=new Props.Props({scene,loader,M:40}),cache=new Map(),measurements={},assemblies=[],materials=new Set();
 function finish(g){const lines=[];g.traverse(o=>{if(o.isLine||o.isLineSegments)lines.push(o);if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.side=THREE.DoubleSide;if(materials.has(m))continue;materials.add(m);m.color?.convertSRGBToLinear();if(m.roughness!=null)m.roughness=Math.max(.45,m.roughness);}});for(const o of lines)o.parent.remove(o);return g;}
 async function raw(id,col=70){const k=id+'-'+col;if(!cache.has(k)){cache.set(k,props.parse(`0 FILE ${k}.ldr\n0 !LDRAW_ORG Unofficial_Model\n1 ${col} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${id}.dat`,k+'.ldr').then(finish));}const base=await cache.get(k);if(options.progress!==false)await saveJSON('native-progress',{part:id,stage:'parsed'});const clone=base.clone(true);return clone;}
 async function part(id,col=70){const root=new THREE.Group(),flip=new THREE.Group();flip.rotation.x=Math.PI;flip.add(await raw(id,col));root.add(flip);root.name='ldraw:'+id;root.userData.part=id;root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());measurements[id]={min:b.min.toArray(),max:b.max.toArray(),size:size.toArray()};return root;}
 async function grounded(id,col=70){const root=await part(id,col),b=new THREE.Box3().setFromObject(root);root.children[0].position.y=-b.min.y;return root;}
 async function assembly(name,ops){const compiled=Dsl.compile({name,ops});assemblies.push({name,ops,report:compiled.report});if(compiled.report.errors.length||compiled.report.unknown.length||compiled.report.floating||compiled.report.dropped.length)throw Error('Assembly rejected '+name+': '+JSON.stringify(compiled.report));const it=await props.add({id:name,mpd:Dsl.toMPD(compiled,name),x:0,y:0,z:0,yaw:0,src:{film:'hero-tests'}},true);if(!it)throw Error('No assembly '+name);finish(it.group);return it.group;}
 const ctx=canvas.getContext('2d');
 function render(pos,target,fov=38){camera.position.fromArray(pos);camera.fov=fov;camera.lookAt(new THREE.Vector3(...target));camera.updateProjectionMatrix();scene.updateMatrixWorld(true);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0);}
 return{scene,camera,renderer,props,raw,part,grounded,assembly,measurements,assemblies,loaded,missing,ctx,render,finish};
}
export function blob(cv,type='image/png'){return new Promise(r=>cv.toBlob(r,type,.94));}
export async function saveStill(name,cv){await fetch('/evidence/'+name+'.png',{method:'POST',body:await blob(cv)});}
export async function saveJSON(name,data){if(!['127.0.0.1','localhost'].includes(location.hostname))return;await fetch('/evidence/'+name+'.json',{method:'POST',body:JSON.stringify(data,null,2)});}
// Bounded triangle traversal avoids the legacy LDraw material-group raycast path.
export function boreCheck(objects,origin,direction,far=1000){const ray=new THREE.Ray(new THREE.Vector3(...origin),new THREE.Vector3(...direction)),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3(),hits=[];let triangles=0;for(const root of objects){root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position,idx=o.geometry.index,count=idx?idx.count:pos.count;for(let i=0;i+2<count;i+=3){if(++triangles>1000000)throw Error('Audit triangle limit');a.fromBufferAttribute(pos,idx?idx.getX(i):i).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(pos,idx?idx.getX(i+1):i+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(pos,idx?idx.getX(i+2):i+2).applyMatrix4(o.matrixWorld);if(ray.intersectTriangle(a,b,c,false,hit)&&hit.distanceTo(ray.origin)<=far)hits.push(hit.toArray());}});}return{triangles,hits,clear:hits.length===0};}

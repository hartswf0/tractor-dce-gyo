/* Runs in the existing Butter workspace closure. No second renderer or builder. */
let locationView='exterior',locationPage=0,locationLast='';
const locationSelect=document.createElement('select');locationSelect.id='locationView';locationSelect.setAttribute('aria-label','Location view');for(const [v,t]of [['exterior','Whole building'],['interior','Shop cutaway'],['assembly','Source assembly']])locationSelect.add(new Option(t,v));worldTools.prepend(locationSelect);
const review=document.createElement('div');review.id='locationReview';review.innerHTML='<div><button id="locationPrev" aria-label="Previous source page">‹</button><input id="locationPage" aria-label="Source assembly page" type="range" min="0" step="1"><button id="locationNext" aria-label="Next source page">›</button><output id="locationCount"></output></div><p id="locationBOM"></p>';stage.append(review);
function isLocation(){return filmOf()?.sourceId==='grocer-location';}
function locationApply(){
 const on=isLocation();locationSelect.hidden=!on;review.hidden=!on||locationView!=='assembly';
 if(!on)return;
 for(const p of S.parts){const d=catalog.get(p.part);if(!d?.layer)continue;const page=d.reviewPage;
 p.mesh.material.clippingPlanes=locationView==='interior'?[new THREE.Plane(V(0,-1,0),98)]:[];renderer.localClippingEnabled=true;
 p.mesh.visible=locationView==='exterior'||(d.layer==='shop'&&(locationView!=='assembly'||page<=locationPage));
 const past=locationView==='assembly'&&page<locationPage;
 if(p.mesh.material.vertexColors===past){p.mesh.material.vertexColors=!past;p.mesh.material.color.set(past?0x82938b:0xffffff);p.mesh.material.needsUpdate=true;}
 if(p.mesh.material.emissive)p.mesh.material.emissive.set(locationView==='assembly'&&page===locationPage?0x24350c:0);
 }
 for(const a of ButterCast.cast)a.rig.figure.visible=locationView!=='assembly';
 const pages=filmAsset().pages;locationPage=Math.min(locationPage,pages.length-1);const p=pages[locationPage];
 $('#locationPage').max=pages.length-1;$('#locationPage').value=locationPage;$('#locationCount').textContent=(locationPage+1)+' / '+pages.length;
 $('#locationBOM').textContent='Source step '+p.sourceStep+' · '+p.bom.map(b=>b.quantity+' × '+b.ref.replace('10185 - ground floor - ','')+' (colour '+b.color+')').join(' · ')+(p.bom.some(b=>b.subassembly)?' · Subassembly: open its source booklet in the donor atlas.':'');
 $('#locationPrev').disabled=locationPage===0;$('#locationNext').disabled=locationPage===pages.length-1;
}
const locationFitBefore=filmFit;filmFit=function(){if(!isLocation())return locationFitBefore();
 if(locationView==='exterior'){const b=union(S.parts),c=b.getCenter(V()),size=b.getSize(V()),distance=Math.max(size.y,size.x/Math.max(.25,camera.aspect))*2+size.z*.7;filmSetCamera({pos:c.clone().addScaledVector(V(1,.55,1).normalize(),distance).toArray(),target:c.toArray(),fov:38});}
 else if(locationView==='interior')filmSetCamera({pos:[320,620,350],target:[-25,35,10],fov:44});
 else{const currentPart=S.parts.find(p=>catalog.get(p.part)?.reviewPage===locationPage);if(currentPart){const b=bounds(currentPart),c=b.getCenter(V()),s=b.getSize(V()),dist=Math.max(s.x/Math.max(.25,camera.aspect),s.z,s.y,90)*1.9;filmSetCamera({pos:c.clone().addScaledVector(V(1,1.4,1).normalize(),dist).toArray(),target:c.toArray(),fov:44});}}
 if(camera.aspect<.75&&locationView==='interior'){const c=controls.target.clone();const offset=camera.position.clone().sub(c).multiplyScalar(1.5);camera.position.copy(c).add(offset);controls.update();}
};
async function locationSetView(value){filmStop();if(filmMode==='walk')await filmSetMode('build');locationView=value;locationSelect.value=value;locationApply();filmFit();}
locationSelect.onchange=()=>locationSetView(locationSelect.value);
function locationSetPage(n){locationPage=Math.max(0,Math.min(filmAsset().pages.length-1,n));locationApply();filmFit();}
$('#locationPrev').onclick=()=>locationSetPage(locationPage-1);$('#locationNext').onclick=()=>locationSetPage(locationPage+1);$('#locationPage').oninput=e=>locationSetPage(+e.target.value);
const locationCacheBefore=walkCache;walkCache=function(){if(!isLocation())return locationCacheBefore();walkGround=[];
 for(const p of S.parts){const boxes=filmAsset().colliders[p.part];if(!boxes)continue;const m=new THREE.Matrix4().compose(V(p.x,p.y,p.z),partQuaternion(p),V(1,1,1));for(const [lo,hi]of boxes)walkGround.push({box:new THREE.Box3(V(...lo),V(...hi)).applyMatrix4(m),mesh:p.mesh});}
};
const locationModeBefore=filmSetMode;filmSetMode=async function(mode){if(isLocation()&&mode==='walk'&&locationView==='assembly'){locationView='interior';locationSelect.value=locationView;}await locationModeBefore(mode);locationApply();};
modeBar.querySelectorAll('button').forEach(b=>b.onclick=()=>filmSetMode(b.dataset.filmMode));window.FilmButter.setMode=filmSetMode;
const locationFrameBefore=ButterSpatialRuntime.frame;ButterSpatialRuntime.frame=function(now){locationFrameBefore(now);const id=filmOf()?.sourceId||'';if(id!==locationLast){locationLast=id;locationApply();if(isLocation()){filmFit();$('#filmThought').textContent='Authored location · Film reviews proposed poses; Build and Walk explore the set.';}}};
const locationBriefBefore=filmBrief;filmBrief=function(){locationBriefBefore();if(isLocation()){$('#filmLimits').textContent='Source-order assembly review, not a certified manual. No stress, clutch or insertion solver. Native donor MPD retains submodels and source steps; Edited MPD is a posed triangle snapshot. Film mode reviews a proposed 48-second take. Clearance failures block playback and export; the assembly remains unverified.';$('#filmFacts').textContent='Green Grocer by Max Martin Richter and credited revisers · authored architecture with the existing Butter cast';}};$('#filmBrief').onclick=filmBrief;
window.ButterLocation={setView:locationSetView,setPage:locationSetPage,get view(){return locationView;},get page(){return locationPage;},get report(){return {pages:filmAsset()?.pages?.length,visible:S.parts.filter(p=>p.mesh.visible).length,colliders:walkGround.length};}};
const booklet=document.createElement('button');booklet.textContent='Subassembly MPD';booklet.id='locationBooklet';review.append(booklet);booklet.onclick=()=>{const page=filmAsset().pages[locationPage],refs=page.bom.filter(b=>b.subassembly).map(b=>b.ref);if(!refs.length)return;const sections=new Map();let key=null;for(const line of filmAsset().sourceText.split(/\r?\n/)){if(/^0 FILE /i.test(line)){key=line.slice(7).trim().toLowerCase();sections.set(key,[]);}if(key&&!/^0 NOFILE/i.test(line))sections.get(key).push(line);}const seen=new Set(),order=[];function visit(k){if(seen.has(k))return;seen.add(k);if(!sections.has(k))throw Error('Missing source section: '+k);order.push(k);for(const line of sections.get(k)){const m=line.trim().match(/^1\s+\S+\s+(?:\S+\s+){12}(.+)$/);if(m&&sections.has(m[1].toLowerCase()))visit(m[1].toLowerCase());}}visit(refs[0]);download(order.map(k=>sections.get(k).join('\n')).join('\n')+'\n0 NOFILE\n','source-subassembly.mpd','text/plain');};
const locationApplyBefore=locationApply;locationApply=function(){locationApplyBefore();booklet.hidden=!isLocation()||!filmAsset().pages[locationPage].bom.some(b=>b.subassembly);};
// Cap the native location's draw rate; input and hand tracking still update every frame.
let locationDrawAt=0;const locationFrameStep=runFrameStep;runFrameStep=function(name,fn){if(name==='scene-render'&&isLocation()){const now=performance.now();if(now-locationDrawAt<40)return;locationDrawAt=now;}return locationFrameStep(name,fn);};
// Preserve glass triangles as a transparent child; the catalogue keeps complete export geometry.
const locationCreateBefore=create;create=function(row){const p=locationCreateBefore(row),d=catalog.get(row.part);if(d?.glassTriangles?.length){if(!d.opaqueGeometry){const glass=new Set(d.glassTriangles),opaqueIndex=[],glassIndex=[];for(let i=0;i<d.geometry.attributes.position.count/3;i++)(glass.has(i)?glassIndex:opaqueIndex).push(i*3,i*3+1,i*3+2);const split=index=>{const g=new THREE.BufferGeometry();for(const [k,a]of Object.entries(d.geometry.attributes))g.setAttribute(k,a);g.setIndex(index);g.computeBoundingSphere();return g;};d.opaqueGeometry=split(opaqueIndex);d.glassGeometry=split(glassIndex);}p.mesh.geometry=d.opaqueGeometry;const glass=new THREE.Mesh(d.glassGeometry,new THREE.MeshStandardMaterial({vertexColors:true,color:0xffffff,transparent:true,opacity:.2,roughness:.12,depthWrite:false,side:THREE.DoubleSide}));glass.name='Native glass';glass.onBeforeRender=()=>{glass.material.clippingPlanes=p.mesh.material.clippingPlanes;glass.material.clipIntersection=p.mesh.material.clipIntersection;};p.mesh.add(glass);}return p;};
const locationReleaseBefore=filmReleaseUnused;filmReleaseUnused=function(){const keep=new Set(S.parts.map(p=>filmPartOwner.get(p.part)?.id));for(const d of catalog.values())if(d.film&&!keep.has(d.filmId)){d.opaqueGeometry?.dispose();d.glassGeometry?.dispose();d.filmOpaque?.dispose();d.filmClear?.dispose();}locationReleaseBefore();};
// Film cutaways remove whole native leaf instances. No clipping plane opens a brick shell.
function locationFilmGeometry(d){
 if(d.filmOpaque)return;
 const bytes=Uint8Array.from(atob(d.filmVertices),c=>c.charCodeAt(0));
 const positions=new Float32Array(bytes.buffer),rgb=Uint8Array.from(atob(d.filmColors),c=>c.charCodeAt(0)),colors=new Float32Array(positions.length);
 for(let i=0;i<rgb.length/3;i++){const c=new THREE.Color(rgb[i*3]/255,rgb[i*3+1]/255,rgb[i*3+2]/255).convertSRGBToLinear();for(let j=0;j<3;j++)colors.set([c.r,c.g,c.b],i*9+j*3);}
 const full=new THREE.BufferGeometry();full.setAttribute('position',new THREE.BufferAttribute(positions,3));full.setAttribute('color',new THREE.BufferAttribute(colors,3));full.computeVertexNormals();
 const glass=new Set(d.filmGlassTriangles),opaque=[],clear=[];
 for(let i=0;i<positions.length/9;i++)(glass.has(i)?clear:opaque).push(i*3,i*3+1,i*3+2);
 const split=indices=>{const g=new THREE.BufferGeometry();g.setAttribute('position',full.attributes.position);g.setAttribute('normal',full.attributes.normal);g.setAttribute('color',full.attributes.color);g.setIndex(indices);g.computeBoundingBox();return g;};
 d.filmOpaque=split(opaque);d.filmClear=split(clear);
}
function locationUseWholePieces(p,film){
 const d=catalog.get(p.part);if(!d?.layer)return;
 if(film&&d.filmVertices!==undefined){locationFilmGeometry(d);p.mesh.geometry=d.filmOpaque;}
 else p.mesh.geometry=d.opaqueGeometry||d.geometry;
 p.mesh.material.side=THREE.DoubleSide;p.mesh.material.clippingPlanes=[];
 const glass=p.mesh.children.find(c=>c.name==='Native glass');if(glass){glass.geometry=film&&d.filmClear?d.filmClear:d.glassGeometry;glass.material.clippingPlanes=[];}
}
const locationWholeApply=locationApply;locationApply=function(){locationWholeApply();if(isLocation())for(const p of S.parts)locationUseWholePieces(p,locationView==='interior');};

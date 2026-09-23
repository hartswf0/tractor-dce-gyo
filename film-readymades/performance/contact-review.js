/* Conservative geometric clearance review. This is not a clutch/strength solver. */
const contactPanel=document.createElement('details');contactPanel.id='contactReview';
contactPanel.innerHTML='<summary>Contact not checked · assembly unverified</summary><p>Checks sampled cast and prop envelopes against visible native triangles, including glass. An overlap needs inspection; it is not proof of interpenetration. Stud connections, insertion, support and strength are not verified.</p><button type="button">Save contact report</button>';
takePanel.append(contactPanel);
let contactReport=null,contactChecking=false;
const contactTriangles=new WeakMap();
function contactMeshData(g){
 let d=contactTriangles.get(g);if(d)return d;
 const pos=g.attributes.position,index=g.index,triangles=[];
 for(let i=0;i<(index?index.count:pos.count);i+=3){const points=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(pos,index?index.getX(i+j):i+j));const triangle=new THREE.Triangle(...points);const box=new THREE.Box3().setFromPoints(points);triangles.push({triangle,box});}
 function build(items){const box=new THREE.Box3();for(const t of items)box.union(t.box);if(items.length<=24)return {box,items};const s=box.getSize(V()),axis=s.x>=s.y&&s.x>=s.z?'x':s.y>=s.z?'y':'z';items.sort((a,b)=>a.box.min[axis]+a.box.max[axis]-b.box.min[axis]-b.box.max[axis]);const n=items.length>>1;return {box,left:build(items.slice(0,n)),right:build(items.slice(n))};}
 d=build(triangles);contactTriangles.set(g,d);return d;
}
function contactIntersect(node,box){if(!node.box.intersectsBox(box))return false;if(node.items)return node.items.some(t=>t.box.intersectsBox(box)&&box.intersectsTriangle(t.triangle));return contactIntersect(node.left,box)||contactIntersect(node.right,box);}
function contactBox(o){o.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(o);}
function contactMovers(){
 const movers=[];for(const [actor,a]of Object.entries(takeCast))for(const [slot,o]of Object.entries(a.rig.slots)){if(!o||!o.isObject3D||!o.visible)continue;const box=contactBox(o);if(!box.isEmpty())movers.push({name:actor+'.'+slot,box});}
 for(const name of ['apple','apple2','duck','buggy']){const o=takeAssets[name];if(o?.visible)movers.push({name,box:contactBox(o)});}
 return movers;
}
function contactFrame(t,pose=true){
 if(pose)takeSeek(t);scene.updateMatrixWorld(true);const movers=contactMovers(),hits=[];
 const fixtures=[];
 for(const p of S.parts){if(!p.mesh.visible||catalog.get(p.part)?.layer!=='shop')continue;p.mesh.traverse(o=>{if(!o.isMesh||!o.visible||!o.geometry.attributes.position)return;fixtures.push({mesh:o,p,name:catalog.get(p.part).name,source:catalog.get(p.part).ref,world:contactBox(o)});});}
 for(const name of ['buggy','housing','stem']){const mesh=takeAssets[name];if(mesh?.visible)fixtures.push({mesh,name,source:name==='buggy'?'Film-Butter-Buggy.mpd':'performance/take.js',world:contactBox(mesh)});}
 for(const mover of movers){
  // Slightly shrink the envelope to avoid reporting exact floor seating as penetration.
  const box=mover.box.clone().expandByScalar(-.02);if(box.isEmpty())continue;
  for(const f of fixtures){if(mover.name===f.name||!box.intersectsBox(f.world))continue;
   const local=box.clone().applyMatrix4(f.mesh.matrixWorld.clone().invert());
   if(contactIntersect(contactMeshData(f.mesh.geometry),local)){hits.push({time:+t.toFixed(4),moving:mover.name,obstacle:f.name,source:f.source,instance:f.p?.id,test:'native triangle intersects conservative moving envelope'});}
  }
 }
 // A hand's hollow grip needs an exact grip solver. Envelope overlap remains unresolved.
 for(const prop of movers.filter(m=>['apple','apple2','duck'].includes(m.name)))for(const hand of movers.filter(m=>/\.hand[LR]$/.test(m.name)))if(prop.box.clone().expandByScalar(-.02).intersectsBox(hand.box))hits.push({time:+t.toFixed(4),moving:prop.name,obstacle:hand.name,test:'grip envelopes overlap; exact contact unresolved'});
 return hits;
}
function contactLabel(text){contactPanel.querySelector('summary').textContent=text;}
async function contactCheck({step=1/12,end=48}={}){
 if(contactChecking)return null;if(!takeActive)throw Error('Enter the grocery take first.');contactChecking=true;takeStop();const old=takeTime,hits=[];let samples=0;
 contactLabel('Checking geometry… · assembly unverified');
 try{
  for(let n=0;n<=Math.round(end/step);n++){const t=Math.min(end,n*step);hits.push(...contactFrame(t));samples++;
   if(n%24===0){takeSeek(old);contactLabel('Checking '+Math.round(t/end*100)+'% · assembly unverified');await new Promise(r=>setTimeout(r,0));}
  }
  contactReport={schema:1,status:hits.length?'blocked':'sampled-envelopes-clear',samples,stepSeconds:step,duration:end,hits,structuralValidation:'not performed',limitations:['Conservative envelopes can flag safe hollow grips.','Sampled positions do not certify continuous swept motion.','No stud/clutch, support, insertion, strength or balance solver.','No solid-containment classification; these are surface/envelope tests.','Actor self-collision and contacts outside this scope are not certified.','Report applies only to the inspected current scene.']};
  contactLabel(hits.length?'Playback blocked · '+hits.length+' unresolved contacts':'Sampled envelopes clear · assembly unverified');contactPanel.open=hits.length>0;return contactReport;
 }finally{takeSeek(old);contactChecking=false;}
}
contactPanel.querySelector('button').onclick=()=>download(JSON.stringify(contactReport||{status:'not checked',structuralValidation:'not performed'},null,2),'film-contact-report.json','application/json');
const contactPlayBefore=takePlay;takePlay=async function(){if(takePlaying){takeStop();return;}const report=await contactCheck();if(report?.status!=='sampled-envelopes-clear'){note('Take blocked. Inspect the contact report; scrubbing remains available.','CONTACT');return;}await contactPlayBefore();};
$('#takePlay').onclick=takePlay;GrocerTake.play=takePlay;
GrocerTake.contacts={check:contactCheck,frame:contactFrame,current:t=>contactFrame(t,false),get report(){return contactReport;}};
const contactExportBefore=GrocerTake.frame;GrocerTake.frame=function(t){const hits=contactFrame(t);if(hits.length)throw Error('Export blocked at '+t.toFixed(3)+'s: '+hits[0].moving+' / '+hits[0].obstacle);return contactExportBefore(t);};
// Review failures in the scene, without accepting the proposed pose as a valid action.
const contactIssues=document.createElement('select');contactIssues.setAttribute('aria-label','Inspect an unresolved contact');contactIssues.hidden=true;contactPanel.insertBefore(contactIssues,contactPanel.querySelector('button'));
let contactMarkers=[];
function contactClearMarkers(){for(const m of contactMarkers){scene.remove(m);m.geometry.dispose();m.material.dispose();}contactMarkers=[];}
const contactSeekBefore=takeSeek;takeSeek=function(t){if(t!==takeTime)contactClearMarkers();contactSeekBefore(t);};
contactIssues.onchange=()=>{const h=contactReport?.hits[+contactIssues.value];if(!h)return;GrocerTake.seek(h.time);const mover=contactMovers().find(m=>m.name===h.moving),obstacle=S.parts.find(p=>p.id===h.instance);for(const [box,color]of [[mover?.box,0xffcc33],[obstacle?contactBox(obstacle.mesh):contactMovers().find(m=>m.name===h.obstacle)?.box,0x55ddff]])if(box){const marker=new THREE.Box3Helper(box,color);marker.material.depthTest=false;marker.renderOrder=999;scene.add(marker);contactMarkers.push(marker);}};
const contactCheckBefore=contactCheck;contactCheck=async function(options){const report=await contactCheckBefore(options);contactIssues.replaceChildren();if(report){const seen=new Set();for(const [i,h]of report.hits.entries()){const key=h.moving+' / '+h.obstacle;if(seen.has(key))continue;seen.add(key);contactIssues.add(new Option(h.time.toFixed(2)+'s · '+key,i));}contactIssues.hidden=!report.hits.length;}return report;};GrocerTake.contacts.check=contactCheck;
const contactLeaveBefore=takeLeave;takeLeave=function(){contactClearMarkers();contactLeaveBefore();};

/* Interactive source/brick comparison. Rendering uses the repository's LDraw loader. */
(function(){
'use strict';
const $=id=>document.getElementById(id),error=msg=>$('error').textContent=msg;
let parsed=null,assembly=null,frame=null,model=null,token=0,queue=Promise.resolve(),renderer,scene,camera,controls,loader;
const download=(name,text,type)=>{const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
function clearExport(){$('mpd').disabled=true;$('json').disabled=true;assembly=null;}
function paint(){
 if(!parsed||!frame)return;const c=$('source'),g=c.getContext('2d'),cw=20,ch=24;c.width=parsed.w*cw;c.height=parsed.h*ch;
 for(let y=0;y<parsed.h;y++)for(let x=0;x<parsed.w;x++){const i=y*parsed.w+x,v=255-Math.round(frame.cells[i]*255/7);g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(x*cw,y*ch,cw,ch);if(assembly&&$('difference').checked&&(frame.cells[i]>=+$('threshold').value)!==!!assembly.projected[i]){g.fillStyle='#df4535';g.fillRect(x*cw,y*ch,cw,ch);}}
}
function fit(front){
 if(!model||!camera)return;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),radius=Math.max(size.x,size.y,size.z,40),distance=radius*1.8;
 camera.position.copy(center).add(new THREE.Vector3(front?0:distance*.65,front?0:distance*.45,distance));camera.near=1;camera.far=distance*20;camera.updateProjectionMatrix();controls.target.copy(center);controls.update();
}
function showModel(mpd,current){
 if(!loader)return;
 queue=queue.catch(()=>{}).then(()=>new Promise(resolve=>{
 if(current!==token)return resolve();let finished=false;const timer=setTimeout(()=>{if(current===token)error('LDraw parts did not finish loading. Exports remain available; rebuild to retry.');finished=true;resolve();},45000);
 try{loader.parse(mpd,'beflix-extrusion.mpd',g=>{clearTimeout(timer);if(current===token&&!finished){if(model)scene.remove(model);model=new THREE.Group();model.rotation.x=Math.PI;model.add(g);scene.add(model);fit(false);$('modelCaption').textContent='LDraw · drag to orbit, pinch or scroll to zoom';}resolve();});}catch(e){clearTimeout(timer);if(current===token)error(e.message);resolve();}
 }));
}
function assemble(){
 clearExport();error('');const current=++token;
 try{
 if(!parsed)throw Error('Build the drawing first.');frame=parsed.frames[+$('frame').value];
 assembly=BeflixBricks.assemble(frame,parsed.w,parsed.h,+$('depth').value,+$('threshold').value,Dsl);
 assembly.mpd=assembly.mpd.replace('\n','\n0 !COLOUR Workshop_Tan CODE 19 VALUE #D9BB7B EDGE #554832\n');
 paint();$('depthValue').textContent=$('depth').value+' studs';$('thresholdValue').textContent=$('threshold').value;
 $('frameLabel').textContent='Recorded state '+(+$('frame').value+1)+' / '+parsed.frames.length+' · frames '+frame.start+'–'+(frame.start+frame.duration-1);
 $('status').textContent=assembly.result.pieces.length+' bricks · '+assembly.mismatch+' source cells differ · '+assembly.result.report.floating+' floating pieces reported';
 $('parts').textContent=Object.entries(assembly.parts).map(([p,n])=>p+'.dat × '+n).join('\n')||'No bricks.';
 $('mpd').disabled=!assembly.result.pieces.length;$('json').disabled=false;
 if(assembly.result.pieces.length){$('modelCaption').textContent='Loading LDraw geometry…';showModel(assembly.mpd,current);}else{if(model&&scene)scene.remove(model);model=null;$('modelCaption').textContent='No supported bricks in this state';}
 }catch(e){error(e.message);paint();}
}
function build(){try{const [w,h]=$('grid').value.split(',').map(Number);parsed=BeflixBricks.parse($('code').value,w,h);$('frame').max=parsed.frames.length-1;$('frame').value=0;assemble();}catch(e){token++;clearExport();error(e.message);$('status').textContent='Drawing rejected. Correct the command and rebuild.';}}
$('code').oninput=()=>{token++;clearExport();parsed=null;$('status').textContent='Program changed. Build to update the assembly.';$('modelCaption').textContent='Previous assembly';};$('grid').onchange=()=>{token++;clearExport();parsed=null;$('status').textContent='Grid changed. Build to update the assembly.';};
$('build').onclick=build;$('frame').onchange=assemble;$('depth').onchange=assemble;$('threshold').onchange=assemble;$('difference').onchange=paint;
$('depth').oninput=()=>$('depthValue').textContent=$('depth').value+' studs';$('threshold').oninput=()=>$('thresholdValue').textContent=$('threshold').value;
$('front').onclick=()=>fit(true);$('orbit').onclick=()=>fit(false);
$('mpd').onclick=()=>assembly&&download('beflix-extrusion.mpd',assembly.mpd,'text/plain');
$('json').onclick=()=>assembly&&download('beflix-extrusion.json',JSON.stringify({schema:'beflix-bricks/1',source:$('code').value,grid:[parsed.w,parsed.h],state:+$('frame').value,depth:+$('depth').value,threshold:+$('threshold').value,program:assembly.program,regions:assembly.regions,checks:{mismatchedCells:assembly.mismatch,floating:assembly.result.report.floating}},null,2),'application/json');
$('source').onclick=e=>{if(!frame||!parsed)return;const rect=e.currentTarget.getBoundingClientRect(),x=Math.min(parsed.w-1,Math.floor((e.clientX-rect.left)/rect.width*parsed.w)),y=Math.min(parsed.h-1,Math.floor((e.clientY-rect.top)/rect.height*parsed.h)),line=frame.owners[y*parsed.w+x],lines=$('code').value.split('\n');const start=lines.slice(0,line-1).reduce((n,s)=>n+s.length+1,0);$('code').focus();$('code').setSelectionRange(start,start+(lines[line-1]||'').length);$('sourceCaption').textContent='Cell '+x+', '+y+' · last written by line '+line;};
$('image').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Use an image under 10 MB.');const bitmap=await createImageBitmap(file),[w,h]=$('grid').value.split(',').map(Number),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,w,h);const scale=Math.min(w/bitmap.width,h/bitmap.height),dw=bitmap.width*scale,dh=bitmap.height*scale;g.drawImage(bitmap,(w-dw)/2,h-dh,dw,dh);bitmap.close();const data=g.getImageData(0,0,w,h).data,lines=['CLR 0'];for(let y=0;y<h;y++)for(let x=0;x<w;){const value=i=>Math.round((1-(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])/255)*7),v=value(y*w+x);if(!v){x++;continue;}let end=x+1;while(end<w&&value(y*w+end)===v)end++;lines.push('PNT '+x+' '+y+' '+(end-x)+' 1 '+v);x=end;}lines.push('REC 24');$('code').value=lines.join('\n');build();}catch(e){error(e.message);}};
try{
 const host=$('viewport');renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color(0x202832);scene.add(new THREE.HemisphereLight(0xffffff,0x505060,1.4));const light=new THREE.DirectionalLight(0xffffff,1);light.position.set(500,800,600);scene.add(light);camera=new THREE.PerspectiveCamera(38,1,1,10000);controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=false;loader=new THREE.LDrawLoader();loader.setPath('ldraw/');const draw=()=>renderer.render(scene,camera);controls.addEventListener('change',draw);new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();draw();}).observe(host);
}catch(e){$('modelCaption').textContent='3D preview unavailable. Source comparison and exports still work.';}
build();
})();

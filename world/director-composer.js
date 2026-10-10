(function(){'use strict';
const $=id=>document.getElementById(id),D=DirectorCore,history=[],undos=[];let W,F,C,prepared=null,controller=null,selected=0,sceneRef=null,lastReel=null;
const error=t=>$('error').textContent=t;
const record=(kind,data)=>{const item={time:new Date().toISOString(),kind,data};history.push(item);const el=document.createElement('details');el.open=true;const sum=document.createElement('summary');sum.textContent=kind;const pre=document.createElement('pre');pre.textContent=JSON.stringify(data,null,2);el.append(sum,pre);$('history').prepend(el);return item;};
const download=(name,text,type)=>{const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
const signature=()=>JSON.stringify(F.shots.map(s=>({name:s.name,sec:s.sec,plan:s.plan,keys:s.keys.map(k=>({pos:k.pos.toArray(),tgt:k.tgt.toArray(),fov:k.fov}))})));
function context(){return {film:F.name||'',subjects:['me',...F.actors.keys(),...F.builds.keys()],selected,shots:F.shots.map((s,index)=>({index,name:s.name,duration:s.sec,camera:s.plan||{on:s.on,frame:s.frame,move:s.move},spokenLines:(s.events||[]).filter(e=>e.what==='SPEAK').map(e=>({who:e.who,text:e.text}))}))};}
function invalidate(){prepared=null;$('send').disabled=true;$('apply').disabled=true;}
function render(){
 if(!F)return;selected=Math.max(0,Math.min(selected,F.shots.length-1));$('shots').replaceChildren();
 F.shots.forEach((s,i)=>{const b=document.createElement('button');b.textContent=(i+1)+'. '+s.name+' · '+s.sec+'s';b.setAttribute('aria-pressed',String(i===selected));b.onclick=()=>{selected=i;F.view(i);render();};$('shots').append(b);});
 const ctx=context(),current=$('subject').value;$('subject').replaceChildren(...ctx.subjects.map(s=>new Option(s,s)));if(ctx.subjects.includes(current))$('subject').value=current;
 const s=F.shots[selected],p=s&&(s.plan||s);if(p){if(ctx.subjects.includes(p.on))$('subject').value=p.on;$('framing').value=D.frames.includes(p.frame)?p.frame:'medium';$('movement').value=D.moves.includes(p.move)?p.move:'hold';$('bearing').value=D.bearings.includes(p.from)?p.from:'front';$('lens').value=p.lens||s.keys[0]?.fov||40;}
 $('manual').disabled=!s;$('play').disabled=!F.shots.length;$('stop').disabled=false;$('capture').disabled=false;$('compose').disabled=!!controller;$('undo').disabled=!undos.length;
}
function snapshot(){return{context:context(),signature:signature(),scene:F.scene};}
function apply(raw,snap){
 if(!snap||snap.scene!==F.scene||snap.signature!==signature())throw Error('The scene or cameras changed. Prepare a fresh prompt.');
 const plan=D.validate(raw,snap.context);if(!plan.shots.length){$('status').textContent=plan.note||'No camera changes proposed.';return;}
 const replacements=plan.shots.map(p=>{const old=F.shots[p.index],st=F.stage({...p,sec:old.sec,name:old.name});return {index:p.index,shot:D.cameraPatch(old,st,p),clear:st.clear};});
 F.stop();undos.push({scene:F.scene,shots:F.shots.slice()});for(const r of replacements)F.shots[r.index]=r.shot;F.save();F.view(selected);
 record('Applied camera edits',{patches:plan.shots,staging:replacements.map(r=>({index:r.index,clear:r.clear,keys:r.shot.keys.map(k=>({position:k.pos.toArray(),target:k.tgt.toArray(),fieldOfView:k.fov}))})),duration:F.total()});invalidate();render();$('status').textContent='Camera edits applied. Play or capture to inspect them.';
}
$('system').value=D.system;for(const[id,values]of [['framing',D.frames],['movement',D.moves],['bearing',D.bearings]])$(id).replaceChildren(...values.map(v=>new Option(v,v)));
$('compose').onclick=()=>{try{error('');if(!$('brief').value.trim())throw Error('Write a direction first.');const snap=snapshot(),input='SCENE CONTEXT\n'+JSON.stringify(snap.context,null,2)+'\nDIRECTOR BRIEF\n'+$('brief').value.trim()+'\nReturn one JSON object only.';prepared={...snap,system:$('system').value,input};record('Prepared model call',{model:C.Ai.model(),instructions:prepared.system,input,images:[],automaticRetries:0});$('send').disabled=false;$('apply').disabled=true;$('status').textContent='Exact prompts shown below. Send when ready.';}catch(e){error(e.message);}};
$('send').onclick=async()=>{if(!prepared||controller)return;const request=prepared;try{
 error('');if(request.scene!==F.scene||request.signature!==signature())throw Error('Scene changed. Prepare again.');
 const key=$('key').value.trim()||C.Ai.key();if(!key)throw Error('Enter an API key in Model connection or configure it in Cinerium.');
 controller=new AbortController();$('cancel').disabled=false;$('send').disabled=true;$('compose').disabled=true;record('Request sent',{model:C.Ai.model(),instructions:request.system,input:request.input});
 const response=await C.Ai.request(request.input,{key,system:request.system,signal:controller.signal,stage:'DIRECTOR',detail:'camera edits',parse:raw=>raw});
 record('Model response',{raw:response.raw,usage:response.j?.usage,responseId:response.j?.id,milliseconds:response.ms});$('proposal').value=response.raw;
 D.validate(response.raw,request.context);if(request.scene!==F.scene||request.signature!==signature())throw Error('Scene changed while the model worked. Prepare again.');prepared=request;$('apply').disabled=false;$('status').textContent='Proposal validated. Inspect or edit the JSON, then Apply.';
 }catch(e){record('Request failed',{message:e.message});error(e.message);invalidate();}finally{controller=null;$('cancel').disabled=true;$('compose').disabled=!F;render();}};
$('cancel').onclick=()=>controller?.abort();
$('apply').onclick=()=>{try{error('');apply($('proposal').value,prepared);}catch(e){record('Apply rejected',{message:e.message});error(e.message);}};
$('manual').onclick=()=>{try{error('');const patch={index:selected,on:$('subject').value,frame:$('framing').value,from:$('bearing').value,move:$('movement').value,lens:+$('lens').value};record('Direct controls; no model call',patch);apply({shots:[patch]},snapshot());}catch(e){error(e.message);}};
$('play').onclick=()=>{F.playAll();record('Play',{shots:F.shots.length,duration:F.total()});};$('stop').onclick=()=>{F.stop();record('Stop',{shot:F.play.i});};
$('undo').onclick=()=>{const prev=undos.pop();if(!prev||prev.scene!==F.scene){error('That scene has changed; the camera edit cannot be restored.');return;}F.stop();F.shots=prev.shots;F.save();F.view(selected);invalidate();render();record('Undo',{restored:true});};
$('capture').onclick=()=>{try{const cv=document.createElement('canvas');cv.width=1280;cv.height=720;W.renderer.render(W.scene,W.camera);F.drawFrame(cv.getContext('2d'),1280,720);const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='director-shot-'+(F.sel+1)+'.png';a.click();record('Frame captured',{shot:F.sel,reelTime:F.reelOffset(F.play.i)+F.play.t});}catch(e){error(e.message);}};
$('export').onclick=()=>download('director-session.json',JSON.stringify({schema:'cinerium-director/1',history},null,2),'application/json');
$('film').onchange=()=>{controller?.abort();F.stop();F.trailer($('film').value);undos.length=0;invalidate();$('status').textContent='Loading film…';};
for(const id of ['brief','system'])$(id).oninput=()=>{if(!controller)invalidate();};
const timer=setInterval(()=>{try{C=$('world').contentWindow;W=C.__world;F=W?.film;if(!F||!W.ready||F.scene&&!F.scene.ready)return;
 if(!lastReel){$('film').replaceChildren(...Object.entries(C.Film.SCENES).map(([id,p])=>new Option(p.name||id,id)));$('film').value='odyssey-trailer';$('film').disabled=false;$('model').textContent='Model: '+C.Ai.model()+'. API keys are excluded from the history.';$('status').textContent='Ready. Select a shot or prepare a direction.';}
 if(sceneRef!==F.scene){sceneRef=F.scene;undos.length=0;invalidate();selected=0;}
 if(lastReel!==F.shots){lastReel=F.shots;render();}
 }catch(e){error('Composer needs Cinerium on the same origin: '+e.message);clearInterval(timer);}},500);
})();

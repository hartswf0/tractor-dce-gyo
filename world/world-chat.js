/* Chat shell: relocate existing controls, preserving their handlers and builder state. */
(function(){
'use strict';
const $=s=>document.querySelector(s),W=window.__world;
if(!W||!window.PutThatThere)return;
const link=document.createElement('link');link.rel='stylesheet';link.href='./world/world-chat.css?v=8';document.head.appendChild(link);
document.body.classList.add('world-chat');
const shell=document.createElement('section');shell.id='worldChat';shell.setAttribute('aria-label','World conversation');
shell.innerHTML='<header><span id="wcPlace">World</span><button id="wcHistoryToggle" aria-expanded="true">History</button></header><div id="wcHistory" role="log" aria-live="polite"></div><div id="wcContext"></div><div id="wcStatus" role="status"></div><div id="wcPreview" hidden></div><div id="wcSelection"></div><div id="wcAudio" hidden></div><div id="wcComposer"></div><nav aria-label="World tools"><button data-tool="build">Build</button><button data-tool="point">Point</button><button data-tool="world">World</button><button data-tool="setup">Setup</button></nav><div id="wcTools" hidden><div class="wcTool" id="wc-build" hidden><div id="wcBuildButtons"></div><div class="wcParts"><select id="wcPart" aria-label="Brick shape"></select><select id="wcColour" aria-label="Brick colour"><option value="4">Red</option><option value="1">Blue</option><option value="14">Yellow</option><option value="2">Green</option><option value="15">White</option><option value="0">Black</option><option value="71">Grey</option></select></div><div id="wcExamples"><button data-prompt="Build a house here">House here</button><button data-prompt="Make that taller">Make it taller</button><button data-prompt="Copy that over there">Copy there</button></div></div><div class="wcTool" id="wc-point" hidden><div id="wcPointButtons"></div></div><div class="wcTool" id="wc-world" hidden></div><div class="wcTool" id="wc-setup" hidden><p>API key for generation and transcription</p></div></div>';
document.body.appendChild(shell);
function move(id,dest){const e=$(id),p=$(dest);if(e&&p)p.appendChild(e);return e;}
move('#pttForm','#wcComposer');move('#pttAsk','#wcComposer');
move('#pttThat','#wcContext');move('#pttThere','#wcContext');
for(const id of ['#pttMove','#pttCopy','#pttCancel'])move(id,'#wcSelection');
move('#wbSheet','#wcPreview');
for(const id of ['#pttSendAudio','#pttPlayback','#pttLevel'])move(id,'#wcAudio');
for(const id of ['#pttBrick','#pttUndo','#wbRead','#wbCodeBtn','#wbLogBtn','#wbStop'])move(id,'#wcBuildButtons');
for(const id of ['#wbCode','#wbLog'])move(id,'#wc-build');
for(const id of ['#pttStart','#pttCenter','#pttArrange'])move(id,'#wcPointButtons');
move('#pttView','#wc-point');
const objects=$('#pttObjects');if(objects)move('#pttObjects','#wc-point');
move('#pttGesture','#wc-point');move('#menu','#wc-world');move('#find','#wc-world');
move('#wbKeyRow','#wc-setup');move('#pttBrowserVoice','#wc-setup');move('#pttDiagnostics','#wc-setup');
const transcript=[];
function message(role,text){
 if(!text)return;const last=transcript[transcript.length-1];if(last&&last.role===role&&last.text===text)return;
 transcript.push({role,text});if(transcript.length>60)transcript.shift();
 const log=$('#wcHistory');const bubble=document.createElement('p');bubble.className=role;bubble.textContent=text;log.appendChild(bubble);
 while(log.children.length>60)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
}
message('assistant','Point at an object or a place, then tell me what to build or change.');
let tool=null;
function openTool(name){
 tool=tool===name?null:name;
 $('#wcTools').hidden=!tool;
 shell.querySelectorAll('.wcTool').forEach(e=>e.hidden=e.id!=='wc-'+tool);
 shell.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('on',b.dataset.tool===tool);b.setAttribute('aria-expanded',String(b.dataset.tool===tool));});
}
shell.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
shell.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#pttWords').value=b.dataset.prompt;$('#pttWords').focus();openTool(tool);});
$('#wcHistoryToggle').onclick=()=>{const hidden=$('#wcHistory').hidden=!$('#wcHistory').hidden;$('#wcHistoryToggle').setAttribute('aria-expanded',String(!hidden));};
window.addEventListener('world-chat-message',e=>{message(e.detail.role,e.detail.text);$('#wcHistory').hidden=false;$('#wcHistoryToggle').setAttribute('aria-expanded','true');if(tool)openTool(tool);});
window.addEventListener('world-chat-status',e=>{
 const {text,kind}=e.detail;
 $('#wcStatus').textContent=text;
 if(kind==='speak'||/complete\.|error:|failed:|undone\.|placed\.|recorded/i.test(text))message('assistant',text);
 if(/add an openai key|add.*api key/i.test(text)&&tool!=='setup')openTool('setup');
});
const oldKey=$('#pttKey');if(oldKey)oldKey.onclick=()=>{if(tool!=='setup')openTool('setup');$('#wbKey').focus();};
let partCount=0,hadPreview=false;
function sync(){
 $('#wcPlace').textContent=$('#place').textContent||'World';
 const preview=!!(W.master&&W.master.result);$('#wcPreview').hidden=!preview;
 if(preview&&!hadPreview){message('assistant','Build preview ready. Place it, adjust it, or discard it.');if(tool)openTool(tool);}
 hadPreview=preview;
 const mic=$('#pttMic');if(mic&&mic.textContent&&/REC |transcribing|recorded/i.test(mic.textContent))$('#wcStatus').textContent=mic.textContent;
 $('#wcAudio').hidden=$('#pttPlayback').hidden&&$('#pttSendAudio').disabled;
 const B=W.build;if(B&&B.kinds.size!==partCount){partCount=B.kinds.size;const select=$('#wcPart');select.replaceChildren();for(const [id,k] of B.kinds){const opt=document.createElement('option');opt.value=id;opt.textContent=k.name||id;select.appendChild(opt);}select.value=B.part;}
}
$('#wcPart').onchange=e=>W.choose&&W.choose(e.target.value,null,null);
$('#wcColour').onchange=e=>W.choose&&W.choose(null,+e.target.value,null);
const status=$('#wbText');
if(status)new MutationObserver(()=>{if(W.master&&W.master.busy)$('#wcStatus').textContent=status.textContent;}).observe(status,{childList:true,characterData:true,subtree:true});
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
new MutationObserver(sync).observe($('#pttPlayback'),{attributes:true,attributeFilter:['hidden']});
for(const name of ['pointerdown','pointerup','pointermove','keydown'])shell.addEventListener(name,e=>e.stopPropagation());
function viewport(){const v=window.visualViewport;document.body.classList.toggle('wc-keyboard',!!(v&&v.height<innerHeight*.75));document.documentElement.style.setProperty('--wc-height',(v?v.height:innerHeight)+'px');document.documentElement.style.setProperty('--wc-bottom',Math.max(0,v?innerHeight-v.height-v.offsetTop:0)+'px');}
window.addEventListener('resize',viewport);if(window.visualViewport){visualViewport.addEventListener('resize',viewport);visualViewport.addEventListener('scroll',viewport);}
$('#pttDiagnostics summary').textContent='Diagnostics · chat 8';
$('#wbKeyOk').addEventListener('click',()=>{if(window.Ai&&Ai.key())$('#wcStatus').textContent='API key saved.';});
setInterval(sync,800);sync();viewport();
})();

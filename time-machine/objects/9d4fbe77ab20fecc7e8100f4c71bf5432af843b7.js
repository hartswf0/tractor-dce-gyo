/* One bounded mobile tray; preserves existing controller and key-save handlers. */
(function(){
'use strict';
const $=s=>document.querySelector(s),panel=$('#ptt'),actions=$('#pttActions');
if(!panel||!actions)return;
const style=document.createElement('link');style.rel='stylesheet';style.href='./world/ptt-mobile.css?v=7';document.head.appendChild(style);
const media=matchMedia('(max-width:620px), (max-height:500px) and (pointer:coarse)');
const primary=actions.firstElementChild;primary.id='pttPrimary';
const top=document.createElement('div');top.id='pttTop';top.innerHTML='<span>World controls</span><button id="pttTrayToggle" type="button" aria-expanded="true">Hide</button>';
panel.insertBefore(top,panel.firstChild);
const tools=document.createElement('details');tools.id='pttTools';tools.innerHTML='<summary>More controls</summary><div id="pttToolsBody"><div id="pttSecondary"></div></div>';
const body=tools.querySelector('#pttToolsBody'),secondary=tools.querySelector('#pttSecondary');
const homes=new Map();
function move(el,parent){if(!el)return;if(!homes.has(el)){const mark=document.createComment('mobile home');el.before(mark);homes.set(el,mark);}parent.appendChild(el);}
const keyForm=document.createElement('form');keyForm.id='pttKeyForm';keyForm.hidden=true;
keyForm.innerHTML='<input id="pttKeyInput" type="password" aria-label="OpenAI API key" placeholder="OpenAI API key" autocomplete="off"><button>Save</button>';
body.appendChild(keyForm);
const close=document.createElement('button');close.id='pttMenuClose';close.textContent='Close menu';close.hidden=true;document.body.appendChild(close);
const syncMenu=()=>{const open=media.matches&&$('#menu').classList.contains('open');document.body.classList.toggle('ptt-menu-open',open);close.hidden=!open;};
const audioButton=$('#pttSendAudio');
const syncAudio=()=>{if(media.matches)audioButton.hidden=audioButton.disabled;else audioButton.hidden=false;};
new MutationObserver(syncAudio).observe(audioButton,{attributes:true,attributeFilter:['disabled']});
new MutationObserver(syncMenu).observe($('#menu'),{attributes:true,attributeFilter:['class']});
close.onclick=()=>{$('#menu').classList.remove('open');};
$('#pttTrayToggle').onclick=()=>{const collapsed=panel.classList.toggle('ptt-collapsed');$('#pttTrayToggle').textContent=collapsed?'Controls':'Hide';$('#pttTrayToggle').setAttribute('aria-expanded',String(!collapsed));};
const oldKey=$('#pttKey').onclick;
$('#pttKey').onclick=()=>{if(!media.matches){oldKey();return;}tools.open=true;keyForm.hidden=false;$('#pttKeyInput').value='';$('#pttKeyInput').focus();};
keyForm.onsubmit=e=>{e.preventDefault();const value=$('#pttKeyInput').value.trim();if(!value)return;$('#wbKey').value=value;$('#wbKeyOk').click();$('#pttKeyInput').value='';keyForm.hidden=true;$('#pttLine').textContent='API key saved.';};
function layout(){
  top.hidden=!media.matches;
  if(media.matches){
    // Secondary operations never compete with the prompt and recording button.
    for(const id of ['#pttCenter','#pttUndo','#pttKey','#pttCopy'])move($(id),secondary);
    for(const child of [...actions.children])if(child!==primary&&child.id!=='pttForm'&&child.id!=='pttGesture'&&child!==tools)move(child,body);
    move(audioButton,primary);actions.appendChild(tools);
    tools.open=false;$('#pttDiagnostics').open=false;
    $('#menu').classList.remove('open');
  }else{
    for(const [el,mark] of homes)mark.after(el);
    tools.remove();panel.classList.remove('ptt-collapsed');
  }
  syncAudio();syncMenu();viewport();
}
function viewport(){
 const v=window.visualViewport,h=v?v.height:innerHeight,t=v?v.offsetTop:0,b=Math.max(0,innerHeight-h-t);
 document.documentElement.style.setProperty('--ptt-vh',h+'px');
 document.documentElement.style.setProperty('--ptt-vtop',t+'px');
 document.documentElement.style.setProperty('--ptt-vbottom',b+'px');
 document.body.classList.toggle('ptt-keyboard',media.matches&&h<innerHeight*.75);
}
if(media.addEventListener)media.addEventListener('change',layout);else media.addListener(layout);
window.addEventListener('resize',viewport);
if(window.visualViewport){visualViewport.addEventListener('resize',viewport);visualViewport.addEventListener('scroll',viewport);}
for(const name of ['pointerdown','pointerup','pointermove','keydown'])top.addEventListener(name,e=>e.stopPropagation());
$('#pttDiagnostics summary').textContent='Diagnostics · mobile 7';
layout();
})();

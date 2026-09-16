/* world/ui-shell.js — keep the phone UI in one mode at a time.
   AI words and manual brick placement are mutually exclusive. The OpenAI key
   is always reachable from a fixed KEY/SOL control and never buried in a menu. */
(function(){
'use strict';

function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }

ready(function(){
  const body=document.body;
  const by=id=>document.getElementById(id);

  /* Runtime CSS wins even if an older shell stylesheet is still around. */
  const css=document.createElement('style');
  css.id='worldUiShellStyle';
  css.textContent=`
    body.build #wb{display:none!important}
    body.build{--wb:0px!important}
    body.build #hint{bottom:4px!important}
    #wbRead{display:none!important}
    #worldKeyBtn{position:fixed;left:50%;top:calc(58px + env(safe-area-inset-top));transform:translateX(-50%);height:34px;min-width:56px;padding:0 12px;border:0;border-radius:10px;background:rgba(26,31,42,.14);color:var(--ink,#1a1f2a);font:800 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;z-index:8;box-shadow:none}
    #worldKeyBtn.has{background:#1a1f2a;color:#fff}
    body.fly #worldKeyBtn{display:none}
    #worldKeyModal{position:fixed;inset:0;display:none;align-items:flex-end;background:rgba(10,14,20,.36);z-index:30;padding:12px 12px calc(12px + env(safe-area-inset-bottom))}
    #worldKeyModal.open{display:flex}
    #worldKeyCard{width:100%;max-width:560px;margin:0 auto;padding:14px;border-radius:18px;background:#f8fafb;color:#1a1f2a;box-shadow:0 18px 60px rgba(0,0,0,.28)}
    #worldKeyCard .kh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font:800 11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.15em;text-transform:uppercase}
    #worldKeyCard .kh span:last-child{font-weight:500;color:#596272;letter-spacing:.06em}
    #worldKeyInput{width:100%;height:50px;border:1px solid rgba(26,31,42,.25);border-radius:13px;padding:0 12px;font:15px ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;color:#1a1f2a;-webkit-user-select:text;user-select:text}
    #worldKeyInput:focus{outline:2px solid #c8901c;border-color:transparent}
    #worldKeyActions{display:flex;gap:8px;margin-top:10px}
    #worldKeyActions button{height:46px;border-radius:12px;padding:0 15px;border:1px solid rgba(26,31,42,.2);background:#fff;color:#1a1f2a;font:800 12px system-ui,sans-serif}
    #worldKeyActions .save{flex:1;border:0;background:#1a1f2a;color:#fff}
    #worldKeyActions .remove{color:#b52822}
    #worldKeyNote{margin-top:8px;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#596272}
    #wbKeyRow{display:none!important}
  `;
  document.head.appendChild(css);

  const keyBtn=document.createElement('button');
  keyBtn.id='worldKeyBtn'; keyBtn.type='button'; keyBtn.textContent='KEY'; keyBtn.setAttribute('aria-label','OpenAI API key');
  body.appendChild(keyBtn);

  const modal=document.createElement('div');
  modal.id='worldKeyModal';
  modal.innerHTML=`<div id="worldKeyCard"><div class="kh"><span>Builder key</span><span>GPT-5.6 SOL · MAX</span></div><input id="worldKeyInput" type="password" placeholder="sk-… OpenAI API key" autocomplete="off" autocapitalize="none" spellcheck="false"><div id="worldKeyActions"><button class="remove" type="button">Remove</button><button class="close" type="button">Close</button><button class="save" type="button">Save key</button></div><div id="worldKeyNote">Stored only in this browser's local storage for this site. The builder sends requests directly to OpenAI.</div></div>`;
  body.appendChild(modal);

  const input=by('worldKeyInput');
  const save=modal.querySelector('.save'), close=modal.querySelector('.close'), remove=modal.querySelector('.remove');

  function ai(){ return window.Ai; }
  function hasKey(){ try{return !!(ai()&&ai().key&&ai().key());}catch(e){return false;} }
  function sync(){
    const has=hasKey(); keyBtn.textContent=has?'SOL':'KEY'; keyBtn.classList.toggle('has',has);
    const row=by('wbRow');
    if(row) row.hidden=!has;
    const words=by('words'); if(words) words.placeholder=has?'build something here…':'tap KEY to connect OpenAI';
    const mk=by('aiKey'); if(mk&&has) mk.value=ai().key();
  }
  function exitManual(){
    if(body.classList.contains('build')){ const b=by('build'); if(b) b.click(); }
  }
  function mode(){
    const manual=body.classList.contains('build');
    const b=by('build'); if(b) b.textContent=manual?'DONE':'BUILD';
    if(manual){ const w=by('words'); if(w) w.blur(); }
  }
  function openKey(){
    exitManual();
    if(ai()&&ai().key) input.value=ai().key()||'';
    modal.classList.add('open');
    setTimeout(()=>{input.focus(); input.select();},30);
  }
  function closeKey(){ modal.classList.remove('open'); input.blur(); sync(); }
  function saveKey(){
    const v=(input.value||'').trim(); if(!v||!ai()||!ai().setKey) return;
    ai().setKey(v); sync(); closeKey();
    const w=by('words'); if(w) setTimeout(()=>w.focus(),40);
  }

  keyBtn.addEventListener('click',openKey);
  close.addEventListener('click',closeKey);
  save.addEventListener('click',saveKey);
  remove.addEventListener('click',()=>{ if(ai()&&ai().setKey) ai().setKey(''); input.value=''; sync(); });
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();saveKey();} if(e.key==='Escape'){e.preventDefault();closeKey();} });
  modal.addEventListener('click',e=>{if(e.target===modal) closeKey();});

  const manualBtn=by('build'); if(manualBtn) manualBtn.addEventListener('click',()=>setTimeout(mode,0));
  new MutationObserver(()=>mode()).observe(body,{attributes:true,attributeFilter:['class']});

  /* If the shell contains the old READ action, kill both its visibility and tab stop. */
  const read=by('wbRead'); if(read){read.hidden=true;read.tabIndex=-1;read.setAttribute('aria-hidden','true');}

  /* A missing key should never leave a dead text box. */
  const build=by('wbBuild'); if(build) build.addEventListener('click',()=>{ if(!hasKey()) setTimeout(openKey,0); },true);
  const words=by('words'); if(words) words.addEventListener('focus',()=>{ if(!hasKey()) setTimeout(openKey,0); });

  /* Menu key is only a mirror now. Keep it synchronized if somebody uses it. */
  document.addEventListener('change',e=>{ if(e.target&&e.target.id==='aiKey'&&ai()&&ai().setKey){ai().setKey(e.target.value);sync();} });

  mode(); sync(); setTimeout(sync,250); setTimeout(sync,1000);
});
})();

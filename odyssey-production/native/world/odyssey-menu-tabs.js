/* One WHO / WHERE surface. Existing control nodes retain their event handlers. */
(function(){
 const menu=document.getElementById('menu');if(!menu)return;
 const style=document.createElement('style');style.textContent=`
 #menu{max-height:calc(100dvh - 200px);overflow:auto;z-index:40;background:rgba(248,249,247,.97)}
 #menu{right:auto!important;width:min(390px,calc(100vw - 48px));box-sizing:border-box;background:rgba(247,249,247,var(--menu-opacity,.80))!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid #ffffff55}
 body.dark #menu{background:rgba(214,228,238,var(--menu-opacity,.80))!important}
 #menu.menu-wide{width:calc(100vw - 28px)}
 #menu.menu-peek>[role=tabpanel],#menu.menu-peek .world-tabs{display:none!important}
 #menu .menu-view-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
 #menu .menu-view-tools input{width:95px;height:20px}
 #menu .row span{width:100%;margin-top:8px}
 @media(max-width:650px){#menu{width:calc(100vw - 28px);max-height:48dvh}}
 #menu{border-radius:5px!important;border:1px solid #8cb1c2!important;box-shadow:0 10px 30px #07182766;--ink:#182d3b;--dim:#345263;background:rgba(214,228,238,var(--menu-opacity,.80))!important;background-size:8px 8px}
 #menu button{border-radius:3px!important;border:1px solid #657e8c!important;border-top:2px solid #a4cbd8!important;font:600 11px var(--mono)!important;letter-spacing:.03em;min-height:32px;height:auto!important;padding:7px 9px!important;background:#f1f5f8d9!important;color:#172b38!important}
 #menu button.on,#menu [aria-selected=true]{background:#225572!important;color:white!important}
 #menu #world-tab-play{border-top-color:#e5b544!important} #menu #world-tab-scout{border-top-color:#58b9ba!important} #menu #world-tab-location{border-top-color:#87b565!important} #menu #world-tab-shells{border-top-color:#b587b6!important}
 #menu input,#menu select{border-radius:3px!important;border:1px solid #879eab!important;background:#f8fbfbe8!important;color:#172b38!important;font:12px var(--mono)!important}
 #menu{scrollbar-width:thin;scrollbar-color:#376781 #bfced5}
 #menu::-webkit-scrollbar{width:9px;height:9px} #menu::-webkit-scrollbar-track{background:#bfced5} #menu::-webkit-scrollbar-thumb{background:#376781;border:2px solid #bfced5;border-radius:3px}
 #menu .placement-tools{border:1px solid #77919f;margin:12px 0;padding:10px} #menu .placement-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px} #menu .placement-grid label{display:flex;flex-direction:column} #menu .placement-grid input{width:100%;box-sizing:border-box} #menu legend{font:700 12px var(--mono)}
 body.dark #menu{color:#172b38!important}
 #menu .world-menu-header{position:sticky;top:-10px;z-index:4;background:#ccdde9f5;padding-top:8px} #menu .world-menu-header .world-tabs{position:static;background:transparent} #menu .world-tabs{display:flex;flex-wrap:wrap;gap:6px;position:sticky;top:-10px;padding:8px 0 12px;z-index:2;background:inherit;border-bottom:1px solid #8885;margin-bottom:10px}
 #menu [role=tabpanel][hidden]{display:none!important}
 #menu [role=tabpanel]{min-height:130px}
 #menu .world-tabs [aria-selected=true]{background:#1a1f2a;color:white}
 #menu #odysseyPlay,#menu #odysseyScout,#menu #odysseyLocation{position:static!important;inset:auto!important;max-width:none!important;max-height:none!important;overflow:visible!important;background:transparent!important;color:inherit!important;padding:8px 0!important;font:13px var(--sans)!important;box-shadow:none!important}
 #menu #odysseyLocation>summary{display:none}
 #menu #odysseyLocation img{max-width:400px}
 #menu select{max-width:100%;padding:7px;border-radius:6px}
 #menu p{line-height:1.5} #menu a{color:inherit;text-decoration:underline}
 body:not(.odyssey-tabs-ready)>#odysseyPlay,body:not(.odyssey-tabs-ready)>#odysseyScout,body:not(.odyssey-tabs-ready)>#odysseyLocation{visibility:hidden}
 `;document.head.append(style);
 function mount(){
  const play=document.getElementById('odysseyPlay'),scout=document.getElementById('odysseyScout'),locationPanel=document.getElementById('odysseyLocation');
  if(!menu.querySelector('.row')||!play||!scout||!locationPanel||menu.querySelector('.world-tabs'))return;
  const who=document.createElement('section');while(menu.firstChild)who.append(menu.firstChild);
  const tools=document.createElement('div');tools.className='menu-view-tools';tools.innerHTML='<button type="button" id="menuSize">Wide panel</button><button type="button" id="menuPeek">Peek at scene</button><label>Glass <input aria-label="Panel opacity" type="range" min="35" max="100" value="80"></label>';menu.append(tools);tools.querySelector('#menuSize').onclick=e=>{const wide=menu.classList.toggle('menu-wide');e.target.textContent=wide?'Side panel':'Wide panel';};tools.querySelector('#menuPeek').onclick=e=>{const peek=menu.classList.toggle('menu-peek');e.target.textContent=peek?'Show controls':'Peek at scene';};tools.querySelector('input').oninput=e=>menu.style.setProperty('--menu-opacity',e.target.value/100);
  const tabs=document.createElement('div');tabs.className='world-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','World controls');menu.append(tabs);const header=document.createElement('div');header.className='world-menu-header';menu.prepend(header);header.append(tools,tabs);
  locationPanel.open=true;
  const shells=document.createElement('section');shells.innerHTML='<p><a href="./cinerium.html">Cinerium · book takes and performances ↗</a></p><h3>Scenerator · scene shells</h3><p>Use the existing Grecian Urn catalogue to select a terrain shell, hull, cave or baseplate before dressing the scene.</p><p><a href="https://hartswf0.github.io/tractor-dce-gyo/grecian-urn.html" target="_blank" rel="noopener">Open Grecian Urn Scenerator ↗</a></p><p>The supplied catalogue lists 116 shells. This opens the existing builder; three native shells below can be placed directly as fixed visual scenery. Terrain-conforming collision is not implemented.</p>';
  const shellButtons=document.createElement('p');for(const [key,label]of [['shell-raised','Place raised shell'],['shell-canyon','Place canyon shell'],['shell-stairs','Place stair shell']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{document.getElementById('odPart').value=key;document.getElementById('odPlace').click();};shellButtons.append(b);}shells.append(shellButtons);
  const records=[['who','Who · Where',who],['play','Rehearse',play],['scout','Scout',scout],['location','Location & kit',locationPanel],['shells','Scene shells',shells]];
  function select(id){for(const [key,,node,b]of records){node.hidden=key!==id;b.setAttribute('aria-selected',String(key===id));b.classList.toggle('on',key===id);b.tabIndex=key===id?0:-1;}}
  records.forEach(r=>{const[id,label,content]=r,wrap=document.createElement('section'),b=document.createElement('button');wrap.id='world-pane-'+id;wrap.setAttribute('role','tabpanel');wrap.setAttribute('aria-labelledby','world-tab-'+id);wrap.append(content);r[2]=wrap;b.id='world-tab-'+id;b.type='button';b.textContent=label;b.setAttribute('role','tab');b.setAttribute('aria-controls',wrap.id);b.onclick=()=>select(id);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=records.indexOf(r),n=e.key==='Home'?0:e.key==='End'?records.length-1:(i+(e.key==='ArrowRight'?1:-1)+records.length)%records.length;select(records[n][0]);records[n][3].focus();};r.push(b);tabs.append(b);menu.append(wrap);});
  select('who');document.body.classList.add('odyssey-tabs-ready');observer.disconnect();
 }
 const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});mount();
})();

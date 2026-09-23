/* The forage shelf: runs in the Butter workspace closure (create, S, catalog, refresh, persist, controls are in scope).
   Every card of the Odyssey forage, searchable; choosing one sets its build down where the camera looks, as real parts that
   stay put (pinned) until a piece is picked up, all of them selected so the build moves as one. */
(function(){
 const root=new URL('../../',location.href).href;
 const panel=document.createElement('section');panel.id='forageShelf';panel.hidden=true;
 panel.innerHTML='<div class="fs-head"><strong>Forage</strong><input id="fsQuery" type="search" placeholder="Search the Odyssey cards" aria-label="Search the forage"><button id="fsClose" aria-label="Close the forage">×</button></div><div id="fsTypes"></div><div id="fsList" role="list"></div><p id="fsNote">Choose a card: its build is set down where the camera looks, selected, ready to move.</p>';
 document.body.appendChild(panel);
 const open=document.createElement('button');open.id='fsOpen';open.textContent='Forage';open.title='Add a build from the Odyssey forage';
 (document.getElementById('filmWorldTools')||document.body).appendChild(open);if(!open.parentElement||open.parentElement===document.body)open.classList.add('fs-float');
 let cards=[],type='character';
 const TYPES=[['character','Cast'],['ensemble','Crowds'],['creature','Creatures'],['prop','Props'],['set_piece','Set pieces'],['location','Locations'],['vehicle','Vehicles'],['divine_fx','Divine'],['environment','Weather']];
 async function load(){if(cards.length)return;try{cards=(await (await fetch(root+'odyssey/forage.json')).json()).cards.filter(c=>c.type!=='scene');}catch(e){$('#fsNote').textContent='The forage index could not be read ('+e.message+').';}draw();}
 function draw(){const q=$('#fsQuery').value.trim().toLowerCase();$('#fsTypes').innerHTML=TYPES.map(([k,l])=>`<button data-t="${k}" class="${k===type?'on':''}">${l}</button>`).join('');
  const list=cards.filter(c=>(q?true:c.type===type)&&(!q||c.name.toLowerCase().includes(q))).slice(0,60);
  $('#fsList').innerHTML=list.map(c=>`<button role="listitem" data-id="${c.id}">${c.thumb?`<img alt="" loading="lazy" src="${root}odyssey/thumbs/${c.id}.webp">`:'<span class="fs-sym">'+c.name.slice(0,2)+'</span>'}<span>${c.name}</span><small>${c.pieces} pieces</small></button>`).join('')||'<p>No card matches.</p>';}
 $('#fsTypes').onclick=e=>{const b=e.target.closest('[data-t]');if(b){type=b.dataset.t;$('#fsQuery').value='';draw();}};
 $('#fsQuery').oninput=draw;
 open.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)load();};$('#fsClose').onclick=()=>panel.hidden=true;
 $('#fsList').onclick=async e=>{const b=e.target.closest('[data-id]');if(!b)return;const id=b.dataset.id;$('#fsNote').textContent='Fetching '+id+'…';
  try{const doc=await (await fetch(root+'odyssey/butter/'+id+'.json')).json();
   for(const pid of new Set(doc.parts.map(p=>p.part)))if(!catalog.has(pid))await ButterRepository.load(pid);
   const at=controls.target,added=[];let n=S.next||1;
   for(const p of doc.parts){const row={id:'p'+(n++),part:p.part,color:p.color,x:p.x+at.x,y:p.y+Math.max(0,at.y*0),z:p.z+at.z,r:p.r||0,...(p.q?{q:p.q.slice()}:{})};added.push(create(row));}
   S.next=n;try{PH.pinned=PH.pinned||new Set();for(const p of added)PH.pinned.add(p.id);}catch(_){ }
   S.selected=new Set(added.map(p=>p.id));refresh();persist();$('#fsNote').textContent=`${doc.name}: ${added.length} parts set down and selected. Move them as one; a part picked up alone comes loose.`;}
  catch(err){$('#fsNote').textContent='Could not add '+id+': '+err.message;console.error('[forage shelf]',err);}};
})();
window.OdysseyFilm={asset:()=>filmAsset(),setCamera:c=>filmSetCamera(c),fit:()=>filmFit(),get cameras(){return filmAsset()?.cameras||[];}};

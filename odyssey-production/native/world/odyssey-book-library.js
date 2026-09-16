/* Book rehearsals are native Film programs staged on the chosen live terrain. */
(function(){
const entries={
 film:{book:'all',name:'The journey home · voiced assembly',place:'Voidokilia Beach Greece',sky:'day',weather:'clear',kind:'film'},
 boat:{book:9,name:'Escape by oar · boat test',place:'Voidokilia Beach Greece',sky:'day',weather:'clear',kind:'boat'},
 stake:{book:9,name:'The shared stake',place:'Voidokilia Beach Greece',sky:'dawn',weather:'clear',hero:'shared-stake',kind:'cave'},
 cave:{book:9,name:'Stone and flock',place:'Voidokilia Beach Greece',sky:'dawn',weather:'clear',kind:'cave'},
 circe:{book:10,name:'Circe’s forest threshold',place:'Culbin Forest Scotland',sky:'day',weather:'fog',kind:'forest'},
 argos:{book:17,name:'Argos at the gate',place:'Vathy Ithaca Greece',sky:'dusk',weather:'clear',kind:'gate'},
 axes:{book:21,name:'The twelve axes',place:'Vathy Ithaca Greece',sky:'day',weather:'clear',hero:'twelve-axes',kind:'hall'},
 bed:{book:23,name:'The rooted bed',place:'Vathy Ithaca Greece',sky:'dusk',weather:'clear',hero:'rooted-bed',kind:'hall'}
};
const q=new URLSearchParams(location.search),active=q.get('bookScene');
const ui=document.createElement('details');ui.id='bookLocation';
ui.innerHTML='<summary>Books · stage on location</summary><div class="book-controls"><label>Rehearsal <select id="bookChoice">'+Object.entries(entries).map(([k,e])=>`<option value="${k}">Book ${e.book} · ${e.name}</option>`).join('')+'</select></label><label>Location <input id="bookPlace" aria-label="Rehearsal location"></label><label>Light <select id="bookLight">'+['day','dawn','dusk','night','auto'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><label>Weather <select id="bookWeather">'+['clear','cloudy','fog','rain','storm','snow'].map(x=>'<option>'+x+'</option>').join('')+'</select></label><button id="bookStage">Travel & stage</button><button id="bookApply">Apply light / weather</button><button id="bookCapture">Capture blocking</button><button id="bookFilmPlay">Play with voices & music</button></div><p id="bookStatus" role="status">Choose a book to place native scenery, actors and camera shots in the world. Locations are scouting candidates.</p>';
(document.querySelector('#fb')||document.querySelector('#film')).append(ui);
const css=document.createElement('style');css.textContent='#bookLocation{flex-basis:100%;max-width:820px;background:#cedeeae8;color:#142e40;padding:7px 10px;border:1px solid #7994a8;border-radius:7px;font:12px system-ui;backdrop-filter:blur(8px)}#bookLocation summary{cursor:pointer;font-weight:700}#bookLocation .book-controls{display:flex;flex-wrap:wrap;gap:8px;padding-top:8px}#bookLocation label{display:flex;flex-direction:column;gap:3px}#bookLocation p{margin:6px 0 0}#bookLocation input{width:210px}#bookLocation select,#bookLocation input,#bookLocation button{font:12px system-ui;max-width:270px;padding:5px;border:1px solid #849daa;border-radius:4px}#bookStage{background:#285a77;color:white}';document.head.append(css);
const $=id=>ui.querySelector('#'+id),status=t=>$('bookStatus').textContent=t;
function preset(){const e=entries[$('bookChoice').value];$('bookPlace').value=e.place;$('bookLight').value=e.sky;$('bookWeather').value=e.weather;}
$('bookChoice').value=entries[active]?active:'bed';preset();
if(entries[active]){for(const [id,key]of [['bookPlace','place'],['bookLight','sky'],['bookWeather','weather']])if(q.has(key))$(id).value=q.get(key);}
$('bookChoice').onchange=preset;
$('bookFilmPlay').onclick=async()=>{const W=window.__world;if(!W?.film?.scene?.ready)return status('Wait for the assembly to finish.');Fx.Sfx.setMute(false);Fx.Sfx.unlock();status('Preparing recorded voices and score…');try{await OdysseyAssembly.preload(W);status('Halfworld recordings and score decoded · continuous playback');W.film.playAll();ui.open=false;}catch(e){status('Audio preparation failed: '+e.message);}};
$('bookCapture').onclick=async()=>{const W=window.__world;if(!W?.ready)return;try{const name='on-location-'+(active||'scene');await new Promise(resolve=>requestAnimationFrame(()=>{W.renderer.render(W.scene,W.camera);W.renderer.domElement.toBlob(async blob=>{if(blob)await fetch('/evidence/'+name+'.png',{method:'POST',body:blob});resolve();});}));const r=await fetch('/evidence/'+name+'.json',{method:'POST',body:JSON.stringify({place:W.place,light:W.skyMode,weather:W.weather,scene:W.film.sceneState(),boat:active==='boat'?'Controlled water stage; native 52572 hull, four 2542 oars, five crew; not coastal navigation':null},null,2)});status(r.ok?'Saved blocking screenshot and scene receipt.':'Capture failed');}catch(e){status('Capture failed: '+e.message);}};
$('bookApply').onclick=()=>{const W=window.__world;if(!W?.ready)return status('Waiting for the world.');W.setSky($('bookLight').value);W.setWeather($('bookWeather').value);if(W.film?.scene){W.film.scene.time=$('bookLight').value;W.film.scene.weather=$('bookWeather').value;W.film.save();}const url=new URL(location.href);url.searchParams.set('sky',$('bookLight').value);url.searchParams.set('weather',$('bookWeather').value);history.replaceState(null,'',url);status('Live scene light: '+$('bookLight').value+' · '+$('bookWeather').value);};
$('bookStage').onclick=()=>{const place=$('bookPlace').value.trim();if(!place)return status('Enter a location.');window.__world?.film?.save();location.href='./cinerium.html?'+new URLSearchParams({world:'odyssey',ground:'real',as:'odysseus-sword',place,sky:$('bookLight').value,weather:$('bookWeather').value,bookScene:$('bookChoice').value,mute:$('bookChoice').value==='film'?'0':'1'});};
async function text(url){const r=await fetch(url);if(!r.ok)throw Error('Missing geometry: '+url);const t=await r.text();if(!/^0 /m.test(t)||/<html/i.test(t))throw Error('Invalid geometry: '+url);return t;}
const part=(id,col=19)=>`0 FILE ${id}.ldr\n1 ${col} 0 0 0 1 0 0 0 1 0 0 0 1 ${id}.dat`;
async function program(key){
 if(key==='film')return OdysseyAssembly.compile(program);
 if(key==='boat')return OdysseyBoat.program($('bookLight').value,$('bookWeather').value);
 const e=entries[key],builds=[],actors=[{name:'odysseus',figure:'odysseus-sword',x:-3,z:4,heading:180}];
 function model(name,mpd,x,z,w=8,d=8){builds.push({name,x,z,groundBase:true,program:{ops:[{op:'mpd',name,text:mpd,x:-w/2,z:-d/2,w,d,hp:24}]}});}
 async function donor(name,x,z){let mpd=await text('./odyssey-donors/'+name+'.mpd');if(name.startsWith('pinetree'))mpd=mpd.replace(/^1 15 /gm,'1 2 ');model(name+'-'+builds.length,mpd,x,z);}
 if(e.hero)model(e.hero,await text('/hero-items/'+e.hero+'.mpd'),0,0,16,12);
 if(e.kind==='cave'){
  const rock=['0 FILE cave-mouth.ldr'];
  const line=(id,c,x,y,z,mat='1 0 0 0 1 0 0 0 1')=>rock.push(`1 ${c} ${x} ${-y} ${z} ${mat} ${id}.dat`);
  for(const x of[-190,190])for(const z of[-240,-60,120])line('6082',19,x,144,z,x<0?'0 0 1 0 1 0 -1 0 0':'0 0 -1 0 1 0 1 0 0');
  for(const x of[-160,-80,0,80,160]){line('3001',19,x,168,60);line('3039',19,x,192,60);}
  for(const x of[-285,285])for(const z of[-120,60,230])line('6083',28,x,168,z);
  model('assembled-cave-mouth',rock.join('\n'),0,-2,32,28);
  if(key==='cave'){model('stone',part('6083',72),0,2);for(let i=0;i<3;i++)model('flock-proxy-'+i,part('95341p01'),i*2-2,-3);}
  actors.push({name:'crew',figure:'sailor',x:2,z:4,heading:180});
 }else if(e.kind==='forest'){
  await donor('GreatHallBackWall',0,-5);for(const x of[-5,5]){await donor('pinetree2',x,-3);await donor('GreatHallPillar',x,1);}await donor('GreatHallDoor1',0,-4);
  for(let i=0;i<3;i++)model('transformed-crew-'+i,part('87621p01',13),i*2-2,0);
  actors.push({name:'circe',figure:'penelope-ithaca',x:0,z:-2,heading:0},{name:'witness',figure:'sailor',x:4,z:4,heading:180});
 }else if(e.kind==='gate'){
  for(const x of[-4,4])await donor('GreatHallPillar',x,-2);await donor('GreatHallDoor1',0,-3);model('argos-standing-proxy',part('92586p01'),-2,0);actors.push({name:'eumaeus',figure:'sailor',x:3,z:3,heading:180});
 }else{
  for(const x of[-6,6])await donor('GreatHallPillar',x,-3);await donor('GreatHallBackWall',0,-6);
  if(key==='bed')actors.push({name:'penelope',figure:'penelope-ithaca',x:3,z:1,heading:270});
 }
 const shots=[{name:'Book '+e.book+' · location wide',pos:[13,8,18],tgt:[0,2,0],sec:5,lens:42},{name:e.name+' · approach',on:'odysseus',frame:'medium',from:'s',sec:6,acts:[{who:'odysseus',to:[-2,2]}]},{name:e.name+' · hero detail',pos:[7,5,9],tgt:[0,1.8,0],sec:5,lens:45}];
 return {name:'Book '+e.book+' · '+e.name,world:'odyssey',ground:'real',time:$('bookLight').value,weather:$('bookWeather').value,me:'off',actors,builds,shots,story:{title:e.name,location:$('bookPlace').value,description:'Native on-location blocking. Prototype scenery; full creature performance and historical architecture remain unfinished.'}};
}
if(entries[active]){ui.open=true;status('Loading location before staging…');const start=Date.now();const timer=setInterval(async()=>{const W=window.__world;if(!W?.ready||!W.film||W.relanding){if(Date.now()-start>90000){clearInterval(timer);status('Location is still loading. Reload to retry staging.');}return;}clearInterval(timer);try{status('Loading native scenery and actors…');const prog=await program(active);W.rehearsalProtectSet=true;W.film.stop();W.film.loadProgram(prog);const deadline=Date.now()+90000;while(!W.film.scene?.ready){if(Date.now()>deadline)throw Error('Scene loading timed out');await new Promise(r=>setTimeout(r,150));}if(active==='boat')await OdysseyBoat.assemble(W);if(active==='film')await OdysseyAssembly.finish(W,prog);W.film.view(0);W.film.setMode('shot');status(prog.name+' · '+prog.actors.length+' actors · '+(active==='boat'?1:prog.builds.length)+' assemblies · '+prog.shots.length+' editable shots · '+prog.time+' / '+prog.weather+'. Play rehearses; View explores the location.');ui.open=false;}catch(e){status('Staging failed: '+e.message);ui.open=true;}},300);}
})();

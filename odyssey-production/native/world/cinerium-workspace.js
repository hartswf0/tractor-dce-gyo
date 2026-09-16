/* One viewing surface; existing editing controls retain their original handlers. */
(()=>{
const $=id=>document.getElementById(id), film=$('film');if(!film)return;
const icon=(path)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const icons={watch:'M8 5v14l11-7Z',shots:'M3 5h18v14H3ZM8 5v14M16 5v14',stage:'m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',export:'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',sound:'M3 9h4l5-4v14l-5-4H3ZM16 8q6 4 0 8',stop:'M6 6h12v12H6Z'};
const head=document.createElement('header');head.id='cinHead';head.innerHTML='<div class="cinBrand"><b>CINERIUM</b><span>The Odyssey · a film in bricks</span></div><nav aria-label="Workspace">'+['watch','shots','stage','export'].map(m=>`<button data-workspace="${m}">${icon(icons[m])}${m==='watch'?'Watch':m==='shots'?'Direct':m==='stage'?'Stage':'Export'}</button>`).join('')+'</nav>';film.prepend(head);
const transport=document.createElement('div');transport.id='cinTransport';transport.innerHTML=`<button id="cinPlay" class="primary">${icon(icons.watch)}<span>Play film</span></button><label class="cinPicker">Watching <select id="cinScene" aria-label="Choose a rehearsal"></select></label><span id="cinTime">Loading scene…</span><button id="cinSound">${icon(icons.sound)}<span>Sound</span></button>`;head.after(transport);const library=document.createElement('a');library.href='../scene-library.html';library.textContent='Scene library';library.title='Preview all scenes, sheep escape and earlier tests';transport.append(library);
const help=document.createElement('p');help.id='cinHelp';transport.after(help);
const panels={};for(const m of ['shots','stage','export']){const p=document.createElement('section');p.id='cin-'+m;p.className='cinPanel';film.append(p);panels[m]=p;}
function move(id,p){const el=$(id);if(el)p.append(el);}
move('reel',panels.shots);const fb=$('fb');panels.shots.append(fb);
for(const id of ['fbRec','fbSave','fbAspect','fbFps','fbSize','fbFilms'])move(id,panels.export);
for(const id of ['fbScene','bookLocation'])move(id,panels.stage);
for(const id of ['fbFrame','fbStory','perform','fbText'])move(id,panels.shots);
const names={fbHere:'New shot',fbKey:'Add camera position',fbDel:'Delete shot',fbMento:'Edit film script',fbStoryBtn:'Story notes',fbPerform:'Actor controls',fbFilms:'Film library',fbTheatre:'Full screen view'};
for(const [id,name]of Object.entries(names))if($(id))$(id).textContent=name;
for(const [value,name]of [['view','Explore'],['shot','Shot camera'],['free','Move camera']]){const b=fb.querySelector(`[data-fmode="${value}"]`);if(b)b.textContent=name;}
move('menuBtn',panels.stage);if($('menuBtn'))$('menuBtn').textContent='Character & world';
$('fbScene').options[0].textContent='Other productions…';
for(const [id,label]of [['fbAspect','Frame shape'],['fbFps','Frames / second'],['fbSize','Resolution']]){const el=$(id),l=document.createElement('label');l.textContent=label+' ';el.before(l);l.append(el);}
$('bookLocation').open=true;$('bookFilmPlay').hidden=true;$('fbTheatre').hidden=true;
const picker=$('cinScene');picker.setAttribute('aria-label','Scene library');
function group(label,options){const g=document.createElement('optgroup');g.label=label;for(const [value,text]of options)g.append(new Option(text,value));picker.append(g);}
group('On-location book rehearsals',[...$('bookChoice').options].map(o=>[o.value,o.text]));
const native=Object.entries({...Film.TRAILERS,...Film.SCENES}).map(([value,s])=>({value,text:s.name}));
group('Odyssey trailer, cast & earlier scenes',native.filter(o=>/odyssey/i.test(o.text)).map(o=>['native:'+o.value,o.text]));
group('Other native film tests',native.filter(o=>!/odyssey/i.test(o.text)).map(o=>['native:'+o.value,o.text]));
group('Earlier blocking laboratories · separate pages',[
 ['archive:next-scenes.html','Two new scene tests'],['archive:hero-tests.html','Hero objects in blocking'],['archive:location-tests.html','Coast, grove & cave laboratory'],['archive:cyclops-sequence.html','Cyclops · stone and flock'],['archive:review.html','Original production review']]);
const nativeKey=new URLSearchParams(location.search).get('nativeScene');picker.value=nativeKey?'native:'+nativeKey:$('bookChoice').value;
$('fbScene').hidden=true;
picker.onchange=()=>{const v=picker.value;window.__world?.film?.save();if(v.startsWith('archive:')){location.href='../'+v.slice(8);return;}if(v.startsWith('native:')){const u=new URL(location.href);u.searchParams.delete('bookScene');u.searchParams.set('nativeScene',v.slice(7));location.href=u;return;}$('bookChoice').value=v;$('bookChoice').dispatchEvent(new Event('change'));$('bookStage').click();};
$('bookChoice').addEventListener('change',()=>{picker.value=$('bookChoice').value;});
if(nativeKey){const known=native.some(o=>o.value===nativeKey);if(!known)help.textContent='Unknown native scene.';else{const timer=setInterval(()=>{const W=window.__world;if(!W?.ready||!W.film||W.relanding)return;clearInterval(timer);W.film.stop();W.film.trailer(nativeKey);const started=Date.now(),ready=setInterval(()=>{if(W.film.scene?.ready){clearInterval(ready);W.film.view(0);}else if(Date.now()-started>90000){clearInterval(ready);help.textContent='Scene loading timed out. Reload to retry.';}},200);},300);}}
let busy=false;
$('cinPlay').onclick=async()=>{const W=window.__world,F=W?.film;if(!F?.scene?.ready||busy)return;if(F.play.on){F.stop();return;}busy=true;try{Fx.Sfx.unlock();await OdysseyAssembly.preload(W);F.playAll();}catch(e){help.textContent='Playback could not start: '+e.message;}finally{busy=false;}};
$('cinSound').onclick=()=>{Fx.Sfx.unlock();Fx.Sfx.setMute(!Fx.Sfx.muted);};
const hints={watch:'',shots:'Select a shot to frame it. Select it again to rehearse. Use New shot to keep your current camera.',stage:'Choose a location and assemble the scene. Light and weather apply to the live world.',export:'Record the sequence, then download the take. Resolution and frame rate control the recording.'};
function mode(m){document.body.dataset.workspace=m;head.querySelectorAll('[data-workspace]').forEach(b=>{b.classList.toggle('active',b.dataset.workspace===m);b.setAttribute('aria-pressed',b.dataset.workspace===m);});for(const [k,p]of Object.entries(panels))p.hidden=k!==m;help.textContent=hints[m];window.dispatchEvent(new Event('resize'));}
head.querySelectorAll('[data-workspace]').forEach(b=>b.onclick=()=>mode(b.dataset.workspace));mode('watch');
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
setInterval(()=>{const F=window.__world?.film,ready=F?.scene?.ready;$('cinPlay').disabled=!ready||busy;const playing=F?.play.on;$('cinPlay').innerHTML=icon(icons[playing?'stop':'watch'])+'<span>'+(busy?'Preparing audio…':playing?'Stop':'Play film')+'</span>';$('fbRec').textContent=F?.rec?'Stop recording':'Record film';$('fbSave').textContent='Download take';$('cinSound').querySelector('span').textContent=Fx.Sfx.muted?'Sound off':'Sound on';$('cinSound').setAttribute('aria-pressed',!Fx.Sfx.muted);$('cinTime').textContent=ready?`${fmt(playing?F.reelOffset(F.play.i)+F.play.t:0)} / ${fmt(F.total())} · ${F.shots.length} shots`:'Assembling scene…';},300);
})();

/* Canonical Halfworld dialogue and timings, retargeted onto the native rehearsal casts. */
window.OdysseyAssembly={
 async compile(make){
  const response=await fetch('./world/lines/odyssey/halfworld-reel.json');if(!response.ok)throw Error('Halfworld reel data missing');const source=await response.json();
  const film={name:'The Odyssey · The journey home',world:'odyssey',ground:'real',time:'day',weather:'clear',me:'off',actors:[],builds:[],shots:[],story:{title:'The journey home',description:'Canonical Odyssey Halfworld recordings, segment timing and source turn IDs; native rehearsal sets. Seven sets share one coastal production stage. Creature action and choreography remain partial.'}};
  const seq=['cave','stake','boat','circe','argos','axes','bed'];
  const music=['cyclopean-pulse','cyclopean-pulse','aegean-resolve','loom-assembly-night-sail','lament-of-penelope','bronze-armor-clash','hearthside-resolution'];
  film.shots.push({title:'THE ODYSSEY\nTHE JOURNEY HOME',name:'Prologue',sec:4,score:'file:odyssey/music/aegean-resolve.ogg',fade:2});
  for(let i=0;i<seq.length;i++){
   const key=seq[i],p=await make(key),x=i*160,z=0,prefix=key+'-',chapter=source[key];
   if(key==='circe')for(let k=0;k<3;k++)p.actors.push({name:'scout-'+k,figure:'sailor',x:k*2-2,z:5,heading:180});
   if(key==='axes'){p.actors.push({name:'telemachus',figure:'telemachus-ithaca',x:5,z:5,heading:270});p.actors.find(a=>a.name==='odysseus').figure='odysseus-bow';}
   for(const a of p.actors)film.actors.push({...a,name:prefix+a.name,x:a.x+x,z:a.z+z});
   for(const b of p.builds)film.builds.push({...b,name:prefix+b.name,x:b.x+x,z:b.z+z});
   const first=film.shots.length,start=film.shots.reduce((n,s)=>n+s.sec,0);
   const aliases={eurylochus:'witness',odysseus:key==='boat'?'helmsman':'odysseus'};
   for(let j=0;j<chapter.segments.length;j++){
    const seg=chapter.segments[j];if(seg.kind==='SPEAKER_CUE')continue;
    const rawWho=seg.speakerId.split('.').pop(),who=seg.speakerId==='PERFORMER.NARRATOR'?'narrator':prefix+(aliases[rawWho]||rawWho);
    const base=JSON.parse(JSON.stringify(p.shots[j===0?0:j%3]));const actor=film.actors.find(a=>a.name===who);
    const shot={...base,name:chapter.id+' · '+(seg.sourceTurnId?.split('-').pop()||'opening')+' · '+(seg.speakerName||seg.kind),sec:+(seg.for+(seg.pauseAfterMs||300)/1000+.35).toFixed(2),lamp:key==='cave'||key==='stake'?'warm':undefined,acts:[],events:[],score:j===0?'file:odyssey/music/'+music[i]+'.ogg':undefined,fade:2,shift:chapter.id,set:{time:key==='cave'||key==='stake'?'dusk':key==='bed'?'dawn':'day',weather:key==='circe'?'fog':'clear'}};
    if(base.pos){shot.pos[0]+=x;shot.pos[2]+=z;shot.tgt[0]+=x;shot.tgt[2]+=z;}else if(base.on)shot.on=prefix+base.on;
    if(actor&&key!=='boat'){delete shot.pos;delete shot.tgt;shot.on=who;shot.frame='medium';shot.from='s';shot.lens=45;}
    shot.events.push({what:'SPEAK',who,text:seg.text,file:seg.file,from:seg.from,for:seg.for,at:.15,sourceTurnId:seg.sourceTurnId});
    const lead=prefix+(key==='boat'?'helmsman':'odysseus');
    if(key!=='boat'){
     shot.events.push({what:'PHRASE',who:actor?who:lead,name:seg.kind==='DIALOGUE'?'command':key==='argos'?'grief':'listen',at:0,enter:.6});
     if(actor&&who!==lead)shot.events.push({what:'PERFORM',who:lead,verb:'LOOK',target:who,at:.1,keepGaze:true});
     if(key==='circe'&&/wand/i.test(seg.text))shot.events.push({what:'SET',who:'circe-circe',ch:'arm.R.pitch',v:-1.4,at:1,over:1});
     if(key==='argos'&&/tear|aside/i.test(seg.text))shot.events.push({what:'PHRASE',who:lead,name:'hands near face',at:1,enter:1},{what:'SET',who:lead,ch:'head.yaw',v:.7,at:1,over:1});
     if(key==='bed'&&/weep|reunite|angry/i.test(seg.text))for(const who of['bed-penelope','bed-odysseus'])shot.events.push({what:'PHRASE',who,name:'tenderness',at:.3,enter:1});
    }
    film.shots.push(...OdysseyDirection.direct(shot,seg,{key,j,x,z,prefix}).map(s=>({...s,directionCue:{key,j}})));
   }
   if(key==='boat')film.boat={x,z,prefix,start,first,count:film.shots.length-first};
  }
  film.shots.push({title:'ITHACA\nEND OF REHEARSAL ASSEMBLY',name:'Home',sec:5});return film;
 },
 async finish(W,p){const b=p.boat;await OdysseyBoat.assemble(W,{...b,duration:W.film.shots.slice(b.first,b.first+b.count).reduce((s,q)=>s+q.sec,0),sceneName:p.name,shots:W.film.shots.slice(b.first,b.first+b.count)});
  const F=W.film,late=F.late;F.late=dt=>{late(dt);if(F.scene?.name!==p.name)return;const idx=F.play.on?F.play.i:F.sel,cue=p.shots[idx]?.directionCue;const transformed=cue?.key==='circe'?cue.j>=4:idx>=p.shots.findIndex(s=>s.directionCue?.key==='argos');for(let i=0;i<3;i++){const a=F.actors.get('circe-scout-'+i);if(a?.rig){a.rig.figure.visible=!transformed;if(a.rig.slots.weaponR)a.rig.slots.weaponR.visible=false;}}for(const it of W.props.items.values())if(it.src?.name?.startsWith('film-circe-transformed-crew-'))it.group.visible=transformed;};F.late(0);},
 async preload(W){const ctx=Fx.Sfx.ctx;if(!ctx)throw Error('Audio context unavailable');const files=new Set();for(const s of W.film.shots){if(s.score?.startsWith('file:'))files.add(s.score.slice(5));for(const e of s.events||[])if(e.file)files.add(e.file);}await Promise.all([...files].map(async f=>{if(!await Sound.loadFile(ctx,f))throw Error('Cannot decode '+f);}));}
};

/* The keyframe gate: a scene's critical stills, blocked and framed by hand (odyssey/keyframes/<scene>.json), rendered in Film
   Butter and scored. Nothing of the scene is rendered as film until every still passes:
     each subject visible (4 rays from the lens to head, neck, chest, hips unbroken: >= 0.75, >= 0.5 for a soft subject)
     whole in frame (unless cut), on screen between min and max of the frame's height
     a face shown (the figure turned toward the lens: facing >= 0.35)
     the primary subject's head on a thirds line (within 0.06) with headroom (>= 0.03)
     nothing but the allowed figures crowding the lens (<= 10% of a grid of rays blocked nearer than a third of the subject)
     no other figure between: none nearer than three quarters of the subject's distance with its head in the frame
     solid: no two figures (their parts, and what they hold, as oriented boxes) pass through each other unless the still says
       they touch; every figure stands on something (feet within three LDU of a surface)
   Serve the repository root (python3 -m http.server 8899), build the location, then
   NODE_PATH=<playwright> node film-readymades/keyframes.cjs odyssey/keyframes/OD-B12-S03.json [--out dir] */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const specFile=process.argv[2],spec=JSON.parse(fs.readFileSync(specFile,'utf8'));
const out=process.argv.includes('--out')?process.argv[process.argv.indexOf('--out')+1]:path.join(path.dirname(specFile),spec.scene);
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log('page error',e.message));
await p.goto('http://localhost:8899/film-readymades/production/Film-Butter-Odyssey.html');
await p.waitForFunction(()=>window.ButterLocation&&window.ButterFilms?.current&&!ButterFilms.busy&&ButterCast.cast.length,{timeout:240000});
if((await p.evaluate(()=>ButterFilms.current.sourceId))!==spec.location){
 await p.evaluate(id=>{const t=ButterFilms.records.find(r=>r.id===id).title,o=[...document.querySelectorAll('#versionSelect option')].find(o=>o.textContent.trim()===t);return ButterFilms.switchTo(o.value);},spec.location);
 await p.waitForFunction(id=>ButterFilms.current?.sourceId===id&&!ButterFilms.busy&&ButterCast.cast.length,spec.location,{timeout:240000});}
await p.evaluate(()=>{window.renderStill=renderer.render.bind(renderer);renderer.render=()=>{};renderer.setPixelRatio(1);renderer.setSize(1280,720,false);camera.aspect=16/9;camera.updateProjectionMatrix();   /* a 16:9 frame */
  document.body.classList.add('kf');
  const st=document.createElement('style');st.textContent='body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools,body.kf [class*="prompt"],body.kf [class*="dock"],body.kf [class*="toolbar"]{visibility:hidden!important}';document.head.appendChild(st);});
await p.waitForTimeout(800);
const report=[];
for(const k of spec.keys){
 const r=await p.evaluate(({base,k,look})=>{OdysseyFilm.block(base);OdysseyFilm.block(k.blocking||[]);const cam=OdysseyFilm.rig(k.camera);
   OdysseyFilm.look(Object.assign({},look,k.look));OdysseyFilm.rope(k.rope||null);const phys=OdysseyFilm.physics(ButterCast.cast.map(a=>a.kind.replace(/^odyssey-od-b\d\d-s\d\d-/,'')),k.touch||[]);const sc=OdysseyFilm.score(k.subjects);const clutter=OdysseyFilm.clutter((k.subjects.find(s=>s.primary&&!s.id.startsWith('piece:'))||k.subjects.find(s=>!s.id.startsWith('piece:'))||{id:(k.subjects[0]||{}).id}).id,[...(k.lensAllow||[]),...k.subjects.map(s=>s.id)]);const prim=(k.subjects.find(s=>s.primary)||{}).id;const lens=OdysseyFilm.lens(prim||k.subjects[0].id,k.lensAllow||[]);renderStill(scene,camera);const png=renderer.domElement.toDataURL('image/png');return {cam,sc,lens,clutter,phys,png};},{base:spec.blocking,k,look:spec.look||{}});
 const fails=[];
 for(const s of k.subjects){const m=r.sc[s.id];if(!m||m.missing){fails.push(s.id+' missing');continue;}
  if(m.behind)fails.push(s.id+' behind the camera');
  if(m.visible<(s.soft?0.5:0.75))fails.push(`${s.id} hidden (${m.visible})`);
  if(!s.cut&&!m.inFrame)fails.push(`${s.id} cut by the frame`);
  if(!(m.head[0]>0.02&&m.head[0]<0.98&&m.head[1]>0.02&&m.head[1]<0.98))fails.push(`${s.id} head out of frame`);
  if(s.min&&m.size<s.min)fails.push(`${s.id} too small (${m.size})`);
  if(s.max&&m.size>s.max)fails.push(`${s.id} too big (${m.size})`);
  if(s.face&&m.facing<0.35)fails.push(`${s.id} face turned away (${m.facing})`);
  if(s.primary&&k.camera.place&&k.camera.place!=='C'&&m.thirds>0.06)fails.push(`${s.id} off the thirds (${m.thirds})`);
  if(s.primary&&m.headroom<0.03)fails.push(`${s.id} no headroom (${m.headroom})`);}
 if(r.lens>0.1)fails.push(`lens crowded (${r.lens})`);
 if(r.clutter.length)fails.push(`foreground clutter: ${r.clutter.join(', ')}`);
 for(const [a,b2,n] of r.phys.collide)fails.push(`${a} passes through ${b2} (${n} part overlaps)`);
 for(const [a,g] of r.phys.floating)fails.push(`${a} ${g==null?'stands on nothing':g>0?'floats '+g:'is sunk '+(-g)}`);
 const file=path.join(out,k.id+'.png');fs.writeFileSync(file,Buffer.from(r.png.split(',')[1],'base64'));delete r.png;   /* the frame itself, straight off the renderer: no workspace chrome */
 report.push({id:k.id,beat:k.beat,pass:!fails.length,fails,camera:r.cam,lens:r.lens,physics:r.phys,subjects:r.sc,file:path.relative(process.cwd(),file)});
 console.log(`${k.id} ${fails.length?'FAIL':'PASS'}  ${k.beat}${fails.length?'\n    '+fails.join('\n    '):''}`);}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scene:spec.scene,pass:report.every(r=>r.pass),keys:report},null,1));
console.log(report.every(r=>r.pass)?'ALL STILLS PASS: the scene may go to film':'GATE CLOSED: '+report.filter(r=>!r.pass).length+' of '+report.length+' stills fail');
await b.close();process.exit(report.every(r=>r.pass)?0:1);})();

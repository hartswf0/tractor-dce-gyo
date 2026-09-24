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
/* --search K3: coverage for one still. Stage it once, then try n cameras (seeded) round its focus, inside the set's bounds; keep those the
   gate would pass, rank them (the primary at the size asked, faces shown, soft subjects in view), render the best six to choose from */
/* --turn K1: a viewfinder. Stage the still once and render it from eight directions round its focus (k.turn: around, r, h, fov), to see
   which side shows the thing before any camera is set */
const turnId=process.argv.includes('--turn')?process.argv[process.argv.indexOf('--turn')+1]:null;
if(turnId){const k=spec.keys.find(x=>x.id===turnId),T=k.turn;await p.evaluate(()=>OdysseyFilm.loadProps());
 await p.evaluate(({base,k,look,spread,props})=>{OdysseyFilm.hide(k.hide||[]);OdysseyFilm.props([...(props||[]),...(k.props||[])]);OdysseyFilm.block(base);if(spread)OdysseyFilm.spread(spread);OdysseyFilm.block(k.blocking||[]);OdysseyFilm.light(Object.assign({},look,k.look));OdysseyFilm.look(Object.assign({},look,k.look));OdysseyFilm.rope(k.rope||null);},{base:spec.blocking,k,look:spec.look||{},spread:spec.spread||0,props:spec.props||[]});
 for(let i=0;i<8;i++){const png=await p.evaluate(({T,i})=>{const c=typeof T.around==='string'?(T.around.startsWith('@')?OdysseyFilm.anchor(T.around.slice(1)):OdysseyFilm.cast().find(a=>a.id===T.around)):{x:T.around[0],y:T.around[1],z:T.around[2]};const A=i*Math.PI/4;
   OdysseyFilm.rig({type:'wide',pos:[c.x+Math.sin(A)*T.r,T.h,c.z+Math.cos(A)*T.r],target:[c.x,c.y,c.z],fov:T.fov||50});renderStill(scene,camera);return renderer.domElement.toDataURL('image/png');},{T,i});
  fs.writeFileSync(path.join(out,`${k.id}-turn${i}.png`),Buffer.from(png.split(',')[1],'base64'));}
 console.log('turnaround of',k.id,'written');await b.close();process.exit(0);}
const searchId=process.argv.includes('--search')?process.argv[process.argv.indexOf('--search')+1]:null;
if(searchId){const k=spec.keys.find(x=>x.id===searchId),S_=k.search||{};await p.evaluate(()=>OdysseyFilm.loadProps());
 const cands=await p.evaluate(({base,k,look,spread,props,S_})=>{OdysseyFilm.hide(k.hide||[]);OdysseyFilm.props([...(props||[]),...(k.props||[])]);OdysseyFilm.block(base);if(spread)OdysseyFilm.spread(spread);OdysseyFilm.block(k.blocking||[]);OdysseyFilm.light(Object.assign({},look,k.look));OdysseyFilm.look(Object.assign({},look,k.look));OdysseyFilm.rope(k.rope||null);
  let seed=S_.seed||7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const around=S_.around;const out=[];const B=S_.bounds||[-1e9,1e9,-1e9,1e9];
  const prim=(k.subjects.find(s=>s.primary)||k.subjects[0]).id;
  for(let i=0;i<(S_.n||60);i++){const A=(S_.az?S_.az[0]+rnd()*(S_.az[1]-S_.az[0]):rnd()*Math.PI*2),r=S_.r[0]+rnd()*(S_.r[1]-S_.r[0]),h=S_.h[0]+rnd()*(S_.h[1]-S_.h[0]),fov=S_.fov?S_.fov[0]+rnd()*(S_.fov[1]-S_.fov[0]):36;
   const c=typeof around==='string'?(around.startsWith('@')?OdysseyFilm.anchor(around.slice(1)):OdysseyFilm.cast().find(a=>a.id===around)):{x:around[0],y:around[1],z:around[2]};if(!c)break;
   const pos=[c.x+Math.sin(A)*r,h,c.z+Math.cos(A)*r];if(pos[0]<B[0]||pos[0]>B[1]||pos[2]<B[2]||pos[2]>B[3])continue;
   const cam={type:'wide',pos,target:S_.target||around,fov,subject:prim,place:k.camera.place||S_.place||'L',eye:k.camera.eye||0.4};OdysseyFilm.rig(cam);
   const sc=OdysseyFilm.score(k.subjects),lens=OdysseyFilm.lens(prim,k.lensAllow||[]),clutter=OdysseyFilm.clutter(prim.startsWith('prop:')||prim.startsWith('piece:')?(k.subjects.find(s=>!s.id.includes(':'))||{}).id||prim:prim,[...(k.lensAllow||[]),...k.subjects.map(s=>s.id)]);
   const why=[];if(lens>0.1)why.push('lens');if(clutter.length)why.push('clutter:'+clutter.join('+'));let ok=lens<=0.1&&!clutter.length,val=0;for(const s of k.subjects){const m=sc[s.id];if(!m||m.missing||m.behind){ok=false;why.push(s.id+':behind');continue;}
    if(m.visible<(s.soft?0.5:0.75)){ok=false;why.push(s.id+':hidden');}if(!s.cut&&!m.inFrame){ok=false;why.push(s.id+':cut');}if(s.min&&m.size<s.min){ok=false;why.push(s.id+':small');}if(s.max&&m.size>s.max){ok=false;why.push(s.id+':big');}if(s.face&&m.facing<0.35){ok=false;why.push(s.id+':face');}
    if(!(m.head[0]>0.02&&m.head[0]<0.98&&m.head[1]>0.02&&m.head[1]<0.98)){ok=false;why.push(s.id+':headout');}
    if(s.primary){if(m.thirds>0.06&&cam.place!=='C'){ok=false;why.push('thirds');}if(m.headroom<0.03){ok=false;why.push('headroom');}val-=Math.abs(m.size-(S_.size||0.35))*3;}
    if(s.face)val+=m.facing*0.5;val+=m.visible*0.3;}
   out.push({ok,why,val:+val.toFixed(3),cam:{...cam,pos:pos.map(v=>+v.toFixed(1)),fov:+fov.toFixed(1)}});}
  return out;},{base:spec.blocking,k,look:spec.look||{},spread:spec.spread||0,props:spec.props||[],S_});
 const tally={};for(const c of cands)for(const w of c.why)tally[w]=(tally[w]||0)+1;console.log('  why cameras failed:',JSON.stringify(Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,8)));
 let good=cands.filter(c=>c.ok).sort((a,b)=>b.val-a.val);if(!good.length){good=cands.sort((a,b)=>a.why.length-b.why.length||b.val-a.val);console.log('  none pass: rendering the nearest misses');}const pick=[];for(const c of good){if(pick.every(q=>Math.hypot(q.cam.pos[0]-c.cam.pos[0],q.cam.pos[2]-c.cam.pos[2])>60))pick.push(c);if(pick.length>=6)break;}
 console.log(`${k.id}: ${cands.length} cameras tried, ${good.length} pass; rendering ${pick.length}`);
 for(let i=0;i<pick.length;i++){const png=await p.evaluate(cam=>{OdysseyFilm.rig(cam);renderStill(scene,camera);return renderer.domElement.toDataURL('image/png');},pick[i].cam);fs.writeFileSync(path.join(out,`${k.id}-c${i+1}.png`),Buffer.from(png.split(',')[1],'base64'));}
 fs.writeFileSync(path.join(out,`${k.id}-candidates.json`),JSON.stringify(pick,null,1));await b.close();process.exit(0);}
const onlyIds=process.argv.includes('--only')?process.argv[process.argv.indexOf('--only')+1].split(','):null;
for(const k of spec.keys.filter(k=>!onlyIds||onlyIds.includes(k.id))){
 await p.evaluate(()=>OdysseyFilm.loadProps());
 const r=await p.evaluate(({base,k,look,spread,props})=>{OdysseyFilm.hide(k.hide||[]);OdysseyFilm.props([...(props||[]),...(k.props||[])]);OdysseyFilm.block(base);if(spread)OdysseyFilm.spread(spread);OdysseyFilm.block(k.blocking||[]);OdysseyFilm.light(Object.assign({},look,k.look));const cam=OdysseyFilm.rig(k.camera);
   OdysseyFilm.look(Object.assign({},look,k.look));OdysseyFilm.rope(k.rope||null);const phys=OdysseyFilm.physics(ButterCast.cast.map(a=>a.kind.replace(/^odyssey-od-b\d\d-s\d\d-/,'')),k.touch||[]);const sc=OdysseyFilm.score(k.subjects);const clutter=OdysseyFilm.clutter((k.subjects.find(s=>s.primary&&!s.id.startsWith('piece:'))||k.subjects.find(s=>!s.id.startsWith('piece:'))||{id:(k.subjects[0]||{}).id}).id,[...(k.lensAllow||[]),...k.subjects.map(s=>s.id)]);const prim=(k.subjects.find(s=>s.primary)||{}).id;const lens=OdysseyFilm.lens(prim||k.subjects[0].id,k.lensAllow||[]);renderStill(scene,camera);const png=renderer.domElement.toDataURL('image/png');return {cam,sc,lens,clutter,phys,png};},{base:spec.blocking,k,look:spec.look||{},spread:spec.spread||0,props:spec.props||[]});
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
 if(process.argv.includes('--plan')){console.log('   anchors',JSON.stringify(await p.evaluate(()=>OdysseyFilm.anchors())),'\n   cast',JSON.stringify(await p.evaluate(()=>OdysseyFilm.cast().map(c=>[c.id,c.x,c.y,c.z]))));const plan=await p.evaluate(()=>{const cam=camera.position.clone(),tgt=controls.target.clone(),fov=camera.fov,q=camera.quaternion.clone();
   const mk=new THREE.Mesh(new THREE.SphereGeometry(9,12,8),new THREE.MeshBasicMaterial({color:'#ff2030'}));mk.position.copy(cam);scene.add(mk);
   const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([cam,tgt]),new THREE.LineBasicMaterial({color:'#ff2030'}));scene.add(ln);
   const bg=scene.background,fg=scene.fog;scene.fog=null;camera.position.set(0,1300,-20);camera.fov=40;camera.updateProjectionMatrix();camera.lookAt(0,0,-21);renderStill(scene,camera);const png=renderer.domElement.toDataURL('image/png');
   scene.remove(mk);scene.remove(ln);scene.fog=fg;camera.position.copy(cam);camera.quaternion.copy(q);camera.fov=fov;camera.updateProjectionMatrix();return png;});
  fs.writeFileSync(path.join(out,k.id+'-plan.png'),Buffer.from(plan.split(',')[1],'base64'));}
 const file=path.join(out,k.id+'.png');fs.writeFileSync(file,Buffer.from(r.png.split(',')[1],'base64'));delete r.png;   /* the frame itself, straight off the renderer: no workspace chrome */
 report.push({id:k.id,beat:k.beat,text:k.text,pass:!fails.length,fails,camera:r.cam,lens:r.lens,physics:r.phys,subjects:r.sc,file:path.relative(process.cwd(),file)});
 console.log(`${k.id} ${fails.length?'FAIL':'PASS'}  ${k.beat}${fails.length?'\n    '+fails.join('\n    '):''}`);}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scene:spec.scene,pass:report.every(r=>r.pass),keys:report},null,1));
console.log(report.every(r=>r.pass)?'ALL STILLS PASS: the scene may go to film':'GATE CLOSED: '+report.filter(r=>!r.pass).length+' of '+report.length+' stills fail');
await b.close();process.exit(report.every(r=>r.pass)?0:1);})();

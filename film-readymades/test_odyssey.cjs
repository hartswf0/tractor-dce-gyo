/* The Odyssey location in Film Butter: it loads, its cast stands, its camera marks frame, the walk has colliders, the forage
   shelf sets a card's build down. Serve the repository root first (python3 -m http.server 8899).
   NODE_PATH=<playwright> node film-readymades/test_odyssey.cjs [--out dir] */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=process.argv.includes('--out')?process.argv[process.argv.indexOf('--out')+1]:path.join(__dirname,'production/odyssey-check');
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:800}});const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
await p.goto('http://localhost:8899/film-readymades/production/Film-Butter-Odyssey.html');
await p.waitForFunction(()=>window.ButterLocation&&window.ButterFilms?.current&&!ButterFilms.busy,{timeout:240000});
await p.evaluate(()=>{window.renderStill=renderer.render.bind(renderer);renderer.render=()=>{};});await p.waitForTimeout(1500);
const state=await p.evaluate(()=>({id:ButterFilms.current.sourceId,parts:S.parts.length,cast:ButterCast.cast.map(a=>a.kind),report:ButterLocation.report,cameras:OdysseyFilm.cameras.length}));console.log(JSON.stringify(state));
const shot=async n=>{await p.evaluate(()=>renderStill(scene,camera));await p.screenshot({path:path.join(out,n+'.png')});};
await p.evaluate(()=>OdysseyFilm.fit());await shot('0-location');
const cams=await p.evaluate(()=>OdysseyFilm.cameras.length);
for(let i=0;i<cams;i++){await p.evaluate(i=>OdysseyFilm.setCamera(OdysseyFilm.cameras[i]),i);await shot('cam-'+(i+1));}
await p.evaluate(()=>FilmButter.setMode('walk'));const walk=await p.evaluate(()=>({mode:FilmButter.mode,report:ButterLocation.report}));console.log('walk',JSON.stringify(walk));await shot('walk');await p.evaluate(()=>FilmButter.setMode('build'));
await p.evaluate(()=>OdysseyFilm.fit());await p.click('#fsOpen');await p.waitForSelector('#fsList [data-id]',{timeout:60000});await p.click('#fsList [data-id="character.athena"]').catch(async()=>{await p.fill('#fsQuery','athena');await p.click('#fsList [data-id="character.athena"]');});
await p.waitForFunction(()=>/set down/.test(document.querySelector('#fsNote').textContent)||/Could not/.test(document.querySelector('#fsNote').textContent),null,{timeout:120000});
console.log('shelf',await p.evaluate(()=>document.querySelector('#fsNote').textContent),await p.evaluate(()=>S.parts.length));await p.click('#fsClose');await shot('shelf-add');
console.log('errors',errors.length);await b.close();})();

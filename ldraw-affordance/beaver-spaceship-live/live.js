(()=>{
'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const svg=(name,a={})=>{const n=document.createElementNS(NS,name);for(const[k,v]of Object.entries(a))n.setAttribute(k,String(v));return n};
const dims={
'3005.dat':[20,20,24],'3004.dat':[20,40,24],'3622.dat':[20,60,24],'3010.dat':[20,80,24],'3009.dat':[20,120,24],'3008.dat':[20,160,24],
'3003.dat':[40,40,24],'3002.dat':[40,60,24],'3001.dat':[40,80,24],'3031.dat':[80,80,8],'3035.dat':[80,160,8],'3020.dat':[40,80,8],
'3023.dat':[20,40,8],'3700.dat':[20,40,24],'3941.dat':[40,40,40],'60593.dat':[40,20,72],'60602.dat':[36,10,64],'60596.dat':[80,20,144],
'60616b.dat':[64,12,132],'3811.dat':[640,640,4]
};
const fills={PRESSURE:'#72b8ff',GRAVITY:'#ff7468',STRUCTURE:'#f7f5ef',ACCESS:'#65d59c',THRUST:'#e993ff',SYSTEMS:'#ada6ff'};
let M=null,state=null,running=false,lastId=null;

function grid(root){
  root.replaceChildren();
  root.append(svg('rect',{x:-640,y:-320,width:1280,height:640,class:'base'}));
  for(let x=-640;x<=640;x+=80)root.append(svg('line',{x1:x,y1:-320,x2:x,y2:320,class:'grid'}));
  for(let y=-320;y<=320;y+=80)root.append(svg('line',{x1:-640,y1:y,x2:640,y2:y,class:'grid'}));
}
function footprint(a){
  const d=dims[a.file]||[28,28,20],r=a.r||[1,0,0,0,1,0,0,0,1];
  return [Math.max(8,Math.abs(r[0])*d[0]+Math.abs(r[2])*d[1]),Math.max(8,Math.abs(r[6])*d[0]+Math.abs(r[8])*d[1]),d[2]];
}
function draw(){
  const plan=$('#plan'),side=$('#side');grid(plan);grid(side);
  if(!state)return;
  for(const a of state.placements){
    const [w,z,h]=footprint(a),x=a.t?.[0]||0,zz=a.t?.[2]||0,y=-(a.t?.[1]||0),fill=fills[a.signal]||'#ddd9cf',cls=`piece${a.id===lastId?' last':''}`;
    if(a.file==='3941.dat')plan.append(svg('circle',{cx:x,cy:zz,r:Math.max(w,z)/2,fill,class:cls}));
    else plan.append(svg('rect',{x:x-w/2,y:zz-z/2,width:w,height:z,fill,class:cls}));
    side.append(svg('rect',{x:x-w/2,y:y-h/2,width:w,height:h,fill,class:cls}));
  }
  const raw=M.hear(state).raw;
  if(raw){
    const x=raw.t?.[0]||0,z=raw.t?.[2]||0,y=-(raw.t?.[1]||0);
    plan.append(svg('circle',{cx:x,cy:z,r:13,class:'target'}));
    side.append(svg('circle',{cx:x,cy:y,r:13,class:'target'}));
  }
}
function update(full=true){
  if(!M||!state)return;
  const open=M.unresolved(state),gaps=M.pressureMissing(state),heard=M.hear(state);
  $('#count').textContent=`${state.placements.length} / ${state.placements.length+open.length}`;
  $('#contacts').textContent=`CONTACTS ${state.clicks}`;
  $('#gaps').textContent=`GAPS ${gaps.length}`;$('#gaps').className=`chip ${gaps.length?'bad':'good'}`;
  if(!heard.raw){$('#phase').textContent='QUIET';$('#message').textContent='Ship stopped asking.'}
  else if(!heard.choice){$('#phase').textContent='BLOCKED';$('#message').textContent=`${heard.raw.signal} · ${heard.raw.label}`}
  else{$('#phase').textContent='HEAR';$('#message').textContent=`${heard.raw.signal} → reachable ${heard.choice.action.file}`}
  if(full)draw();
}
function one(){
  const h=M.hear(state);if(!h.raw)return'complete';if(!h.choice)return'blocked';
  const a=h.choice.action,rec=M.commit(a,state);if(!rec)return'retry';lastId=a.id;
  $('#detail').textContent=`${a.signal} · ${a.file} · ${a.label} · ${rec.clicks?rec.clicks+' verified clutch contacts':'FIT / SEAL'}`;
  return'acted';
}
async function build(){
  if(running)return;running=true;$('#build').disabled=$('#step').disabled=$('#reset').disabled=true;
  for(let i=0;i<5000;i++){
    const r=one();if(r==='retry')continue;if(r!=='acted')break;
    update(false);draw();
    await new Promise(requestAnimationFrame);
  }
  running=false;$('#build').disabled=$('#step').disabled=$('#reset').disabled=false;update(true);
}
function reset(){state=M.stateFor(M.makePlan());lastId=null;update(true);$('#detail').textContent='Reset complete. First discrepancy is visible as the red target.'}

window.addEventListener('error',e=>{$('#boot').textContent='JS ERROR';$('#boot').className='chip bad';$('#error').textContent=`${e.message}\n${e.filename||''}:${e.lineno||''}`});
window.addEventListener('unhandledrejection',e=>{$('#boot').textContent='PROMISE ERROR';$('#boot').className='chip bad';$('#error').textContent=String(e.reason?.stack||e.reason||'unknown rejection')});

grid($('#plan'));grid($('#side'));
$('#detail').textContent='1 · HTML parsed. 2 · plain JavaScript alive. 3 · importing ../beaver-spaceship/model-runtime.js…';
import('../beaver-spaceship/model-runtime.js?live=2').then(mod=>{
  M=mod;
  const dry=M.simulate(M.makePlan(),5000);
  state=M.stateFor(M.makePlan());
  $('#boot').textContent='BEAVER MODEL READY';$('#boot').className='chip good';
  $('#build').disabled=$('#step').disabled=$('#reset').disabled=false;
  $('#detail').textContent=`MODEL PASS · dry run ${dry.moves} actions · ${dry.clicks} contacts · pressure gaps ${dry.pressureMissing.length} · thrust gaps ${dry.thrustMissing?.length||0}`;
  update(true);
}).catch(err=>{
  $('#boot').textContent='MODEL IMPORT FAILED';$('#boot').className='chip bad';
  $('#phase').textContent='STOP';$('#message').textContent='The Beaver model did not load.';
  $('#error').textContent=String(err?.stack||err);
});

$('#build').onclick=build;
$('#step').onclick=()=>{if(!M||running)return;one();update(true)};
$('#reset').onclick=()=>{if(M&&!running)reset()};
})();

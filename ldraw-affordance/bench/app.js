import {loadIndex,compatibility,scoreSuite,ablation,varietyScore,bestConnection,toLDraw,seamTax,ID,transformPoint} from '../src/engine.js';
const [library,rules,tasks]=await Promise.all([
 fetch('../library/core.json').then(r=>r.json()),fetch('../library/compatibility.json').then(r=>r.json()),fetch('../tests/task-suite.json').then(r=>r.json())
]);
const index=loadIndex(library); let assembly=[]; let selectedInstance=null; let selectedPort=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
$('#partCount').textContent=`${library.parts.length} parts`;
function instancePart(i){return index.get(i.partId)}
function isUsed(inst,portId){return (inst.usedPorts||[]).includes(portId)}
function addRoot(part){assembly=[{uid:crypto.randomUUID(),partId:part.id,t:[0,0,0],r:ID,usedPorts:[],seamTax:0,parent:null}]; selectedInstance=assembly[0]; selectedPort=part.ports.find(p=>p.gender==='male')?.id||part.ports[0]?.id; refresh();}
function addPart(part){
 if(!assembly.length){addRoot(part);return}
 const parent=selectedInstance||assembly[assembly.length-1], pp=instancePart(parent).ports.find(p=>p.id===selectedPort);
 if(!pp||isUsed(parent,pp.id)){flash('SELECT AN OPEN PORT');return}
 const snap=bestConnection(parent,instancePart(parent),pp.id,part,rules); if(!snap){flash('NO DIRECT INTERFACE — ADAPTER REQUIRED');return}
 parent.usedPorts=[...(parent.usedPorts||[]),pp.id];
 const child={uid:crypto.randomUUID(),partId:part.id,t:snap.t,r:snap.r,usedPorts:[snap.childPortId],seamTax:snap.tax,parent:parent.uid,joint:snap.joint,via:`${pp.id} ↔ ${snap.childPortId}`};
 assembly.push(child); selectedInstance=child; selectedPort=part.ports.find(p=>!child.usedPorts.includes(p.id))?.id||null; refresh();
}
function flash(text){const n=$('#viewnote');const old=n.textContent;n.textContent=text;n.style.background='var(--hot)';setTimeout(()=>{n.textContent=old;n.style.background='#fff'},900)}
function exposedPorts(){ if(!selectedInstance)return []; return instancePart(selectedInstance).ports.filter(p=>!isUsed(selectedInstance,p.id)); }
function renderParts(){
 const target=selectedInstance&&selectedPort?instancePart(selectedInstance).ports.find(p=>p.id===selectedPort):null;
 const sorted=[...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a)); $('#parts').innerHTML='';
 for(const p of sorted){const ok=!target||p.ports.some(cp=>compatibility(target,cp,rules)); const b=document.createElement('button');b.className='partCard';b.disabled=!ok;b.innerHTML=`<b>${p.id}</b>${p.name}<small>${p.family} · V${varietyScore(p)}</small>`;b.onclick=()=>addPart(p);$('#parts').appendChild(b)}
}
function renderPorts(){const el=$('#ports');el.innerHTML=''; if(!selectedInstance){el.innerHTML='<button>ADD ANY PART TO START</button>';return} const p=instancePart(selectedInstance); for(const port of p.ports){const b=document.createElement('button');b.className='portBtn'+(isUsed(selectedInstance,port.id)?' used':'')+(selectedPort===port.id?' selected':'');b.disabled=isUsed(selectedInstance,port.id);b.innerHTML=`${port.id}<small>${port.gender} ${port.type} · ${port.confidence}</small>`;b.onclick=()=>{selectedPort=port.id;renderPorts();renderParts()};el.appendChild(b)}}
function renderAssembly(){const el=$('#assemblyList');el.innerHTML=''; assembly.forEach((inst,i)=>{const p=instancePart(inst);const d=document.createElement('div');d.className='instance';d.innerHTML=`<button>${i===0?'ROOT':'SELECT'}</button><div><b>${p.id} ${p.name}</b><div class="ops">${inst.via||'origin'} · ${inst.joint||'free'}</div></div><span class="tax">${inst.seamTax?inst.seamTax.toFixed(2):'0.00'}</span>`;d.querySelector('button').onclick=()=>{selectedInstance=inst;selectedPort=exposedPorts()[0]?.id||null;refresh()};el.appendChild(d)})}
function renderTests(){const s=scoreSuite(tasks,library.parts), abl=ablation(tasks,library); $('#testSummary').innerHTML=`<div class="metric"><span>CAPABILITY</span><b>${s.got}/${s.total}</b></div><div class="metric"><span>PARTS</span><b>${library.parts.length}</b></div><div class="metric"><span>TOP ABLATION</span><b>${abl[0]?.loss||0}</b></div>`; const el=$('#tests');el.innerHTML='<div class="testrow"><b>LOSS</b><b>ABLATION / WHAT COLLAPSES IF REMOVED</b><b>V</b></div>'; for(const a of abl){const p=index.get(a.id),r=document.createElement('div');r.className='testrow';r.innerHTML=`<span class="${a.loss?'fail':'pass'}">${a.loss}</span><div><b>${a.id} ${a.name}</b><div class="ops">${p.operators.join(' · ')}</div></div><span>${varietyScore(p)}</span>`;el.appendChild(r)} }
function renderLibrary(q=''){q=q.toLowerCase();const el=$('#library');el.innerHTML='';[...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a)).filter(p=>JSON.stringify(p).toLowerCase().includes(q)).forEach(p=>{const r=document.createElement('div');r.className='librow';r.innerHTML=`<b>${p.id}</b><div><b>${p.name}</b><div class="ops">${p.operators.join(' · ')}<br>${p.ports.map(x=>`${x.gender} ${x.type}:${x.id}`).join(' · ')}</div></div><span class="badge">V ${varietyScore(p)}</span>`;el.appendChild(r)})}
function refresh(){renderPorts();renderParts();renderAssembly();$('#attention').textContent=`tax ${seamTax(assembly).toFixed(2)}`;draw()}
$('#filter').oninput=e=>renderLibrary(e.target.value);
$('#resetBtn').onclick=()=>{assembly=[];selectedInstance=null;selectedPort=null;refresh()};
$('#undoBtn').onclick=()=>{if(!assembly.length)return;const gone=assembly.pop(); if(gone?.parent){const p=assembly.find(x=>x.uid===gone.parent); if(p&&gone.via){const pid=gone.via.split(' ↔ ')[0];p.usedPorts=(p.usedPorts||[]).filter(x=>x!==pid)}} selectedInstance=assembly.at(-1)||null;selectedPort=selectedInstance?instancePart(selectedInstance).ports.find(p=>!isUsed(selectedInstance,p.id))?.id:null;refresh()};
$('#exportBtn').onclick=()=>{if(!assembly.length){flash('BUILD SOMETHING FIRST');return}const text=toLDraw(assembly,index,'AFFORDANCE-BUILD');const blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='affordance-build.mpd';a.click();URL.revokeObjectURL(a.href)};
function connect(parent,portId,partId){selectedInstance=parent;selectedPort=portId;addPart(index.get(partId));return selectedInstance}
$('#benchBtn').onclick=()=>{addRoot(index.get('3005'));let b=connect(assembly[0],'top','3700');let s=connect(b,'top','4070');connect(s,'front','3024');selectedInstance=b;selectedPort='hole';addPart(index.get('2780'));flash('BENCH: SYSTEM → TECHNIC + SNOT + SIDE PLATE');};
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(p=>p.classList.remove('activePanel'));$('#'+b.dataset.tab+'Panel').classList.add('activePanel');if(b.dataset.tab==='test')renderTests();if(b.dataset.tab==='library')renderLibrary($('#filter').value)});
const canvas=$('#canvas'),ctx=canvas.getContext('2d');
function resize(){const d=devicePixelRatio||1,r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw()}addEventListener('resize',resize);
const iso=p=>[p[0]*0.72-p[2]*0.72,(p[0]+p[2])*0.34+p[1]*0.72];
function worldCorners(inst,p){const [w,h,d]=p.dims;const pts=[];for(const x of[-w/2,w/2])for(const y of[0,h])for(const z of[-d/2,d/2])pts.push(transformPoint(inst,[x,y,z]));return pts}
function drawBox(inst,p,offset,scale,sel){const pts=worldCorners(inst,p).map(iso).map(([x,y])=>[offset[0]+x*scale,offset[1]+y*scale]);const edge=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];ctx.strokeStyle=sel?'#ff4f2e':'#111';ctx.lineWidth=sel?3:1.5;for(const [a,b] of edge){ctx.beginPath();ctx.moveTo(...pts[a]);ctx.lineTo(...pts[b]);ctx.stroke()}ctx.fillStyle='#111';ctx.font='10px monospace';const c=pts.reduce((a,p)=>[a[0]+p[0]/8,a[1]+p[1]/8],[0,0]);ctx.fillText(p.id,c[0]+4,c[1]-4)}
function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);if(!assembly.length){ctx.fillStyle='#111';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText('ADD A PART',r.width/2,r.height/2);ctx.textAlign='left';return}let all=[];assembly.forEach(i=>all.push(...worldCorners(i,instancePart(i)).map(iso)));let minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));let s=Math.min((r.width-50)/(maxX-minX||40),(r.height-50)/(maxY-minY||40),3);let off=[r.width/2-(minX+maxX)*s/2,r.height/2-(minY+maxY)*s/2];assembly.forEach(i=>drawBox(i,instancePart(i),off,s,i===selectedInstance));if(selectedInstance&&selectedPort){const port=instancePart(selectedInstance).ports.find(p=>p.id===selectedPort);if(port){const q=iso(transformPoint(selectedInstance,port.p));ctx.beginPath();ctx.arc(off[0]+q[0]*s,off[1]+q[1]*s,7,0,Math.PI*2);ctx.fillStyle='#ffdf2b';ctx.fill();ctx.strokeStyle='#111';ctx.stroke()}}}
renderTests();renderLibrary();refresh();resize();

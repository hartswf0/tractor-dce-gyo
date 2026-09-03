import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import {flattenLDraw,parseMbxScene,parseLxfml,summarizeTarget,TARGET_IMPORT_VERSION} from './target-import.js';

const $=s=>document.querySelector(s),drop=$('#drop'),input=$('#file');let target=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const trace=[];const log=x=>{trace.push(x);$('#trace').textContent=trace.join('\n')};

async function zipEntry(zip,names){
  const map=new Map(Object.keys(zip.files).map(n=>[n.toLowerCase(),n]));
  for(const wanted of names){const actual=map.get(wanted.toLowerCase());if(actual)return zip.file(actual)?.async('string')}
  return null;
}
async function parseFile(file){
  const ext=file.name.toLowerCase().split('.').pop();
  if(['ldr','mpd'].includes(ext))return flattenLDraw(await file.text(),{name:file.name});
  if(ext==='mbx')return parseMbxScene(await file.text());
  if(ext==='lxfml')return parseLxfml(await file.text());
  if(['zmbx','io','lxf'].includes(ext)){
    let zip;try{zip=await JSZip.loadAsync(await file.arrayBuffer())}catch(e){throw new Error(`${ext.toUpperCase()} ZIP could not be opened. Older Studio .io files can be ZipCrypto-encrypted; export an .ldr/.mpd from Studio if so. ${e.message}`)}
    if(ext==='zmbx'){
      const mbx=await zipEntry(zip,['scene.mbx']);if(!mbx)throw new Error('ZMBX contains no scene.mbx');return parseMbxScene(mbx);
    }
    if(ext==='lxf'){
      const xml=await zipEntry(zip,['IMAGE100.LXFML','image100.lxfml']);if(!xml)throw new Error('LXF contains no IMAGE100.LXFML');return parseLxfml(xml);
    }
    const entries=['model.ldr','model2.ldr','modelv2.ldr'];let chosen=null,text=null;
    for(const n of entries){const t=await zipEntry(zip,[n]);if(t&&/^\s*1\s/m.test(t)){chosen=n;text=t;break}}
    if(!text)throw new Error('Studio .io contains no readable model.ldr/model2.ldr type-1 placements');
    const out=flattenLDraw(text,{name:chosen});out.format=`studio-io/${chosen}`;out.calibration=chosen==='model.ldr'?'exact-ldraw':'ldraw-geometry / nonstandard-color-space';return out;
  }
  throw new Error(`Unsupported extension .${ext}`);
}

async function existsPart(partId){
  if(!/^[A-Za-z0-9_+.-]+$/.test(partId))return false;
  try{const r=await fetch(`../../ldraw/parts/${encodeURIComponent(partId)}.dat`,{method:'HEAD',cache:'force-cache'});return r.ok}catch{return false}
}
async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let n=0;
  const worker=async()=>{for(;;){const i=n++;if(i>=items.length)return;out[i]=await fn(items[i],i)}};
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return out;
}
async function coverage(summary){
  const ids=summary.parts.map(x=>x.partId),ok=await mapLimit(ids,16,existsPart),rows=summary.parts.map((x,i)=>({...x,local:ok[i]}));return{rows,local:rows.filter(x=>x.local).length,missing:rows.filter(x=>!x.local).length};
}

function renderRows(rows){
  $('#parts').innerHTML=rows.slice(0,1200).map(r=>`<div class="row"><b>${esc(r.partId)}</b><span>${r.local?'LDRAW':'UNMAPPED'}</span><small>×${r.count}</small></div>`).join('');
}
async function load(file){
  trace.length=0;$('#fileChip').textContent='READING';$('#fileChip').className='chip warn';$('#status').textContent=`READING · ${file.name}`;log(`IMPORT ${TARGET_IMPORT_VERSION}`);log(`FILE ${file.name} · ${(file.size/1024/1024).toFixed(2)} MB`);
  try{
    target=await parseFile(file);const s=summarizeTarget(target);log(`FORMAT ${s.format}`);log(`TARGET ${s.placements} instances · ${s.uniqueParts} unique IDs`);log(`CALIBRATION ${s.calibration}`);if(s.warning)log(`WARNING ${s.warning}`);log('CHECK local LDraw part coverage…');
    const c=await coverage(s);$('#nParts').textContent=s.placements.toLocaleString();$('#nUnique').textContent=s.uniqueParts.toLocaleString();$('#nLocal').textContent=c.local.toLocaleString();$('#nMissing').textContent=c.missing.toLocaleString();renderRows(c.rows);
    $('#fileChip').textContent='TARGET LOADED';$('#fileChip').className='chip ok';const exact=s.calibration==='exact-ldraw';$('#calChip').textContent=exact?'LDRAW POSE':'POSE NEEDS MAP';$('#calChip').className=`chip ${exact?'ok':'warn'}`;
    $('#status').textContent=`INGESTED · ${s.placements.toLocaleString()} part instances · ${c.local}/${s.uniqueParts} unique IDs resolve directly in local LDraw`;
    log(`LOCAL LDRAW ${c.local}/${s.uniqueParts} unique IDs`);if(c.missing)log(`UNMAPPED ${c.missing} IDs · these stay loud; no substitution is automatic`);
    log('NEXT: compile connector semantics; pose alone is never CLICK.');
  }catch(e){console.error(e);$('#fileChip').textContent='IMPORT FAILED';$('#fileChip').className='chip bad';$('#status').textContent=`FAILED · ${e.message}`;log(`ERROR ${e.stack||e.message}`)}
}
input.onchange=e=>e.target.files?.[0]&&load(e.target.files[0]);
for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')});
for(const ev of ['dragleave','drop'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')});
drop.addEventListener('drop',e=>e.dataTransfer?.files?.[0]&&load(e.dataTransfer.files[0]));
fetch('./sources.json',{cache:'no-store'}).then(r=>r.json()).then(s=>log(`READY · ${s.name} ${s.set} · official count ${s.officialPieceCount}`)).catch(()=>log('READY · source manifest unavailable'));

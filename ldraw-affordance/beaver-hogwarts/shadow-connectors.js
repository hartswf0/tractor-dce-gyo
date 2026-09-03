import {parseType1} from './target-import.js';

const ID=[1,0,0,0,1,0,0,0,1];
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const mm=(a,b)=>[
 a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
 a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
 a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const neg=a=>a.map(x=>-x);
const compose=(a,b)=>({r:mm(a.r,b.r),t:add(a.t,mv(a.r,b.t))});
const clean=s=>String(s||'').replace(/\\/g,'/').replace(/^\.\//,'').trim();

export function parseMetaAttrs(line){
  const out={};for(const m of line.matchAll(/\[([^=\]]+)=([^\]]*)\]/g))out[m[1].trim()]=m[2].trim();return out;
}
const nums=s=>String(s||'').trim().split(/\s+/).filter(Boolean).map(Number);
const bool=s=>String(s).toLowerCase()==='true';
const trFrom=a=>({t:nums(a.pos).length===3?nums(a.pos):[0,0,0],r:nums(a.ori).length===9?nums(a.ori):ID});

export function parseShadowMeta(text){
  const ops=[],unsupported=[];
  for(const raw of String(text||'').split(/\r?\n/)){
    const line=raw.trim();if(!line.startsWith('0 !LDCAD '))continue;
    const m=/^0\s+!LDCAD\s+(SNAP_[A-Z]+)\b(.*)$/i.exec(line);if(!m)continue;
    const kind=m[1].toUpperCase(),attrs=parseMetaAttrs(m[2]);
    if(['SNAP_CYL','SNAP_INCL','SNAP_CLEAR'].includes(kind))ops.push({kind,attrs,raw:line});else unsupported.push({kind,attrs,raw:line});
  }
  return{ops,unsupported};
}

function parseGrid(s){
  const t=String(s||'').trim().split(/\s+/).filter(Boolean);if(t.length<4)return[{x:0,z:0}];
  const dx=Number(t[t.length-2]),dz=Number(t[t.length-1]),spec=t.slice(0,-2);if(!Number.isFinite(dx)||!Number.isFinite(dz))return[{x:0,z:0}];
  let i=0;const axis=()=>{let centered=false;if(String(spec[i]).toUpperCase()==='C'){centered=true;i++}const count=Math.max(1,Number(spec[i++])||1);return{centered,count}};
  const ax=axis(),az=axis(),out=[];
  const ofs=(a,k,d)=>a.centered?(k-(a.count-1)/2)*d:k*d;
  for(let z=0;z<az.count;z++)for(let x=0;x<ax.count;x++)out.push({x:ofs(ax,x,dx),z:ofs(az,z,dz)});return out;
}

function firstSection(secs){
  const t=String(secs||'').trim().split(/\s+/);if(t.length<3)return null;const radius=Number(t[1]),length=Number(t[2]);return{shape:String(t[0]).toUpperCase(),radius,length,tokens:t};
}
function classifyCylinder(a){
  const sec=firstSection(a.secs),gender=String(a.gender||'').toUpperCase(),caps=String(a.caps||'none').toLowerCase(),slide=bool(a.slide);
  if(!sec||!['M','F'].includes(gender))return{protocol:'CYLINDER_UNMODELED',clickable:false,reason:'CYLINDER_SIGNATURE_INCOMPLETE',sec,gender,caps,slide};
  const studRadius=Math.abs(sec.radius-6)<.01,studShape=['R','S'].includes(sec.shape);
  if(studRadius&&studShape&&caps==='one'&&!slide)return{protocol:'STUD_CLUTCH',clickable:true,reason:'CAPPED_STUD_CYLINDER',sec,gender,caps,slide};
  if(caps==='none'||slide)return{protocol:'INSERTION',clickable:false,reason:'INSERTION_DEPTH_UNMODELED',sec,gender,caps,slide};
  return{protocol:'CYLINDER_UNMODELED',clickable:false,reason:'PROTOCOL_UNMODELED',sec,gender,caps,slide};
}
function localCylinderPorts(a,source){
  const base=trFrom(a),axis=mv(base.r,[0,1,0]),c=classifyCylinder(a),out=[];
  for(const [i,g] of parseGrid(a.grid).entries()){
    const p=add(base.t,mv(base.r,[g.x,0,g.z])),n=c.gender==='F'?neg(axis):axis;
    out.push({id:a.ID||a.id||null,group:a.group||null,kind:'SNAP_CYL',gender:c.gender,p,n,ori:base.r,protocol:c.protocol,clickable:c.clickable,reason:c.reason,signature:c.sec,raw:a,source,gridIndex:i});
  }
  return out;
}
const apply=(port,tr)=>({...port,p:add(tr.t,mv(tr.r,port.p)),n:mv(tr.r,port.n),ori:mm(tr.r,port.ori||ID)});
const applyGrid=(ports,a)=>{const base=trFrom(a),out=[];for(const g of parseGrid(a.grid))for(const p of ports)out.push(apply(p,{t:add(base.t,mv(base.r,[g.x,0,g.z])),r:base.r}));return out};

function refCandidates(ref){
  const r=clean(ref);if(!r)return[];
  if(/^s\//i.test(r))return[`parts/${r}`];
  if(/^(48|8)\//i.test(r))return[`p/${r}`];
  if(/^parts\//i.test(r)||/^p\//i.test(r))return[r];
  return[`parts/${r}`,`p/${r}`];
}
async function resolve(load,ref){for(const p of refCandidates(ref)){const x=await load(p);if(x!=null)return{path:p,text:x}}return null}

export function createShadowCompiler({loadReal,loadShadow,maxDepth=64}){
  const realCache=new Map(),shadowCache=new Map(),compiled=new Map();
  const getReal=async path=>{if(!realCache.has(path))realCache.set(path,await loadReal(path));return realCache.get(path)};
  const getShadow=async path=>{if(!shadowCache.has(path))shadowCache.set(path,await loadShadow(path));return shadowCache.get(path)};
  const resolveReal=ref=>resolve(getReal,ref),resolveShadow=ref=>resolve(getShadow,ref);

  async function metaRef(ref,stack=[]){
    const found=await resolveShadow(ref);if(!found)return{ports:[],unsupported:[`MISSING_SHADOW:${ref}`]};if(stack.includes(found.path))return{ports:[],unsupported:[`SHADOW_CYCLE:${found.path}`]};
    const parsed=parseShadowMeta(found.text),ports=[],unsupported=parsed.unsupported.map(x=>`${x.kind}:${found.path}`),clears=parsed.ops.filter(x=>x.kind==='SNAP_CLEAR');
    for(const op of parsed.ops){
      if(op.kind==='SNAP_CYL')ports.push(...localCylinderPorts(op.attrs,found.path));
      else if(op.kind==='SNAP_INCL'){
        const child=await metaRef(op.attrs.ref,[...stack,found.path]);ports.push(...applyGrid(child.ports,op.attrs));unsupported.push(...child.unsupported);
      }
    }
    if(clears.some(x=>Object.keys(x.attrs).length))unsupported.push(`SELECTIVE_SNAP_CLEAR_UNMODELED:${found.path}`);
    return{ports,unsupported,clearAll:clears.some(x=>Object.keys(x.attrs).length===0)};
  }

  async function compilePath(path,stack=[],depth=0){
    if(depth>maxDepth)return{ports:[],unsupported:[`DEPTH>${maxDepth}:${path}`]};
    const cacheKey=path;if(!stack.length&&compiled.has(cacheKey))return compiled.get(cacheKey);
    if(stack.includes(path))return{ports:[],unsupported:[`REAL_CYCLE:${path}`]};
    const real=await getReal(path);if(real==null)return{ports:[],unsupported:[`MISSING_LDRAW:${path}`]};
    const shadow=await getShadow(path),meta=shadow==null?{ops:[],unsupported:[]}:parseShadowMeta(shadow),ports=[],unsupported=meta.unsupported.map(x=>`${x.kind}:${path}`);
    const clears=meta.ops.filter(x=>x.kind==='SNAP_CLEAR'),clearAll=clears.some(x=>Object.keys(x.attrs).length===0),selective=clears.some(x=>Object.keys(x.attrs).length>0);if(selective)unsupported.push(`SELECTIVE_SNAP_CLEAR_UNMODELED:${path}`);
    if(!clearAll&&!selective){
      for(const raw of String(real).split(/\r?\n/)){
        const row=parseType1(raw);if(!row)continue;const child=await resolveReal(row.ref);if(!child)continue;
        const c=await compilePath(child.path,[...stack,path],depth+1),tr={t:row.t,r:row.r};ports.push(...c.ports.map(p=>apply(p,tr)));unsupported.push(...c.unsupported);
      }
    }
    for(const op of meta.ops){
      if(op.kind==='SNAP_CYL')ports.push(...localCylinderPorts(op.attrs,path));
      else if(op.kind==='SNAP_INCL'){
        const c=await metaRef(op.attrs.ref,[path]);ports.push(...applyGrid(c.ports,op.attrs));unsupported.push(...c.unsupported);
      }
    }
    const seen=new Set(),dedup=[];for(const p of ports){const k=[p.protocol,p.gender,...p.p.map(x=>x.toFixed(4)),...p.n.map(x=>x.toFixed(5))].join('|');if(!seen.has(k)){seen.add(k);dedup.push(p)}}
    const result={path,ports:dedup,clickable:dedup.filter(p=>p.clickable),unsupported:[...new Set(unsupported)]};if(!stack.length)compiled.set(cacheKey,result);return result;
  }
  async function compilePart(partId){return compilePath(`parts/${clean(partId).replace(/\.dat$/i,'')}.dat`)}
  return{compilePart,compilePath,metaRef,caches:{realCache,shadowCache,compiled}};
}

export function targetPorts(placement,compiled){
  const tr={t:placement.t,r:placement.r};return compiled.ports.map((p,i)=>({...apply(p,tr),partUid:placement.uid,partId:placement.partId,portIndex:i}));
}
export function buildStudContactGraph(placements,compiledByPart,{positionTolerance=.08,normalTolerance=.999}={}){
  const ports=[];for(const inst of placements){const c=compiledByPart.get(inst.partId);if(c)ports.push(...targetPorts(inst,c).filter(p=>p.clickable&&p.protocol==='STUD_CLUTCH'))}
  const cell=Math.max(positionTolerance*2,.01),hash=new Map(),ck=p=>p.map(x=>Math.round(x/cell)).join(','),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  for(const p of ports){const k=ck(p.p);if(!hash.has(k))hash.set(k,[]);hash.get(k).push(p)}
  const edges=[],used=new Set();
  for(const p of ports){if(p.gender!=='M')continue;const base=p.p.map(x=>Math.round(x/cell));let best=null;
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const q of hash.get(`${base[0]+x},${base[1]+y},${base[2]+z}`)||[]){
      if(q.gender!=='F'||q.partUid===p.partUid)continue;const d=dist(p.p,q.p),nd=dot(p.n,q.n);if(d>positionTolerance||nd>-normalTolerance)continue;if(!best||d<best.d)best={q,d,nd};
    }
    if(best){const a=`${p.partUid}:${p.portIndex}`,b=`${best.q.partUid}:${best.q.portIndex}`;if(used.has(a)||used.has(b))continue;used.add(a);used.add(b);edges.push({a:p.partUid,b:best.q.partUid,aPort:p,bPort:best.q,d:best.d,normalDot:best.nd,protocol:'STUD_CLUTCH'});}
  }
  const nodes=new Map(placements.map(p=>[p.uid,{uid:p.uid,partId:p.partId,degree:0}]));for(const e of edges){nodes.get(e.a).degree++;nodes.get(e.b).degree++}
  return{nodes:[...nodes.values()],edges,ports:ports.length,connectedNodes:[...nodes.values()].filter(n=>n.degree>0).length,isolatedNodes:[...nodes.values()].filter(n=>n.degree===0).length};
}

export const SHADOW_COMPILER_VERSION='ldcad-shadow-1';

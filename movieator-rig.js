// MOVIEATOR mechanical production rig
// A candidate mounts only when it can answer the actor port asking for it.

export const PORTS={
  NECK:{id:'NECK',type:'neck',gender:'male'},
  CROWN:{id:'CROWN',type:'stud',gender:'male'},
  NECK_LAYER:{id:'NECK_LAYER',type:'neck-layer',gender:'neutral'},
  LEFT_GRIP:{id:'LEFT_GRIP',type:'grip',gender:'female',side:'left'},
  RIGHT_GRIP:{id:'RIGHT_GRIP',type:'grip',gender:'female',side:'right'}
};

export function headFamily(part){
  if(!part)return 'none';
  const f=(part.file||part.filename||'').toLowerCase();
  const d=(part.description||'').toLowerCase();
  if(/^3626/.test(f))return 'standard';
  if(/simpsons|yoda|gremlin|mogwai|powerpuff|alien e\. ?t\.|wookiee|chewbacca|muppet|mickey|scooby/.test(d))return 'prosthetic';
  return 'prosthetic';
}

export function actorPorts({head}){
  const family=headFamily(head);
  return {
    neck:PORTS.NECK,
    crown:family==='standard'?PORTS.CROWN:null,
    neckLayer:family==='standard'?PORTS.NECK_LAYER:null,
    leftGrip:PORTS.LEFT_GRIP,
    rightGrip:PORTS.RIGHT_GRIP
  };
}

export function isFaceCandidate(r){return /^3626[^/]*\.dat$/i.test(r.filename||'') && /^Minifig Head\b/i.test(r.description||'')}
export function isProstheticCandidate(r){return /^Minifig Head\b/i.test(r.description||'') && !isFaceCandidate(r)}
export function isHeadwearCandidate(r){return /^Minifig (?:Hair|Headgear|Helmet|Hat|Hood|Headdress|Cap|Crown|Bandana|Turban|Wig)\b/i.test(r.description||'')}
export function isNeckLayerCandidate(r){return /^Minifig\b/i.test(r.description||'') && /\b(?:beard|moustache|mustache|neck|collar|scarf|breathing apparatus|respirator|shoulder armor|neckwear)\b/i.test(r.description||'')}

const ID=[1,0,0,0,1,0,0,0,1];
const mag=v=>Math.hypot(v[0],v[1],v[2]);
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mm=(a,b)=>[
 a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
 a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
 a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
function matrixColumns(a){return [[a[0],a[3],a[6]],[a[1],a[4],a[7]],[a[2],a[5],a[8]]]}
function joinPath(base,file){
  if(/^https?:/i.test(file))return file;
  file=file.replace(/\\/g,'/').replace(/^parts\//,'');
  if(file.startsWith('s/'))return `${base}s/${file.slice(2)}`;
  return `${base}${file}`;
}

export async function probeCrownSocket(part,{base='./ldraw/parts/',cache=new Map()}={}){
  const file=part.filename||part.file;if(!file)return {ok:false,status:'BLOCKED',reason:'NO FILE'};
  try{
    let text=cache.get(file);if(text===undefined){const r=await fetch(joinPath(base,file),{cache:'force-cache'});if(!r.ok)throw new Error();text=await r.text();cache.set(file,text)}
    // Official headwear commonly exposes the anti-stud through stud4o or a
    // closely related hollow-stud primitive. Do not accept a name alone.
    if(/\b(?:stud4o|stud2a|stud2)\.dat\b/i.test(text))return {ok:true,status:'CLICK',reason:'ANTI-STUD FOUND'};
    return {ok:false,status:'BLOCKED',reason:'NO ANTI-STUD FOUND'};
  }catch{return {ok:false,status:'BLOCKED',reason:'SOCKET PROBE ERROR'}}
}

// Probe a .dat recursively for a cylindrical shaft at minifig grip scale.
// Returned point and axis are in the root part's local coordinate system.
export async function probeGrip(part,{base='./ldraw/parts/',maxDepth=3,cache=new Map()}={}){
  const start=part.filename||part.file;
  if(!start)return {ok:false,status:'BLOCKED',reason:'NO FILE'};
  const seen=new Set();
  async function walk(file,T={p:[0,0,0],m:ID},depth=0){
    const key=`${depth}|${file}`;if(depth>maxDepth||seen.has(key))return null;seen.add(key);
    let text=cache.get(file);if(text===undefined){const r=await fetch(joinPath(base,file),{cache:'force-cache'});if(!r.ok)return null;text=await r.text();cache.set(file,text)}
    for(const raw of text.split(/\r?\n/)){
      const a=raw.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;
      const lp=[+a[2],+a[3],+a[4]],lm=a.slice(5,14).map(Number),child=a.slice(14).join(' ').replace(/\\/g,'/');
      const p=add(T.p,mv(T.m,lp)),m=mm(T.m,lm),low=child.toLowerCase();
      if(/(?:cyli|cylc)\.dat$/.test(low)){
        const cols=matrixColumns(m),lens=cols.map(mag),order=[0,1,2].sort((i,j)=>lens[j]-lens[i]);
        const axisI=order[0],r1=lens[order[1]],r2=lens[order[2]],ax=lens[axisI];
        if(ax>=8 && r1>=3.35&&r1<=4.65 && r2>=3.35&&r2<=4.65){const axis=cols[axisI],axisLen=mag(axis)||1;return {ok:true,status:'CLICK',reason:'GRIP SHAFT',localPoint:p,axis:axis.map(x=>x/axisLen),radius:(r1+r2)/2,length:ax,source:child}}
      }
      const primitive=/\b(?:stud|edge|disc|ring|cyli|cylc|con|torus|box|rect|tri|quad)\b/i.test(low);
      if(depth<maxDepth && (!primitive||/^s\//i.test(low))){const hit=await walk(child,{p,m},depth+1);if(hit)return hit}
    }
    return null;
  }
  try{return await walk(start)||{ok:false,status:'BLOCKED',reason:'NO ~8 LDU GRIP SHAFT'}}catch{return {ok:false,status:'BLOCKED',reason:'PROBE ERROR'}}
}

export async function headwearCompatibility({actorHead,candidate,cache}){
  if(headFamily(actorHead)!=='standard')return {ok:false,status:'BLOCKED',reason:'NO CROWN PORT ON PROSTHETIC'};
  if(!isHeadwearCandidate(candidate))return {ok:false,status:'BLOCKED',reason:'NOT HEADWEAR'};
  return probeCrownSocket(candidate,{cache});
}
export function neckCompatibility({actorHead,candidate}){
  if(headFamily(actorHead)!=='standard')return {ok:false,status:'BLOCKED',reason:'NO NECK LAYER ON PROSTHETIC'};
  if(!isNeckLayerCandidate(candidate))return {ok:false,status:'BLOCKED',reason:'NOT NECK LAYER'};
  return {ok:true,status:'INFERRED',reason:'NECK FAMILY; CLEARANCE UNPROVED'};
}

export const CLOCKS=[0,90,180,270];

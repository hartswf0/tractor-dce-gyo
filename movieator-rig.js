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
  // 3626 is the canonical cylindrical minifig head family. Keep the first
  // production pass deliberately strict; unusual sculpts are prosthetics.
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

export function isFaceCandidate(r){
  return /^3626[^/]*\.dat$/i.test(r.filename||'') && /^Minifig Head\b/i.test(r.description||'');
}
export function isProstheticCandidate(r){
  return /^Minifig Head\b/i.test(r.description||'') && !isFaceCandidate(r);
}
export function isHeadwearCandidate(r){
  return /^Minifig (?:Hair|Headgear|Helmet|Hat|Hood|Headdress|Cap|Crown|Bandana|Turban|Wig)\b/i.test(r.description||'');
}
export function isNeckLayerCandidate(r){
  return /^Minifig\b/i.test(r.description||'') && /\b(?:beard|moustache|mustache|neck|collar|scarf|breathing apparatus|respirator|shoulder armor|neckwear)\b/i.test(r.description||'');
}

const mag=(x,y,z)=>Math.hypot(x,y,z);
function matrixColumns(a){
  // LDraw matrix a b c / d e f / g h i. Return transformed primitive axes.
  return [[a[0],a[3],a[6]],[a[1],a[4],a[7]],[a[2],a[5],a[8]]];
}
function joinPath(base,file){
  if(/^https?:/i.test(file))return file;
  file=file.replace(/\\/g,'/').replace(/^parts\//,'');
  if(file.startsWith('s/'))return `${base}s/${file.slice(2)}`;
  return `${base}${file}`;
}

// Probe a .dat recursively for a cylindrical shaft at minifig grip scale.
// A minifig hand grips ~3.18mm diameter, approximately 8 LDU, so we seek a
// cylinder with two transverse radii around 4 LDU and a useful axial length.
export async function probeGrip(part,{base='./ldraw/parts/',maxDepth=2,cache=new Map()}={}){
  const start=part.filename||part.file;
  if(!start)return {ok:false,status:'BLOCKED',reason:'NO FILE'};
  const seen=new Set();
  async function walk(file,T={p:[0,0,0],m:[1,0,0,0,1,0,0,0,1]},depth=0){
    const key=file;
    if(depth>maxDepth||seen.has(key))return null;seen.add(key);
    let text=cache.get(key);
    if(text===undefined){
      const r=await fetch(joinPath(base,file),{cache:'force-cache'});if(!r.ok)return null;text=await r.text();cache.set(key,text);
    }
    for(const raw of text.split(/\r?\n/)){
      const a=raw.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;
      const p=[+a[2],+a[3],+a[4]],m=a.slice(5,14).map(Number),child=a.slice(14).join(' ').replace(/\\/g,'/');
      const low=child.toLowerCase();
      if(/(?:cyli|cylc)\.dat$/.test(low)){
        const cols=matrixColumns(m),lens=cols.map(v=>mag(...v));
        const order=[0,1,2].sort((i,j)=>lens[j]-lens[i]);
        const axisI=order[0],r1=lens[order[1]],r2=lens[order[2]],ax=lens[axisI];
        if(ax>=8 && r1>=3.4&&r1<=4.6 && r2>=3.4&&r2<=4.6){
          return {ok:true,status:'CLICK',reason:'GRIP SHAFT',localPoint:p,axis:cols[axisI],radius:(r1+r2)/2,length:ax,source:child};
        }
      }
      if(depth<maxDepth && (/^s\//i.test(low)||!/\b(?:stud|edge|disc|ring|cyli|cylc|con|torus|box|rect|tri)\b/i.test(low))){
        const hit=await walk(child,{p,m},depth+1);if(hit)return hit;
      }
    }
    return null;
  }
  try{return await walk(start)||{ok:false,status:'BLOCKED',reason:'NO ~8 LDU GRIP SHAFT'}}catch(e){return {ok:false,status:'BLOCKED',reason:'PROBE ERROR'}}
}

export function headwearCompatibility({actorHead,candidate}){
  if(headFamily(actorHead)!=='standard')return {ok:false,status:'BLOCKED',reason:'NO CROWN PORT ON PROSTHETIC'};
  if(!isHeadwearCandidate(candidate))return {ok:false,status:'BLOCKED',reason:'NOT HEADWEAR'};
  return {ok:true,status:'CLICK',reason:'STANDARD CROWN PORT'};
}
export function neckCompatibility({actorHead,candidate}){
  if(headFamily(actorHead)!=='standard')return {ok:false,status:'BLOCKED',reason:'NO NECK LAYER ON PROSTHETIC'};
  if(!isNeckLayerCandidate(candidate))return {ok:false,status:'BLOCKED',reason:'NOT NECK LAYER'};
  return {ok:true,status:'INFERRED',reason:'NECK-LAYER FAMILY; CLEARANCE UNPROVED'};
}

export const CLOCKS=[0,90,180,270];

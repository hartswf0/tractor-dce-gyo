// MOVIEATOR / BEAVER V3
// Names discover candidates. Ports, geometry, and fit decide attachment.

export const PORTS={
 NECK:{id:'NECK',type:'neck'},CROWN:{id:'CROWN',type:'stud'},NECK_LAYER:{id:'NECK_LAYER',type:'neck-layer'},
 LEFT_GRIP:{id:'LEFT_GRIP',type:'grip',side:'left'},RIGHT_GRIP:{id:'RIGHT_GRIP',type:'grip',side:'right'}
};
export const MAGNET_PHASES=['HEAR','PULL','ALIGN','SLIDE','CLOCK','CLICK'];
export const CLOCKS=[0,90,180,270];
export const GRIP_FRACTIONS=[0.18,0.28,0.38,0.5,0.62,0.72,0.82];

const ID=[1,0,0,0,1,0,0,0,1];
const mag=v=>Math.hypot(v[0],v[1],v[2]);
const norm=v=>{const n=mag(v)||1;return v.map(x=>x/n)};
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mm=(a,b)=>[
 a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
 a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
 a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
const matrixColumns=a=>[[a[0],a[3],a[6]],[a[1],a[4],a[7]],[a[2],a[5],a[8]]];
function joinPath(base,file){file=String(file||'').replace(/\\/g,'/').replace(/^parts\//,'');return file.startsWith('s/')?`${base}s/${file.slice(2)}`:`${base}${file}`}

export function headFamily(part){
 if(!part)return'none';const f=(part.file||part.filename||'').toLowerCase(),d=(part.description||'').toLowerCase();
 if(/^3626/.test(f))return'standard';
 if(/simpsons|yoda|gremlin|mogwai|powerpuff|alien e\. ?t\.|wookiee|chewbacca|muppet|mickey|scooby/.test(d))return'prosthetic';
 return'prosthetic';
}
export function actorPorts({head,body}){const standard=headFamily(head)==='standard'&&body!=='baby';return{neck:PORTS.NECK,crown:standard?PORTS.CROWN:null,neckLayer:standard?PORTS.NECK_LAYER:null,leftGrip:body==='baby'?null:PORTS.LEFT_GRIP,rightGrip:body==='baby'?null:PORTS.RIGHT_GRIP}}

export const isFaceCandidate=r=>/^3626[^/]*\.dat$/i.test(r.filename||'')&&/^Minifig Head\b/i.test(r.description||'');
export const hasPrintedFacialHair=r=>isFaceCandidate(r)&&/\b(?:beard|moustache|mustache|stubble|goatee|sideburn|whisker)\b/i.test(r.description||'');
export const isProstheticCandidate=r=>/^Minifig Head\b/i.test(r.description||'')&&!isFaceCandidate(r);
export const isHeadwearCandidate=r=>/^Minifig (?:Hair|Headgear|Helmet|Hat|Hood|Headdress|Cap|Crown|Bandana|Turban|Wig)\b/i.test(r.description||'');
export const isNeckLayerCandidate=r=>/^Minifig\b/i.test(r.description||'')&&/\b(?:beard|moustache|mustache|neck|collar|scarf|breathing apparatus|respirator|shoulder armor|neckwear)\b/i.test(r.description||'');
export const isAttachmentOnlyProp=r=>/\b(?:axe|hammer|spear|mace|pick) head\b|\bblade only\b|\bhead only\b/i.test(r.description||'');

async function readPart(file,{base='./ldraw/parts/',cache=new Map()}={}){let t=cache.get(file);if(t!==undefined)return t;const r=await fetch(joinPath(base,file),{cache:'force-cache'});if(!r.ok)throw new Error(`missing ${file}`);t=await r.text();cache.set(file,t);return t}

export async function probeCrownSocket(part,{base='./ldraw/parts/',cache=new Map(),maxDepth=3}={}){
 const start=part.filename||part.file;if(!start)return{ok:false,status:'BLOCKED',reason:'NO FILE'};const seen=new Set();
 async function walk(file,depth){if(depth>maxDepth||seen.has(file))return false;seen.add(file);const text=await readPart(file,{base,cache});if(/\b(?:stud4o|stud2a|stud2|stud4)\.dat\b/i.test(text))return true;
  for(const raw of text.split(/\r?\n/)){const a=raw.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;const child=a.slice(14).join(' ').replace(/\\/g,'/');if(/^s\//i.test(child)&&await walk(child,depth+1))return true}return false}
 try{return await walk(start,0)?{ok:true,status:'CLICK',reason:'CROWN SOCKET FOUND'}:{ok:true,status:'TRY',reason:'HEADWEAR FAMILY; SOCKET UNRESOLVED'}}catch{return{ok:true,status:'TRY',reason:'HEADWEAR FAMILY; PROBE UNRESOLVED'}}
}
export async function headwearCompatibility({actorHead,candidate,cache}){
 if(headFamily(actorHead)!=='standard')return{ok:false,status:'BLOCKED',reason:'NO CROWN PORT ON PROSTHETIC'};
 if(!isHeadwearCandidate(candidate))return{ok:false,status:'BLOCKED',reason:'NOT HEADWEAR'};
 return probeCrownSocket(candidate,{cache});
}
export function neckCompatibility({actorHead,candidate}){
 if(headFamily(actorHead)!=='standard')return{ok:false,status:'BLOCKED',reason:'NO NECK LAYER ON PROSTHETIC'};
 if(!isNeckLayerCandidate(candidate))return{ok:false,status:'BLOCKED',reason:'NOT NECK LAYER'};
 return{ok:true,status:'TRY',reason:'NECK-LAYER FAMILY; CLEARANCE REQUIRED'};
}

// LDraw cylinder primitives 4-4cyli / 4-4cylc run from y=0 to y=1.
// Therefore the transformed LOCAL Y column is the cylinder axis. X and Z are
// its two radial directions. Do not infer axis from whichever matrix column is
// longest: that is only accidentally correct for long handles.
export async function probeGripSegments(part,{base='./ldraw/parts/',maxDepth=4,cache=new Map()}={}){
 const start=part.filename||part.file;if(!start)return{ok:false,status:'BLOCKED',reason:'NO FILE',segments:[]};const seen=new Set(),segments=[];
 async function walk(file,T={p:[0,0,0],m:ID},depth=0){if(depth>maxDepth)return;const key=`${depth}|${file}`;if(seen.has(key))return;seen.add(key);let text;try{text=await readPart(file,{base,cache})}catch{return}
  for(const raw of text.split(/\r?\n/)){const a=raw.trim().split(/\s+/);if(a[0]!=='1'||a.length<15)continue;const lp=[+a[2],+a[3],+a[4]],lm=a.slice(5,14).map(Number),child=a.slice(14).join(' ').replace(/\\/g,'/'),p=add(T.p,mv(T.m,lp)),m=mm(T.m,lm),low=child.toLowerCase();
   if(/(?:cyli|cylc)\.dat$/.test(low)){
    const cols=matrixColumns(m),length=mag(cols[1]),r1=mag(cols[0]),r2=mag(cols[2]);
    if(length>=6&&r1>=3.2&&r1<=4.8&&r2>=3.2&&r2<=4.8){segments.push({origin:p,axis:norm(cols[1]),radius:(r1+r2)/2,length,source:child,primitiveAxis:'Y'})}
   }
   const primitive=/\b(?:stud|edge|disc|ring|cyli|cylc|con|torus|box|rect|tri|quad)\b/i.test(low);if(depth<maxDepth&&(!primitive||/^s\//i.test(low)))await walk(child,{p,m},depth+1)
  }}
 try{await walk(start);segments.sort((a,b)=>b.length-a.length);if(!segments.length)return{ok:false,status:'BLOCKED',reason:'NO HAND-SCALE GRIP SEGMENT',segments};return{ok:true,status:isAttachmentOnlyProp(part)?'TRY':'HEAR',reason:`${segments.length} GRIP SEGMENT${segments.length===1?'':'S'} HEARD`,segments}}catch{return{ok:false,status:'BLOCKED',reason:'GRIP PROBE ERROR',segments:[]}}
}
export async function probeGrip(part,opts={}){const r=await probeGripSegments(part,opts);if(!r.ok)return r;const s=r.segments[0],fraction=s.length>=30?.78:.5;return{...r,...s,localPoint:add(s.origin,s.axis.map(x=>x*(fraction-.5)*s.length)),sourcePoint:s.origin,gripFraction:fraction}}

// Current minifig hand placements used by the production body rig.
export const HANDS={
 left:{p:[-23.6904,-33.226,-9.8982],m:[0.985,-0.1202,0.1202,0.17,0.6964,-0.6964,0,0.707,0.707]},
 right:{p:[23.6904,-33.226,-9.8982],m:[0.985,0.1202,-0.1202,-0.17,0.6964,-0.6964,0,0.707,0.707]}
};
export const HAND_GRIP_LOCAL=[0,-0.8229,-9.8948];
// 3820.dat's own half-cylinder starts at (0,4.502,-8.518) and its LOCAL Y
// transform column is (0,-10.64966,-2.75422). Its midpoint is the documented
// grip centre. This normalized vector is therefore the actual claw/bar axis.
export const HAND_GRIP_AXIS_LOCAL=norm([0,-10.64966,-2.75422]);
export function handFrame(side){
 const h=HANDS[side],center=add(h.p,mv(h.m,HAND_GRIP_LOCAL)),gripAxis=norm(mv(h.m,HAND_GRIP_AXIS_LOCAL));
 return{side,center,gripAxis,clawNormal:norm(mv(h.m,[1,0,0])),captureRadius:18,minOverlap:6,radius:[3.2,4.8],axes:{grip:gripAxis,localX:norm(mv(h.m,[1,0,0])),localY:norm(mv(h.m,[0,1,0])),localZ:norm(mv(h.m,[0,0,1]))}};
}

export function magnetStatus({distance=Infinity,axisError=Infinity,overlap=0,clear=false}={}){
 if(!Number.isFinite(distance))return'DEAF';if(distance>18)return'DEAF';if(distance>8)return'HEAR';if(axisError>.02)return'PULL';if(overlap<6)return'ALIGN';if(!clear)return'CLOCK';return'CLICK';
}

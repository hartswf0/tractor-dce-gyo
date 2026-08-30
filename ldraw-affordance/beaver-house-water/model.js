export const ID=[1,0,0,0,1,0,0,0,1];
export const RY90=[0,0,1,0,1,0,-1,0,0];
export const RY180=[-1,0,0,0,1,0,0,0,-1];
export const RY270=[0,0,-1,0,1,0,1,0,0];

export const HOUSE={
  lengthStuds:32,
  depthStuds:16,
  wallBricks:7,
  wallHeight:168,
  wallTopY:-168,
  roofTopY:-176,
  baseplate:'3811.dat',
  baseplateStuds:32,
  principle:'Water is the error signal. Build only where flow still crosses the envelope.'
};

const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mm=(a,b)=>[
  a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
export const transformPoint=(inst,p)=>add(inst.t,mv(inst.r||ID,p));
export const transformVector=(inst,v)=>mv(inst.r||ID,v);
export const compose=(outer,inner)=>({t:add(outer.t,mv(outer.r||ID,inner.t||[0,0,0])),r:mm(outer.r||ID,inner.r||ID)});
export const pointKey=p=>p.map(v=>Math.round(v*1000)).join('|');

function studCenters(width){return Array.from({length:width},(_,i)=>(-(width-1)*10)+i*20)}
function brickRow(width,y,color=15){
  const parts=[];
  const xs=studCenters(width);
  for(let i=0;i<width;i+=2){
    const a=xs[i],b=xs[i+1];
    if(b===undefined)parts.push({file:'3005.dat',color,t:[a,y,0],r:ID});
    else parts.push({file:'3004.dat',color,t:[(a+b)/2,y,0],r:ID});
  }
  return parts;
}
function ports(width,y,gender){
  return studCenters(width).map((x,i)=>({id:`${gender}-${i}`,type:'stud',gender,p:[x,y,0],n:gender==='male'?[0,-1,0]:[0,1,0],confidence:'exact'}));
}
function wallModule(width){
  const parts=[];for(let course=0;course<HOUSE.wallBricks;course++)parts.push(...brickRow(width,course*24,15));
  return{id:`wall-${width}`,kind:'wall',width,heightBricks:7,parts,bottomPorts:ports(width,168,'female'),topPorts:ports(width,0,'male'),minContacts:width,leakAfter:0,capabilities:['SEAL_WALL']};
}
function doorFrameModule(){
  const parts=[];
  parts.push(...brickRow(8,0,15));
  for(let course=1;course<7;course++){
    parts.push({file:'3004.dat',color:15,t:[-60,course*24,0],r:ID},{file:'3004.dat',color:15,t:[60,course*24,0],r:ID});
  }
  parts.push({file:'60596.dat',color:71,t:[0,24,0],r:ID});
  const bottom=[-70,-50,50,70].map((x,i)=>({id:`female-${i}`,type:'stud',gender:'female',p:[x,168,0],n:[0,1,0],confidence:'exact'}));
  return{id:'door-frame-8',kind:'door-frame',width:8,parts,bottomPorts:bottom,topPorts:ports(8,0,'male'),minContacts:4,leakAfter:24,capabilities:['FRAME_DOOR']};
}
function windowFrameModule(){
  const parts=[];
  parts.push(...brickRow(8,0,15),...brickRow(8,24,15),...brickRow(8,120,15),...brickRow(8,144,15));
  for(const y of [48,72,96])parts.push({file:'3004.dat',color:15,t:[-60,y,0],r:ID},{file:'3004.dat',color:15,t:[60,y,0],r:ID});
  parts.push({file:'60593.dat',color:71,t:[-20,48,0],r:ID},{file:'60593.dat',color:71,t:[20,48,0],r:ID});
  return{id:'window-frame-8',kind:'window-frame',width:8,parts,bottomPorts:ports(8,168,'female'),topPorts:ports(8,0,'male'),minContacts:8,leakAfter:12,capabilities:['FRAME_WINDOW']};
}
function roofModule(){
  const parts=[];
  for(const x of [-40,40])for(const z of [-140,-100,-60,-20,20,60,100,140])parts.push({file:'3020.dat',color:4,t:[x,0,z],r:ID});
  const bottom=[];for(const x of studCenters(8))for(const z of studCenters(16))bottom.push({id:`b-${x}-${z}`,type:'stud',gender:'female',p:[x,8,z],n:[0,1,0],confidence:'exact'});
  return{id:'roof-8x16',kind:'roof',width:8,depth:16,parts,bottomPorts:bottom,topPorts:[],minContacts:16,leakAfter:0,capabilities:['SEAL_ROOF']};
}

export const MODULES=new Map([
  ['wall-8',wallModule(8)],['wall-6',wallModule(6)],['door-frame-8',doorFrameModule()],['window-frame-8',windowFrameModule()],['roof-8x16',roofModule()]
]);

export const CLOSURES={
  door:{id:'door-leaf',kind:'closure',protocol:'hinge-fit',parts:[{file:'60616b.dat',color:4,t:[-32,24,-5],r:ID}],leakAfter:0,click:false,evidence:'60616b.dat HELP gives ±32 LDU X and 5 LDU Z relation to 60596 frame'},
  window:{id:'window-glass',kind:'closure',protocol:'glass-in-frame',parts:[{file:'60602.dat',color:47,t:[-20,48,0],r:ID},{file:'60602.dat',color:47,t:[20,48,0],r:ID}],leakAfter:0,click:false,evidence:'60593c01.dat places 60593.dat and 60602.dat at identical transforms'}
};

function wallSlot(id,side,center,width,type='wall'){
  const r=side==='front'?ID:side==='back'?RY180:side==='left'?RY90:RY270;
  const t=side==='front'?[center,HOUSE.wallTopY,-150]:side==='back'?[-center,HOUSE.wallTopY,150]:side==='left'?[-310,HOUSE.wallTopY,center]:[310,HOUSE.wallTopY,-center];
  return{id,category:'wall',side,center,width,type,state:'open',t,r,baseLeak:width*7,flowDir:side==='front'?[0,0,1]:side==='back'?[0,0,-1]:side==='left'?[1,0,0]:[-1,0,0]};
}
function roofSlot(id,center){return{id,category:'roof',side:'roof',center,width:8,type:'roof',state:'open',t:[center,HOUSE.roofTopY,0],r:ID,baseLeak:8*16,flowDir:[0,1,0]}}

export function makeSlots(){
  const slots=[];
  const frontTypes=['wall','door','window','wall'];
  const backTypes=['window','wall','wall','window'];
  [-240,-80,80,240].forEach((x,i)=>slots.push(wallSlot(`front-${i}`,'front',x,8,frontTypes[i])));
  [-240,-80,80,240].forEach((x,i)=>slots.push(wallSlot(`back-${i}`,'back',x,8,backTypes[i])));
  slots.push(wallSlot('left-a','left',-60,8,'wall'),wallSlot('left-b','left',80,6,'wall'),wallSlot('right-a','right',-60,8,'wall'),wallSlot('right-b','right',80,6,'wall'));
  [-240,-80,80,240].forEach((x,i)=>slots.push(roofSlot(`roof-${i}`,x)));
  return slots;
}

export function moduleForSlot(slot){
  if(slot.category==='roof')return MODULES.get('roof-8x16');
  if(slot.state==='framed')return slot.type==='door'?CLOSURES.door:CLOSURES.window;
  if(slot.type==='door')return MODULES.get('door-frame-8');
  if(slot.type==='window')return MODULES.get('window-frame-8');
  return MODULES.get(`wall-${slot.width}`);
}

export function leakOf(slot){
  if(slot.state==='sealed')return 0;
  if(slot.state==='framed')return slot.type==='door'?24:slot.type==='window'?12:slot.baseLeak;
  return slot.baseLeak;
}
export function totalLeak(slots){return slots.reduce((s,x)=>s+leakOf(x),0)}

export function baseplateSupports(){
  const out=[];for(let iz=0;iz<32;iz++)for(let ix=0;ix<32;ix++)out.push({id:`base-${ix}-${iz}`,owner:'BASE',p:[-310+ix*20,0,-310+iz*20],n:[0,-1,0],used:false,exact:true});return out;
}
export function instanceTopSupports(instance,module){return(module.topPorts||[]).map(p=>({id:`${instance.id}:${p.id}`,owner:instance.id,p:transformPoint(instance,p.p),n:transformVector(instance,p.n),used:false,exact:true}))}

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function contactSet(instance,module,supports){
  if(module.kind==='closure')return[];
  const contacts=[],used=new Set();
  for(const bp of module.bottomPorts||[]){
    const p=transformPoint(instance,bp.p),n=transformVector(instance,bp.n);
    const candidates=supports.filter(s=>!s.used&&!used.has(s.id)&&dist(s.p,p)<.001&&dot(s.n,n)<-.999999);
    if(candidates.length){const s=candidates[0];used.add(s.id);contacts.push({support:s,port:bp,p,positionError:dist(s.p,p),normalDot:dot(s.n,n),click:true})}
  }
  return contacts;
}
export function canSeat(instance,module,supports){
  if(module.kind==='closure')return{ok:true,contacts:[],protocol:module.protocol,click:false};
  const contacts=contactSet(instance,module,supports),need=module.minContacts||1;
  return{ok:contacts.length>=need,contacts,need,protocol:'stud-clutch',click:true};
}

export function commitModule(slot,module,supports,instances){
  if(module.kind==='closure'){
    const inst={id:`${slot.id}:${module.id}`,moduleId:module.id,t:[...slot.t],r:[...slot.r],closure:true,kind:module.kind,parts:module.parts,protocol:module.protocol};instances.push(inst);slot.state='sealed';return{instance:inst,contacts:[],clicks:0,seal:true};
  }
  const inst={id:`${slot.id}:${module.id}`,moduleId:module.id,t:[...slot.t],r:[...slot.r],kind:module.kind,parts:module.parts};
  const seat=canSeat(inst,module,supports);if(!seat.ok)return null;
  for(const c of seat.contacts)c.support.used=true;
  instances.push(inst);supports.push(...instanceTopSupports(inst,module));
  if(slot.type==='door'||slot.type==='window')slot.state='framed';else slot.state='sealed';
  return{instance:inst,contacts:seat.contacts,clicks:seat.contacts.length,seal:false};
}

export function actionable(slot,supports){
  if(slot.state==='sealed')return null;
  const module=moduleForSlot(slot);
  if(module.kind==='closure')return{slot,module,seat:{ok:true,contacts:[],click:false}};
  const inst={id:`probe:${slot.id}`,t:slot.t,r:slot.r};
  const seat=canSeat(inst,module,supports);return seat.ok?{slot,module,seat}:null;
}

export function flatten(instances){
  const out=[{file:'3811.dat',color:2,t:[0,0,0],r:ID,label:'REAL 32x32 BASEPLATE'}];
  for(const inst of instances)for(const p of inst.parts||[]){const q=compose(inst,p);out.push({file:p.file,color:p.color??16,t:q.t,r:q.r,label:inst.moduleId})}
  return out;
}
export function toLDraw(instances,title='BEAVER-WATER-HOUSE'){
  const fmt=n=>Math.abs(n)<1e-9?'0':Number(n.toFixed(6)).toString(),lines=[`0 ${title}`,`0 Name: ${title}.mpd`,`0 !LDRAW_ORG Model`,`0 // 32x16 stud, seven-brick envelope. Water leak field drives assembly.`];
  for(const p of flatten(instances))lines.push(`1 ${p.color} ${fmt(p.t[0])} ${fmt(p.t[1])} ${fmt(p.t[2])} ${p.r.map(fmt).join(' ')} ${p.file}`);
  return lines.join('\n')+'\n';
}

export function leakPoint(slot){
  if(slot.category==='roof')return[slot.center,HOUSE.roofTopY-24,0];
  const y=slot.state==='framed'?(slot.type==='door'?-72:-84):-84;
  if(slot.side==='front')return[slot.center,y,-174];
  if(slot.side==='back')return[-slot.center,y,174];
  if(slot.side==='left')return[-334,y,slot.center];
  return[334,y,-slot.center];
}

export function simulateAll(){
  const slots=makeSlots(),supports=baseplateSupports(),instances=[];let moves=0,clicks=0;
  while(totalLeak(slots)>0&&moves<100){
    const ranked=slots.filter(s=>leakOf(s)>0).sort((a,b)=>leakOf(b)-leakOf(a));
    let choice=null;for(const slot of ranked){const a=actionable(slot,supports);if(a){choice=a;break}}
    if(!choice)break;
    const rec=commitModule(choice.slot,choice.module,supports,instances);if(!rec)break;moves++;clicks+=rec.clicks;
  }
  return{slots,supports,instances,moves,clicks,leak:totalLeak(slots)};
}

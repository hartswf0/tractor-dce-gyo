export const ID=[1,0,0,0,1,0,0,0,1];
export const RY90=[0,0,1,0,1,0,-1,0,0];
export const RY180=[-1,0,0,0,1,0,0,0,-1];
export const RY270=[0,0,-1,0,1,0,1,0,0];

export const DESIGN={
  name:'COURTYARD ATELIER',
  site:'32×32 baseplate',
  ground:'24×16 studs · 6 bricks high',
  upper:'16×8 studs · 4 bricks high',
  principle:'No structural part is committed until its own receivers find live studs below. Water, gravity, access, guard and vent signals remain active until their local condition is closed.'
};

const S=i=>-310+i*20;
const C=(a,b)=>(S(a)+S(b))/2;
const key=(x,y,z)=>`${Math.round(x*1000)}|${Math.round(y*1000)}|${Math.round(z*1000)}`;
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const PART={1:{file:'3005.dat',name:'Brick 1 x 1'},2:{file:'3004.dat',name:'Brick 1 x 2'},4:{file:'3010.dat',name:'Brick 1 x 4'},6:{file:'3009.dat',name:'Brick 1 x 6'},8:{file:'3008.dat',name:'Brick 1 x 8'}};
let serial=0;

function rectCells(ix0,ix1,iz0,iz1,y){const out=[];for(let ix=ix0;ix<=ix1;ix++)for(let iz=iz0;iz<=iz1;iz++)out.push([S(ix),y,S(iz)]);return out}
function actionBase(o){return{placed:false,requires:[],signal:'WATER',severity:50,weight:1,color:15,...o,id:o.id||`a${++serial}`}}
function rectPart({id,file,name,ix0,ix1,iz0,iz1,topY,height,r=ID,color=15,minContacts,signal='WATER',severity=50,weight=1,label,requires=[],minSpread=0}){
  const bottomY=topY+height,bottom=rectCells(ix0,ix1,iz0,iz1,bottomY),top=rectCells(ix0,ix1,iz0,iz1,topY);
  return actionBase({id,file,name,t:[C(ix0,ix1),topY,C(iz0,iz1)],r,color,bottom,top,minContacts:minContacts??bottom.length,minSpread,signal,severity,weight,label,requires,kind:'structure'});
}
function lineBrick({id,axis,start,end,fixed,course,baseY=0,color=15,signal='WATER',severity=70,weight=1,label,minContacts,minSpread}){
  const len=end-start+1,p=PART[len];if(!p)throw new Error(`No 1x${len} brick`);const topY=baseY-course*24;
  return axis==='x'?rectPart({id,file:p.file,name:p.name,ix0:start,ix1:end,iz0:fixed,iz1:fixed,topY,height:24,r:ID,color,signal,severity,weight,label,minContacts,minSpread}):rectPart({id,file:p.file,name:p.name,ix0:fixed,ix1:fixed,iz0:start,iz1:end,topY,height:24,r:RY90,color,signal,severity,weight,label,minContacts,minSpread});
}
function contiguous(values){if(!values.length)return[];const a=[...values].sort((x,y)=>x-y),out=[];let s=a[0],p=a[0];for(let i=1;i<a.length;i++){if(a[i]===p+1){p=a[i];continue}out.push([s,p]);s=p=a[i]}out.push([s,p]);return out}
function tileSegment(a,b,course){const out=[];let p=a;const order=course%2?[8,6,4,2,1]:[4,8,6,2,1];while(p<=b){let n=order.find(x=>p+x-1<=b);if(!n)n=1;out.push([p,p+n-1]);p+=n}return out}
function wallLine({side,course,baseY=0,ix0,ix1,iz0,iz1,holes=[],signal='WATER',severity=72,label='WALL',color=15}){
  let axis,fixed,vals;if(side==='front'||side==='back'){axis='x';fixed=side==='front'?iz0:iz1;vals=range(ix0,ix1)}else{axis='z';fixed=side==='left'?ix0:ix1;vals=range(iz0,iz1)}
  if(course%2===0&&(side==='front'||side==='back'))vals=vals.slice(1,-1);if(course%2===1&&(side==='left'||side==='right'))vals=vals.slice(1,-1);
  const blocked=new Set(holes.filter(h=>course>=h.from&&course<=h.to).flatMap(h=>range(h.a,h.b)));vals=vals.filter(v=>!blocked.has(v));const out=[];
  for(const [a,b] of contiguous(vals))for(const [s,e] of tileSegment(a,b,course)){const len=e-s+1,belowMissing=holes.some(h=>course===h.to+1&&!(e<h.a||s>h.b)),min=belowMissing?Math.max(2,Math.ceil(len/2)):len,spread=belowMissing?(len-2)*20:0;out.push(lineBrick({axis,start:s,end:e,fixed,course,baseY,color,signal,severity,weight:len,label:`${label} · ${side} · course ${course}`,minContacts:min,minSpread:spread}))}
  return out;
}
function windowFrame({id,side,a,b,bottomY,ix0,ix1,iz0,iz1,label='WINDOW FRAME'}){
  let t,r,bottom,top;if(side==='front'){t=[C(a,b),bottomY-72,S(iz0)];r=ID;bottom=rectCells(a,b,iz0,iz0,bottomY);top=rectCells(a,b,iz0,iz0,bottomY-72)}if(side==='back'){t=[C(a,b),bottomY-72,S(iz1)];r=RY180;bottom=rectCells(a,b,iz1,iz1,bottomY);top=rectCells(a,b,iz1,iz1,bottomY-72)}if(side==='left'){t=[S(ix0),bottomY-72,C(a,b)];r=RY90;bottom=rectCells(ix0,ix0,a,b,bottomY);top=rectCells(ix0,ix0,a,b,bottomY-72)}if(side==='right'){t=[S(ix1),bottomY-72,C(a,b)];r=RY270;bottom=rectCells(ix1,ix1,a,b,bottomY);top=rectCells(ix1,ix1,a,b,bottomY-72)}
  return actionBase({id,file:'60593.dat',name:'Window 1 x 2 x 3',t,r,color:71,bottom,top,minContacts:2,signal:'STRUCTURE',severity:83,weight:2,label,kind:'structure'});
}
function closure({id,file,name,parentId,t,r,color,signal='WATER',severity=105,weight=18,label,requires=[]}){return actionBase({id,file,name,t,r,color,requires:parentId?[parentId,...requires]:requires,bottom:[],top:[],minContacts:0,signal,severity,weight,label,kind:'closure'})}
function doorFrame({id='door-frame',ix0=14,ix1=17,iz=8,topY=-144,requires=[]}){return actionBase({id,file:'60596.dat',name:'Door 1 x 4 x 6 Frame',t:[C(ix0,ix1),topY,S(iz)],r:ID,color:71,bottom:[],top:[],minContacts:0,signal:'ACCESS',severity:80,weight:8,label:'FRONT DOOR FRAME',kind:'closure',requires})}
function plate48({id,ix0,ix1,iz0,iz1,topY,signal='WATER',severity=100,weight=32,label='ROOF / FLOOR',color=4,minContacts=7}){return rectPart({id,file:'3035.dat',name:'Plate 4 x 8',ix0,ix1,iz0,iz1,topY,height:8,r:RY90,color,signal,severity,weight,label,minContacts,minSpread:120})}
function columnBrick({id,ix0,iz0,course}){return rectPart({id,file:'3003.dat',name:'Brick 2 x 2',ix0,ix1:ix0+1,iz0,iz1:iz0+1,topY:-24*course,height:24,color:71,signal:'RAIN_ENTRY',severity:50,weight:2,label:`PORCH COLUMN · ${course}`,minContacts:4})}

export function makePlan(){
  serial=0;const actions=[];const G={ix0:4,ix1:27,iz0:8,iz1:23};
  const groundOpen={front:[{a:14,b:17,from:1,to:5},{a:8,b:9,from:2,to:4},{a:22,b:23,from:2,to:4}],back:[{a:9,b:10,from:2,to:4},{a:20,b:21,from:2,to:4}],left:[{a:14,b:15,from:2,to:4}],right:[{a:17,b:18,from:2,to:4}]};
  for(let course=1;course<=6;course++)for(const side of ['front','back','left','right']){const holes=side==='front'&&course===6?[...groundOpen.front,{a:12,b:19,from:6,to:6}]:groundOpen[side];actions.push(...wallLine({side,course,...G,holes,severity:78,label:'GROUND ENVELOPE'}))}
  actions.push(lineBrick({id:'front-door-lintel',axis:'x',start:12,end:19,fixed:8,course:6,color:15,signal:'GRAVITY',severity:101,weight:8,label:'FRONT DOOR LINTEL · spans both jambs',minContacts:4,minSpread:140}));

  const coreHole=[{a:14,b:17,from:1,to:5}];
  for(let course=1;course<=6;course++)for(const z of [15,16]){
    const vals=range(5,26).filter(x=>!coreHole.some(h=>course>=h.from&&course<=h.to&&x>=h.a&&x<=h.b)&&!(course===6&&x>=12&&x<=19));
    for(const [a,b] of contiguous(vals))for(const [s,e] of tileSegment(a,b,course)){const len=e-s+1;actions.push(lineBrick({axis:'x',start:s,end:e,fixed:z,course,color:71,signal:'GRAVITY',severity:86,weight:len,label:`BEARING SPINE z${z} · course ${course}`,minContacts:len}))}
    if(course===6)actions.push(lineBrick({id:`core-lintel-${z}`,axis:'x',start:12,end:19,fixed:z,course,color:71,signal:'GRAVITY',severity:102,weight:8,label:`BEARING SPINE LINTEL z${z} · support both sides`,minContacts:4,minSpread:140}));
  }

  const windows=[['gw-front-L','front',8,9],['gw-front-R','front',22,23],['gw-back-L','back',9,10],['gw-back-R','back',20,21],['gw-left','left',14,15],['gw-right','right',17,18]];
  for(const [id,side,a,b] of windows){const f=windowFrame({id:`${id}-frame`,side,a,b,bottomY:-24,...G,label:`GROUND ${side.toUpperCase()} WINDOW FRAME`});actions.push(f);actions.push(closure({id:`${id}-glass`,file:'60602.dat',name:'Window Glass 1 x 2 x 3',parentId:f.id,t:[...f.t],r:[...f.r],color:47,label:`GROUND ${side.toUpperCase()} WINDOW GLASS`,weight:22}))}
  const df=doorFrame({requires:['front-door-lintel']});actions.push(df);actions.push(closure({id:'door-leaf',file:'60616b.dat',name:'Door 1 x 4 x 6',parentId:df.id,t:[C(14,17)-32,-120,S(8)-5],r:ID,color:4,signal:'WATER',severity:112,weight:36,label:'FRONT DOOR LEAF'}));

  for(let x=4;x<=24;x+=4)actions.push(plate48({id:`terrace-roof-${x}`,ix0:x,ix1:x+3,iz0:8,iz1:15,topY:-152,signal:'WATER',severity:118,weight:42,label:'GROUND ROOF / TERRACE'}));
  for(let x=4;x<=24;x+=4)actions.push(plate48({id:`upper-floor-${x}`,ix0:x,ix1:x+3,iz0:16,iz1:23,topY:-152,signal:'GRAVITY',severity:96,weight:20,label:'SECOND-STORY FLOOR'}));

  const U={ix0:8,ix1:23,iz0:16,iz1:23},upperBase=-152,upperOpen={front:[{a:11,b:12,from:2,to:4},{a:19,b:20,from:2,to:4}],back:[{a:15,b:16,from:2,to:4}],left:[{a:19,b:20,from:2,to:4}],right:[{a:19,b:20,from:2,to:4}]};
  for(let course=1;course<=4;course++)for(const side of ['front','back','left','right'])actions.push(...wallLine({side,course,baseY:upperBase,...U,holes:upperOpen[side],severity:88,label:'UPPER ENVELOPE',color:15}));
  const uw=[['uw-front-L','front',11,12],['uw-front-R','front',19,20],['uw-back','back',15,16],['uw-left','left',19,20],['uw-right','right',19,20]];
  for(const [id,side,a,b] of uw){const f=windowFrame({id:`${id}-frame`,side,a,b,bottomY:upperBase-24,...U,label:`UPPER ${side.toUpperCase()} WINDOW FRAME`});actions.push(f);actions.push(closure({id:`${id}-glass`,file:'60602.dat',name:'Window Glass 1 x 2 x 3',parentId:f.id,t:[...f.t],r:[...f.r],color:47,label:`UPPER ${side.toUpperCase()} WINDOW GLASS`,weight:24,severity:115}))}
  for(let x=8;x<=20;x+=4)actions.push(plate48({id:`upper-roof-${x}`,ix0:x,ix1:x+3,iz0:16,iz1:23,topY:-256,signal:'WATER',severity:125,weight:55,label:'UPPER ROOF',minContacts:8,color:4}));

  const P={ix0:4,ix1:27,iz0:8,iz1:15};for(const side of ['front','left','right'])actions.push(...wallLine({side,course:1,baseY:-152,...P,holes:[],signal:'GUARD',severity:62,label:'TERRACE PARAPET',color:71}));
  for(const [s,e] of tileSegment(4,7,1))actions.push(lineBrick({axis:'x',start:s,end:e,fixed:15,course:1,baseY:-152,color:71,signal:'GUARD',severity:62,weight:e-s+1,label:'TERRACE REAR GUARD',minContacts:e-s+1}));for(const [s,e] of tileSegment(24,27,1))actions.push(lineBrick({axis:'x',start:s,end:e,fixed:15,course:1,baseY:-152,color:71,signal:'GUARD',severity:62,weight:e-s+1,label:'TERRACE REAR GUARD',minContacts:e-s+1}));

  for(const [x,z] of [[12,4],[18,4],[12,6],[18,6]])for(let course=1;course<=4;course++)actions.push(columnBrick({id:`porch-col-${x}-${z}-${course}`,ix0:x,iz0:z,course}));
  actions.push(rectPart({id:'porch-canopy',file:'3035.dat',name:'Plate 4 x 8',ix0:12,ix1:19,iz0:4,iz1:7,topY:-104,height:8,r:ID,color:4,signal:'RAIN_ENTRY',severity:74,weight:28,label:'PORCH CANOPY',minContacts:16,minSpread:120}));
  actions.push(rectPart({id:'porch-step-1',file:'3020.dat',name:'Plate 2 x 4',ix0:14,ix1:17,iz0:2,iz1:3,topY:-8,height:8,r:ID,color:71,signal:'ACCESS',severity:45,weight:4,label:'ENTRY STEP',minContacts:8}));actions.push(rectPart({id:'porch-step-2',file:'3710.dat',name:'Plate 1 x 4',ix0:14,ix1:17,iz0:3,iz1:3,topY:-16,height:8,r:ID,color:71,signal:'ACCESS',severity:46,weight:4,label:'ENTRY STEP',minContacts:4}));

  for(let course=1;course<=3;course++)actions.push(rectPart({id:`chimney-${course}`,file:'3003.dat',name:'Brick 2 x 2',ix0:20,ix1:21,iz0:20,iz1:21,topY:-256-course*24,height:24,color:1,signal:'VENT',severity:48,weight:4,label:`CHIMNEY · course ${course}`,minContacts:4}));actions.push(rectPart({id:'chimney-cap',file:'3022.dat',name:'Plate 2 x 2',ix0:20,ix1:21,iz0:20,iz1:21,topY:-336,height:8,color:1,signal:'VENT',severity:49,weight:4,label:'CHIMNEY CAP',minContacts:4}));
  return actions;
}

export function baseSupports(){const m=new Map();for(let ix=0;ix<32;ix++)for(let iz=0;iz<32;iz++){const p=[S(ix),0,S(iz)];m.set(key(...p),{id:`base-${ix}-${iz}`,p,owner:'3811.dat',used:false})}return m}
function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])}
export function seat(action,supports){if(action.kind==='closure')return{ok:true,contacts:[],need:0,protocol:'fit/hinge',click:false};const contacts=[];for(const p of action.bottom){const s=supports.get(key(...p));if(s&&!s.used)contacts.push(s)}const need=action.minContacts??action.bottom.length;if(contacts.length<need)return{ok:false,contacts,need,reason:`contacts ${contacts.length}/${need}`};if(action.minSpread>0){let spread=0;for(let i=0;i<contacts.length;i++)for(let j=i+1;j<contacts.length;j++)spread=Math.max(spread,distance(contacts[i].p,contacts[j].p));if(spread<action.minSpread)return{ok:false,contacts,need,spread,reason:`support spread ${spread.toFixed(1)} < ${action.minSpread}`}}return{ok:true,contacts,need,protocol:'stud-clutch',click:true}}
export function canAct(action,state){if(action.placed)return null;if(action.requires?.some(id=>!state.placedIds.has(id)))return null;const s=seat(action,state.supports);return s.ok?{action,seat:s}:null}
export function commit(action,state){const proposal=canAct(action,state);if(!proposal)return null;const s=proposal.seat;if(action.kind!=='closure'){for(const c of s.contacts)c.used=true;for(const p of action.top){const k=key(...p);if(state.supports.has(k)&&!state.supports.get(k).used)throw new Error(`Duplicate live stud ${k} from ${action.id}`);state.supports.set(k,{id:`${action.id}:${k}`,p,owner:action.id,used:false})}}action.placed=true;state.placedIds.add(action.id);state.placements.push(action);return{action,contacts:s.contacts,clicks:s.click?s.contacts.length:0,protocol:s.protocol}}
export function stateFor(actions=makePlan()){return{actions,supports:baseSupports(),placedIds:new Set(),placements:[]}}
export function unresolved(state){return state.actions.filter(a=>!a.placed)}
export function signalLoad(state,signal=null){return unresolved(state).filter(a=>!signal||a.signal===signal).reduce((n,a)=>n+a.weight,0)}
export function hear(state){const open=unresolved(state).sort((a,b)=>b.severity-a.severity||b.weight-a.weight);const raw=open[0]||null;let choice=null;for(const a of open){const p=canAct(a,state);if(p){choice=p;break}}return{open,raw,choice}}
export function simulate(actions=makePlan(),limit=1000){const state=stateFor(actions);let moves=0,clicks=0;while(unresolved(state).length&&moves<limit){const h=hear(state);if(!h.choice)break;const r=commit(h.choice.action,state);moves++;clicks+=r.clicks}return{state,moves,clicks,remaining:unresolved(state),water:signalLoad(state,'WATER')}}
export function toLDraw(state,title='BEAVER-COMPLEX-HOUSE'){const fmt=n=>Math.abs(n)<1e-9?'0':Number(n.toFixed(6)).toString(),lines=[`0 ${title}`,`0 Name: ${title}.mpd`,`0 !LDRAW_ORG Model`,`0 // Piece-level Beaver house: every structural placement passed the live-support gate.`,`1 2 0 0 0 1 0 0 0 1 0 0 0 1 3811.dat`];for(const a of state.placements){lines.push(`0 STEP`);lines.push(`0 // ${a.signal} · ${a.label} · ${a.id}`);lines.push(`1 ${a.color??16} ${fmt(a.t[0])} ${fmt(a.t[1])} ${fmt(a.t[2])} ${a.r.map(fmt).join(' ')} ${a.file}`)}return lines.join('\n')+'\n'}

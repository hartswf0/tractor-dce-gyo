import * as core from './model-final.js';
export * from './model-final.js';

export const THRUST_TARGETS=['T|port|28','T|port|36','T|starboard|28','T|starboard|36'];
const X=i=>-630+i*20,Z=i=>-310+i*20;
const cells=(a,b,y)=>Array.from({length:b-a+1},(_,j)=>[X(a+j),y,Z(21)]);
const cover=(a,b)=>Array.from({length:b-a+1},(_,j)=>`P|starboard|7|${a+j}`);

function starboardTopSegment({id,file,name,a,b,minContacts=b-a+1,minSpread=0,severity=112,weight=b-a+1,label}){
  return {
    placed:false,requires:[],anchors:[],signal:'PRESSURE',severity,weight,color:15,cover:cover(a,b),kind:'structure',
    id,file,name,t:[(X(a)+X(b))/2,-272,Z(21)],r:core.ID,
    bottom:cells(a,b,-248),top:cells(a,b,-272),minContacts,minSpread,
    label
  };
}

export function makePlan(){
  const source=core.makePlan();
  const remove=new Set(['hull-starboard-7-26','hull-starboard-7-32']);
  const plan=source.filter(a=>!remove.has(a.id));
  if(source.filter(a=>remove.has(a.id)).length!==2)throw new Error('Expected bonded starboard top-course segments were not generated');

  plan.push(
    starboardTopSegment({id:'airlock-jamb-cap-left',file:'3622.dat',name:'Brick 1 x 3',a:26,b:28,label:'AIRLOCK LEFT JAMB CAP'}),
    starboardTopSegment({id:'airlock-lintel',file:'3008.dat',name:'Brick 1 x 8',a:29,b:36,minContacts:4,minSpread:140,severity:176,weight:24,label:'AIRLOCK LINTEL · SPANS BOTH JAMBS'}),
    starboardTopSegment({id:'airlock-jamb-cap-right',file:'3005.dat',name:'Brick 1 x 1',a:37,b:37,label:'AIRLOCK RIGHT JAMB CAP'})
  );

  for(const side of ['port','starboard'])for(const x of [28,36]){
    const engine=plan.find(a=>a.id===`${side}-engine-${x}-3`);
    if(!engine)throw new Error(`Missing final engine stage ${side}-${x}`);
    engine.cover=[...(engine.cover||[]),`T|${side}|${x}`];
  }
  return plan;
}

export const stateFor=(plan=makePlan())=>core.stateFor(plan);
export const thrustMissing=state=>THRUST_TARGETS.filter(k=>!state.covers.has(k));
export const simulate=(plan=makePlan(),limit=5000)=>{
  const state=stateFor(plan);let moves=0;
  while(moves<limit){const h=core.hear(state);if(!h.raw||!h.choice)break;core.commit(h.choice.action,state);moves++}
  return{state,moves,remaining:core.unresolved(state),clicks:state.clicks,pressureMissing:core.pressureMissing(state),thrustMissing:thrustMissing(state)};
};

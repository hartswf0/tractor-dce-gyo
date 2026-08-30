import * as core from './model-final.js';
export * from './model-final.js';

export function makePlan(){
  const plan=core.makePlan();
  const i=plan.findIndex(a=>a.id==='hull-starboard-7-28');
  if(i<0)throw new Error('Expected starboard airlock lintel segment was not generated');
  const old=plan[i];
  plan[i]={...old,id:'airlock-lintel',minContacts:4,minSpread:140,severity:176,weight:24,label:'AIRLOCK LINTEL · REAL 1×8 BRICK · BOTH JAMBS'};
  return plan;
}

export const stateFor=(plan=makePlan())=>core.stateFor(plan);
export const simulate=(plan=makePlan(),limit=5000)=>{
  const state=stateFor(plan);let moves=0;
  while(moves<limit){const h=core.hear(state);if(!h.raw||!h.choice)break;core.commit(h.choice.action,state);moves++}
  return{state,moves,remaining:core.unresolved(state),clicks:state.clicks,pressureMissing:core.pressureMissing(state)};
};

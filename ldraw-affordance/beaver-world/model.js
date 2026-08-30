import {PARTS,CHALLENGES,TOKENS} from './atlas.js';

export function makeState(challengeKey='flood_depot',vocabMode='all',seed=1){
  const challenge=CHALLENGES[challengeKey]||CHALLENGES.flood_depot;
  const vocab=selectVocabulary(vocabMode,seed);
  return{
    challengeKey,challenge,vocabMode,seed,vocab,
    used:[],provided:new Set(),events:[],step:0,blocked:false,quiet:false
  };
}

function rng(seed){let x=seed|0;return()=>{x=(x*1664525+1013904223)|0;return((x>>>0)/4294967296)}}
export function selectVocabulary(mode='all',seed=1){
  if(mode==='all')return [...PARTS];
  if(mode==='no_buildings')return PARTS.filter(p=>!['BUILDING_MODULE','ROOF_SHELL','WALL_PANEL','POD_SHELL','GLAZED_SHELL'].includes(p.class));
  if(mode==='no_bridges')return PARTS.filter(p=>!p.class.includes('BRIDGE'));
  if(mode==='no_site')return PARTS.filter(p=>!p.class.startsWith('SITE_'));
  if(mode==='random18'){
    const r=rng(seed),a=[...PARTS];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,18);
  }
  return [...PARTS];
}

export function signalStates(state){
  return state.challenge.signals.map(([label,weight,needs],index)=>{
    const remaining=needs.filter(t=>!state.provided.has(t));
    return{index,label,weight,needs,remaining,solved:remaining.length===0,severity:weight*(remaining.length/needs.length)};
  }).sort((a,b)=>b.severity-a.severity||a.index-b.index);
}

function requirementsMet(part,state){return(part.requires||[]).every(id=>state.used.some(p=>p.id===id))}
export function scorePart(part,state){
  if(state.used.some(p=>p.id===part.id)||!requirementsMet(part,state))return null;
  const tokens=TOKENS(part),signals=signalStates(state).filter(s=>!s.solved);
  let gain=0,hits=[];
  for(const s of signals){
    const covered=s.remaining.filter(t=>tokens.has(t));
    if(covered.length){const g=s.weight*(covered.length/s.needs.length);gain+=g;hits.push({label:s.label,tokens:covered,gain:g})}
  }
  if(gain<=0)return null;
  const compression=(part.c||0)*.22,quality=(part.q||0)*.14,attention=(part.a||0)*.16;
  const score=gain+compression+quality+attention;
  return{part,score,gain,hits,tokens:[...tokens]};
}

export function candidates(state){return state.vocab.map(p=>scorePart(p,state)).filter(Boolean).sort((a,b)=>b.score-a.score||b.gain-a.gain||a.part.id.localeCompare(b.part.id))}
export function hear(state){
  const signals=signalStates(state),loudest=signals.find(s=>!s.solved)||null,cands=candidates(state),best=cands[0]||null;
  return{signals,loudest,candidates:cands,best};
}

export function step(state){
  if(state.quiet||state.blocked)return{state,event:null};
  const h=hear(state);
  if(!h.loudest){state.quiet=true;const event={type:'QUIET',step:state.step,text:'All current world signals are quiet.'};state.events.push(event);return{state,event}}
  if(!h.best){state.blocked=true;const event={type:'BLOCKED',step:state.step,signal:h.loudest,text:`Still hear ${h.loudest.label}: missing ${h.loudest.remaining.join(' + ')}`};state.events.push(event);return{state,event}}
  const pick=h.best,part=pick.part;state.used.push(part);for(const t of TOKENS(part))state.provided.add(t);state.step++;
  const event={type:'SET',step:state.step,part,score:pick.score,gain:pick.gain,hits:pick.hits,text:`${part.id} ${part.name}`};state.events.push(event);
  if(signalStates(state).every(s=>s.solved))state.quiet=true;
  return{state,event};
}

export function run(state,max=64){let last=null;for(let i=0;i<max&&!state.quiet&&!state.blocked;i++)last=step(state).event;return{state,last}}

export function coverage(state){const signals=signalStates(state),done=signals.filter(s=>s.solved).length;return{done,total:signals.length,ratio:signals.length?done/signals.length:1,remaining:signals.filter(s=>!s.solved)}}

export function benchmark(){
  const results=[];
  for(const key of Object.keys(CHALLENGES))for(const mode of ['all','no_buildings','no_bridges','random18']){
    const state=makeState(key,mode,17);run(state);const cov=coverage(state);results.push({key,mode,quiet:state.quiet,blocked:state.blocked,parts:state.used.length,done:cov.done,total:cov.total,remaining:cov.remaining.map(x=>x.label)});
  }
  return results;
}

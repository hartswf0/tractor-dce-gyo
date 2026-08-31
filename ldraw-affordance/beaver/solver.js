import {loadIndex,compatibility,snapChild,transformPoint,transformVector,ID} from '../src/engine.js';
import {physicalHandshake,auditAssembly} from './handshake.js';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const volume=p=>(p.dims||[99,99,99]).reduce((a,b)=>a*b,1);

export function prepareLibrary(source,overrides={}){
  const library=structuredClone(source);
  for(const [id,patches] of Object.entries(overrides.parts||{})){
    const part=library.parts.find(p=>p.id===id);if(!part)continue;
    if(patches.replacePorts)part.ports=structuredClone(patches.replacePorts);
    for(const [portId,patch] of Object.entries(patches)){
      if(portId==='replacePorts')continue;
      const port=part.ports.find(p=>p.id===portId);if(port)Object.assign(port,structuredClone(patch));
    }
  }
  return library;
}

export function strictRules(source){
  const rules=structuredClone(source);
  rules.clickPositionTolerance=.001;
  rules.clickLateralTolerance=.001;
  rules.clickAxialTolerance=.001;
  rules.clickNormalTolerance=.999999;
  return rules;
}

export function createSolver({library:librarySource,rules:rulesSource,overrides={},field,vocabMode='full'}){
  const library=prepareLibrary(librarySource,overrides),rules=strictRules(rulesSource),index=loadIndex(library);
  const state={field:structuredClone(field),assembly:[],completed:new Set(),rejected:new Set(),stats:{tries:0,rejected:0,clicks:0,placements:0,audits:0},last:null};
  const partOf=inst=>index.get(inst.partId);
  const isUsed=(inst,id)=>(inst.usedPorts||[]).includes(id);
  const usePort=(inst,id)=>{inst.usedPorts??=[];if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)};
  const unusePort=(inst,id)=>{inst.usedPorts=(inst.usedPorts||[]).filter(x=>x!==id)};
  const disabled=part=>{
    const ops=part.operators||[],tags=part.tags||[];
    if(vocabMode==='no-snot'&&ops.includes('TURN_PLANE_90'))return true;
    if(vocabMode==='no-offset'&&(ops.includes('OFFSET_HALF_STUD')||part.family==='offset'))return true;
    if(vocabMode==='no-technic'&&(tags.includes('technic')||part.family==='bridge'||part.family==='connector'))return true;
    if(vocabMode==='matter-only'&&!['matter','resolution'].includes(part.family))return true;
    return false;
  };
  const actionSig=a=>`${a.cue.feature.id}|${a.parentInst.uid}|${a.parentPort.id}|${a.part.id}|${a.childPort.id}|${a.outputPort?.id||''}`;

  function makeSeeds(){
    const seeds=state.field.seeds||[state.field.seed];
    state.assembly=seeds.filter(Boolean).map((s,i)=>({uid:`seed-${i}`,partId:s.partId,t:s.t||[0,0,0],r:s.r||ID,usedPorts:[...(s.usedPorts||[])],color:s.color??16,label:s.label||'SUBSTRATE',parent:null,seed:true}));
  }
  function reset(){state.completed=new Set();state.rejected=new Set();state.stats={tries:0,rejected:0,clicks:0,placements:0,audits:0};state.last=null;makeSeeds();return hear()}
  function openPorts(){
    const out=[];
    for(const inst of state.assembly){
      if(inst.provisional)continue;
      for(const port of partOf(inst).ports)if(!isUsed(inst,port.id))out.push({inst,port,p:transformPoint(inst,port.p),n:transformVector(inst,port.n)});
    }
    return out;
  }
  function matchingOpenPort(spec){
    let best=null;
    for(const row of openPorts()){
      if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;
      const d=dist(row.p,spec.p),nd=dot(row.n,spec.n),score=d+(1-nd)*100;
      if(!best||score<best.score)best={...row,d,nd,score};
    }
    return best&&best.d<=(spec.tolerance??.05)&&best.nd>.999?best:null;
  }
  function featureState(feature){
    if(state.completed.has(feature.id))return{solved:true,feature};
    const port=matchingOpenPort(feature.prerequisite);
    if(feature.completion.kind==='port')return port?{solved:true,feature,port}:{solved:false,stage:'expose',feature};
    return port?{solved:false,stage:'mate',feature,port}:{solved:false,stage:'expose',feature};
  }
  function hear(){
    const states=state.field.features.map(featureState),unresolved=states.filter(x=>!x.solved).sort((a,b)=>b.feature.severity-a.feature.severity);
    return{states,unresolved,strongest:unresolved[0]||null};
  }
  function outputError(inst,port,spec){
    if(port.type!==spec.type||port.gender!==spec.gender||port.confidence!=='exact')return Infinity;
    const p=transformPoint(inst,port.p),n=transformVector(inst,port.n);
    return dist(p,spec.p)+(1-dot(n,spec.n))*100;
  }
  function signalCoverage(probe,part){
    if(state.field.objective!=='bonded')return 1;
    let covered=0;
    for(const out of part.ports){
      if(out.type!=='stud'||out.gender!=='male'||out.confidence!=='exact')continue;
      const p=transformPoint(probe,out.p),n=transformVector(probe,out.n);
      for(const feature of state.field.features){
        if(state.completed.has(feature.id))continue;
        const spec=feature.prerequisite;
        if(spec.type!=='stud'||spec.gender!=='male')continue;
        if(dist(p,spec.p)<=(spec.tolerance??.05)&&dot(n,spec.n)>.999){covered++;break}
      }
    }
    return Math.max(1,covered);
  }
  function potentialSecondaryContacts(probe,part,primaryParent,primaryChildPortId,rows){
    if(state.field.objective!=='bonded')return 0;
    const usedChild=new Set([primaryChildPortId]),usedParent=new Set([`${primaryParent.inst.uid}|${primaryParent.port.id}`]);
    let count=0;
    for(const cp of part.ports){
      if(usedChild.has(cp.id))continue;
      for(const row of rows){
        const key=`${row.inst.uid}|${row.port.id}`;if(usedParent.has(key))continue;
        const connection=compatibility(row.port,cp,rules);if(!connection)continue;
        const test=physicalHandshake(row.inst,row.port,probe,cp,connection,rules);
        if(!test.ok||!test.clickable)continue;
        usedChild.add(cp.id);usedParent.add(key);count++;break;
      }
    }
    return count;
  }
  function candidateForExpose(cue){
    const spec=cue.feature.prerequisite,candidates=[],allOpen=openPorts(),tol=spec.tolerance??.05,maxReach=state.field.maxReach??140;
    const parents=allOpen.filter(row=>dist(row.p,spec.p)<=maxReach);
    for(const parent of parents)for(const part of library.parts){
      if(disabled(part))continue;
      for(const cp of part.ports){
        const connection=compatibility(parent.port,cp,rules);if(!connection)continue;
        const snap=snapChild(parent.inst,parent.port,part,cp,connection);if(!snap)continue;
        const probe={uid:'probe',partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]},incoming=physicalHandshake(parent.inst,parent.port,probe,cp,connection,rules);
        if(!incoming.ok)continue;
        for(const out of part.ports){
          if(out.id===cp.id)continue;
          const error=outputError(probe,out,spec);if(!Number.isFinite(error)||error>tol)continue;
          const operatorBonus=(part.operators||[]).some(op=>(spec.operatorHint||'').includes(op))?-1000:0;
          const secondary=potentialSecondaryContacts(probe,part,parent,cp.id,allOpen),contacts=1+secondary,coverage=signalCoverage(probe,part);
          const physicalCost=state.field.objective==='bonded'?volume(part)/(coverage*coverage*contacts)+volume(part)*1e-6:volume(part);
          const score=error*1e6+physicalCost+operatorBonus,a={kind:'expose',cue,parentInst:parent.inst,parentPort:parent.port,part,childPort:cp,outputPort:out,connection,snap,incoming,error,score,potentialContacts:contacts,signalCoverage:coverage};
          if(!state.rejected.has(actionSig(a)))candidates.push(a);
        }
      }
    }
    candidates.sort((a,b)=>a.score-b.score);
    return candidates[0]||null;
  }
  function candidateForMate(cue){
    const target=cue.port,prefer=cue.feature.completion.preferFamily,candidates=[];
    for(const part of library.parts){
      if(disabled(part))continue;
      for(const cp of part.ports){
        const connection=compatibility(target.port,cp,rules);if(!connection)continue;
        const snap=snapChild(target.inst,target.port,part,cp,connection);if(!snap)continue;
        const probe={uid:'probe',partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]},incoming=physicalHandshake(target.inst,target.port,probe,cp,connection,rules);
        if(!incoming.ok)continue;
        const score=volume(part)+(part.family===prefer?0:1e8),a={kind:'mate',cue,parentInst:target.inst,parentPort:target.port,part,childPort:cp,connection,snap,incoming,error:0,score};
        if(!state.rejected.has(actionSig(a)))candidates.push(a);
      }
    }
    candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null;
  }
  const chooseAction=cue=>cue?(cue.stage==='mate'?candidateForMate(cue):candidateForExpose(cue)):null;

  function secondaryContacts(child){
    const out=[],childPart=partOf(child);
    for(const other of state.assembly){
      if(other===child||other.provisional)continue;
      const otherPart=partOf(other);
      for(const op of otherPart.ports){
        if(isUsed(other,op.id))continue;
        for(const cp of childPart.ports){
          if(isUsed(child,cp.id))continue;
          const connection=compatibility(op,cp,rules);if(!connection)continue;
          const test=physicalHandshake(other,op,child,cp,connection,rules);
          if(!test.ok||!test.clickable)continue;
          out.push({parentUid:other.uid,parentPortId:op.id,childPortId:cp.id,connection,test});usePort(other,op.id);usePort(child,cp.id);break;
        }
      }
    }
    return out;
  }
  function rollback(child,action){
    for(const rec of child.secondaryJoints||[]){const parent=state.assembly.find(x=>x.uid===rec.parentUid);if(parent)unusePort(parent,rec.parentPortId)}
    state.assembly=state.assembly.filter(x=>x.uid!==child.uid);unusePort(action.parentInst,action.parentPort.id);state.rejected.add(actionSig(action));state.stats.rejected++;
  }
  function commitAction(action){
    state.stats.tries++;
    const child={uid:`part-${state.stats.tries}-${state.assembly.length}`,partId:action.part.id,t:[...action.snap.t],r:action.snap.r,usedPorts:[action.childPort.id],color:16,label:`response:${action.cue.feature.id}`,parent:action.parentInst.uid,secondaryJoints:[],jointRecord:{parentPortId:action.parentPort.id,childPortId:action.childPort.id,connection:action.connection}};
    state.assembly.push(child);usePort(action.parentInst,action.parentPort.id);
    const final=physicalHandshake(action.parentInst,action.parentPort,child,action.childPort,action.connection,rules);
    if(!final.ok){rollback(child,action);return{ok:false,reason:final.reason,action,final}}
    child.secondaryJoints=secondaryContacts(child);
    state.stats.audits++;const audit=auditAssembly(state.assembly,index,rules);
    if(!audit.ok){const bad=audit.joints.find(x=>!x.test.ok);rollback(child,action);return{ok:false,reason:bad?.test.reason||'audit',action,final,audit}}
    const contacts=1+child.secondaryJoints.length;state.stats.placements++;state.stats.clicks+=contacts;if(action.kind==='mate')state.completed.add(action.cue.feature.id);
    state.last={action,child,contacts,audit};return{ok:true,action,child,contacts,audit,final};
  }
  function step(){
    state.stats.audits++;const before=auditAssembly(state.assembly,index,rules);
    if(!before.ok)return{status:'blocked',reason:'existing-handshake',audit:before};
    const h=hear();if(!h.strongest)return{status:'complete',hear:h};
    const action=chooseAction(h.strongest);if(!action)return{status:'blocked',reason:'no-verified-response',hear:h,cue:h.strongest};
    const result=commitAction(action);return result.ok?{status:'acted',...result,hear:hear()}:{status:'retry',...result,hear:hear()};
  }
  function run(max=300){
    let result=null,moves=0;
    while(moves<max){result=step();if(result.status==='retry')continue;if(result.status!=='acted')break;moves++}
    const h=hear();return{result,moves,quiet:!h.strongest,remaining:h.unresolved.map(x=>x.feature.id),state};
  }

  reset();
  return{library,rules,index,state,reset,openPorts,featureState,hear,chooseAction,step,run,audit:()=>auditAssembly(state.assembly,index,rules),partOf};
}

export function loadIndex(library){ return new Map(library.parts.map(p=>[p.id,p])); }
export function keyPort(p){ return `${p.type}:${p.gender}`; }
export function oppositeGender(a,b){ return (a==='male'&&b==='female')||(a==='female'&&b==='male')||a==='neutral'||b==='neutral'; }
export function compatibility(pa,pb,rules){
  const rule=rules.rules.find(r=>{
    const ab=r.a.type===pa.type&&r.a.gender===pa.gender&&r.b.type===pb.type&&r.b.gender===pb.gender;
    const ba=r.a.type===pb.type&&r.a.gender===pb.gender&&r.b.type===pa.type&&r.b.gender===pa.gender;
    return ab||ba;
  });
  if(!rule || !oppositeGender(pa.gender,pb.gender)) return null;
  const conf=rules.confidenceTax||{};
  return {joint:rule.joint,normalRelation:rule.normalRelation||'opposed',motion:rule.motion||'seat',approach:rule.approach||12,tax:rule.baseTax+(conf[pa.confidence]||0)+(conf[pb.confidence]||0)};
}
export function allOperators(parts){ return new Set(parts.flatMap(p=>p.operators||[])); }
export function allPortTypes(parts){ return new Set(parts.flatMap(p=>p.ports||[]).map(p=>p.type)); }
export function taskPass(task,parts){
  const ops=allOperators(parts), ports=allPortTypes(parts);
  if(task.requiresOperators && !task.requiresOperators.every(x=>ops.has(x))) return false;
  if(task.requiresAnyOperators && !task.requiresAnyOperators.some(x=>ops.has(x))) return false;
  if(task.requiresPortTypes && !task.requiresPortTypes.every(x=>ports.has(x))) return false;
  return true;
}
export function scoreSuite(tasks,parts){let got=0,total=0;const results=[];for(const t of tasks.tasks){const w=t.weight||1;total+=w;const pass=taskPass(t,parts);if(pass)got+=w;results.push({...t,pass})}return{got,total,ratio:total?got/total:0,results}}
export function ablation(tasks,library){const base=scoreSuite(tasks,library.parts);return library.parts.map(part=>{const reduced=library.parts.filter(p=>p.id!==part.id),s=scoreSuite(tasks,reduced);return{id:part.id,name:part.name,loss:base.got-s.got,ratioLoss:base.total?(base.got-s.got)/base.total:0}}).sort((a,b)=>b.loss-a.loss||a.id.localeCompare(b.id))}
export function varietyScore(part){const pt=new Set(part.ports.map(p=>p.type)),bridge=(part.tags||[]).includes('adapter')?3:0,orient=(part.operators||[]).filter(x=>/TURN|OFFSET|CHANGE_COORDINATE/.test(x)).length,kinetic=(part.operators||[]).filter(x=>/ROTATION|JOIN|RETAIN|LOCK/.test(x)).length,redundancy=(part.tags||[]).includes('redundant-length')?2:0;return 3*pt.size+3*orient+3*bridge+2*kinetic+(part.operators||[]).length-redundancy}

const ORIENTATIONS=(()=>{const axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mats=[];for(const x of axes)for(const y of axes){if(dot(x,y)!==0)continue;const z=cross(x,y);if(z.every(v=>v===0))continue;mats.push([x,y,z])}return mats.map(cols=>[cols[0][0],cols[1][0],cols[2][0],cols[0][1],cols[1][1],cols[2][1],cols[0][2],cols[1][2],cols[2][2]])})();
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]],add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),neg=a=>a.map(x=>-x),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
export const ID=[1,0,0,0,1,0,0,0,1];
export function transformPoint(inst,p){return add(inst.t,mv(inst.r,p))}
export function transformVector(inst,v){return mv(inst.r,v)}
export function seamTargetNormal(parentInst,parentPort,childPort,connection){const pn=transformVector(parentInst,parentPort.n);if(connection?.normalRelation==='insert')return childPort.gender==='male'?pn:neg(pn);return connection?.normalRelation==='same'?pn:neg(pn)}
export function snapChild(parentInst,parentPort,childPart,childPort,connection={normalRelation:'opposed'}){const desired=seamTargetNormal(parentInst,parentPort,childPort,connection),pup=transformVector(parentInst,parentPort.up||[0,0,-1]);let best=null;for(const r of ORIENTATIONS){const cn=mv(r,childPort.n),cup=mv(r,childPort.up||[0,0,-1]);if(dot(cn,desired)<0.999)continue;const upScore=dot(cup,pup);if(!best||upScore>best.upScore)best={r,upScore}}if(!best)return null;const target=transformPoint(parentInst,parentPort.p),childOffset=mv(best.r,childPort.p);return{partId:childPart.id,t:sub(target,childOffset),r:best.r}}
export function inspectSeam(parentInst,parentPort,childInst,childPort,connection,rules={}){const a=transformPoint(parentInst,parentPort.p),b=transformPoint(childInst,childPort.p),posError=len(sub(a,b)),targetN=seamTargetNormal(parentInst,parentPort,childPort,connection),childN=transformVector(childInst,childPort.n),normalDot=dot(targetN,childN),positionTolerance=rules.positionTolerance??0.01,normalTolerance=rules.normalTolerance??0.999,ok=posError<=positionTolerance&&normalDot>=normalTolerance;let confidence='CLICKED';if([parentPort.confidence,childPort.confidence].includes('approx'))confidence='CALIBRATE';else if([parentPort.confidence,childPort.confidence].includes('semantic'))confidence='INFERRED';return{posError,normalDot,ok,status:ok?confidence:'OPEN'}}
export function bestConnection(parentInst,parentPart,parentPortId,childPart,rules){const pp=parentPart.ports.find(p=>p.id===parentPortId);if(!pp)return null;const candidates=[];for(const cp of childPart.ports){const c=compatibility(pp,cp,rules);if(c)candidates.push({cp,c})}candidates.sort((a,b)=>a.c.tax-b.c.tax);for(const chosen of candidates){const snapped=snapChild(parentInst,pp,childPart,chosen.cp,chosen.c);if(!snapped)continue;const childInst={partId:childPart.id,t:snapped.t,r:snapped.r},seam=inspectSeam(parentInst,pp,childInst,chosen.cp,chosen.c,rules);if(seam.ok)return{...snapped,parentPortId,childPortId:chosen.cp.id,...chosen.c,seam}}return null}
export function findCoincidentConnections(assembly,childInst,index,rules){const childPart=index.get(childInst.partId),out=[];if(!childPart)return out;const childUsed=new Set(childInst.usedPorts||[]);for(const other of assembly){if(other===childInst)continue;const otherPart=index.get(other.partId);if(!otherPart)continue;const otherUsed=new Set(other.usedPorts||[]);for(const pp of otherPart.ports){if(otherUsed.has(pp.id))continue;for(const cp of childPart.ports){if(childUsed.has(cp.id))continue;const c=compatibility(pp,cp,rules);if(!c)continue;const seam=inspectSeam(other,pp,childInst,cp,c,rules);if(seam.ok)out.push({other,pp,cp,connection:c,seam})}}}return out}
export function seamLeakSeries(assembly,repeatFloor=.15){const seen=new Map(),out=[];for(const x of assembly){const raw=x.seamTax||x.tax||0;if(!raw){out.push({...x,rawLeak:0,effectiveLeak:0,repeatIndex:0});continue}const key=x.leakKey||x.joint||'seam',n=(seen.get(key)||0)+1;seen.set(key,n);const multiplier=n===1?1:Math.max(repeatFloor,1/n);out.push({...x,rawLeak:raw,effectiveLeak:raw*multiplier,repeatIndex:n})}return out}
export function seamTax(assembly,repeatFloor=.15){return seamLeakSeries(assembly,repeatFloor).reduce((s,x)=>s+x.effectiveLeak,0)}
export function toLDraw(assembly,index,title='AFFORDANCE-BENCH'){const fmt=n=>Math.abs(n)<1e-9?'0':Number(n.toFixed(6)).toString(),out=[`0 ${title}`,`0 Name: ${title}.mpd`,`0 !LDRAW_ORG Model`,`0 // generated by LDraw Affordance API`];for(const inst of assembly){const p=index.get(inst.partId),m=inst.r||ID,t=inst.t||[0,0,0],colour=Number.isFinite(inst.color)?inst.color:16;out.push(`1 ${colour} ${fmt(t[0])} ${fmt(t[1])} ${fmt(t[2])} ${m.map(fmt).join(' ')} ${p.file}`)}return out.join('\n')+'\n'}

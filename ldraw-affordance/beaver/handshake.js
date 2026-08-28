import {transformPoint,transformVector} from '../src/engine.js';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const len=a=>Math.hypot(...a);
const scale=(a,s)=>a.map(x=>x*s);

export function physicalHandshake(parentInst,parentPort,childInst,childPort,connection,rules={}){
  const protocol=connection?.joint||'unknown';
  const result={
    ok:false,
    clickable:false,
    protocol,
    state:'REJECT',
    reason:'UNKNOWN',
    positionError:Infinity,
    lateralError:Infinity,
    axialError:Infinity,
    normalDot:0
  };

  if(!parentPort||!childPort){result.reason='MISSING_PORT';return result}
  if(parentPort.type!==childPort.type){result.reason='TYPE_MISMATCH';return result}
  if(parentPort.confidence!=='exact'||childPort.confidence!=='exact'){
    result.reason='UNCALIBRATED_DATUM';return result;
  }

  const a=transformPoint(parentInst,parentPort.p);
  const b=transformPoint(childInst,childPort.p);
  const pn=transformVector(parentInst,parentPort.n);
  const cn=transformVector(childInst,childPort.n);
  const delta=sub(b,a);
  const axial=dot(delta,pn);
  const lateralVec=sub(delta,scale(pn,axial));
  result.positionError=len(delta);
  result.axialError=Math.abs(axial);
  result.lateralError=len(lateralVec);
  result.normalDot=dot(pn,cn);

  // We only certify the physical protocol we actually model correctly.
  // A stud click means seating planes coincide and axes oppose.
  if(parentPort.type==='stud'){
    const genders=new Set([parentPort.gender,childPort.gender]);
    if(!(genders.has('male')&&genders.has('female'))){result.reason='STUD_GENDER';return result}
    const posTol=rules.clickPositionTolerance??0.001;
    const lateralTol=rules.clickLateralTolerance??0.001;
    const axialTol=rules.clickAxialTolerance??0.001;
    const normalTol=rules.clickNormalTolerance??0.999999;
    if(result.lateralError>lateralTol){result.reason='LATERAL_MISS';return result}
    if(result.axialError>axialTol){result.reason='NOT_SEATED';return result}
    if(result.positionError>posTol){result.reason='POSITION_MISS';return result}
    if(result.normalDot>-normalTol){result.reason='AXIS_MISS';return result}
    result.ok=true;
    result.clickable=true;
    result.state='CLICK';
    result.reason='STUD_SEATED';
    return result;
  }

  // Pin and axle need insertion depth, not point coincidence. Until that
  // protocol exists, they may be advertised by the library but cannot pass.
  if(parentPort.type==='pin'||parentPort.type==='axle'){
    result.reason='INSERTION_DEPTH_UNMODELED';
    result.state='BLOCKED';
    return result;
  }

  result.reason='PROTOCOL_UNMODELED';
  return result;
}

export function auditAssembly(assembly,index,rules={}){
  const byUid=new Map(assembly.map(x=>[x.uid,x]));
  const joints=[];
  let ok=true;
  for(const child of assembly){
    if(!child.parent||!child.jointRecord)continue;
    const parent=byUid.get(child.parent);
    const parentPart=parent&&index.get(parent.partId);
    const childPart=index.get(child.partId);
    const pp=parentPart?.ports.find(p=>p.id===child.jointRecord.parentPortId);
    const cp=childPart?.ports.find(p=>p.id===child.jointRecord.childPortId);
    const test=physicalHandshake(parent,pp,child,cp,child.jointRecord.connection,rules);
    joints.push({child,parent,test,record:child.jointRecord});
    if(!test.ok)ok=false;
  }
  return{ok,joints};
}

export function handshakeSummary(test){
  if(!test)return'NO TEST';
  const p=n=>Number.isFinite(n)?n.toFixed(4):'∞';
  return`${test.state} · ${test.reason} · lateral ${p(test.lateralError)} · axial ${p(test.axialError)} · normal ${p(test.normalDot)}`;
}

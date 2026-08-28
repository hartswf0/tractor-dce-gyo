import {transformPoint,transformVector} from '../src/engine.js';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const len=a=>Math.hypot(...a);
const scale=(a,s)=>a.map(x=>x*s);

export function physicalHandshake(parentInst,parentPort,childInst,childPort,connection,rules={}){
  const protocol=connection?.joint||'unknown';
  const result={ok:false,clickable:false,protocol,state:'REJECT',reason:'UNKNOWN',positionError:Infinity,lateralError:Infinity,axialError:Infinity,normalDot:0};
  if(!parentPort||!childPort){result.reason='MISSING_PORT';return result}
  if(parentPort.type!==childPort.type){result.reason='TYPE_MISMATCH';return result}
  if(parentPort.confidence!=='exact'||childPort.confidence!=='exact'){result.reason='UNCALIBRATED_DATUM';return result}

  const a=transformPoint(parentInst,parentPort.p),b=transformPoint(childInst,childPort.p);
  const pn=transformVector(parentInst,parentPort.n),cn=transformVector(childInst,childPort.n);
  const delta=sub(b,a),axial=dot(delta,pn),lateralVec=sub(delta,scale(pn,axial));
  result.positionError=len(delta);result.axialError=Math.abs(axial);result.lateralError=len(lateralVec);result.normalDot=dot(pn,cn);

  // Only a protocol we physically model can pass. For now that is stud clutch.
  if(parentPort.type==='stud'){
    const genders=new Set([parentPort.gender,childPort.gender]);
    if(!(genders.has('male')&&genders.has('female'))){result.reason='STUD_GENDER';return result}
    const posTol=rules.clickPositionTolerance??0.001,lateralTol=rules.clickLateralTolerance??0.001,axialTol=rules.clickAxialTolerance??0.001,normalTol=rules.clickNormalTolerance??0.999999;
    if(result.lateralError>lateralTol){result.reason='LATERAL_MISS';return result}
    if(result.axialError>axialTol){result.reason='NOT_SEATED';return result}
    if(result.positionError>posTol){result.reason='POSITION_MISS';return result}
    if(result.normalDot>-normalTol){result.reason='AXIS_MISS';return result}
    result.ok=true;result.clickable=true;result.state='CLICK';result.reason='STUD_SEATED';return result;
  }

  // Pin and axle need insertion depth, not endpoint coincidence.
  if(parentPort.type==='pin'||parentPort.type==='axle'){
    result.reason='INSERTION_DEPTH_UNMODELED';result.state='BLOCKED';return result;
  }
  result.reason='PROTOCOL_UNMODELED';return result;
}

function auditRecord(parent,child,record,index,rules){
  const parentPart=parent&&index.get(parent.partId),childPart=index.get(child.partId);
  const pp=parentPart?.ports.find(p=>p.id===record.parentPortId),cp=childPart?.ports.find(p=>p.id===record.childPortId);
  const test=physicalHandshake(parent,pp,child,cp,record.connection,rules);
  return{child,parent,test,record};
}

export function auditAssembly(assembly,index,rules={}){
  const byUid=new Map(assembly.map(x=>[x.uid,x])),joints=[];let ok=true;
  for(const child of assembly){
    if(child.parent&&child.jointRecord){
      const row=auditRecord(byUid.get(child.parent),child,child.jointRecord,index,rules);joints.push(row);if(!row.test.ok)ok=false;
    }
    for(const record of child.secondaryJoints||[]){
      const row=auditRecord(byUid.get(record.parentUid),child,record,index,rules);joints.push(row);if(!row.test.ok)ok=false;
    }
  }
  return{ok,joints};
}

export function handshakeSummary(test){
  if(!test)return'NO TEST';
  const p=n=>Number.isFinite(n)?n.toFixed(4):'∞';
  return`${test.state} · ${test.reason} · lateral ${p(test.lateralError)} · axial ${p(test.axialError)} · normal ${p(test.normalDot)}`;
}

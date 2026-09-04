import fs from 'node:fs';
import {loadIndex,compatibility,snapChild,transformPoint,transformVector,ID} from '../src/engine.js';
import {physicalHandshake,auditAssembly} from '../beaver/handshake.js';

const read=url=>JSON.parse(fs.readFileSync(new URL(url,import.meta.url),'utf8'));
const library=read('../library/core.json');
const rules=read('../library/compatibility.json');
const overrides=read('../library/seam-overrides.json');
for(const [id,patches] of Object.entries(overrides.parts||{})){
  const part=library.parts.find(p=>p.id===id);if(!part)continue;
  if(patches.replacePorts)part.ports=patches.replacePorts;
  for(const [portId,patch] of Object.entries(patches)){
    if(portId==='replacePorts')continue;
    const port=part.ports.find(p=>p.id===portId);if(port)Object.assign(port,patch);
  }
}
rules.clickPositionTolerance=.001;
rules.clickLateralTolerance=.001;
rules.clickAxialTolerance=.001;
rules.clickNormalTolerance=.999999;
const index=loadIndex(library);
const near=(a,b,eps=1e-9)=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<=eps);
const port=(part,id)=>index.get(part).ports.find(p=>p.id===id);
let n=0;const uid=()=>`t${++n}`;const assembly=[];
function addSeed(){const x={uid:uid(),partId:'3020',t:[0,0,0],r:ID,usedPorts:[],parent:null};assembly.push(x);return x}
function use(x,id){if(!x.usedPorts.includes(id))x.usedPorts.push(id)}
function attach(parent,parentPortId,partId,childPortId){const pp=port(parent.partId,parentPortId),cp=port(partId,childPortId),part=index.get(partId),connection=compatibility(pp,cp,rules);if(!connection)throw new Error(`no compatibility ${parent.partId}.${parentPortId} -> ${partId}.${childPortId}`);const snap=snapChild(parent,pp,part,cp,connection);if(!snap)throw new Error('snap failed');const child={uid:uid(),partId,t:snap.t,r:snap.r,usedPorts:[childPortId],parent:parent.uid,jointRecord:{parentPortId,childPortId,connection},secondaryJoints:[]};const test=physicalHandshake(parent,pp,child,cp,connection,rules);if(!test.ok)throw new Error(`handshake failed ${partId}: ${test.reason}`);use(parent,parentPortId);assembly.push(child);const audit=auditAssembly(assembly,index,rules);if(!audit.ok)throw new Error(`audit failed after ${partId}`);return child}
function addSecondary(parent,parentPortId,child,childPortId){const pp=port(parent.partId,parentPortId),cp=port(child.partId,childPortId),connection=compatibility(pp,cp,rules);if(!connection)throw new Error('secondary compatibility failed');const test=physicalHandshake(parent,pp,child,cp,connection,rules);if(!test.ok)throw new Error(`secondary handshake failed: ${test.reason}`);use(parent,parentPortId);use(child,childPortId);child.secondaryJoints.push({parentUid:parent.uid,parentPortId,childPortId,connection});const audit=auditAssembly(assembly,index,rules);if(!audit.ok)throw new Error('audit failed after secondary contact');return test}

const seed=addSeed();
const snot=attach(seed,'top-0','4070','bottom');
attach(snot,'front','3024','bottom');
const jumper=attach(seed,'top-1','15573','bottom-l');
addSecondary(seed,'top-2',jumper,'bottom-r');
attach(jumper,'top-center','3005','bottom');
const gateway=attach(seed,'top-6','3700','bottom-l');
addSecondary(seed,'top-7',gateway,'bottom-r');

const snotPort=port('4070','front'),snotOut=transformPoint(snot,snotPort.p),snotN=transformVector(snot,snotPort.n);
if(!near(snotOut,[-30,-14,-16])||!near(snotN,[0,0,-1]))throw new Error(`SNOT output wrong ${JSON.stringify({snotOut,snotN})}`);
const jumperPort=port('15573','top-center'),jumperOut=transformPoint(jumper,jumperPort.p),jumperN=transformVector(jumper,jumperPort.n);
if(!near(jumperOut,[0,-8,-10])||!near(jumperN,[0,-1,0]))throw new Error('jumper releaser not silenced');
const holePort=port('3700','hole-front'),pinMouth=transformPoint(gateway,holePort.p),pinN=transformVector(gateway,holePort.n);
if(!near(pinMouth,[20,-14,0])||!near(pinN,[0,0,-1]))throw new Error('Technic socket datum wrong');

const audit=auditAssembly(assembly,index,rules);
if(!audit.ok)throw new Error('final audit failed');
if(audit.joints.length!==7)throw new Error(`expected 7 verified stud contacts, got ${audit.joints.length}`);

{
  const pp=port('3020','top-3'),cp=port('4070','bottom'),connection=compatibility(pp,cp,rules),snap=snapChild(seed,pp,index.get('4070'),cp,connection);
  const bad={uid:'bad',partId:'4070',t:[snap.t[0]+1,snap.t[1],snap.t[2]],r:snap.r,usedPorts:['bottom']};
  const test=physicalHandshake(seed,pp,bad,cp,connection,rules);if(test.ok)throw new Error('1 LDU miss falsely clicked');
}
{
  const pp=port('3020','top-3'),real=port('4070','bottom'),cp={...real,confidence:'semantic'},connection=compatibility(pp,cp,rules),snap=snapChild(seed,pp,index.get('4070'),cp,connection),probe={uid:'semantic',partId:'4070',t:snap.t,r:snap.r,usedPorts:['bottom']};
  const test=physicalHandshake(seed,pp,probe,cp,connection,rules);if(test.ok||test.reason!=='UNCALIBRATED_DATUM')throw new Error('semantic datum falsely certified');
}
{
  const pp=port('3700','hole-front'),cp=port('2780','a'),connection=compatibility(pp,cp,rules),snap=snapChild(gateway,pp,index.get('2780'),cp,connection),probe={uid:'pin',partId:'2780',t:snap.t,r:snap.r,usedPorts:['a']};
  const test=physicalHandshake(gateway,pp,probe,cp,connection,rules);if(test.ok||test.reason!=='INSERTION_DEPTH_UNMODELED')throw new Error('pin mouth touch falsely treated as insertion');
}

console.log(JSON.stringify({ok:true,parts:assembly.length,verifiedContacts:audit.joints.length,snotOut,jumperOut,pinMouth,negativeTests:['1 LDU miss rejected','semantic datum rejected','pin mouth touch rejected']},null,2));

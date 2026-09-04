// Geometry-backed connector extraction for the affordance library.
// The semantic API may propose a connection, but a stud click is valid only
// when its male port is backed by an actual LDraw stud primitive.

const MALE_STUD_PRIMITIVES=new Set(['stud.dat','stud2.dat','stud2a.dat']);
const normPath=s=>s.replaceAll('\\','/');
const baseName=s=>normPath(s).split('/').at(-1).toLowerCase();
const mv=(m,v)=>[
  m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
  m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
  m[6]*v[0]+m[7]*v[1]+m[8]*v[2]
];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mm=(a,b)=>[
  a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
const len=v=>Math.hypot(...v);
const unit=v=>{const l=len(v)||1;return v.map(x=>x/l)};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const ID=[1,0,0,0,1,0,0,0,1];

function parseType1(line){
  const s=line.trim().split(/\s+/);if(s[0]!=='1'||s.length<15)return null;
  return{
    t:[+s[2],+s[3],+s[4]],
    r:s.slice(5,14).map(Number),
    ref:normPath(s.slice(14).join(' '))
  };
}
function compose(parent,child){return{r:mm(parent.r,child.r),t:add(parent.t,mv(parent.r,child.t))}}
function sourceURL(base,kind,path){return`${base.replace(/\/$/,'')}/${kind}/${normPath(path)}`}

export class LDrawConnectorOracle{
  constructor(base='../../ldraw'){
    this.base=base;this.textCache=new Map();this.studCache=new Map();
  }
  async fetchText(kind,path){
    const key=`${kind}/${normPath(path)}`;if(this.textCache.has(key))return this.textCache.get(key);
    const r=await fetch(sourceURL(this.base,kind,path),{cache:'no-store'});
    if(!r.ok)throw new Error(`LDraw connector source ${r.status}: ${key}`);
    const text=await r.text();this.textCache.set(key,text);return text;
  }
  async studsForPart(file){
    const key=normPath(file);if(this.studCache.has(key))return this.studCache.get(key);
    const promise=this.walk('parts',key,{r:ID,t:[0,0,0]},new Set());this.studCache.set(key,promise);return promise;
  }
  async walk(kind,path,xf,stack){
    const stackKey=`${kind}/${normPath(path)}`;if(stack.has(stackKey))return[];
    const nextStack=new Set(stack);nextStack.add(stackKey);
    const text=await this.fetchText(kind,path),out=[];
    for(const line of text.split(/\r?\n/)){
      const sub=parseType1(line);if(!sub)continue;
      const childXF=compose(xf,sub),name=baseName(sub.ref);
      if(MALE_STUD_PRIMITIVES.has(name)){
        // All standard stud primitives originate at their seating/base plane and
        // grow along local -Y. Transform that physical axis into part space.
        out.push({primitive:name,p:[...childXF.t],n:unit(mv(childXF.r,[0,-1,0])),source:`${stackKey} -> ${sub.ref}`});
        continue;
      }
      // Recurse only through structural subparts and stud groups. This is enough
      // to reach the connector primitives without traversing the whole geometry tree.
      const ref=normPath(sub.ref),lower=name;
      if(ref.startsWith('s/')||lower.startsWith('stug')){
        const childKind=ref.startsWith('s/')?'parts':'p';
        try{out.push(...await this.walk(childKind,ref,childXF,nextStack))}catch(err){console.warn('[CONNECTOR ORACLE]',err.message)}
      }
    }
    return out;
  }
  async auditPart(part,posTol=.15,normalTol=.999){
    const studs=await this.studsForPart(part.file),rows=[];
    for(const port of part.ports||[]){
      if(port.type!=='stud'||port.gender!=='male')continue;
      let best=null;
      for(const stud of studs){const d=dist(port.p,stud.p),nd=dot(unit(port.n),unit(stud.n)),score=d+(1-nd)*100;if(!best||score<best.score)best={stud,d,nd,score}}
      rows.push({portId:port.id,ok:!!best&&best.d<=posTol&&best.nd>=normalTol,d:best?.d??Infinity,normalDot:best?.nd??-1,stud:best?.stud||null});
    }
    return{partId:part.id,studs,ports:rows,ok:rows.every(x=>x.ok)};
  }
}

export function transformedConnector(inst,local){return{p:add(inst.t,mv(inst.r,local.p)),n:unit(mv(inst.r,local.n))}}

export function verifyStudClick({parentInst,parentPort,childInst,childPort,parentAudit,childAudit,posTol=.05,normalTol=.999}){
  if(parentPort.type!=='stud'||childPort.type!=='stud')return{ok:false,reason:'not-stud-joint'};
  const maleIsParent=parentPort.gender==='male'&&childPort.gender==='female';
  const maleIsChild=childPort.gender==='male'&&parentPort.gender==='female';
  if(!maleIsParent&&!maleIsChild)return{ok:false,reason:'not-male-female'};
  const maleInst=maleIsParent?parentInst:childInst,malePort=maleIsParent?parentPort:childPort,maleAudit=maleIsParent?parentAudit:childAudit;
  const femaleInst=maleIsParent?childInst:parentInst,femalePort=maleIsParent?childPort:parentPort;
  const portAudit=maleAudit?.ports?.find(x=>x.portId===malePort.id);
  if(!portAudit?.ok)return{ok:false,reason:'male-port-not-backed-by-real-stud',audit:portAudit||null};
  if(femalePort.confidence!=='exact')return{ok:false,reason:'female-receiver-not-calibrated',confidence:femalePort.confidence||'unknown'};
  const maleReal=transformedConnector(maleInst,portAudit.stud),female=transformedConnector(femaleInst,femalePort);
  const d=dist(maleReal.p,female.p),nd=dot(maleReal.n,female.n);
  if(d>posTol)return{ok:false,reason:'stud-antistud-gap',distance:d,normalDot:nd,male:maleReal,female};
  if(nd>-normalTol)return{ok:false,reason:'stud-antistud-axis-mismatch',distance:d,normalDot:nd,male:maleReal,female};
  return{ok:true,reason:'physical-stud-antistud-contact',distance:d,normalDot:nd,male:maleReal,female,primitive:portAudit.stud.primitive,source:portAudit.stud.source};
}

import fs from 'node:fs';
import path from 'node:path';

const repo=process.cwd();
const ldraw=path.join(repo,'ldraw');
const suite=JSON.parse(fs.readFileSync(path.join(repo,'ldraw-affordance/tests/vignette-tests.json'),'utf8'));

const I=[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1];
function mul(A,B){const C=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)C[r*4+c]+=A[r*4+k]*B[k*4+c];return C}
function tx(M,p){const [x,y,z]=p;return[
  M[0]*x+M[1]*y+M[2]*z+M[3],
  M[4]*x+M[5]*y+M[6]*z+M[7],
  M[8]*x+M[9]*y+M[10]*z+M[11]
]}
function refMatrix(t){const [x,y,z,a,b,c,d,e,f,g,h,i]=t.slice(2,14).map(Number);return[a,b,c,x,d,e,f,y,g,h,i,z,0,0,0,1]}
function normName(s){return s.replaceAll('\\','/').replace(/^\.\//,'')}
function resolveFile(name,parent=null){
  name=normName(name);
  const c=[];
  if(parent)c.push(path.resolve(parent,name));
  c.push(path.join(ldraw,name),path.join(ldraw,'parts',name),path.join(ldraw,'p',name),path.join(ldraw,'parts','s',name),path.join(ldraw,'p','48',name));
  for(const p of c)if(fs.existsSync(p)&&fs.statSync(p).isFile())return p;
  return null;
}
function grow(box,p){for(let i=0;i<3;i++){box.min[i]=Math.min(box.min[i],p[i]);box.max[i]=Math.max(box.max[i],p[i])}}
function auditPart(id){
  const root=resolveFile(`${id}.dat`);if(!root)return{id,ok:false,error:'root missing',refs:0,vertices:0,unresolved:[`${id}.dat`]};
  const box={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let vertices=0,refs=0;const unresolved=[];
  function walk(file,M,stack,depth){
    if(depth>80){unresolved.push(`depth>${file}`);return}
    const dir=path.dirname(file),lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
    for(const raw of lines){const s=raw.trim();if(!s||s.startsWith('0 '))continue;const t=s.split(/\s+/),typ=t[0];
      if(typ==='1'&&t.length>=15){refs++;const name=t.slice(14).join(' '),child=resolveFile(name,dir);if(!child){unresolved.push(name);continue}const real=fs.realpathSync(child);if(stack.includes(real))continue;walk(child,mul(M,refMatrix(t)),[...stack,real],depth+1)}
      else if(['2','3','4','5'].includes(typ)){const nums=t.slice(2).map(Number);for(let i=0;i+2<nums.length;i+=3){const p=tx(M,[nums[i],nums[i+1],nums[i+2]]);grow(box,p);vertices++}}
    }
  }
  walk(root,I,[fs.realpathSync(root)],0);
  const finite=box.min.every(Number.isFinite)&&box.max.every(Number.isFinite),size=finite?box.max.map((x,i)=>x-box.min[i]):[0,0,0];
  return{id,ok:finite&&vertices>0&&unresolved.length===0,refs,vertices,unresolved:[...new Set(unresolved)].slice(0,30),bbox:box,size};
}
const audits=new Map();function audit(id){if(!audits.has(id))audits.set(id,auditPart(id));return audits.get(id)}
function source(id){const p=resolveFile(`${id}.dat`);return p?fs.readFileSync(p,'utf8'):''}

async function assertion(a,test){
  if(a.kind==='geometryNonEmpty'){
    const rows=test.parts.map(p=>audit(p.id)),ok=rows.every(r=>r.ok);return{label:a.label,ok,detail:rows.map(r=>`${r.id}:${r.vertices}v/${r.unresolved.length} unresolved`).join(' · ')}
  }
  if(a.kind==='sourceContains'){
    const ok=source(a.part).includes(a.text);return{label:a.label,ok,detail:ok?`found ${JSON.stringify(a.text)}`:`missing ${JSON.stringify(a.text)}`}
  }
  if(a.kind==='referenceCountAtLeast'){
    const n=source(a.part).split(/\r?\n/).filter(x=>/^1\s/.test(x.trim())).length,ok=n>=a.value;return{label:a.label,ok,detail:`${n} top-level type-1 refs; need >=${a.value}`}
  }
  if(a.kind==='reciprocalHelp'){
    const ab=source(a.a).includes(`${a.b}.dat`),ba=source(a.b).includes(`${a.a}.dat`),ok=ab&&ba;return{label:a.label,ok,detail:`${a.a}->${a.b}:${ab} ${a.b}->${a.a}:${ba}`}
  }
  if(a.kind==='bboxXZApprox'){
    const rows=a.parts.map(id=>audit(id)),ok=rows.every(r=>r.ok&&Math.abs(r.size[0]-a.x)<=a.tolerance&&Math.abs(r.size[2]-a.z)<=a.tolerance);return{label:a.label,ok,detail:rows.map(r=>`${r.id}:${r.size[0].toFixed(1)}x${r.size[2].toFixed(1)}`).join(' ') + ` target ${a.x}x${a.z} +/-${a.tolerance}`}
  }
  if(a.kind==='gridPitch'){
    const k=a.axis==='y'?1:a.axis==='z'?2:0,vals=test.parts.map(p=>p.t[k]),gaps=vals.slice(1).map((v,i)=>v-vals[i]),ok=gaps.length>0&&gaps.every(g=>Math.abs(g-a.value)<=a.tolerance);return{label:a.label,ok,detail:`gaps ${gaps.join(', ')}; target ${a.value}`}
  }
  if(a.kind==='truthMustRemainOpen'){
    const ok=a.allowed.includes(test.truth);return{label:a.label,ok,detail:`truth=${test.truth}; allowed=${a.allowed.join('|')}`}
  }
  return{label:a.label,ok:false,detail:`unknown assertion ${a.kind}`}
}

const results=[];
for(const test of suite.tests){
  const checks=[];for(const a of test.assertions)checks.push(await assertion(a,test));const assertionsPass=checks.every(x=>x.ok);const outcome=assertionsPass?(test.expectedOutcome==='BLOCKED_AS_DESIGNED'?'BLOCKED_AS_DESIGNED':'PASS'):'FAIL';results.push({id:test.id,vignette:test.vignette,title:test.title,truth:test.truth,outcome,checks});
}
const valid=results.filter(r=>r.outcome==='PASS'||r.outcome==='BLOCKED_AS_DESIGNED').length;
const report={suite:suite.version,valid,total:results.length,results};
fs.writeFileSync(path.join(repo,'ldraw-affordance/tests/vignette-test-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(`ASSEMBLY VIGNETTES ${valid}/${results.length} VALIDATED`);
for(const r of results){console.log(`\n${r.outcome.padEnd(21)} ${r.id} ${r.title}`);for(const c of r.checks)console.log(`  ${c.ok?'PASS':'FAIL'} ${c.label} :: ${c.detail}`)}
if(valid!==results.length)process.exit(1);

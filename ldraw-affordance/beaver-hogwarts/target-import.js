const ID=[1,0,0,0,1,0,0,0,1];
const vadd=(a,b)=>a.map((x,i)=>x+b[i]);
const mv=(m,v)=>[
  m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
  m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
  m[6]*v[0]+m[7]*v[1]+m[8]*v[2]
];
const mm=(a,b)=>[
  a[0]*b[0]+a[1]*b[3]+a[2]*b[6],a[0]*b[1]+a[1]*b[4]+a[2]*b[7],a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
  a[3]*b[0]+a[4]*b[3]+a[5]*b[6],a[3]*b[1]+a[4]*b[4]+a[5]*b[7],a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
  a[6]*b[0]+a[7]*b[3]+a[8]*b[6],a[6]*b[1]+a[7]*b[4]+a[8]*b[7],a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
];
const compose=(parent,local)=>({r:mm(parent.r,local.r),t:vadd(parent.t,mv(parent.r,local.t))});
const cleanRef=s=>s.replace(/\\/g,'/').trim();
const key=s=>cleanRef(s).toLowerCase();
const stripDat=s=>cleanRef(s).replace(/^parts\//i,'').replace(/\.dat$/i,'');

export function parseType1(line){
  const p=line.trim().split(/\s+/);if(p[0]!=='1'||p.length<15)return null;
  const nums=p.slice(1,14).map(Number);if(nums.some(Number.isNaN))return null;
  return{
    color:nums[0],
    t:nums.slice(1,4),
    r:nums.slice(4,13),
    ref:cleanRef(p.slice(14).join(' '))
  };
}

export function parseLDrawSections(text,{name='MODEL.ldr'}={}){
  const sections=new Map();let current=null,first=null,implicit=[];
  const ensure=n=>{const k=key(n);if(!sections.has(k))sections.set(k,{name:n,rows:[],steps:0});return sections.get(k)};
  for(const raw of String(text).split(/\r?\n/)){
    const line=raw.trim();
    const fm=/^0\s+FILE\s+(.+)$/i.exec(line);
    if(fm){current=ensure(cleanRef(fm[1]));if(!first)first=current.name;continue}
    if(/^0\s+NOFILE\b/i.test(line)){current=null;continue}
    if(!current){implicit.push(raw);continue}
    if(/^0\s+STEP\b/i.test(line)){current.steps++;continue}
    const row=parseType1(line);if(row)current.rows.push({...row,step:current.steps});
  }
  if(!sections.size){current=ensure(name);first=current.name;current.rows=[];current.steps=0;for(const raw of implicit){const line=raw.trim();if(/^0\s+STEP\b/i.test(line)){current.steps++;continue}const row=parseType1(line);if(row)current.rows.push({...row,step:current.steps})}}
  return{sections,root:first||name};
}

export function flattenLDraw(text,{name='MODEL.ldr',maxDepth=128}={}){
  const {sections,root}=parseLDrawSections(text,{name}),placements=[];
  const walk=(sectionName,world,color=16,path=[],depth=0)=>{
    if(depth>maxDepth)throw new Error(`LDraw recursion depth > ${maxDepth}: ${sectionName}`);
    const section=sections.get(key(sectionName));if(!section)throw new Error(`Missing internal submodel: ${sectionName}`);
    const nextPath=[...path,key(sectionName)];if(path.includes(key(sectionName)))throw new Error(`Cyclic MPD reference: ${nextPath.join(' -> ')}`);
    for(const [i,row] of section.rows.entries()){
      const child=compose(world,{r:row.r,t:row.t}),childColor=row.color===16?color:row.color,internal=sections.has(key(row.ref));
      if(internal)walk(row.ref,child,childColor,nextPath,depth+1);
      else placements.push({
        uid:`ldraw-${placements.length}`,
        partId:stripDat(row.ref),color:childColor,t:child.t,r:child.r,
        source:{format:'ldraw',section:section.name,row:i,step:row.step,ref:row.ref,path:[...nextPath]}
      });
    }
  };
  walk(root,{r:ID,t:[0,0,0]});
  return{format:'ldraw',root,placements,sections:[...sections.values()].map(s=>({name:s.name,refs:s.rows.length,steps:s.steps})),calibration:'exact-ldraw'};
}

function mbxTransform(m){
  if(!Array.isArray(m)||m.length!==16||m.some(x=>!Number.isFinite(Number(x))))throw new Error('Mecabricks part matrix must contain 16 finite numbers');
  const a=m.map(Number),rM=[a[0],a[1],a[2],a[4],a[5],a[6],a[8],a[9],a[10]],f=[1,-1,1];
  const r=[...rM];for(let i=0;i<3;i++)for(let j=0;j<3;j++)r[i*3+j]=f[i]*rM[i*3+j]*f[j];
  return{r,t:[a[3]*2.5,-a[7]*2.5,a[11]*2.5],rawMatrix:a};
}

export function parseMbxScene(scene){
  const mbx=typeof scene==='string'?JSON.parse(scene):scene;if(!mbx||!Array.isArray(mbx.parts))throw new Error('Mecabricks scene.mbx has no parts[]');
  const placements=mbx.parts.map((part,i)=>{
    const config=mbx.configurations?.[String(part.version)]?.[part.configuration];
    const design=String(config?.name||part.configuration||'').trim();if(!design)throw new Error(`Mecabricks part ${i} has no configuration/design id`);
    const tr=mbxTransform(part.matrix),base=Array.isArray(part.material?.base)?part.material.base[0]:null;
    return{
      uid:`mbx-${i}`,partId:design.replace(/\.dat$/i,''),color:base,t:tr.t,r:tr.r,
      source:{format:'mecabricks-mbx',index:i,objectIndex:part.objectIndex,version:part.version,configuration:part.configuration,rawMatrix:tr.rawMatrix}
    };
  });
  return{
    format:'mecabricks-mbx',placements,metadata:mbx.metadata||null,
    calibration:'candidate-global-mm-to-ldu-only',
    warning:'Mecabricks uses its own part origins. partId and final pose are evidence, but a per-part Mecabricks↔LDraw conversion must be certified before Beaver may use these transforms for physical CLICK.'
  };
}

export function parseLxfml(xmlText){
  // Environment-neutral, deliberately narrow XML extraction. Browser callers may
  // use DOMParser too; this regex only reads Part/Bone records and is CI-testable.
  const text=String(xmlText),placements=[];
  const partRe=/<Part\b([^>]*)>([\s\S]*?)<\/Part>/gi;let m;
  const attr=(s,n)=>{const x=new RegExp(`${n}="([^"]*)"`,'i').exec(s);return x?.[1]??null};
  while((m=partRe.exec(text))){
    const attrs=m[1],body=m[2],design=attr(attrs,'designID'),materials=attr(attrs,'materials'),bone=/<Bone\b([^>]*)>/i.exec(body);if(!design||!bone)continue;
    const vals=(attr(bone[1],'transformation')||'').split(',').map(Number);if(vals.length!==12||vals.some(Number.isNaN))continue;
    placements.push({
      uid:`lxf-${placements.length}`,partId:design,color:materials?.split(',')[0]??null,
      // LDD stores a 3×3 basis followed by translation in millimetres.
      t:vals.slice(9,12),r:vals.slice(0,9),
      source:{format:'lxfml',refID:attr(attrs,'refID'),rawTransform:vals}
    });
  }
  return{
    format:'lxfml',placements,calibration:'ldd-native-mm',
    warning:'LDD and LDraw part origins/rotations differ. Apply ldraw.xml/lxf2ldr conversion data before treating these transforms as LDraw connector coordinates.'
  };
}

export function summarizeTarget(target){
  const counts=new Map();for(const p of target.placements)counts.set(p.partId,(counts.get(p.partId)||0)+1);
  return{format:target.format,placements:target.placements.length,uniqueParts:counts.size,parts:[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([partId,count])=>({partId,count})),calibration:target.calibration,warning:target.warning||null};
}

export const TARGET_IMPORT_VERSION='71043-target-1';

const ID=[1,0,0,0,1,0,0,0,1];
const port=(id,severity,label,p,operatorHint='EXTEND')=>({id,severity,label,prerequisite:{kind:'port',type:'stud',gender:'male',p,n:[0,-1,0],tolerance:.05,cry:label.toUpperCase(),operatorHint},completion:{kind:'port'}});
const range=(a,b,step=20)=>Array.from({length:Math.floor((b-a)/step)+1},(_,i)=>a+i*step);

function plateFoundation(nx,nz,{x0=0,z0=0,color=71}={}){
  const seeds=[];
  const xStart=x0-(nx-1)*40,zStart=z0-(nz-1)*20;
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++)seeds.push({partId:'3020',t:[xStart+ix*80,0,zStart+iz*40],r:ID,color,label:'EXISTING FOUNDATION'});
  return seeds;
}
function addLayer(features,cells,y,severity,label,operatorHint){
  let s=severity;
  for(const [x,z] of cells)features.push(port(`${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${x}-${z}-${Math.abs(y)}`,s--,`${label} · ${x},${z}`,[x,y,z],operatorHint));
  return s;
}
function rectangleCells(xs,zs){const out=[];for(const z of zs)for(const x of xs)out.push([x,z]);return out}
function bandCells(xs,zs,thickness=2){
  const out=[];
  for(let zi=0;zi<zs.length;zi++)for(let xi=0;xi<xs.length;xi++)if(xi<thickness||xi>=xs.length-thickness||zi<thickness||zi>=zs.length-thickness)out.push([xs[xi],zs[zi]]);
  return out;
}

function courtyardHouse(){
  const xs=range(-150,150),zs=range(-90,90),band=bandCells(xs,zs,2),features=[];
  let severity=20000;
  const isDoor=(x,z,c)=>c<=3&&[-10,10].includes(x)&&[-90,-70].includes(z);
  const isWindow=(x,z,c)=>{
    if(c<2||c>3)return false;
    const front=[-90,-70].includes(x)&&[-90,-70].includes(z);
    const backA=[70,90].includes(x)&&[70,90].includes(z);
    const backB=[-90,-70].includes(x)&&[70,90].includes(z);
    return front||backA||backB;
  };
  for(let c=1;c<=4;c++){
    const cells=band.filter(([x,z])=>!isDoor(x,z,c)&&!isWindow(x,z,c));
    severity=addLayer(features,cells,-24*c,severity,`WALL COURSE ${c}`,'EXTEND / SPAN / BRANCH')-50;
  }
  severity=addLayer(features,band,-104,severity,'ROOF RING','THIN / SPAN / BRANCH')-50;
  severity=addLayer(features,band,-128,severity,'ROOF PARAPET','EXTEND / SPAN / BRANCH')-50;
  severity=addLayer(features,band,-136,severity,'PARAPET CAP','THIN / SPAN / BRANCH')-50;
  return{
    id:'serious-courtyard-house',name:'SERIOUS COURTYARD HOUSE',category:'serious / architecture',tier:'serious',
    description:'16×10-stud bonded courtyard house. Two-stud envelope, doorway, three window voids, lintel course, roof ring, terrace parapet and cap. Same base Beaver; no house-specific placement script.',
    principle:'Prefer the legal piece that absorbs the most unresolved wall/roof signals through the most verified contacts.',
    objective:'bonded',maxReach:120,maxMoves:700,visualStride:4,seeds:plateFoundation(4,5),features,expect:{full:'quiet','matter-only':'quiet'}
  };
}

function courtyardHouseII(){
  const xs=range(-230,230),zs=range(-130,130),band=bandCells(xs,zs,2),features=[];
  let severity=60000;
  const groundDoor=(x,z,c)=>c<=4&&[-10,10].includes(x)&&[-130,-110].includes(z);
  const groundWindow=(x,z,c)=>{
    if(c<2||c>4)return false;
    const front=[-150,-130].includes(x)&&[-130,-110].includes(z);
    const backL=[-150,-130].includes(x)&&[110,130].includes(z);
    const backR=[130,150].includes(x)&&[110,130].includes(z);
    return front||backL||backR;
  };
  for(let c=1;c<=5;c++){
    const cells=band.filter(([x,z])=>!groundDoor(x,z,c)&&!groundWindow(x,z,c));
    severity=addLayer(features,cells,-24*c,severity,`GROUND WALL ${c}`,'EXTEND / SPAN / BRANCH')-100;
  }
  severity=addLayer(features,band,-128,severity,'LEVEL TWO DECK RING','THIN / SPAN / BRANCH')-100;
  const upperWindow=(x,z,c)=>{
    if(c<2||c>3)return false;
    const frontL=[-150,-130].includes(x)&&[-130,-110].includes(z);
    const frontR=[130,150].includes(x)&&[-130,-110].includes(z);
    const backL=[-150,-130].includes(x)&&[110,130].includes(z);
    const backR=[130,150].includes(x)&&[110,130].includes(z);
    return frontL||frontR||backL||backR;
  };
  for(let c=1;c<=4;c++){
    const y=-128-24*c,cells=band.filter(([x,z])=>!upperWindow(x,z,c));
    severity=addLayer(features,cells,y,severity,`UPPER WALL ${c}`,'EXTEND / SPAN / BRANCH')-100;
  }
  severity=addLayer(features,band,-232,severity,'UPPER ROOF RING','THIN / SPAN / BRANCH')-100;
  severity=addLayer(features,band,-256,severity,'UPPER PARAPET','EXTEND / SPAN / BRANCH')-100;
  severity=addLayer(features,band,-264,severity,'UPPER PARAPET CAP','THIN / SPAN / BRANCH')-100;
  return{
    id:'serious-courtyard-house-ii',name:'SERIOUS COURTYARD HOUSE II',category:'serious / architecture',tier:'serious',
    description:'24×14-stud two-story courtyard house. Five-course ground story, real doorway and window voids, bonded level-two deck ring, four-course upper story with four windows, upper roof, parapet and cap.',
    principle:'The same small vocabulary must sustain an architectural dependency chain for two complete stories without a house-specific solver.',
    objective:'bonded',maxReach:120,maxMoves:1200,visualStride:6,seeds:plateFoundation(6,7),features,expect:{full:'quiet'}
  };
}

function frameTower(){
  const xs=range(-70,70),zs=range(-30,30),footprint=rectangleCells(xs,zs),features=[];
  let severity=18000,y=0;
  const layers=[
    ['BRICK',24],['BRICK',24],['PLATE BELT',8],
    ['BRICK',24],['BRICK',24],['PLATE BELT',8],
    ['BRICK',24],['BRICK',24],['PLATE BELT',8],
    ['BRICK',24],['BRICK',24],['PLATE BELT',8],
    ['BRICK',24],['BRICK',24],['PLATE BELT',8]
  ];
  for(let i=0;i<layers.length;i++){
    const [kind,dy]=layers[i];y-=dy;
    severity=addLayer(features,footprint,y,severity,`${kind} ${i+1}`,kind.startsWith('PLATE')?'THIN / SPAN / BRANCH':'EXTEND / SPAN / BRANCH')-30;
  }
  return{
    id:'serious-frame-tower',name:'SERIOUS FRAME TOWER',category:'serious / vertical',tier:'serious',
    description:'8×4-stud structural tower with fifteen bonded layers and plate belts. Tests whether accumulated joints remain valid through long vertical repetition.',
    principle:'A tall structure is a repeated audit, not a repeated picture.',
    objective:'bonded',maxReach:120,maxMoves:600,visualStride:4,seeds:plateFoundation(2,2),features,expect:{full:'quiet','matter-only':'quiet'}
  };
}

function steppedDam(){
  const xs=range(-110,110),zs=range(-50,50),features=[];
  let severity=17000,y=0;
  for(let layer=1;layer<=10;layer++){
    y-=layer%3===0?8:24;
    const inset=Math.min(2,Math.floor((layer-1)/3));
    const layerXs=xs.slice(inset,xs.length-inset),layerZs=zs.slice(inset,zs.length-inset);
    const cells=rectangleCells(layerXs,layerZs);
    const plateLayer=layer%3===0;
    severity=addLayer(features,cells,y,severity,plateLayer?`DAM PLATE ${layer}`:`DAM MASS ${layer}`,plateLayer?'THIN / SPAN / BRANCH':'EXTEND / SPAN / BRANCH')-30;
  }
  return{
    id:'serious-stepped-dam',name:'SERIOUS STEPPED DAM',category:'serious / mass',tier:'serious',
    description:'12×6-stud battered mass that narrows as it rises, with plate bond courses. A larger test of contact absorption, stepping and accumulated audit.',
    principle:'The field withdraws as height increases; Beaver must keep finding a legal supported section.',
    objective:'bonded',maxReach:120,maxMoves:700,visualStride:4,seeds:plateFoundation(3,3),features,expect:{full:'quiet','matter-only':'quiet'}
  };
}

export const SERIOUS_BUILDS=[courtyardHouse(),courtyardHouseII(),frameTower(),steppedDam()];

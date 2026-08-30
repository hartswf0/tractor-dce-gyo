import * as Base from './model.js';
export const {ID,DESIGN,stateFor,hear,commit,unresolved,signalLoad,toLDraw}=Base;
const RY90=[0,0,1,0,1,0,-1,0,0];
const X=i=>-630+i*20,Z=i=>-310+i*20,CX=(a,b)=>(X(a)+X(b))/2,CZ=(a,b)=>(Z(a)+Z(b))/2;
const lineParts={1:['3005.dat','Brick 1 x 1'],2:['3004.dat','Brick 1 x 2'],3:['3622.dat','Brick 1 x 3'],4:['3010.dat','Brick 1 x 4'],6:['3009.dat','Brick 1 x 6'],8:['3008.dat','Brick 1 x 8']};
function pts(x0,x1,z0,z1,y){const out=[];for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)out.push([X(x),y,Z(z)]);return out}
function action(o){return{placed:false,requires:[],signal:'GRAVITY',severity:96,weight:1,color:71,cover:[],kind:'structure',...o}}
function line({id,x0,x1,z,topY=-168,color=71,label='BEARING LINTEL',minContacts,spread=0,signal='GRAVITY',severity=108}){const n=x1-x0+1,p=lineParts[n];if(!p)throw Error(`No real 1x${n} line part`);return action({id,file:p[0],name:p[1],t:[CX(x0,x1),topY,Z(z)],r:ID,color,bottom:pts(x0,x1,z,z,topY+24),top:pts(x0,x1,z,z,topY),minContacts:minContacts??n,minSpread:spread,signal,severity,weight:n,label})}
function col({id,x,z,course,label}){const y=-24*course;return action({id,file:'3003.dat',name:'Brick 2 x 2',t:[CX(x,x+1),y,CZ(z,z+1)],r:ID,bottom:pts(x,x+1,z,z+1,y+24),top:pts(x,x+1,z,z+1,y),minContacts:4,minSpread:0,weight:4,label})}
function balconyPlate({id,x0,x1}){const topY=-176;return action({id,file:'3035.dat',name:'Plate 4 x 8',t:[CX(x0,x1),topY,CZ(14,17)],r:ID,color:4,bottom:pts(x0,x1,14,17,topY+8),top:pts(x0,x1,14,17,topY),minContacts:16,minSpread:140,weight:40,label:'COURTYARD BALCONY · two-ended support'})}
function removeWhere(plan,pred){for(let i=plan.length-1;i>=0;i--)if(pred(plan[i]))plan.splice(i,1)}
function addSpineCaps(plan){
  // Replace generic course-seven pieces with exact jamb-supported fields.
  removeWhere(plan,a=>/^(FRONT|REAR) SPINE · z(12|13|19|20) · course 7$/.test(a.label||''));
  for(const z of [12,13]){
    plan.push(line({id:`front-cap-${z}-L`,x0:12,x1:19,z,label:'FRONT SPINE CAP'}));
    plan.push(line({id:`front-passage-${z}-A`,x0:20,x1:27,z,label:'FRONT SPINE LINTEL A · BOTH JAMBS',minContacts:4,spread:140,severity:120}));
    plan.push(line({id:`front-cap-${z}-M`,x0:28,x1:35,z,label:'FRONT SPINE CAP'}));
    plan.push(line({id:`front-passage-${z}-B`,x0:36,x1:43,z,label:'FRONT SPINE LINTEL B · BOTH JAMBS',minContacts:4,spread:140,severity:120}));
    plan.push(line({id:`front-cap-${z}-R`,x0:44,x1:51,z,label:'FRONT SPINE CAP'}));
  }
  // Delete old duplicate front lintels emitted by the first model.
  removeWhere(plan,a=>/^spine-lintel-(12|13)-/.test(a.id||''));
  for(const z of [19,20]){
    plan.push(line({id:`rear-cap-${z}-L8`,x0:12,x1:19,z,label:'REAR SPINE CAP'}));
    plan.push(line({id:`rear-cap-${z}-L6`,x0:20,x1:25,z,label:'REAR SPINE CAP'}));
    plan.push(line({id:`rear-passage-${z}`,x0:26,x1:33,z,label:'REAR SPINE LINTEL · BOTH JAMBS',minContacts:4,spread:140,severity:120}));
    plan.push(line({id:`rear-cap-${z}-R8a`,x0:34,x1:41,z,label:'REAR SPINE CAP'}));
    plan.push(line({id:`rear-cap-${z}-R8b`,x0:42,x1:49,z,label:'REAR SPINE CAP'}));
    plan.push(line({id:`rear-cap-${z}-R2`,x0:50,x1:51,z,label:'REAR SPINE CAP'}));
  }
}
function rebuildBalcony(plan){
  removeWhere(plan,a=>(a.id||'').startsWith('bal-col-')||(a.id||'').startsWith('balcony-')||(a.id||'').startsWith('bal-guard-'));
  // Twelve independent 2x2 columns sit entirely in the courtyard gap, never in the bearing spines.
  for(const x of [18,24,26,32,34,40])for(const z of [14,16])for(let c=1;c<=7;c++)plan.push(col({id:`court-col-${x}-${z}-${c}`,x,z,course:c,label:`COURTYARD BALCONY COLUMN · course ${c}`}));
  for(const [id,x0,x1] of [['A',18,25],['B',26,33],['C',34,41]])plan.push(balconyPlate({id:`court-balcony-${id}`,x0,x1}));
  for(const [id,x0,x1] of [['A',18,25],['B',26,33],['C',34,41]])plan.push(line({id:`court-guard-${id}`,x0,x1,z:17,topY:-200,color:71,label:'COURTYARD BALCONY GUARD',signal:'GUARD',severity:76}));
}
function rebuildPorch(plan){
  removeWhere(plan,a=>(a.id||'').startsWith('porch-')&&!(a.id||'').startsWith('porch-canopy'));
  // Six column stacks support both canopy plates while leaving the center stair completely clear.
  for(const [x,z] of [[26,1],[26,3],[32,1],[34,1],[40,1],[40,3]])for(let c=1;c<=7;c++)plan.push(col({id:`entry-col-${x}-${z}-${c}`,x,z,course:c,label:`ENTRY PORCH COLUMN · course ${c}`}));
}
function repairDoor(plan){
  const frame=plan.find(a=>a.id==='front-door-frame'),leaf=plan.find(a=>a.id==='front-door-leaf');
  if(frame){frame.requires=[...new Set([...(frame.requires||[]),'threshold'])];frame.label='FRONT DOOR OUTER FRAME · THRESHOLD + DOUBLE LINTEL';}
  if(leaf&&frame){leaf.t=[frame.t[0]-32,frame.t[1],frame.t[2]+5];leaf.label='FRONT DOOR LEAF · CALIBRATED FRAME ORIGIN';}
  // A second frame fills the inner stud of the two-stud wall, producing a real deep reveal instead of a paper-thin hole.
  if(frame&&!plan.some(a=>a.id==='front-door-inner-frame'))plan.push({placed:false,id:'front-door-inner-frame',file:'60596.dat',name:'Door 1 x 4 x 6 Frame',t:[frame.t[0],frame.t[1],frame.t[2]+20],r:ID,color:71,bottom:[],top:[],minContacts:0,minSpread:0,signal:'ACCESS',severity:116,weight:18,label:'FRONT DOOR INNER FRAME · DEEP REVEAL',kind:'closure',requires:['door-lintel-inner','threshold'],cover:[]});
}
const bounds={G:{x0:10,x1:53,z0:5,z1:26,courses:7},U:{x0:14,x1:45,z0:5,z1:12,courses:6},P:{x0:24,x1:35,z0:5,z1:12,courses:4}};
function delegatedBondCorner(k){
  const [level,side,cs,is]=k.split('|'),c=Number(cs),i=Number(is),b=bounds[level];if(!b)return false;
  // Odd courses: front/back bricks own the corners, so left/right corner weather cells are delegated to them.
  if(c%2===1&&(side==='left'||side==='right'))return i===b.z0||i===b.z0+1||i===b.z1-1||i===b.z1;
  // Even courses: left/right bricks own the corners, so front/back corner cells are delegated to them.
  if(c%2===0&&(side==='front'||side==='back'))return i===b.x0||i===b.x0+1||i===b.x1-1||i===b.x1;
  return false;
}
export function weatherMissing(state){return Base.weatherMissing(state).filter(k=>!delegatedBondCorner(k))}
export function makePlan(){
  const plan=Base.makePlan();addSpineCaps(plan);rebuildBalcony(plan);rebuildPorch(plan);repairDoor(plan);return plan;
}
export function simulate(actions=makePlan(),limit=5000){const s=Base.stateFor(actions);let moves=0;while(moves<limit){const h=Base.hear(s);if(!h.raw||!h.choice)break;Base.commit(h.choice.action,s);moves++}return{state:s,moves,remaining:Base.unresolved(s),clicks:s.clicks,weatherMissing:weatherMissing(s)}}

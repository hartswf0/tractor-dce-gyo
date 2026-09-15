/* Personalized control mapping, not a metric hand-pose estimator. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ButterCalibration=api;})(globalThis,function(){
 'use strict';
 const median=a=>{const s=a.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};
 const CORNERS=Array.from({length:8},(_,i)=>({x:i&1?1:0,y:i&2?1:0,z:i&4?1:0}));
 function fit(samples){
  if(samples.length!==8||samples.some(s=>s.raw.length!==3||s.raw.some(v=>!Number.isFinite(v))))throw Error('Capture all eight corners with both inputs visible.');
  const axes=[0,1,2].map(k=>{const name=['x','y','z'][k],lo=samples.filter(s=>s.target[name]===0).map(s=>s.raw[k]),hi=samples.filter(s=>s.target[name]===1).map(s=>s.raw[k]),a=lo.reduce((a,b)=>a+b)/4,b=hi.reduce((a,b)=>a+b)/4;if(Math.abs(b-a)<(k===2?.07:.12))throw Error('Reach range too small on '+name.toUpperCase()+'. Repeat with more separation.');return {a,b};});
  const profile={version:1,axes};const errors=samples.map(s=>Math.max(...map(profile,s.raw).map((v,i)=>Math.abs(v-s.target[['x','y','z'][i]]))));
  profile.fitError=Math.max(...errors);if(profile.fitError>.22)throw Error('Corners disagree. Keep each input in its assigned role and repeat.');return profile;
 }
 function map(profile,raw){return raw.map((v,k)=>(v-profile.axes[k].a)/(profile.axes[k].b-profile.axes[k].a));}
 function error(point,target){return Math.max(...point.map((v,i)=>Math.abs(v-target[['x','y','z'][i]])));}
 function palmScale(m,aspect=4/3){const pairs=[[5,17],[0,9],[0,5],[0,17]];return pairs.map(([a,b])=>Math.hypot((m[a].x-m[b].x)*aspect,m[a].y-m[b].y));}
 function relativePalm(reference,current){const ratios=current.map((v,i)=>v/reference[i]);if(ratios.some(v=>!Number.isFinite(v)||v<=0))return {valid:false};const scale=median(ratios),spread=Math.max(...ratios)-Math.min(...ratios);return {valid:spread/scale<.18,relativeDistance:1/scale,disagreement:spread/scale};}
 function stable(samples){if(samples.length<12)return false;return [0,1,2].every(k=>Math.max(...samples.map(s=>s[k]))-Math.min(...samples.map(s=>s[k]))<.035);}
 function pointMap(profile,p){return {x:profile.x[0]*p.x+profile.x[1]*p.y+profile.x[2],y:profile.y[0]*p.x+profile.y[1]*p.y+profile.y[2]};}
 function fitPointing(samples){
  if(samples.length<4||samples.some(s=>![s.raw.x,s.raw.y,s.target.x,s.target.y].every(Number.isFinite)))throw Error('Need four distinct fingertip targets.');
  const matrix=Array.from({length:3},()=>[0,0,0]);const rhs=[[0,0,0],[0,0,0]];
  for(const s of samples){const v=[s.raw.x,s.raw.y,1];for(let i=0;i<3;i++){for(let j=0;j<3;j++)matrix[i][j]+=v[i]*v[j];rhs[0][i]+=v[i]*s.target.x;rhs[1][i]+=v[i]*s.target.y;}}
  function solve(b){const a=matrix.map((row,i)=>[...row,b[i]]);for(let k=0;k<3;k++){let pivot=k;for(let i=k+1;i<3;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;if(Math.abs(a[pivot][k])<1e-6)throw Error('Pointing samples repeat or lie on one line. Try again.');[a[k],a[pivot]]=[a[pivot],a[k]];const scale=a[k][k];for(let j=k;j<4;j++)a[k][j]/=scale;for(let i=0;i<3;i++)if(i!==k){const f=a[i][k];for(let j=k;j<4;j++)a[i][j]-=f*a[k][j];}}return a.map(row=>row[3]);}
  const profile={version:2,x:solve(rhs[0]),y:solve(rhs[1])};const determinant=profile.x[0]*profile.y[1]-profile.x[1]*profile.y[0];if(Math.abs(determinant)<.1||Math.abs(determinant)>16)throw Error('Pointing range is too small or inconsistent.');
  profile.fitError=Math.sqrt(samples.reduce((sum,s)=>{const p=pointMap(profile,s.raw);return sum+(p.x-s.target.x)**2+(p.y-s.target.y)**2;},0)/samples.length);if(profile.fitError>.055)throw Error('These points do not match the build targets. Repeat pointing setup.');return profile;
 }
 return {pointMap,fitPointing,CORNERS,fit,map,error,palmScale,relativePalm,stable,median};
});

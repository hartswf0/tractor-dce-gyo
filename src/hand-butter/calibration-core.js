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
 return {CORNERS,fit,map,error,palmScale,relativePalm,stable,median};
});

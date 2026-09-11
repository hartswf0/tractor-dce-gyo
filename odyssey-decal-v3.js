import * as BASE from './odyssey-decal.js';
export * from './odyssey-decal.js';

// LEGO print compiler v3.
// Source performance supplies every expressive mark. This compiler only converts
// paper affordances into print affordances: white sclera, opaque ink, beard fill.
const WHITE='#fffdf8';
const BEARDS={
  odysseus:{kind:'full',color:'#2a201a'},nestor:{kind:'groomed',color:'#aaa59b'},eumaeus:{kind:'full',color:'#2b211b'},
  alcinous:{kind:'groomed',color:'#aaa59b'},polyphemus:{kind:'wild',color:'#392a21'},poseidon:{kind:'wild',color:'#e7e2d8'},
  tiresias:{kind:'long',color:'#d8d3ca'},laertes:{kind:'long',color:'#c8c1b6'},menelaus:{kind:'groomed',color:'#3a2a20'},
  zeus:{kind:'long',color:'#ebe7de'},phemius:{kind:'short',color:'#2b211b'}
};

function pupilCentroid(data,w,h,side){
  const x0=Math.floor(w*(side<0?.20:.52)),x1=Math.floor(w*(side<0?.48:.80));
  const y0=Math.floor(h*.18),y1=Math.floor(h*.48);
  let sx=0,sy=0,sw=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=(y*w+x)*4,lum=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    if(lum<85){const wy=1-Math.min(1,Math.abs(y-h*.335)/(h*.16));if(wy<=0)continue;const wt=(86-lum)*wy;sx+=x*wt;sy+=y*wt;sw+=wt;}
  }
  return sw?{x:sx/sw,y:sy/sw}:{x:w*(side<0?.355:.645),y:h*.335};
}
function drawBeard(g,w,h,spec){
  if(!spec)return;const bottom={short:.78,groomed:.84,full:.91,long:.99,wild:1.02}[spec.kind]||.86;
  const start={short:.59,groomed:.57,full:.54,long:.51,wild:.49}[spec.kind]||.56;
  g.save();g.globalAlpha=spec.color.startsWith('#e')||spec.color.startsWith('#d')||spec.color.startsWith('#c')? .98:.92;g.fillStyle=spec.color;
  g.beginPath();g.moveTo(w*.24,h*start);g.quadraticCurveTo(w*.29,h*.64,w*.35,h*.68);g.lineTo(w*.39,h*bottom);g.quadraticCurveTo(w*.50,h*(bottom+.025),w*.61,h*bottom);g.lineTo(w*.65,h*.68);g.quadraticCurveTo(w*.71,h*.64,w*.76,h*start);g.lineTo(w*.72,h*.91);g.quadraticCurveTo(w*.50,h*(bottom+.06),w*.28,h*.91);g.closePath();g.fill();
  // Keep lips/chin readable as skin rather than turning the whole lower head into a bib.
  g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(w*.50,h*.62,w*.105,h*.095,0,0,Math.PI*2);g.fill();g.restore();
}

export function renderLegoDecal(character,performance='neutral',w=448,h=250){
  const src=BASE.renderSourceFace(character,performance,720);if(!src)return null;
  const crop=document.createElement('canvas');crop.width=w;crop.height=h;const cg=crop.getContext('2d',{willReadFrequently:true});
  const sx=src.width*.225,sy=src.height*.255,sw=src.width*.55,sh=src.height*.54;cg.drawImage(src,sx,sy,sw,sh,0,0,w,h);
  const original=cg.getImageData(0,0,w,h),raw=original.data;
  const left=pupilCentroid(raw,w,h,-1),right=pupilCentroid(raw,w,h,1);
  const out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d');
  const key=String(character||'').toLowerCase();drawBeard(g,w,h,BEARDS[key]);
  // White belongs underneath the exact source eye marks. We locate each source pupil first,
  // then place the sclera around it, rather than guessing a universal eye coordinate.
  g.fillStyle=WHITE;for(const e of [left,right]){g.beginPath();g.ellipse(e.x,e.y,w*.052,h*.064,0,0,Math.PI*2);g.fill();}
  const im=cg.getImageData(0,0,w,h),d=im.data,beard=BEARDS[key];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,lum=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    const nx=(x-w/2)/(w*.50),ny=(y-h*.49)/(h*.57);
    if(nx*nx+ny*ny>=1||lum>197){d[i+3]=0;continue;}
    const dense=lum<115;let alpha=dense?255:Math.max(115,Math.min(245,(206-lum)*3.0));
    if(beard&&y>h*.50&&lum<140){const c=parseInt(beard.color.slice(1),16);d[i]=(c>>16)&255;d[i+1]=(c>>8)&255;d[i+2]=c&255;alpha=Math.max(alpha,220);}else{d[i]=18;d[i+1]=16;d[i+2]=14;}
    d[i+3]=alpha;
  }
  cg.putImageData(im,0,0);g.drawImage(crop,0,0);return out;
}

export function makeDecalMesh(THREE,character,performance='neutral'){
  const c=renderLegoDecal(character,performance);if(!c)return null;
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;tex.wrapS=THREE.RepeatWrapping;tex.repeat.x=-1;tex.offset.x=1;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.035,side:THREE.DoubleSide,depthWrite:false});
  const arc=1.60,geo=new THREE.CylinderGeometry(13.18,13.18,12.2,64,1,true,Math.PI-arc/2,arc);
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(0,-72.7,0);mesh.scale.y=-1;mesh.renderOrder=25;mesh.name=`ODYSSEY_DECAL_V3:${character}:${performance}`;
  mesh.userData={character,performance,source:'odyssey-halfworld/odyssey-performances',mount:'3626b-cylinder',sclera:'source-pupil-anchored',facialHair:'printed'};return mesh;
}

import * as FACEM from '/odyssey-halfworld/assets/character/_close/face.mjs';
import * as DIR from '/odyssey-halfworld/scenes/_direction.mjs';

export const SOURCE_CAST=Object.freeze(Object.keys(FACEM.FACES));
export const EXTENSION_CAST=Object.freeze(['poseidon','calypso','tiresias','laertes','antinous','menelaus','arete','hermes','zeus','argos','phemius','melanthius']);
export const CAST24=Object.freeze([...SOURCE_CAST,...EXTENSION_CAST]);

const EXTRA={
 neutral:{}, listening:{eyeNarrow:.10,headYaw:.04}, uncertainty:{browUp:.28,browKnit:.18,headRoll:.08},
 concealment:{eyeNarrow:.26,mouthAsym:.28,headYaw:.18}, challenge:{browKnit:.56,eyeNarrow:.22,headPitch:-.08},
 concentration:{browKnit:.30,eyeNarrow:.16,headPitch:.08}, affection:{browUp:.28,smile:.42,eyeNarrow:.16,headRoll:.05},
 relief:{browUp:.36,smile:.36,headPitch:.10}, surprise:{browUp:.86,eyeWide:.72,jaw:.20},
 anger:{browKnit:.62,eyeNarrow:.28,frown:.38}, fury:{browKnit:.90,eyeNarrow:.42,frown:.64,jaw:.18},
 shame:{browUp:.30,browKnit:.25,eyeNarrow:.35,headPitch:.30},
};
export const PERFORMANCES=Object.freeze({...EXTRA,...DIR.EMOTIONS});
export const PERFORMANCE_NAMES=Object.freeze([
 'neutral','listening','recognition','uncertainty','skepticism','guarded','concealment','irony','contempt','challenge','command','resolve','concentration','appeal','tenderness','affection','relief','joy','wonder','surprise','concern','weariness','grief','hurt','anguish','fear','desperation','anger','fury','shame'
]);

export const SIGNATURES=Object.freeze({
 odysseus:['calculating','disguised','homesick','testing','recognized','restrained fury'],
 penelope:['waiting','withholding','testing','private grief','recognition','controlled joy'],
 telemachus:['uncertainty','embarrassment','awakening confidence','defiance','filial recognition'],
 athena:['appraisal','amusement','disguised counsel','impatience','command','approval'],
 eurycleia:['suspicion','recognition','shock suppressed','maternal tenderness'],
 eumaeus:['hospitality','loyalty','suspicion','grief','astonished recognition'],
 nestor:['recollection','instruction','ceremonial grief','certainty'],
 helen:['remembrance','guilt','irony','fascination','melancholy'],
 menelaus:['hospitality','pride','grief','recollection','indignation'],
 nausicaa:['surprise','composure','curiosity','attraction','embarrassment'],
 alcinous:['welcome','judgment','curiosity','authority'],
 arete:['scrutiny','suspicion','recognition','approval'],
 circe:['threat','surprise','seduction','respect','warning'],
 calypso:['possession','tenderness','resentment','grief','release'],
 poseidon:['offense','brooding','contempt','wrath','satisfaction'],
 zeus:['deliberation','detachment','decree','warning'],
 hermes:['amusement','message-bearing neutrality','warning','departure'],
 tiresias:['vacancy','recognition','prophecy','warning'],
 laertes:['exhaustion','disbelief','testing','recognition','overwhelming joy'],
 antinous:['entitlement','mockery','suspicion','intimidation','panic'],
 melanthius:['contempt','ingratiation','cruelty','fear'],
 phemius:['performance','caution','terror','pleading'],
 polyphemus:['curiosity','appetite','rage','pain','curse'],
 argos:['waiting','noticing','recognition','effort','rest']
});

const ALIAS={
 calculating:'skepticism',disguised:'guarded',homesick:'weariness',testing:'skepticism',recognized:'recognition','restrained fury':'anger',
 waiting:'listening',withholding:'guarded','private grief':'grief','controlled joy':'relief',embarrassment:'shame','awakening confidence':'resolve',defiance:'challenge','filial recognition':'recognition',
 appraisal:'skepticism',amusement:'irony','disguised counsel':'irony',impatience:'command',approval:'relief',suspicion:'skepticism','shock suppressed':'surprise','maternal tenderness':'tenderness',
 hospitality:'appeal',loyalty:'resolve','astonished recognition':'recognition',recollection:'weariness',instruction:'command','ceremonial grief':'grief',certainty:'resolve',remembrance:'weariness',guilt:'shame',fascination:'wonder',melancholy:'weariness',
 pride:'resolve',indignation:'anger',composure:'guarded',curiosity:'wonder',attraction:'affection',welcome:'tenderness',judgment:'skepticism',authority:'command',scrutiny:'skepticism',threat:'challenge',seduction:'affection',respect:'guarded',warning:'command',
 possession:'guarded',resentment:'anger',release:'relief',offense:'contempt',brooding:'anger',wrath:'fury',satisfaction:'relief',deliberation:'concentration',detachment:'guarded',decree:'command','message-bearing neutrality':'neutral',departure:'guarded',vacancy:'neutral',prophecy:'command',
 exhaustion:'weariness',disbelief:'skepticism','overwhelming joy':'joy',entitlement:'contempt',mockery:'irony',intimidation:'challenge',panic:'fear',ingratiation:'appeal',cruelty:'contempt',performance:'joy',caution:'guarded',terror:'fear',pleading:'appeal',appetite:'concentration',rage:'fury',pain:'anguish',curse:'fury',noticing:'recognition',effort:'resolve',rest:'relief'
};
export function resolvePerformance(name){const key=String(name||'neutral').toLowerCase();return {name:key,base:ALIAS[key]||key,state:{...(PERFORMANCES[ALIAS[key]||key]||{})}};}
export function hasSourceFace(character){return !!FACEM.FACES[String(character||'').toLowerCase()];}
export function titleCase(s){return String(s||'').replace(/\b\w/g,m=>m.toUpperCase());}

export function renderSourceFace(character,performance='neutral',size=512){
 const key=String(character||'').toLowerCase(),spec=FACEM.FACES[key];if(!spec)return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const g=canvas.getContext('2d',{willReadFrequently:true});
 g.fillStyle='#FBFAF4';g.fillRect(0,0,size,size);
 const perf=resolvePerformance(performance).state;
 const st={jaw:0,wide:0,press:0,teeth:0,tongue:0,blink:0,gazeX:0,gazeY:0,browUp:0,browKnit:0,headYaw:0,headPitch:0,headRoll:0,chest:0,smile:0,frown:0,eyeWide:0,eyeNarrow:0,mouthAsym:0,cheek:0,...perf};
 FACEM.drawCloseup(g,spec,st,{cx:size*.5,cy:size*.46,R:size*.36});
 return canvas;
}

export function renderDecal(character,performance='neutral',w=384,h=220){
 const src=renderSourceFace(character,performance,640);if(!src)return null;
 const out=document.createElement('canvas');out.width=w;out.height=h;const g=out.getContext('2d',{willReadFrequently:true});
 // The Odyssey close-up remains the source. Crop only the face-print zone so LEGO hair stays physical.
 const sx=src.width*.265,sy=src.height*.285,sw=src.width*.47,sh=src.height*.47;
 g.drawImage(src,sx,sy,sw,sh,0,0,w,h);
 const im=g.getImageData(0,0,w,h),d=im.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,r=d[i],gg=d[i+1],b=d[i+2],lum=.2126*r+.7152*gg+.0722*b;
   const nx=(x-w/2)/(w*.49),ny=(y-h*.50)/(h*.54);const inside=nx*nx+ny*ny<1;
   if(!inside||lum>188){d[i+3]=0;continue}
   const a=Math.max(0,Math.min(255,(205-lum)*2.6));d[i]=15;d[i+1]=14;d[i+2]=12;d[i+3]=a;
 }
 g.putImageData(im,0,0);return out;
}

export function makeDecalMesh(THREE,character,performance='neutral'){
 const c=renderDecal(character,performance);if(!c)return null;
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:false});
 const geo=new THREE.PlaneGeometry(18.6,10.8);const mesh=new THREE.Mesh(geo,mat);
 // 3626b is radius 13 LDU, y=4..17. Mounted at -84, the printable front is centred ~-73.5.
 // Word-to-Theatre flips the complete LDraw group around X, so front is local -Z.
 mesh.position.set(0,-73.5,-13.18);mesh.renderOrder=20;mesh.name=`ODYSSEY_DECAL:${character}:${performance}`;
 mesh.userData={character,performance,source:'odyssey-halfworld/odyssey-performances'};return mesh;
}

export function selection(character,performance){return {schema:'word-to-theatre/odyssey-decal-v1',character:String(character).toLowerCase(),performance:String(performance).toLowerCase(),source:'/odyssey-halfworld/odyssey-performances.html'};}

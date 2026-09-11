import * as THREE from 'three';

const INK=0x171512;
const C={
  ivory:'#eee8d7', white:'#f4efe4', black:'#211d19', brown:'#5b3923', darkBrown:'#34231b', red:'#7b241e', rust:'#9a4f31',
  blue:'#314a69', deepBlue:'#203b61', sea:'#456b78', teal:'#4f756f', olive:'#6c6a45', sand:'#b39a72', tan:'#937653',
  grey:'#8a867d', paleGrey:'#c8c4ba', gold:'#a77b2f', purple:'#5a465f', green:'#4f6245'
};

export const ACTOR_KIT=Object.freeze({
  odysseus:{head:'standard_print_plus_beard',beard:'full',hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.rust,accent:C.darkBrown,trim:C.gold,pattern:'traveler',cape:C.red}},
  penelope:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:15,base:C.ivory,accent:C.sand,trim:C.gold,pattern:'drape',skirt:true}},
  telemachus:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:272,bottom:70,base:C.blue,accent:C.sand,trim:C.gold,pattern:'young',cape:C.deepBlue}},
  athena:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:19,costume:{top:15,bottom:272,base:C.white,accent:C.blue,trim:C.gold,pattern:'divine',cape:C.deepBlue}},
  nestor:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:71,costume:{top:19,bottom:70,base:C.tan,accent:C.darkBrown,trim:C.gold,pattern:'elder'}},
  eumaeus:{head:'standard_print_plus_beard',beard:'full',hair:'21787.dat',hairColor:70,costume:{top:19,bottom:70,base:C.brown,accent:C.olive,trim:C.sand,pattern:'worker'}},
  circe:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:4,bottom:70,base:C.purple,accent:C.red,trim:C.gold,pattern:'divine',skirt:true}},
  nausicaa:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:272,base:C.white,accent:C.sea,trim:C.gold,pattern:'drape',skirt:true}},
  helen:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:4,base:C.ivory,accent:C.red,trim:C.gold,pattern:'court',skirt:true}},
  eurycleia:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:71,costume:{top:70,bottom:19,base:C.tan,accent:C.brown,trim:C.ivory,pattern:'elder',skirt:true}},
  alcinous:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:71,costume:{top:272,bottom:15,base:C.blue,accent:C.white,trim:C.gold,pattern:'court',cape:C.deepBlue}},
  polyphemus:{head:'special_rig',beard:'wild',hair:null,hairColor:70,costume:{top:70,bottom:70,base:C.brown,accent:C.darkBrown,trim:C.sand,pattern:'giant'}},
  poseidon:{head:'silhouette_sensitive_beard',beard:'wild',hair:'21787.dat',hairColor:15,costume:{top:272,bottom:19,base:C.deepBlue,accent:C.sea,trim:C.gold,pattern:'divine',cape:C.sea}},
  calypso:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:15,bottom:272,base:C.ivory,accent:C.teal,trim:C.gold,pattern:'drape',skirt:true}},
  tiresias:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:71,costume:{top:71,bottom:72,base:C.grey,accent:C.darkBrown,trim:C.paleGrey,pattern:'elder',cape:C.grey}},
  laertes:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:71,costume:{top:19,bottom:70,base:C.tan,accent:C.olive,trim:C.sand,pattern:'worker'}},
  antinous:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.red,accent:C.darkBrown,trim:C.gold,pattern:'court',cape:C.red}},
  menelaus:{head:'standard_print_plus_beard',beard:'groomed',hair:'21787.dat',hairColor:70,costume:{top:4,bottom:70,base:C.rust,accent:C.brown,trim:C.gold,pattern:'court',cape:C.red}},
  arete:{head:'standard_print',beard:false,hair:'12890.dat',hairColor:70,costume:{top:272,bottom:19,base:C.sea,accent:C.ivory,trim:C.gold,pattern:'court',skirt:true}},
  hermes:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:71,bottom:70,base:C.paleGrey,accent:C.blue,trim:C.gold,pattern:'messenger',cape:C.grey}},
  zeus:{head:'silhouette_sensitive_beard',beard:'long',hair:'21787.dat',hairColor:15,costume:{top:15,bottom:272,base:C.white,accent:C.grey,trim:C.gold,pattern:'divine',cape:C.paleGrey}},
  phemius:{head:'standard_print_plus_beard',beard:'short',hair:'21787.dat',hairColor:70,costume:{top:19,bottom:70,base:C.olive,accent:C.brown,trim:C.gold,pattern:'poet'}},
  melanthius:{head:'standard_print',beard:false,hair:'21787.dat',hairColor:70,costume:{top:70,bottom:70,base:C.darkBrown,accent:C.brown,trim:C.sand,pattern:'worker'}}
});

export function actorKit(character){return ACTOR_KIT[String(character||'').toLowerCase()]||ACTOR_KIT.telemachus;}

function textureCanvas(spec,which='torso'){
  const c=document.createElement('canvas');c.width=512;c.height=which==='torso'?360:300;const g=c.getContext('2d');
  g.clearRect(0,0,c.width,c.height);g.fillStyle=spec.base;g.fillRect(0,0,c.width,c.height);
  const ink='#2a241e',trim=spec.trim||C.gold,accent=spec.accent||C.brown;
  g.strokeStyle=ink;g.lineWidth=8;g.lineCap='round';g.lineJoin='round';
  if(which==='torso'){
    // neck opening
    g.beginPath();g.arc(256,24,72,.12*Math.PI,.88*Math.PI);g.stroke();
    if(spec.pattern==='drape'||spec.pattern==='divine'||spec.pattern==='court'){
      g.fillStyle=accent;g.beginPath();g.moveTo(0,10);g.lineTo(150,0);g.lineTo(360,360);g.lineTo(250,360);g.closePath();g.fill();
      g.strokeStyle=trim;g.lineWidth=13;g.beginPath();g.moveTo(38,0);g.lineTo(290,360);g.stroke();
    }else if(spec.pattern==='traveler'||spec.pattern==='worker'||spec.pattern==='elder'){
      g.fillStyle=accent;g.fillRect(0,250,512,72);g.strokeStyle=trim;g.lineWidth=10;g.strokeRect(0,244,512,84);
      g.strokeStyle=ink;g.lineWidth=6;for(let x=80;x<500;x+=90){g.beginPath();g.moveTo(x,80);g.lineTo(x-35,235);g.stroke()}
    }else if(spec.pattern==='messenger'||spec.pattern==='young'){
      g.fillStyle=accent;g.beginPath();g.moveTo(0,70);g.lineTo(210,15);g.lineTo(315,360);g.lineTo(185,360);g.closePath();g.fill();
      g.strokeStyle=trim;g.lineWidth=10;g.beginPath();g.moveTo(30,80);g.lineTo(210,35);g.stroke();
    }else if(spec.pattern==='poet'){
      g.fillStyle=accent;g.fillRect(0,235,512,75);g.strokeStyle=trim;g.lineWidth=9;g.beginPath();g.moveTo(75,75);g.quadraticCurveTo(250,170,430,78);g.stroke();
    }else if(spec.pattern==='giant'){
      g.fillStyle=accent;g.globalAlpha=.65;for(let i=0;i<16;i++){g.beginPath();g.arc((i*91)%512,(i*61)%360,25+(i%3)*13,0,Math.PI*2);g.fill()}g.globalAlpha=1;
    }
    g.strokeStyle=ink;g.lineWidth=9;g.strokeRect(4,4,504,352);
  }else{
    g.fillStyle=accent;g.fillRect(0,0,512,62);g.fillStyle=spec.base;g.fillRect(0,62,512,238);
    g.strokeStyle=trim;g.lineWidth=10;g.beginPath();g.moveTo(0,60);g.lineTo(512,60);g.stroke();
    if(spec.skirt){g.strokeStyle=ink;g.lineWidth=5;for(let x=70;x<512;x+=95){g.beginPath();g.moveTo(x,75);g.lineTo(x-24,290);g.stroke()}}
    else{g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(256,70);g.lineTo(256,300);g.stroke()}
    g.strokeStyle=ink;g.lineWidth=9;g.strokeRect(4,4,504,292);
  }
  return c;
}

function planeTexture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;}

export function makeCostumeMeshes(character){
  const kit=actorKit(character),spec=kit.costume,group=new THREE.Group();group.name=`ODYSSEY_COSTUME:${character}`;
  const torsoMat=new THREE.MeshBasicMaterial({map:planeTexture(textureCanvas(spec,'torso')),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const torso=new THREE.Mesh(new THREE.PlaneGeometry(35.2,24.2),torsoMat);torso.position.set(0,-48.6,-10.22);torso.renderOrder=15;group.add(torso);
  const lowerMat=new THREE.MeshBasicMaterial({map:planeTexture(textureCanvas(spec,'lower')),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const lower=new THREE.Mesh(new THREE.PlaneGeometry(31.5,19.4),lowerMat);lower.position.set(0,-18.2,-10.28);lower.renderOrder=15;group.add(lower);
  if(spec.cape){const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(spec.cape),side:THREE.DoubleSide,transparent:true,opacity:.96});const sh=new THREE.Shape();sh.moveTo(-18,10);sh.lineTo(18,10);sh.lineTo(22,-30);sh.lineTo(0,-36);sh.lineTo(-22,-30);sh.closePath();const cape=new THREE.Mesh(new THREE.ShapeGeometry(sh),mat);cape.position.set(0,-45,11.6);cape.renderOrder=1;group.add(cape)}
  return group;
}

export function makeBeardMesh(character){
  const kit=actorKit(character),kind=kit.beard;if(!kind)return null;
  const cfg={short:{h:4.4,r:13.5,drop:-67.2},groomed:{h:5.7,r:13.65,drop:-66.6},full:{h:7.5,r:13.9,drop:-65.8},long:{h:10.8,r:14.2,drop:-64.2},wild:{h:12.2,r:14.8,drop:-63.6}}[kind]||{h:6,r:13.8,drop:-66};
  const geo=new THREE.CylinderGeometry(cfg.r+.5,cfg.r,cfg.h,40,1,true,Math.PI-.82,1.64);
  const color=(kit.hairColor===15||kit.hairColor===71)?0xbdb9ae:0x2b211a;
  const mat=new THREE.MeshStandardMaterial({color,roughness:.84,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(0,cfg.drop,0);mesh.name=`ODYSSEY_BEARD:${character}:${kind}`;mesh.renderOrder=10;return mesh;
}

export function assemblyLabel(character){const k=actorKit(character);return `${k.head.replaceAll('_',' ')} · ${k.beard||'no beard'} · ${k.costume.pattern}`.toUpperCase();}

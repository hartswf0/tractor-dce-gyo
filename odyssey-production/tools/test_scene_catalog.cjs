const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;global.THREE=require('../native/vendor/three.min.js');
for(const f of ['film','scenes-cinerium','scenes-odyssey','scenes-cast','scenes-trailer'])vm.runInThisContext(fs.readFileSync('native/world/'+f+'.js','utf8'));
const rows=JSON.parse(fs.readFileSync('scene-catalog.json')),native={...Film.TRAILERS,...Film.SCENES};
for(const [key,s]of Object.entries(native))assert(rows.some(r=>new URL(r.url,'http://local').searchParams.get('nativeScene')===key),'Missing native scene '+key);
for(const r of rows){const u=new URL(r.url,'http://local'),key=u.searchParams.get('nativeScene');if(key)assert(native[key],'Unknown native scene '+key);for(const value of [r.url,r.image,r.video,r.source].filter(Boolean)){const path=value.split('?')[0];assert(fs.existsSync(path.startsWith('films/')?'films/'+path.slice(6):''+path),'Missing '+value);}}
assert(rows.some(r=>r.id==='sheep-escape'&&r.video&&r.image&&r.source));console.log(`${rows.length} catalog entries checked; all ${Object.keys(native).length} registered native programs covered; sheep escape source, still and film present.`);

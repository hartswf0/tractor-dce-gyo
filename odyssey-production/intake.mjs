#!/usr/bin/env node
/** Extract source facts without fabricating depth from projected anchors. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'halfworld'));
const dest=path.join(root,'intake');await fs.mkdir(dest,{recursive:true});
const selected=JSON.parse(await fs.readFile(path.join(root,'challenge-suite.json'),'utf8'));
const voice=JSON.parse(await fs.readFile(path.join(source,'drive/voice-manifest.json'),'utf8'));
const script=JSON.parse(await fs.readFile(path.join(source,'drive/drive-script.json'),'utf8'));
let revision;try{revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{revision='bundled-source; see provenance.json';}
const inventory=[];
for(const file of (await fs.readdir(path.join(source,'scenes'))).filter(f=>/^OD-B\d{2}-S\d{2}\.mjs$/.test(f)).sort()){
 const mod=await import(pathToFileURL(path.join(source,'scenes',file)));const s=mod.default||mod.scene;
 if(!s?.id||!Number.isFinite(s.duration))throw Error('Invalid scene '+file);
 const fact={id:s.id,title:s.title,bookFromId:+s.id.slice(4,6),declaredBook:s.book,duration:s.duration,beats:s.beats,plan:s.plan||null,cast:s.cast.map(c=>c.instance),ops:s.timeline.length,source:file};inventory.push(fact);
 if(!selected.some(c=>c.id===s.id))continue;
 const performance=script.scenes.find(c=>c.id===s.id),v=voice[s.id];
 const contract={id:s.id,title:s.title,sourceRevision:revision,sourcePath:'scenes/'+file,sourceDuration:s.duration,sourceFacts:{cast:s.cast,timeline:s.timeline,plan:s.plan||null,entrances:s.entrances||[],exits:s.exits||[],exitOccupancy:s.exitOccupancy||null,exitState:s.exitState,gazeTargets:s.gazeTargets,walkable:s.walkable,attachments:s.attachments,beats:s.beats},recording:v?{...v,segments:v.segments.map(seg=>({...seg,script:performance?.segments[seg.gi]}))}:null,projectionPolicy:'cast.anchor is an image anchor. It is not an inferred 3D floor coordinate.',nativeStaging:s.id==='OD-B23-S04'?'See bed-test.contract.json and render.mjs':'UNAUTHORED: scene requires inspected depth, interaction and coverage decisions',reviewStatus:s.id==='OD-B23-S04'?'Native production proof; see review ledger':'Source intake only; no completed native scene'};
 await fs.writeFile(path.join(dest,s.id+'.json'),JSON.stringify(contract,null,2)+'\n');
}
await fs.writeFile(path.join(dest,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify({importedScenes:inventory.length,selectedContracts:selected.length,bookMetadataMismatches:inventory.filter(s=>s.bookFromId!==s.declaredBook).map(s=>s.id)},null,2));

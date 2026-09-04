import fs from 'node:fs';
import {loadIndex,bestConnection,toLDraw,ID} from '../src/engine.js';
const L=JSON.parse(fs.readFileSync(new URL('../library/core.json',import.meta.url))); const R=JSON.parse(fs.readFileSync(new URL('../library/compatibility.json',import.meta.url))); const I=loadIndex(L);
const a=[]; const root={partId:'3005',t:[0,0,0],r:ID,seamTax:0}; a.push(root);
function add(parent,port,id){const s=bestConnection(parent,I.get(parent.partId),port,I.get(id),R); if(!s)throw Error(`${parent.partId}:${port} ! ${id}`); if(!s.t.every(Number.isFinite)||!s.r.every(Number.isFinite))throw Error(`non-finite transform for ${id}`); a.push(s);return s}
const tech=add(root,'top','3700'); const snot=add(tech,'top','4070'); add(snot,'front','3024'); add(tech,'hole','2780');
fs.writeFileSync(new URL('../bench/bench-01.mpd',import.meta.url),toLDraw(a,I,'AFFORDANCE-BENCH-01'));
console.log(a.map(x=>({part:x.partId,t:x.t,tax:x.tax||0,joint:x.joint||'root'})));

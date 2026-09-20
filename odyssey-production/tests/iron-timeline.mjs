import assert from 'node:assert/strict';
import fs from 'node:fs';
import {keysAt,locate,setKey,validate} from '../iron-timeline.mjs';
const doc=validate(JSON.parse(fs.readFileSync(new URL('../undaunted-iron-cut.json',import.meta.url))));
assert.equal(doc.shots.reduce((n,s)=>n+s.duration,0),40);
assert.equal(locate(doc.shots,7).i,1);
assert.equal(locate(doc.shots,40).local,8);
const track={keys:[{t:0,pos:[0,0,0],yaw:3.1},{t:2,pos:[10,20,30],yaw:-3.1}]};
assert.deepEqual(keysAt(track.keys,1).pos,[5,10,15]);
assert.ok(Math.abs(keysAt(track.keys,1).yaw-Math.PI)<.001);
setKey(track,{t:1,pos:[9,9,9],yaw:0});assert.deepEqual(keysAt(track.keys,1).pos,[9,9,9]);
setKey(track,{t:1,pos:[8,8,8],yaw:0});assert.equal(track.keys.length,3);
const bad=structuredClone(doc);bad.shots[0].camera[0].target=[NaN,0,0];assert.throws(()=>validate(bad));
for(const s of doc.shots){for(const tr of Object.values(s.tracks)){if(tr.parent)assert.ok(s.tracks[tr.parent]);for(const t of [0,.5,s.duration])assert.ok(keysAt(tr.keys,t).pos.every(Number.isFinite));}}
console.log('PASS: boundaries, deterministic seek, shortest yaw, key replacement, camera validation, attachment references');

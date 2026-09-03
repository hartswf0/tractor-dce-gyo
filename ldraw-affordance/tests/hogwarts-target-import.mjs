import assert from 'node:assert/strict';
import {flattenLDraw,parseMbxScene,parseLxfml,summarizeTarget} from '../beaver-hogwarts/target-import.js';

const mpd=`0 FILE ROOT.ldr
0 STEP
1 4 10 0 0 1 0 0 0 1 0 0 0 1 WING.ldr
0 STEP
1 2 0 -24 0 1 0 0 0 1 0 0 0 1 3005.dat
0 FILE WING.ldr
1 16 20 0 0 0 0 1 0 1 0 -1 0 0 3001.dat
1 1 0 -24 0 1 0 0 0 1 0 0 0 1 3020.dat`;
const l=flattenLDraw(mpd);assert.equal(l.placements.length,3);assert.equal(l.placements[0].partId,'3001');assert.equal(l.placements[0].color,4);assert.deepEqual(l.placements[0].t,[30,0,0]);assert.equal(l.placements[2].source.step,1);

const mbx={metadata:{version:[2,0,0],generator:'mecabricks'},parts:[{type:'solid',version:2,id:7,configuration:'32952',matrix:[1,0,0,4,0,1,0,8,0,0,1,-2,0,0,0,1],objectIndex:3,material:{base:[5],decoration:{}}}],configurations:{'2':{'32952':{name:'32952'}}}};
const m=parseMbxScene(mbx);assert.equal(m.placements.length,1);assert.equal(m.placements[0].partId,'32952');assert.deepEqual(m.placements[0].t,[10,-20,-5]);assert.equal(m.calibration,'candidate-global-mm-to-ldu-only');

const x=`<?xml version="1.0"?><LXFML><Bricks><Brick designID="3001"><Part refID="8" designID="3001" materials="21"><Bone refID="8" transformation="1,0,0,0,1,0,0,0,1,0.8,0,1.6"></Bone></Part></Brick></Bricks></LXFML>`;
const lx=parseLxfml(x);assert.equal(lx.placements.length,1);assert.equal(lx.placements[0].partId,'3001');assert.deepEqual(lx.placements[0].t,[0.8,0,1.6]);

const s=summarizeTarget({...l,placements:[...l.placements,{...l.placements[0],uid:'extra'}]});assert.equal(s.placements,4);assert.equal(s.uniqueParts,3);assert.equal(s.parts[0].count,2);
console.log('BEAVER / HOGWARTS TARGET IMPORT');
console.log('PASS · nested MPD flattening · Mecabricks MBX extraction · LXFML extraction · inventory summary');

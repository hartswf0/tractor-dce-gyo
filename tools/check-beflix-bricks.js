#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
require('../world/dsl.js');
const B=require('../world/beflix-bricks.js');
const make=(code,w,h)=>{const p=B.parse(code,w,h);return p.frames.map(f=>B.assemble(f,w,h,2,1,globalThis.Dsl));};
const door=make('CLR 0\nPNT 0 0 16 10 7\nPNT 6 4 4 6 0\nREC 24',16,10)[0];
assert.equal(door.mismatch,0);assert.equal(door.result.pieces.length,42);assert.equal(door.result.report.floating,0);
assert.match(door.mpd,/parts\/3001.dat/);assert.match(door.mpd,/parts\/3003.dat/);
const diagonal=make('CLR 0\nLIN 0 0 7 7 7\nREC 4',8,8)[0];
assert(diagonal.mismatch>0,'Dropped unsupported cells must be visible to comparison');
assert.equal(make('CLR 0\nREC 1',8,8)[0].result.pieces.length,0);
const p=B.parse('CLR 0\nPNT 0 5 4 3 7\nREC 2\nCLR 0\nPNT 4 6 2 2 7\nREC 3',8,8);
assert.equal(p.ticks,5);assert.equal(p.frames[0].cells[5*8],7);assert.equal(p.frames[1].cells[5*8],0);
for(const code of ['PNT 1 2 3','CLR 8','REC 0','EXEC 1'])assert.throws(()=>B.parse(code,8,8));
console.log('BEFLIX parsing, immutable states, exact doorway projection, missing-cell detection and validation passed.');

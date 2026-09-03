import assert from 'node:assert/strict';
import {createTargetBeaver} from '../beaver-hogwarts/target-beaver.js';
const placements=['a','b','c','d'].map(uid=>({uid,partId:'3001',t:[0,0,0],r:[1,0,0,0,1,0,0,0,1]}));
const edge=(a,b,d=0,normalDot=-1)=>({a,b,d,normalDot,protocol:'STUD_CLUTCH',aPort:{portIndex:0},bPort:{portIndex:0}});
const graph={edges:[edge('a','b'),edge('b','c'),edge('c','d',.2,-1)]};
const b=createTargetBeaver({placements,graph});const r=b.run();assert.equal(r.state.built.size,4);assert.equal(r.state.roots.size,2);assert.equal(r.state.clicks,2);assert.deepEqual(r.components,[3,1]);assert.equal(r.audit.ok,true);assert.equal(r.hear.state,'QUIET');
console.log('BEAVER / HOGWARTS TARGET REPLAY');
console.log('PASS · grows strict certified component · bad edge is not CLICK · isolated remainder starts as explicit loose subassembly');

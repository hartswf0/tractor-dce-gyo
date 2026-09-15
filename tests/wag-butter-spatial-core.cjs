const assert=require('node:assert/strict');const C=require('../src/hand-butter/spatial-core.js');
assert.equal(C.nextFace('front',1),'right');assert.equal(C.nextFace('front',-1),'left');assert.equal(C.nextFace('left',1),'front');
for(const face of ['desk','front','back']){const d=C.hiddenDelta(face,C.hiddenOffset(.6,.4));assert.equal(d[1],0);assert(d[2]<0);}
assert(C.hiddenDelta('top',C.hiddenOffset(.6,.4))[1]>0);
assert.deepEqual(C.coverPoint({x:.25,y:.5},{width:640,height:480},{width:640,height:480}),{x:.75,y:.5});
const p=C.coverPoint({x:.5,y:.5},{width:640,height:480},{width:390,height:700});assert.deepEqual(p,{x:.5,y:.5});
assert.equal(C.chooseTarget([{id:'front'},{id:'back'}],{id:'back',x:10,y:10},{x:12,y:12}),'back');
assert.equal(C.chooseTarget([{id:'front'}],{id:'back',x:10,y:10},{x:12,y:12}),'front');
assert.equal(C.chooseTarget([],{id:'back',x:10,y:10},{x:12,y:12}),null);
console.log('Spatial core: face order, registration, depth direction, and target latching pass.');

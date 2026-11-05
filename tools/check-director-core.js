#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),D=require('../world/director-core.js');
const context={subjects:['odysseus'],shots:[{sec:8}]},p={index:0,on:'odysseus',frame:'close',from:'front',move:'push',lens:40};
assert.equal(D.validate({shots:[p]},context).shots.length,1);
for(const bad of [{...p,sec:1},{...p,on:'invented'},{...p,index:3},{...p,lens:NaN}])assert.throws(()=>D.validate({shots:[bad]},context));
assert.throws(()=>D.validate({shots:[p,p]},context));
const old={sec:8,events:[{what:'SPEAK',for:8}],acts:[{who:'odysseus'}],soundtrack:{file:'scene.mp3'},keys:[]};
const next=D.cameraPatch(old,{sec:1,keys:[{position:'new'}]},p);
assert.equal(next.sec,8);assert.equal(next.events,old.events);assert.equal(next.acts,old.acts);assert.equal(next.soundtrack,old.soundtrack);assert.notEqual(next.keys,old.keys);
console.log('Camera validation and duration/performance preservation passed.');

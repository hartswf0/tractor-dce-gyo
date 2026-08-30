import assert from 'node:assert/strict';
import {HOUSE,CLOSURES,makeSlots,baseplateSupports,moduleForSlot,canSeat,commitModule,totalLeak,leakOf,simulateAll,actionable} from '../beaver-house-water/model.js';

console.log('BEAVER HOUSE / WATER FIELD');
assert.equal(HOUSE.lengthStuds,32,'house length must remain 32 studs');
assert.equal(HOUSE.depthStuds,16,'house depth must remain 16 studs');
assert.equal(HOUSE.wallBricks,7,'wall must remain seven bricks high');
assert.equal(HOUSE.wallHeight,168,'seven brick courses = 168 LDU');

const slots=makeSlots();
assert.equal(slots.filter(s=>s.category==='wall').length,12,'12 envelope wall modules');
assert.equal(slots.filter(s=>s.category==='roof').length,4,'4 roof panels');
assert.equal(slots.filter(s=>s.type==='door').length,1,'one real-scale door opening');
assert.equal(slots.filter(s=>s.type==='window').length,3,'three window openings');
assert.equal(totalLeak(slots),1156,'open shell must be loudly leaking');

const supports=baseplateSupports(),instances=[];
const frontWall=slots.find(s=>s.id==='front-0'),wall=moduleForSlot(frontWall);
const wallProbe={id:'probe-wall',t:frontWall.t,r:frontWall.r};
const wallSeat=canSeat(wallProbe,wall,supports);
assert.equal(wallSeat.ok,true,'8-stud wall module must seat on real baseplate field');
assert.equal(wallSeat.contacts.length,8,'wall module earns eight real stud contacts');

const door=slots.find(s=>s.type==='door');
const doorFrame=moduleForSlot(door),doorProbe={id:'probe-door',t:door.t,r:door.r};
const doorSeat=canSeat(doorProbe,doorFrame,supports);
assert.equal(doorSeat.ok,true,'door frame module must seat by its jambs');
assert.equal(doorSeat.contacts.length,4,'door frame must not invent studs across the doorway');

const window=slots.find(s=>s.type==='window'),windowFrame=moduleForSlot(window),windowProbe={id:'probe-window',t:window.t,r:window.r};
const windowSeat=canSeat(windowProbe,windowFrame,supports);
assert.equal(windowSeat.ok,true,'window frame module must seat on eight studs');
assert.equal(windowSeat.contacts.length,8);

const doorLeak0=leakOf(door);commitModule(door,doorFrame,supports,instances);const doorLeak1=leakOf(door);
assert.equal(doorLeak0,56,'unbuilt door bay leaks like the missing wall bay');
assert.equal(doorLeak1,24,'door frame alone must KEEP leaking');
const doorClosure=moduleForSlot(door);assert.equal(doorClosure,CLOSURES.door);const doorSeal=commitModule(door,doorClosure,supports,instances);
assert.equal(doorSeal.clicks,0,'door leaf is a seal event, never a stud click');
assert.equal(leakOf(door),0,'closed door must stop its flow signal');

const sim=simulateAll();
assert.equal(sim.leak,0,'beaver must not stop while any envelope flow remains');
assert.equal(sim.moves,20,'12 wall/frame moves + 4 roof moves + 4 closure moves');
assert.equal(sim.clicks,152,'only verified stud contacts contribute clicks: 88 wall/base contacts + 64 roof contacts');
assert.equal(sim.slots.every(s=>s.state==='sealed'),true,'every exterior slot ends sealed');
assert.equal(sim.instances.filter(x=>x.closure).length,4,'door + three window closures installed');

const roof=makeSlots().find(s=>s.id==='roof-0'),bareSupports=baseplateSupports();
assert.equal(actionable(roof,bareSupports),null,'roof leak may be loud but roof cannot be placed before walls provide support');

console.log(`PASS · scale ${HOUSE.lengthStuds}×${HOUSE.depthStuds} · ${HOUSE.wallBricks} brick walls`);
console.log(`PASS · initial leak 1156 → final leak ${sim.leak}`);
console.log(`PASS · ${sim.moves} module moves · ${sim.clicks} verified stud clicks · 4 non-click seal closures`);

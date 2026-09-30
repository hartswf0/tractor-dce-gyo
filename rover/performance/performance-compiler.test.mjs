import assert from 'node:assert/strict';
import {
  performancePacket, appendOperation, acceptPass, reopenPass,
  projectHumanIntent, compileSpeech,
} from './performance-compiler.mjs';

let p = performancePacket({
  scene:'OD-B01-S03',
  beat:'hospitality',
  actor:'telemachus',
  why:'a grieving prince notices an unattended stranger and performs hospitality',
  direction:'tenderness',
  binding:{ assembly:'ldraw://cast/telemachus-v1' },
  invariants:['hospitality_read','attention=athena'],
});

assert.throws(() => appendOperation(p, 'HEAD', { op:'TURN', toward:'athena' }), /HIPS cannot begin|HEAD cannot begin before HIPS/);
p = appendOperation(p, 'HIPS', { op:'SETTLE', amount:'SUBTLE' });
p = acceptPass(p, 'HIPS', ['silhouette stable']);
p = appendOperation(p, 'HEAD', { op:'TURN', toward:'athena' });
p = acceptPass(p, 'HEAD', ['eyeline reads']);
p = appendOperation(p, 'ARMS', { op:'OFFER', hand:'R' });
p = acceptPass(p, 'ARMS', ['hospitality reads']);
p = appendOperation(p, 'CARRIAGE', { op:'FOLLOW', source:'VOICE', lagMs:85 });
p = acceptPass(p, 'CARRIAGE');
p = appendOperation(p, 'FACE', { op:'DIRECT', value:'tenderness' });
p = acceptPass(p, 'FACE');

p = reopenPass(p, 'HEAD', 'turn is too weak');
assert.equal(p.passes.find(x => x.name === 'HEAD').status, 'REOPENED');
assert.equal(p.passes.find(x => x.name === 'ARMS').status, 'OPEN');

const projected = projectHumanIntent(
  { channel:'spine.pitch', value:.4 },
  { channels:{ 'root.pitch':{} }, fallbacks:{ 'spine.pitch':{ channel:'root.pitch', reason:'rigid torso' } } }
);
assert.equal(projected.mode, 'PROJECT');
assert.equal(projected.channel, 'root.pitch');

const omitted = projectHumanIntent({ channel:'elbow.flex', value:.8 }, { channels:{ 'arm.pitch':{} } });
assert.equal(omitted.mode, 'OMIT');

const speech = compileSpeech({ audio:'line.wav', text:'Stranger, welcome.', carriageLagMs:85 });
assert.equal(speech.apertureFrom, 'WAVEFORM');
assert.equal(speech.shapeFrom, 'TEXT');
assert.equal(speech.coarticulateMs, 110);

console.log('ROVER performance-compiler: ok');

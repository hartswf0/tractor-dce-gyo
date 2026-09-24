import assert from 'node:assert/strict';
import { actorAssembly, propAssembly, locationFragmentAssembly, stageBinding, bindSource } from './assembly-engine.mjs';

const resolvedActor = {
  operator:'RESOLVE', target:'telemachus',
  selected:{ candidate:'actor-basis', source:'MOVIEATOR', decision:'ADAPT', affordances:['stand','walk','turn_head','gaze','offer_hand','sit'], evidence:['camera silhouette'] }
};

const actor = actorAssembly(resolvedActor, {
  id:'ldraw://cast/telemachus-v1',
  requiredAffordances:['walk','gaze','offer_hand','sit'],
  anchors:{ root:'submodel:torso', head:'pivot:head', 'hand.R':'pivot:hand-r' },
});
assert.equal(actor.kind, 'ACTOR');
assert.ok(actor.affordances.includes('offer_hand'));

const stage = stageBinding(actor, {
  frameId:'OD-B01-S03/F01', cameraId:'OD-B01-S03/CAM-A',
  transform:{ screenRegion:'center-left', depth:'foreground' },
  reason:'Telemachus crosses toward the stranger'
});
const binding = bindSource('character.telemachus', actor, stage);
assert.equal(binding.operator, 'BIND');
assert.equal(binding.sourceAsset, 'character.telemachus');

const resolvedProp = {
  operator:'RESOLVE', target:'athena-spear',
  selected:{ candidate:'spear-basis', source:'LDRAW_MODEL', decision:'REUSE', affordances:['grip','carry','rack'], evidence:[] }
};
const spear = propAssembly(resolvedProp, { id:'ldraw://props/athena-spear-v1', requiredAffordances:['grip','rack'] });
assert.equal(spear.kind, 'PROP');

const resolvedSet = {
  operator:'RESOLVE', target:'palace-threshold',
  selected:{ candidate:'doorway-parts', source:'LDRAW_PART', decision:'ASSEMBLE', affordances:['threshold','entry','occlusion','background_read'], evidence:[] }
};
const threshold = locationFragmentAssembly(resolvedSet, {
  id:'ldraw://sets/ithaca-threshold-shot-a', cameraScope:'OD-B01-S03/CAM-A',
  requiredAffordances:['threshold','entry','occlusion'],
});
assert.equal(threshold.kind, 'LOCATION_FRAGMENT');
assert.equal(threshold.cameraScope, 'OD-B01-S03/CAM-A');

assert.throws(() => locationFragmentAssembly(resolvedSet, { id:'bad' }), /cameraScope/);
console.log('ROVER assembly-engine: ok');

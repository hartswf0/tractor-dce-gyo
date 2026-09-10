import assert from 'node:assert/strict';
import { classifyResolution, rankCandidates, resolveFrontier } from './forage-engine.mjs';

const target = {
  id: 'athena-spear',
  sourceAsset: 'prop.athenas-bronze-spear',
  why: 'visible identity prop',
  referenceRoles: ['PROP','ACTION'],
  mustSupport: ['grip','carry','rack'],
  resolutionOrder: ['REUSE','ADAPT','ASSEMBLE','CUSTOM'],
};

const good = {
  target: 'athena-spear', candidate: 'existing-spear', source: 'LDRAW_MODEL',
  affordances: ['grip','carry','rack'],
  scores: { semantic:.9, affordance:.95, silhouette:.8, camera:.9, continuity:.8, reuse:.7, editCost:.1 },
};

const prettyButWrong = {
  target: 'athena-spear', candidate: 'ornamental-spear', source: 'MOVIEATOR',
  affordances: ['carry'],
  scores: { semantic:.95, affordance:.2, silhouette:.95, camera:.95, continuity:.5, reuse:.5, editCost:.1 },
};

const parts = {
  target: 'athena-spear', candidate: 'shaft-plus-tip', source: 'LDRAW_PART', composable:true,
  affordances: ['grip','carry','rack'],
  scores: { semantic:.65, affordance:.9, silhouette:.7, camera:.8, continuity:.8, reuse:.8, editCost:.45 },
};

assert.equal(classifyResolution(target, prettyButWrong).decision, 'REJECT', 'camera-pretty candidate must fail missing affordances');
assert.equal(classifyResolution(target, good).decision, 'REUSE');
assert.equal(classifyResolution(target, parts).decision, 'ADAPT');

const ranked = rankCandidates(target, [prettyButWrong, parts, good]);
assert.equal(ranked[0].candidate, 'existing-spear');
assert.equal(ranked.at(-1).candidate, 'ornamental-spear');

const frontier = { scene:'OD-B01-S03', operator:'FORAGE', cameraRule:'camera first', targets:[{...target, priority:1}] };
const resolved = resolveFrontier(frontier, [good, prettyButWrong, parts]);
assert.equal(resolved.operator, 'RESOLVE');
assert.equal(resolved.targets[0].selected.candidate, 'existing-spear');
assert.equal(resolved.targets[0].next, 'REUSE');

console.log('ROVER forage-engine: ok');

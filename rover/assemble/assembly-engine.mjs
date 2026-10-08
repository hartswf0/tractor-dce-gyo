const fail = (m) => { throw new Error(`ROVER ASSEMBLE: ${m}`); };
const uniq = (xs = []) => [...new Set(xs.filter(Boolean))];

export const ASSEMBLY_KINDS = Object.freeze(['ACTOR','PROP','LOCATION_FRAGMENT','ENSEMBLE_FRAGMENT','LIGHT_BLOCKER']);

export function assertResolved(resolution) {
  if (!resolution || resolution.operator !== 'RESOLVE') fail('input must come from RESOLVE');
  if (!resolution.selected) fail(`${resolution?.target || 'target'} has no selected candidate`);
  if (resolution.selected.decision === 'REJECT') fail('cannot assemble rejected candidate');
  return resolution;
}

export function assemblyContract(resolution, spec = {}) {
  assertResolved(resolution);
  if (!ASSEMBLY_KINDS.includes(spec.kind)) fail(`unknown assembly kind ${spec.kind}`);
  if (!spec.id) fail('assembly id required');

  const required = uniq(spec.requiredAffordances || []);
  const provided = uniq(spec.affordances || resolution.selected.affordances || []);
  const missing = required.filter((a) => !provided.includes(a));
  if (missing.length) fail(`${spec.id} missing required affordances: ${missing.join(', ')}`);

  return Object.freeze({
    operator: 'ASSEMBLE',
    id: spec.id,
    kind: spec.kind,
    target: resolution.target,
    source: Object.freeze({
      candidate: resolution.selected.candidate,
      source: resolution.selected.source,
      assetRef: resolution.selected.assetRef || null,
      resolution: resolution.selected.decision,
      evidence: Object.freeze([...(resolution.selected.evidence || [])]),
    }),
    cameraScope: spec.cameraScope || null,
    parts: Object.freeze([...(spec.parts || [])]),
    anchors: Object.freeze({ ...(spec.anchors || {}) }),
    zones: Object.freeze({ ...(spec.zones || {}) }),
    affordances: Object.freeze(provided),
    channels: Object.freeze({ ...(spec.channels || {}) }),
    attachments: Object.freeze({ ...(spec.attachments || {}) }),
    keep: Object.freeze(uniq([...(resolution.selected.keep || []), ...(spec.keep || [])])),
    mayChange: Object.freeze(uniq([...(resolution.selected.mayChange || []), ...(spec.mayChange || [])])),
    status: 'ASSEMBLED',
  });
}

export function actorAssembly(resolution, spec = {}) {
  return assemblyContract(resolution, {
    ...spec,
    kind: 'ACTOR',
    requiredAffordances: uniq(['stand','turn_head', ...(spec.requiredAffordances || [])]),
    anchors: {
      root: null,
      head: null,
      'hand.L': null,
      'hand.R': null,
      'foot.L': null,
      'foot.R': null,
      ...(spec.anchors || {}),
    },
    channels: {
      'root.position': { domain:'ROOT' },
      'root.yaw': { domain:'ROOT' },
      'head.yaw': { domain:'BODY' },
      'arm.L': { domain:'BODY' },
      'arm.R': { domain:'BODY' },
      ...(spec.channels || {}),
    },
  });
}

export function propAssembly(resolution, spec = {}) {
  return assemblyContract(resolution, { ...spec, kind:'PROP' });
}

export function locationFragmentAssembly(resolution, spec = {}) {
  if (!spec.cameraScope) fail('LOCATION_FRAGMENT requires cameraScope');
  return assemblyContract(resolution, { ...spec, kind:'LOCATION_FRAGMENT' });
}

export function stageBinding(assembly, placement) {
  if (assembly?.operator !== 'ASSEMBLE') fail('STAGE requires ASSEMBLE output');
  if (!placement?.frameId) fail('STAGE placement.frameId required');
  if (!placement?.cameraId) fail('STAGE placement.cameraId required');
  return Object.freeze({
    operator:'STAGE',
    assembly:assembly.id,
    frameId:placement.frameId,
    cameraId:placement.cameraId,
    transform:Object.freeze({ ...(placement.transform || {}) }),
    visible:placement.visible !== false,
    reason:placement.reason || null,
  });
}

export function bindSource(sourceAsset, assembly, stage) {
  if (!sourceAsset) fail('BIND sourceAsset required');
  if (assembly?.operator !== 'ASSEMBLE') fail('BIND requires assembly');
  if (stage?.operator !== 'STAGE') fail('BIND requires staged assembly');
  if (stage.assembly !== assembly.id) fail('BIND assembly/stage mismatch');
  return Object.freeze({
    operator:'BIND',
    sourceAsset,
    assembly:assembly.id,
    stage,
    affordances:assembly.affordances,
    channels:assembly.channels,
  });
}

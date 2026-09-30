export const REFERENCE_ROLES = Object.freeze([
  'IDENTITY',
  'SILHOUETTE',
  'COSTUME',
  'FACE',
  'PROP',
  'ARCHITECTURE',
  'LAYOUT',
  'MATERIAL',
  'LIGHTING',
  'COMPOSITION',
  'ACTION',
  'CONTINUITY',
]);

export const REQUIREMENT_KINDS = Object.freeze([
  'VISIBLE',
  'INTERACTED',
  'TRAVERSED',
  'OCCLUDER',
  'LIGHTING',
  'CONTINUITY',
]);

const must = (value, label) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`ROVER contract requires ${label}`);
  }
  return value;
};

const oneOf = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  }
  return value;
};

export function reference(input) {
  const roles = [...new Set(input.roles || [])];
  roles.forEach((role) => oneOf(role, REFERENCE_ROLES, 'reference role'));
  return Object.freeze({
    id: must(input.id, 'reference.id'),
    src: must(input.src, 'reference.src'),
    about: input.about ?? null,
    roles: Object.freeze(roles),
    supports: Object.freeze([...(input.supports || [])]),
    doesNotAuthorize: Object.freeze([...(input.doesNotAuthorize || [])]),
    provenance: Object.freeze({ ...(input.provenance || {}) }),
  });
}

export function camera(input) {
  const referenceIds = [...new Set(input.referenceIds || [])];
  if (!referenceIds.length) throw new Error('CAMERA requires at least one REFERENCE');
  return Object.freeze({
    id: must(input.id, 'camera.id'),
    referenceIds: Object.freeze(referenceIds),
    intent: must(input.intent, 'camera.intent'),
    projection: input.projection ?? 'PERSPECTIVE',
    framing: Object.freeze({ ...(input.framing || {}) }),
  });
}

export function frame(input) {
  return Object.freeze({
    id: must(input.id, 'frame.id'),
    cameraId: must(input.cameraId, 'frame.cameraId'),
    at: Number(input.at ?? 0),
    subjects: Object.freeze((input.subjects || []).map((subject) => Object.freeze({
      id: must(subject.id, 'frame.subject.id'),
      sourceAsset: subject.sourceAsset ?? null,
      screenRegion: subject.screenRegion ?? null,
      projectedSize: subject.projectedSize ?? null,
      role: subject.role ?? null,
      required: subject.required !== false,
      reason: subject.reason ?? null,
    }))),
    requirements: Object.freeze((input.requirements || []).map((r) => Object.freeze({ ...r }))),
  });
}

export function requirement(input) {
  const referenceIds = [...new Set(input.referenceIds || [])];
  return Object.freeze({
    id: must(input.id, 'requirement.id'),
    frameId: must(input.frameId, 'requirement.frameId'),
    kind: oneOf(must(input.kind, 'requirement.kind'), REQUIREMENT_KINDS, 'requirement.kind'),
    subject: must(input.subject, 'requirement.subject'),
    reason: must(input.reason, 'requirement.reason'),
    referenceIds: Object.freeze(referenceIds),
    sourceAsset: input.sourceAsset ?? null,
    screenRegion: input.screenRegion ?? null,
    projectedSize: input.projectedSize ?? null,
  });
}

export function requirementsFromFrame(frameContract, cameraContract) {
  if (frameContract.cameraId !== cameraContract.id) {
    throw new Error(`FRAME ${frameContract.id} does not belong to CAMERA ${cameraContract.id}`);
  }

  const visible = frameContract.subjects
    .filter((subject) => subject.required)
    .map((subject, index) => requirement({
      id: `${frameContract.id}/REQ-VISIBLE-${String(index + 1).padStart(2, '0')}`,
      frameId: frameContract.id,
      kind: 'VISIBLE',
      subject: subject.id,
      sourceAsset: subject.sourceAsset,
      reason: subject.reason || `${subject.id} must be legible in ${frameContract.id}`,
      referenceIds: cameraContract.referenceIds,
      screenRegion: subject.screenRegion,
      projectedSize: subject.projectedSize,
    }));

  const explicit = frameContract.requirements.map((r, index) => requirement({
    id: r.id || `${frameContract.id}/REQ-${r.kind || 'EXPLICIT'}-${String(index + 1).padStart(2, '0')}`,
    frameId: frameContract.id,
    referenceIds: cameraContract.referenceIds,
    ...r,
  }));

  return Object.freeze([...visible, ...explicit]);
}

export function forageTarget(input) {
  if (!input.requirementIds?.length) {
    throw new Error('FORAGE target requires at least one FRAME-derived requirement');
  }
  return Object.freeze({
    id: must(input.id, 'forageTarget.id'),
    sourceAsset: input.sourceAsset ?? null,
    requirementIds: Object.freeze([...new Set(input.requirementIds)]),
    function: must(input.function, 'forageTarget.function'),
    mustReadAs: Object.freeze([...(input.mustReadAs || [])]),
    mustSupport: Object.freeze([...(input.mustSupport || [])]),
    mayChange: Object.freeze([...(input.mayChange || [])]),
    queryHints: Object.freeze([...(input.queryHints || [])]),
  });
}

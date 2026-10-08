// LDRAW-ROVER / Odyssey camera-first runtime
// The world is derived from the camera-visible performance requirement.

export const OPERATOR_ORDER = Object.freeze([
  'REFERENCE',
  'CAMERA',
  'FRAME',
  'REQUIRE',
  'FORAGE',
  'RESOLVE',
  'ASSEMBLE',
  'STAGE',
  'BIND',
  'PERFORM',
  'WATCH',
  'REPAIR',
  'COMMIT'
]);

const ORDER = new Map(OPERATOR_ORDER.map((op, i) => [op, i]));

export function createRoverSession({ sceneId, references = [] } = {}) {
  if (!sceneId) throw new Error('ROVER requires a sceneId');

  return {
    schema: 'ldraw-rover.camera-first/v0.1',
    sceneId,
    cursor: -1,
    history: [],
    references: [...references],
    camera: null,
    frame: null,
    requirements: [],
    forage: [],
    resolutions: [],
    assemblies: [],
    stage: [],
    bindings: [],
    performance: [],
    observations: [],
    repairs: [],
    committed: false
  };
}

function assertOperator(op) {
  if (!ORDER.has(op)) throw new Error(`Unknown ROVER operator: ${op}`);
}

function assertPreconditions(session, op) {
  assertOperator(op);
  const target = ORDER.get(op);

  // REPAIR may repeat after WATCH; WATCH may repeat after REPAIR.
  if (op === 'WATCH') {
    if (session.cursor < ORDER.get('PERFORM')) {
      throw new Error('WATCH requires PERFORM');
    }
    return;
  }
  if (op === 'REPAIR') {
    if (!session.observations.length) {
      throw new Error('REPAIR requires WATCH');
    }
    return;
  }
  if (op === 'COMMIT') {
    if (!session.observations.length) {
      throw new Error('COMMIT requires WATCH');
    }
    const last = session.observations.at(-1);
    if (!last.pass) throw new Error('COMMIT blocked: last WATCH did not pass');
    return;
  }

  if (target > session.cursor + 1) {
    const missing = OPERATOR_ORDER.slice(session.cursor + 1, target);
    throw new Error(`${op} blocked; run first: ${missing.join(' → ')}`);
  }
}

function record(session, op, payload) {
  const index = ORDER.get(op);
  if (op !== 'WATCH' && op !== 'REPAIR') {
    session.cursor = Math.max(session.cursor, index);
  }
  session.history.push({ op, payload, at: Date.now() });
  return session;
}

export function operate(session, op, payload = {}) {
  assertPreconditions(session, op);

  switch (op) {
    case 'REFERENCE':
      session.references.push(...(payload.references || []));
      break;

    case 'CAMERA':
      session.camera = normalizeCamera(payload);
      break;

    case 'FRAME':
      session.frame = normalizeFrame(payload, session.camera);
      break;

    case 'REQUIRE':
      session.requirements = deriveRequirements({
        frame: session.frame,
        performance: payload.performance || [],
        continuity: payload.continuity || []
      });
      break;

    case 'FORAGE':
      session.forage = buildForagePlan(
        session.requirements,
        payload.library || 'ldraw'
      );
      break;

    case 'RESOLVE':
      session.resolutions = resolveCandidates(
        session.forage,
        payload.candidates || {}
      );
      break;

    case 'ASSEMBLE':
      session.assemblies = buildAssemblyPlan(
        session.requirements,
        session.resolutions
      );
      break;

    case 'STAGE':
      session.stage = payload.placements || [];
      break;

    case 'BIND':
      session.bindings = payload.bindings || [];
      break;

    case 'PERFORM':
      session.performance = payload.operations || [];
      break;

    case 'WATCH': {
      const result = evaluateWatch(payload.assertions || []);
      session.observations.push(result);
      break;
    }

    case 'REPAIR':
      session.repairs.push(payload);
      break;

    case 'COMMIT':
      session.committed = true;
      break;
  }

  return record(session, op, payload);
}

export function normalizeCamera(camera = {}) {
  return {
    id: camera.id || 'camera-1',
    position: camera.position || null,
    target: camera.target || null,
    lens: camera.lens ?? null,
    framingIntent: camera.framingIntent || '',
    referenceId: camera.referenceId || null
  };
}

export function normalizeFrame(frame = {}, camera) {
  if (!camera) throw new Error('FRAME requires CAMERA');
  return {
    cameraId: camera.id,
    subjects: frame.subjects || [],
    visible: frame.visible || [],
    foreground: frame.foreground || [],
    middle: frame.middle || [],
    background: frame.background || [],
    requiredSilhouettes: frame.requiredSilhouettes || [],
    occluders: frame.occluders || [],
    attention: frame.attention || [],
    entrances: frame.entrances || [],
    exits: frame.exits || []
  };
}

// Camera frontier: no requirement exists merely because the complete fictional
// world contains it. It enters only by a camera/performance/continuity relation.
export function deriveRequirements({ frame, performance = [], continuity = [] }) {
  if (!frame) throw new Error('REQUIRE requires FRAME');

  const req = new Map();
  const add = (id, reason, priority = 1) => {
    if (!id) return;
    const current = req.get(id) || { id, reasons: new Set(), priority: 0 };
    current.reasons.add(reason);
    current.priority = Math.max(current.priority, priority);
    req.set(id, current);
  };

  for (const id of frame.subjects) add(id, 'subject', 10);
  for (const id of frame.visible) add(id, 'visible', 8);
  for (const id of frame.foreground) add(id, 'foreground', 7);
  for (const id of frame.middle) add(id, 'middle', 6);
  for (const id of frame.background) add(id, 'background', 3);
  for (const id of frame.requiredSilhouettes) add(id, 'silhouette', 8);
  for (const id of frame.occluders) add(id, 'occlusion', 5);
  for (const id of frame.entrances) add(id, 'entrance', 7);
  for (const id of frame.exits) add(id, 'exit', 7);

  for (const p of performance) {
    add(p.actor, 'performer', 10);
    add(p.target, 'performance-target', 8);
    add(p.prop, 'touched', 9);
    for (const id of p.traverses || []) add(id, 'traversed', 8);
    for (const id of p.supports || []) add(id, 'supports-performance', 8);
  }

  for (const id of continuity) add(id, 'continuity', 4);

  return [...req.values()]
    .map(x => ({ ...x, reasons: [...x.reasons] }))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

export function buildForagePlan(requirements, library = 'ldraw') {
  return requirements.map(requirement => ({
    requirement,
    library,
    strategy: ['REUSE', 'ADAPT', 'ASSEMBLE', 'CUSTOM'],
    query: buildQuery(requirement)
  }));
}

function buildQuery(requirement) {
  return [requirement.id, ...requirement.reasons]
    .join(' ')
    .replace(/[._:/-]+/g, ' ')
    .trim();
}

export function scoreCandidate(candidate = {}) {
  const positive =
    3 * (candidate.semanticFit || 0) +
    3 * (candidate.affordanceFit || 0) +
    2 * (candidate.silhouetteFit || 0) +
    2 * (candidate.cameraFit || 0) +
    2 * (candidate.rigFit || 0) +
    1 * (candidate.continuityFit || 0) +
    1 * (candidate.reuseValue || 0);

  const negative =
    1.5 * (candidate.editCost || 0) +
    3 * (candidate.incompatibility || 0);

  return positive - negative;
}

export function resolveCandidates(foragePlan, candidatesByRequirement) {
  return foragePlan.map(item => {
    const candidates = candidatesByRequirement[item.requirement.id] || [];
    const ranked = candidates
      .map(candidate => ({ ...candidate, roverScore: scoreCandidate(candidate) }))
      .sort((a, b) => b.roverScore - a.roverScore);

    return {
      requirement: item.requirement,
      selected: ranked[0] || null,
      alternatives: ranked.slice(1)
    };
  });
}

export function buildAssemblyPlan(requirements, resolutions) {
  const selected = new Map(
    resolutions
      .filter(r => r.selected)
      .map(r => [r.requirement.id, r.selected])
  );

  return requirements.map(requirement => ({
    id: requirement.id,
    requiredBecause: requirement.reasons,
    candidate: selected.get(requirement.id) || null,
    build: selected.has(requirement.id) ? 'resolved' : 'unresolved'
  }));
}

export function evaluateWatch(assertions) {
  const failures = assertions.filter(a => a.pass === false);
  return {
    pass: failures.length === 0,
    assertions,
    failures
  };
}

export function nextOperator(session) {
  if (session.committed) return null;
  if (session.observations.length && !session.observations.at(-1).pass) return 'REPAIR';
  return OPERATOR_ORDER[Math.min(session.cursor + 1, OPERATOR_ORDER.length - 1)];
}

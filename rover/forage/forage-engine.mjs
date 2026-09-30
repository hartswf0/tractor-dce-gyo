export const SOURCE_PRIORITY = Object.freeze({
  ROVER_CACHE: 5,
  MOVIEATOR: 4,
  LDRAW_MODEL: 3,
  LDRAW_PART: 2,
  CUSTOM: 1,
});

export const DEFAULT_WEIGHTS = Object.freeze({
  semantic: 1.00,
  affordance: 1.45,
  silhouette: 1.20,
  camera: 1.55,
  continuity: 0.80,
  reuse: 0.65,
  editCost: -0.85,
});

const REQUIRED_SCORE_KEYS = Object.freeze([
  'semantic', 'affordance', 'silhouette', 'camera',
  'continuity', 'reuse', 'editCost',
]);

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

function invariant(condition, message) {
  if (!condition) throw new Error(`ROVER FORAGE: ${message}`);
}

export function assertTarget(target) {
  invariant(target && typeof target === 'object', 'target required');
  invariant(target.id, 'target.id required');
  invariant(target.why, `${target.id}: why required`);
  invariant(Array.isArray(target.mustSupport), `${target.id}: mustSupport[] required`);
  invariant(Array.isArray(target.referenceRoles), `${target.id}: referenceRoles[] required`);
  invariant(Array.isArray(target.resolutionOrder), `${target.id}: resolutionOrder[] required`);
  invariant(target.resolutionOrder.join('>') === 'REUSE>ADAPT>ASSEMBLE>CUSTOM',
    `${target.id}: resolution order must remain REUSE > ADAPT > ASSEMBLE > CUSTOM`);
  return target;
}

export function assertCandidate(candidate) {
  invariant(candidate?.target, 'candidate.target required');
  invariant(candidate?.candidate, 'candidate.candidate required');
  invariant(SOURCE_PRIORITY[candidate.source], `${candidate.candidate}: unknown source ${candidate.source}`);
  invariant(candidate.scores, `${candidate.candidate}: scores required`);
  for (const key of REQUIRED_SCORE_KEYS) {
    invariant(Number.isFinite(Number(candidate.scores[key])), `${candidate.candidate}: scores.${key} required`);
  }
  return candidate;
}

export function weightedScore(candidate, weights = DEFAULT_WEIGHTS) {
  assertCandidate(candidate);
  let sum = 0;
  let norm = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = clamp01(candidate.scores[key]);
    sum += value * weight;
    norm += Math.abs(weight);
  }
  const normalized = norm ? sum / norm : 0;
  return Number(normalized.toFixed(6));
}

export function missingAffordances(target, candidate) {
  assertTarget(target);
  assertCandidate(candidate);
  const offered = new Set(candidate.affordances || []);
  return target.mustSupport.filter((a) => !offered.has(a));
}

export function cameraGate(target, candidate) {
  const missing = missingAffordances(target, candidate);
  const camera = clamp01(candidate.scores.camera);
  const semantic = clamp01(candidate.scores.semantic);
  const silhouette = clamp01(candidate.scores.silhouette);

  // A candidate cannot advance because it is easy to edit if it fails the shot.
  const pass = missing.length === 0 && camera >= 0.55 && semantic >= 0.45 && silhouette >= 0.35;
  return Object.freeze({ pass, missing, camera, semantic, silhouette });
}

export function classifyResolution(target, candidate, weights = DEFAULT_WEIGHTS) {
  const gate = cameraGate(target, candidate);
  if (!gate.pass) return Object.freeze({ decision: 'REJECT', score: weightedScore(candidate, weights), gate });

  const score = weightedScore(candidate, weights);
  const editCost = clamp01(candidate.scores.editCost);
  const source = candidate.source;

  if (score >= 0.60 && editCost <= 0.22 && source !== 'LDRAW_PART' && source !== 'CUSTOM') {
    return Object.freeze({ decision: 'REUSE', score, gate });
  }
  if (score >= 0.43 && editCost <= 0.62 && source !== 'CUSTOM') {
    return Object.freeze({ decision: 'ADAPT', score, gate });
  }
  if (source === 'LDRAW_PART' || candidate.composable === true) {
    return Object.freeze({ decision: 'ASSEMBLE', score, gate });
  }
  return Object.freeze({ decision: 'REJECT', score, gate });
}

export function rankCandidates(target, candidates, weights = DEFAULT_WEIGHTS) {
  assertTarget(target);
  invariant(Array.isArray(candidates), `${target.id}: candidates[] required`);

  return candidates
    .filter((c) => c.target === target.id)
    .map((candidate) => {
      const resolution = classifyResolution(target, candidate, weights);
      return Object.freeze({ ...candidate, ...resolution });
    })
    .sort((a, b) =>
      (b.decision !== 'REJECT') - (a.decision !== 'REJECT') ||
      b.score - a.score ||
      SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source] ||
      a.candidate.localeCompare(b.candidate)
    );
}

export function resolveTarget(target, candidates, options = {}) {
  const ranked = rankCandidates(target, candidates, options.weights || DEFAULT_WEIGHTS);
  const viable = ranked.filter((c) => c.decision !== 'REJECT');
  const shortlist = viable.slice(0, options.shortlist ?? 5);
  const selected = shortlist[0] || null;

  return Object.freeze({
    target: target.id,
    operator: 'RESOLVE',
    selected,
    shortlist,
    rejected: ranked.filter((c) => c.decision === 'REJECT'),
    unresolved: !selected,
    next: selected ? selected.decision : 'CUSTOM',
  });
}

export function resolveFrontier(frontier, candidateInventory, options = {}) {
  invariant(frontier?.operator === 'FORAGE', 'frontier must be produced at FORAGE');
  invariant(Array.isArray(frontier.targets), 'frontier.targets[] required');
  invariant(Array.isArray(candidateInventory), 'candidate inventory required');

  const ordered = [...frontier.targets].sort((a, b) => a.priority - b.priority);
  return Object.freeze({
    scene: frontier.scene,
    operator: 'RESOLVE',
    cameraRule: frontier.cameraRule,
    targets: Object.freeze(ordered.map((target) => resolveTarget(target, candidateInventory, options))),
  });
}

const fail = (m) => { throw new Error(`ROVER WATCH: ${m}`); };

export const ASSERTION_KINDS = Object.freeze([
  'READS_AS','NOT_READS_AS','VISIBLE','OCCLUDED','ATTENTION','SILHOUETTE',
  'AFFORDANCE','EYELINE','FOCUS','CLIPPING','LIGHTING','CONTINUITY','TIMING',
]);

export const REPAIR_SCOPES = Object.freeze([
  'CAMERA','FRAME','ASSEMBLY','STAGE','BODY_HIPS','BODY_HEAD','BODY_ARMS',
  'CARRIAGE','FACE','SPEECH','LIGHT','MATERIAL',
]);

function assertKind(kind) {
  if (!ASSERTION_KINDS.includes(kind)) fail(`unknown assertion kind ${kind}`);
}

export function assertion(input) {
  if (!input?.id) fail('assertion.id required');
  assertKind(input.kind);
  if (!input.subject) fail(`${input.id}: subject required`);
  return Object.freeze({
    id:input.id,
    kind:input.kind,
    subject:input.subject,
    expected:input.expected ?? true,
    hard:input.hard !== false,
    source:input.source || 'CAMERA',
    repairScope:input.repairScope || null,
    reason:input.reason || null,
  });
}

export function watch({ scene, frameId, cameraId, assertions = [], observations = [] }) {
  if (!scene || !frameId || !cameraId) fail('WATCH requires scene, frameId, cameraId');
  const byId = new Map(observations.map((o) => [o.assertionId, o]));
  const results = assertions.map((a0) => {
    const a = assertion(a0);
    const obs = byId.get(a.id);
    const observed = obs?.value;
    const pass = obs ? Object.is(observed, a.expected) : false;
    return Object.freeze({ assertion:a, observed, pass, evidence:obs?.evidence || null });
  });

  return Object.freeze({
    operator:'WATCH', scene, frameId, cameraId,
    results:Object.freeze(results),
    failures:Object.freeze(results.filter((r) => !r.pass)),
    passed:results.every((r) => r.pass || !r.assertion.hard),
  });
}

export function repairPlan(watchResult) {
  if (watchResult?.operator !== 'WATCH') fail('REPAIR requires WATCH output');
  const repairs = watchResult.failures.map((failure) => {
    const scope = failure.assertion.repairScope;
    if (!scope) fail(`${failure.assertion.id}: failing assertion has no repairScope`);
    if (!REPAIR_SCOPES.includes(scope)) fail(`${failure.assertion.id}: unknown repair scope ${scope}`);
    return Object.freeze({
      assertionId:failure.assertion.id,
      scope,
      subject:failure.assertion.subject,
      reason:failure.assertion.reason || `${failure.assertion.kind} failed`,
      preserve:Object.freeze(
        watchResult.results.filter((r) => r.pass).map((r) => r.assertion.id)
      ),
    });
  });
  return Object.freeze({ operator:'REPAIR', scene:watchResult.scene, repairs:Object.freeze(repairs) });
}

export function commitTake({ watch:watchResult, takeId, bindings = [], operations = [] }) {
  if (watchResult?.operator !== 'WATCH') fail('COMMIT requires WATCH output');
  if (!takeId) fail('takeId required');
  if (!watchResult.passed) fail('cannot COMMIT while hard assertions fail');
  return Object.freeze({
    operator:'COMMIT',
    takeId,
    scene:watchResult.scene,
    frameId:watchResult.frameId,
    cameraId:watchResult.cameraId,
    bindings:Object.freeze([...bindings]),
    operations:Object.freeze([...operations]),
    assertions:Object.freeze(watchResult.results.map((r) => ({ id:r.assertion.id, pass:r.pass, observed:r.observed }))),
    status:'COMMITTED',
  });
}

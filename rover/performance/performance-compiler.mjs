export const GLOBAL_OPERATOR_ORDER = Object.freeze([
  'REFERENCE','CAMERA','FRAME','REQUIRE','FORAGE','RESOLVE','ASSEMBLE',
  'STAGE','BIND','PERFORM','WATCH','REPAIR','COMMIT',
]);

export const PERFORMANCE_PASS_ORDER = Object.freeze([
  'HIPS','HEAD','ARMS','CARRIAGE','FACE',
]);

export const TEMPORAL_DOMAINS = Object.freeze({
  CAMERA: { fps: 24, interpolation: 'CONTINUOUS' },
  ROOT: { fps: 24, interpolation: 'CONTINUOUS' },
  BODY: { fps: 12, interpolation: 'DISCRETE' },
  FACE: { fps: 12, interpolation: 'DISCRETE' },
});

const fail = (msg) => { throw new Error(`ROVER PERFORMANCE: ${msg}`); };
const uniq = (xs = []) => [...new Set(xs.filter(Boolean))];

export function assertPerformanceContext(ctx) {
  if (!ctx?.scene) fail('scene required');
  if (!ctx?.actor) fail('actor required');
  if (!ctx?.beat) fail('beat required');
  if (!ctx?.why) fail('WHY required before DIRECTION');
  if (!ctx?.direction) fail('DIRECTION required');
  if (!ctx?.binding) fail('BIND must exist before PERFORM');
  if (!ctx.binding.assembly) fail('bound LDraw assembly required');
  return ctx;
}

export function performancePacket(ctx) {
  assertPerformanceContext(ctx);
  return Object.freeze({
    scene: ctx.scene,
    beat: ctx.beat,
    actor: ctx.actor,
    why: ctx.why,
    direction: ctx.direction,
    binding: Object.freeze({ ...ctx.binding }),
    attention: Object.freeze({ ...(ctx.attention || {}) }),
    actions: Object.freeze([...(ctx.actions || [])]),
    speech: ctx.speech ? Object.freeze({ ...ctx.speech }) : null,
    invariants: Object.freeze(uniq(ctx.invariants)),
    passes: Object.freeze(PERFORMANCE_PASS_ORDER.map((name) => Object.freeze({
      name,
      status: 'OPEN',
      operations: Object.freeze([]),
    }))),
    temporal: Object.freeze({ ...TEMPORAL_DOMAINS, ...(ctx.temporal || {}) }),
  });
}

export function orderedPassIndex(name) {
  const i = PERFORMANCE_PASS_ORDER.indexOf(name);
  if (i < 0) fail(`unknown pass ${name}`);
  return i;
}

export function appendOperation(packet, passName, op) {
  const i = orderedPassIndex(passName);
  const prior = packet.passes.slice(0, i);
  const unacceptedPrior = prior.find((p) => p.status !== 'ACCEPTED');
  if (unacceptedPrior) fail(`${passName} cannot begin before ${unacceptedPrior.name} is ACCEPTED`);

  const passes = packet.passes.map((p, index) => index === i
    ? Object.freeze({ ...p, operations: Object.freeze([...p.operations, Object.freeze({ ...op })]) })
    : p);
  return Object.freeze({ ...packet, passes: Object.freeze(passes) });
}

export function acceptPass(packet, passName, observations = []) {
  const i = orderedPassIndex(passName);
  const passes = packet.passes.map((p, index) => index === i
    ? Object.freeze({ ...p, status: 'ACCEPTED', observations: Object.freeze([...observations]) })
    : p);
  return Object.freeze({ ...packet, passes: Object.freeze(passes) });
}

export function reopenPass(packet, passName, reason) {
  const i = orderedPassIndex(passName);
  if (!reason) fail('REOPEN requires reason');
  // Reopening an earlier pass invalidates every dependent later pass.
  const passes = packet.passes.map((p, index) => index < i ? p : Object.freeze({
    ...p,
    status: index === i ? 'REOPENED' : 'OPEN',
    reopenReason: index === i ? reason : undefined,
  }));
  return Object.freeze({ ...packet, passes: Object.freeze(passes) });
}

export function projectHumanIntent(intent, rig) {
  if (!intent?.channel) fail('projection intent.channel required');
  if (!rig?.channels) fail('rig.channels required');

  const available = new Set(Object.keys(rig.channels));
  if (available.has(intent.channel)) {
    return Object.freeze({ mode:'DIRECT', channel:intent.channel, value:intent.value });
  }

  const fallback = rig.fallbacks?.[intent.channel];
  if (fallback && available.has(fallback.channel)) {
    return Object.freeze({
      mode:'PROJECT',
      sourceChannel:intent.channel,
      channel:fallback.channel,
      value: typeof fallback.map === 'function' ? fallback.map(intent.value) : intent.value,
      reason:fallback.reason || 'unsupported human DOF projected to LEGO articulation',
    });
  }

  if (intent.cheat?.channel && available.has(intent.cheat.channel)) {
    return Object.freeze({
      mode:'CHEAT',
      sourceChannel:intent.channel,
      channel:intent.cheat.channel,
      value:intent.cheat.value ?? intent.value,
      reason:intent.cheat.reason || 'declared perceptual cheat',
      keep:Object.freeze(uniq(intent.cheat.keep)),
    });
  }

  return Object.freeze({ mode:'OMIT', sourceChannel:intent.channel, reason:'no readable LEGO articulation available' });
}

export function compileSpeech(speech) {
  if (!speech) return null;
  if (!speech.audio) fail('speech.audio required');
  if (!speech.text) fail('speech.text required');
  return Object.freeze({
    clock: 'AUDIO',
    audio: speech.audio,
    text: speech.text,
    apertureFrom: 'WAVEFORM',
    shapeFrom: 'TEXT',
    coarticulateMs: Number(speech.coarticulateMs ?? 110),
    carriage: Object.freeze({ source:'VOICE_ENERGY', lagMs:Number(speech.carriageLagMs ?? 85), amount:speech.carriageAmount ?? 'SUBTLE' }),
  });
}

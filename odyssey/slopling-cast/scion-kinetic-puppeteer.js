/*
 * SCION KINETIC PUPPETEER — odyssey/slopling-cast/scion-kinetic-puppeteer.js
 *
 * Synthesizes:
 *   - Lineage #1  Terry Gilliam — Comic Cutout Metamorphosis & Proscenium Operators
 *   - Lineage #13/#41 Nora Willett — Secondary Motion Swarm & Damped Spring Dynamics
 *   - Lineage #14/#38 Pose2Pose — Expressive 15-Part Full-Body Acting Presets
 *   - Lineage #16 JibJab — Recastable E00–E17 Emotion Head-Mount Compositor
 *   - Lineage #32 Forward Kinematics & Lineage #33 Analytic Two-Bone Inverse Kinematics
 *   - Lineage #46 Face Landmark Registration — Collar/Pivot Alignment at [512, 302]
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ScionKineticPuppeteer = api;
  }
  if (typeof window !== 'undefined') {
    window.ScionKineticPuppeteer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function (root) {
  'use strict';

  const PART_IDS = [
    'pelvis',
    'torso',
    'head',
    'upper_arm_left',
    'forearm_left',
    'hand_left',
    'upper_arm_right',
    'forearm_right',
    'hand_right',
    'thigh_left',
    'shin_left',
    'boot_left',
    'thigh_right',
    'shin_right',
    'boot_right'
  ];

  // Face Landmark Registration (#46) for mounting E00–E17 (172x260 crops) onto
  // Watson's 15-part rig head slot (rect [384, 0, 253, 338], pivot [512, 302]).
  const HEAD_LANDMARK_MOUNT = {
    pivot: [512, 302],
    headRect: [384, 0, 253, 338],
    centerGlobalX: 512,
    topGlobalY: -4,
    scale: 1.29,
    collarSplitY: 262
  };

  function definePose(rotations, label, note, verbs, emotions) {
    const obj = Object.assign({}, rotations);
    Object.defineProperties(obj, {
      rotations: { value: obj, enumerable: false, configurable: true },
      label: { value: label, enumerable: false, configurable: true },
      note: { value: note, enumerable: false, configurable: true },
      verbs: { value: verbs || [], enumerable: false, configurable: true },
      emotions: { value: emotions || [], enumerable: false, configurable: true }
    });
    return obj;
  }

  // 12 Expressive Full-Body Rotation Presets for the 15-Part WatsonRig
  const RIG_POSES = {
    neutral: definePose(
      {},
      'Neutral Stance',
      'Balanced proscenium rest posture',
      ['idle', 'stand', 'neutral', 'wait'],
      ['E00']
    ),
    arm_bend: definePose(
      { torso: -1.5, head: -4, upper_arm_left: -14, forearm_left: -52, hand_left: 12, upper_arm_right: 8, forearm_right: -18 },
      'Calipers / Measure',
      'Checking tolerances with brass calipers and deliberate poise',
      ['measure', 'calipers', 'inspect', 'examine', 'verify', 'focus', 'skeptical'],
      ['E01', 'E03']
    ),
    foot_lift: definePose(
      { pelvis: 1, torso: 1.5, head: 2, thigh_left: 8, shin_left: -6, thigh_right: -22, shin_right: 42, boot_right: -18, upper_arm_left: 14, forearm_left: -20, upper_arm_right: -12, forearm_right: -15 },
      'Step / Departure',
      'Stepping out across the threshold onto the Odyssey road',
      ['step', 'walk', 'depart', 'stride', 'journey', 'road', 'embark'],
      ['E00', 'E02']
    ),
    reach: definePose(
      { torso: 2, head: 4, upper_arm_left: -34, forearm_left: -44, hand_left: -10, upper_arm_right: 12, forearm_right: 18, thigh_left: -6, shin_left: 8 },
      'Offer Hand / Orchard',
      'Warm forward extension offering craft proof or greeting',
      ['reach', 'offer', 'give', 'hand', 'welcome', 'share', 'connect'],
      ['E06', 'E14', 'E15']
    ),
    recoil: definePose(
      { pelvis: -1.5, torso: -2.5, head: -7, upper_arm_left: 22, forearm_left: -56, hand_left: -16, upper_arm_right: -24, forearm_right: 48, hand_right: 14, thigh_left: 10, shin_left: -14, thigh_right: -8, shin_right: 14 },
      'Interrupted / Alarm',
      'Sudden defensive jolt back from monster or abrupt interruption',
      ['recoil', 'startle', 'alarm', 'interrupted', 'jolt', 'flinch', 'monster'],
      ['E08', 'E14']
    ),
    refuse: definePose(
      { pelvis: 0, torso: -1.5, head: -5, upper_arm_left: -18, forearm_left: -64, hand_left: -22, upper_arm_right: 10, forearm_right: -24 },
      'Hold / Measured Refusal',
      'Composed palm-up refusal and clear boundary',
      ['refuse', 'hold', 'decline', 'boundary', 'stop', 'no', 'resist'],
      ['E02', 'E16']
    ),
    bow_draw: definePose(
      { pelvis: -1, torso: 2, head: 4, upper_arm_left: -52, forearm_left: -10, hand_left: -5, upper_arm_right: 34, forearm_right: 64, hand_right: 12, thigh_left: -10, shin_left: 12, thigh_right: 10, shin_right: -8 },
      'Trial of the Bow',
      'Full-tension draw aligned through the twelve axe rings',
      ['bow', 'draw', 'aim', 'shoot', 'axes', 'trial', 'tension', 'suitors'],
      ['E01', 'E09', 'E16']
    ),
    listen: definePose(
      { torso: 1.5, head: 5, upper_arm_left: 6, forearm_left: -22, upper_arm_right: -6, forearm_right: 20 },
      'Guild / Wayfinding Listen',
      'Attentive forward tilt reading ocean swells and master counsel',
      ['listen', 'attentive', 'wayfind', 'guild', 'navigate', 'hear', 'counsel'],
      ['E00', 'E11', 'E13']
    ),
    exhausted: definePose(
      { pelvis: 1, torso: 2.5, head: 8, upper_arm_left: 10, forearm_left: 8, upper_arm_right: -8, forearm_right: -6, thigh_left: -5, shin_left: 10, boot_left: -5 },
      'Slop Fatigue',
      'Heavy-shouldered slump under bureaucratic and sea exhaustion',
      ['exhausted', 'fatigue', 'tired', 'slump', 'weary', 'heavy', 'drain'],
      ['E04', 'E07', 'E10', 'E12']
    ),
    graft: definePose(
      { pelvis: 0.5, torso: 2, head: 5, upper_arm_left: -24, forearm_left: -48, hand_left: 14, upper_arm_right: -20, forearm_right: 44, hand_right: -12 },
      'Orchard Calipers & Knife',
      'Two-handed close-in joinery and orchard bark grafting',
      ['graft', 'orchard', 'knife', 'prune', 'carve', 'joinery', 'craft', 'tree'],
      ['E07', 'E17']
    ),
    proclaim: definePose(
      { torso: -1.5, head: -4, upper_arm_left: -38, forearm_left: -26, hand_left: -12, upper_arm_right: 34, forearm_right: 24, hand_right: 10 },
      'Stage Address',
      'Open-armed theatrical declaration to the assembly',
      ['proclaim', 'address', 'declare', 'announce', 'speak', 'stage', 'present'],
      ['E05', 'E06']
    ),
    guard: definePose(
      { pelvis: -1.5, torso: -2, head: -4, upper_arm_left: -26, forearm_left: -52, upper_arm_right: 22, forearm_right: 48, thigh_left: -12, shin_left: 18, boot_left: -6, thigh_right: 12, shin_right: -8 },
      'Brace Against Siren / Cyclops',
      'Low-center braced stance against storm, Siren song, or Cyclops',
      ['guard', 'brace', 'defend', 'shield', 'siren', 'cyclops', 'storm', 'hold_fast'],
      ['E08', 'E09', 'E16']
    )
  };

  function installPresetsIntoWatsonRig(watsonRig) {
    const rig = watsonRig || (root && root.WatsonRig) || (typeof window !== 'undefined' && window.WatsonRig);
    if (!rig || !rig.PRESETS) return false;
    Object.keys(RIG_POSES).forEach(function (key) {
      const p = RIG_POSES[key];
      rig.PRESETS[key] = {
        label: p.label || key,
        note: p.note || '',
        rotations: Object.assign({}, p)
      };
    });
    return true;
  }

  // Install immediately if WatsonRig is already loaded
  installPresetsIntoWatsonRig();

  // Select the most expressive 15-part pose preset for any emotion code, action cue, and beat ID
  function posePresetForEmotionAndCue(emotionCode, actionCue, beatId) {
    const emo = String(emotionCode || 'E00').trim().toUpperCase();
    const cue = String(actionCue || '').trim().toLowerCase();
    const beat = String(beatId || '').trim().toLowerCase();
    const combined = cue + ' ' + beat;

    // Direct preset name match if caller passes a preset name in cue
    if (RIG_POSES[cue]) return cue;

    // High-specificity acting verb matching on actionCue first
    if (/\b(recoil|startle|alarm|jolt|flinch|interrupted|monster|ambush|horror|panic)\b/.test(combined)) {
      return 'recoil';
    }
    if (/\b(bow|arrow|axes|string|suitor|shoot|aim)\b/.test(combined) || /^beat_(8[5-9]|9[0-2])\b/.test(beat)) {
      return 'bow_draw';
    }
    if (/\b(graft|orchard|knife|scab|bark|fig|olive|laertes|root|prune)\b/.test(combined) || /^beat_9[4-9]\b/.test(beat)) {
      return 'graft';
    }
    if (/\b(caliper|measure|tolerance|spec|blueprint|gauge|inspect|examine)\b/.test(combined)) {
      return 'arm_bend';
    }
    if (/\b(siren|cyclops|polyphemus|scylla|charybdis|brace|lash|mast|shield|guard|boulder)\b/.test(combined) || /^beat_(3[4-9]|4[01]|5[1-9]|6\d)\b/.test(beat)) {
      if (emo === 'E08' || emo === 'E14') {
        return 'recoil';
      }
      return 'guard';
    }
    if (/\b(refuse|decline|boundary|no\b|stop|hold\b|reject|enough|withhold)\b/.test(combined)) {
      return 'refuse';
    }
    if (/\b(offer|reach|extend|hand|welcome|gift|share|touch|embrace)\b/.test(combined)) {
      return 'reach';
    }
    if (/\b(proclaim|declare|announce|address|toast|public|stage|behold)\b/.test(combined)) {
      return 'proclaim';
    }
    if (/\b(step|walk|stride|depart|leave|road|embark|horizon|foot)\b/.test(combined) || /^beat_(19|2[0-4]|47)\b/.test(beat)) {
      return 'foot_lift';
    }
    if (/\b(exhaust|fatigue|tired|weary|slump|collapse|sleep|heavy|burnout|slop)\b/.test(combined)) {
      return 'exhausted';
    }
    if (/\b(listen|wayfind|swell|star|pilot|mau|attentive|hear|whisper|counsel)\b/.test(combined) || /^beat_(4[89]|50)\b/.test(beat)) {
      return 'listen';
    }

    // Emotion code defaults mapped to the 12 presets
    const EMOTION_TO_PRESET = {
      E00: 'listen',
      E01: 'arm_bend',
      E02: 'refuse',
      E03: 'arm_bend',
      E04: 'exhausted',
      E05: 'proclaim',
      E06: 'reach',
      E07: 'exhausted',
      E08: 'recoil',
      E09: 'guard',
      E10: 'exhausted',
      E11: 'listen',
      E12: 'exhausted',
      E13: 'listen',
      E14: 'recoil',
      E15: 'reach',
      E16: 'refuse',
      E17: 'graft'
    };

    if (cue === 'neutral' || cue === 'rest') return 'neutral';
    return EMOTION_TO_PRESET[emo] || 'neutral';
  }

  // Per-joint spring-damper parameters & secondary-motion hierarchy (Nora Willett #13/#41)
  const JOINT_PHYSICS = {
    pelvis:          { parent: null,              stiffness: 170, damping: 20, secondaryFollow: 0.00, breathScale: 0.15, speechScale: 0.08 },
    torso:           { parent: 'pelvis',          stiffness: 155, damping: 18, secondaryFollow: 0.18, breathScale: 0.85, speechScale: 0.35 },
    head:            { parent: 'torso',           stiffness: 120, damping: 13, secondaryFollow: 0.42, breathScale: -0.45, speechScale: 1.15 },
    upper_arm_left:  { parent: 'torso',           stiffness: 145, damping: 17, secondaryFollow: 0.22, breathScale: -0.35, speechScale: -0.45 },
    forearm_left:    { parent: 'upper_arm_left',  stiffness:  95, damping: 10, secondaryFollow: 0.55, breathScale: -0.50, speechScale: -1.25 },
    hand_left:       { parent: 'forearm_left',    stiffness:  75, damping:  8, secondaryFollow: 0.68, breathScale: -0.25, speechScale: -0.90 },
    upper_arm_right: { parent: 'torso',           stiffness: 145, damping: 17, secondaryFollow: 0.22, breathScale: 0.35, speechScale: 0.40 },
    forearm_right:   { parent: 'upper_arm_right', stiffness:  95, damping: 10, secondaryFollow: 0.55, breathScale: 0.50, speechScale: 0.95 },
    hand_right:      { parent: 'forearm_right',   stiffness:  75, damping:  8, secondaryFollow: 0.68, breathScale: 0.25, speechScale: 0.75 },
    thigh_left:      { parent: 'pelvis',          stiffness: 165, damping: 19, secondaryFollow: 0.15, breathScale: 0.00, speechScale: 0.00 },
    shin_left:       { parent: 'thigh_left',      stiffness: 130, damping: 15, secondaryFollow: 0.32, breathScale: 0.00, speechScale: 0.00 },
    boot_left:       { parent: 'shin_left',       stiffness:  90, damping: 10, secondaryFollow: 0.48, breathScale: 0.00, speechScale: 0.00 },
    thigh_right:     { parent: 'pelvis',          stiffness: 165, damping: 19, secondaryFollow: 0.15, breathScale: 0.00, speechScale: 0.00 },
    shin_right:      { parent: 'thigh_right',     stiffness: 130, damping: 15, secondaryFollow: 0.32, breathScale: 0.00, speechScale: 0.00 },
    boot_right:      { parent: 'shin_right',      stiffness:  90, damping: 10, secondaryFollow: 0.48, breathScale: 0.00, speechScale: 0.00 }
  };

  function resolvePoseRotations(poseOrPreset, amount) {
    const scale = amount === undefined ? 1 : Math.max(0, Math.min(1.5, Number(amount)));
    let raw = {};
    if (typeof poseOrPreset === 'string') {
      if (RIG_POSES[poseOrPreset]) {
        raw = RIG_POSES[poseOrPreset];
      } else if (root && root.WatsonRig && root.WatsonRig.PRESETS && root.WatsonRig.PRESETS[poseOrPreset]) {
        raw = root.WatsonRig.PRESETS[poseOrPreset].rotations || {};
      }
    } else if (poseOrPreset && typeof poseOrPreset === 'object') {
      raw = poseOrPreset.rotations && typeof poseOrPreset.rotations === 'object'
        ? poseOrPreset.rotations
        : poseOrPreset;
    }
    const out = {};
    PART_IDS.forEach(function (id) {
      out[id] = (Number(raw[id]) || 0) * scale;
    });
    return out;
  }

  function createKineticState(initialPoseOrPreset, options) {
    options = options || {};
    const amount = options.amount === undefined ? 1 : Number(options.amount);
    const initialTargets = resolvePoseRotations(initialPoseOrPreset || 'neutral', amount);
    const joints = {};
    PART_IDS.forEach(function (id) {
      const spec = JOINT_PHYSICS[id];
      const angle = initialTargets[id] || 0;
      joints[id] = {
        angle: angle,
        velocity: 0,
        target: angle,
        stiffness: spec.stiffness,
        damping: spec.damping,
        secondaryFollow: spec.secondaryFollow
      };
    });
    return {
      joints: joints,
      currentRotations: Object.assign({}, initialTargets),
      activePreset: typeof initialPoseOrPreset === 'string' ? initialPoseOrPreset : 'custom',
      poseAmount: amount,
      time: 0,
      lastTimestamp: 0,
      breathRateHz: options.breathRateHz || 0.38,
      breathAmplitude: options.breathAmplitude === undefined ? 1.15 : Number(options.breathAmplitude),
      speechImpulse: 0,
      speechVelocity: 0,
      speechPhase: 0,
      mountEmotionHead: options.mountEmotionHead !== false,
      emotionCode: options.emotionCode || 'E00'
    };
  }

  const defaultKineticState = createKineticState('neutral');

  function ensureKineticState(state) {
    if (!state || typeof state !== 'object') return defaultKineticState;
    if (!state.joints) {
      const upgraded = createKineticState(state.preset || state.activePreset || 'neutral', state);
      Object.assign(state, upgraded);
    }
    return state;
  }

  function setTargetPose(stateOrPreset, presetOrRotations, amount) {
    let state = defaultKineticState;
    let poseInput = stateOrPreset;
    let amt = presetOrRotations;
    if (stateOrPreset && typeof stateOrPreset === 'object' && (stateOrPreset.joints || stateOrPreset.currentRotations)) {
      state = ensureKineticState(stateOrPreset);
      poseInput = presetOrRotations;
      amt = amount;
    }
    const effectiveAmount = amt === undefined ? (state.poseAmount === undefined ? 1 : state.poseAmount) : Number(amt);
    const targets = resolvePoseRotations(poseInput, effectiveAmount);
    state.activePreset = typeof poseInput === 'string' ? poseInput : 'custom';
    state.poseAmount = effectiveAmount;
    PART_IDS.forEach(function (id) {
      if (state.joints[id]) {
        state.joints[id].target = targets[id] || 0;
      }
    });
    return state;
  }

    // Set or pulse speech-cadence viseme/gesture envelope (safe at 30fps continuous calls)
  function applySpeechImpulse(stateOrAmplitude, maybeAmplitude) {
    let state = defaultKineticState;
    let amplitude = 0.5;
    if (typeof stateOrAmplitude === 'number' || stateOrAmplitude === undefined) {
      amplitude = stateOrAmplitude === undefined ? 0.5 : Number(stateOrAmplitude);
    } else if (stateOrAmplitude && typeof stateOrAmplitude === 'object') {
      state = ensureKineticState(stateOrAmplitude);
      amplitude = maybeAmplitude === undefined ? 0.5 : Number(maybeAmplitude);
    }
    const clamped = Math.max(0, Math.min(1.0, Number(amplitude) || 0));
    // Smoothly track the incoming 0..1 envelope rather than accumulating unbounded velocity
    state.speechImpulse = state.speechImpulse * 0.6 + clamped * 0.4;
    state.speechPhase = (state.speechPhase || 0) + 0.42;

    // Gentle zero-mean alternating micro-impulse on gesturing joints
    PART_IDS.forEach(function (id) {
      const spec = JOINT_PHYSICS[id];
      const j = state.joints[id];
      if (!j || !spec.speechScale) return;
      const wave = Math.sin((state.speechPhase || 0) + (id.indexOf('right') !== -1 ? 1.57 : 0));
      j.velocity += spec.speechScale * clamped * 4.5 * wave;
      j.velocity = Math.max(-45, Math.min(45, j.velocity));
    });
    return state;
  }

  // Step damped spring-physics + secondary motion drag/follow-through with anatomical joint clamps
  function stepPhysics(state, dtSeconds) {
    state = ensureKineticState(state);
    const dt = Math.max(0.001, Math.min(0.033, Number(dtSeconds) || (1 / 60)));
    state.time = (state.time || 0) + dt;

    // Smoothly decay speech envelope when no new speech tick arrives
    state.speechImpulse = Math.max(0, (state.speechImpulse || 0) * Math.exp(-6.5 * dt));
    if (state.speechImpulse > 0.01) {
      state.speechPhase = (state.speechPhase || 0) + dt * 9.5;
    }

    const breathAngle = Math.sin(state.time * Math.PI * 2 * (state.breathRateHz || 0.38)) * (state.breathAmplitude === undefined ? 1.0 : state.breathAmplitude);
    const speechOsc = Math.sin(state.speechPhase || 0) * (state.speechImpulse || 0) * 2.2;

    const MAX_EXCURSION = {
      pelvis: 5,
      torso: 8,
      head: 12,
      upper_arm_left: 16,
      forearm_left: 20,
      hand_left: 18,
      upper_arm_right: 16,
      forearm_right: 20,
      hand_right: 18,
      thigh_left: 12,
      shin_left: 14,
      boot_left: 12,
      thigh_right: 12,
      shin_right: 14,
      boot_right: 12
    };

    const parentDeltaVel = {};
    const outRotations = {};

    PART_IDS.forEach(function (id) {
      const spec = JOINT_PHYSICS[id];
      const j = state.joints[id];
      const prevVel = j.velocity || 0;

      // Secondary motion drag: child lags behind parent angular acceleration (bounded)
      let secondaryTorque = 0;
      if (spec.parent && spec.secondaryFollow && parentDeltaVel[spec.parent]) {
        secondaryTorque = Math.max(-40, Math.min(40, -parentDeltaVel[spec.parent] * spec.secondaryFollow * 4.5));
      }

      const displacement = j.angle - j.target;
      const springForce = -j.stiffness * displacement - j.damping * j.velocity + secondaryTorque;
      j.velocity = Math.max(-60, Math.min(60, j.velocity + springForce * dt));
      j.angle += j.velocity * dt;

      // Clamp maximum excursion around target pose so no joint ever spins out of socket
      const maxExc = MAX_EXCURSION[id] || 15;
      if (j.angle > j.target + maxExc) {
        j.angle = j.target + maxExc;
        j.velocity *= 0.2;
      } else if (j.angle < j.target - maxExc) {
        j.angle = j.target - maxExc;
        j.velocity *= 0.2;
      }

      parentDeltaVel[id] = j.velocity - prevVel;

      // Layer subtle breathing + speech cadence onto instantaneous rotation
      const breathOffset = (spec.breathScale || 0) * breathAngle;
      const speechOffset = (spec.speechScale || 0) * speechOsc;
      outRotations[id] = j.angle + breathOffset + speechOffset;
    });

    state.currentRotations = outRotations;
    return outRotations;
  }

  // Analytic 2-bone Inverse Kinematics (#33) for viewer-left or viewer-right arm
  function solveTwoBoneArmIK(side, targetXY, manifest, baseRotations) {
    const mf = manifest || (root && root.WATSON_RIG_MANIFEST) || (typeof window !== 'undefined' && window.WATSON_RIG_MANIFEST);
    if (!mf || !Array.isArray(mf.parts)) return Object.assign({}, baseRotations || {});
    const isRight = side === 'right';
    const upperId = isRight ? 'upper_arm_right' : 'upper_arm_left';
    const foreId = isRight ? 'forearm_right' : 'forearm_left';
    const handId = isRight ? 'hand_right' : 'hand_left';

    const byId = {};
    mf.parts.forEach(function (p) { byId[p.id] = p; });
    const upper = byId[upperId];
    const fore = byId[foreId];
    const hand = byId[handId];
    if (!upper || !fore || !hand) return Object.assign({}, baseRotations || {});

    const s = upper.pivot;
    const e = fore.pivot;
    const w = hand.pivot;
    const L1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
    const L2 = Math.hypot(w[0] - e[0], w[1] - e[1]);

    const restUpperAngle = Math.atan2(e[1] - s[1], e[0] - s[0]);
    const restForeAngle = Math.atan2(w[1] - e[1], w[0] - e[0]) - restUpperAngle;

    const dx = targetXY[0] - s[0];
    const dy = targetXY[1] - s[1];
    const dist = Math.max(8, Math.min(L1 + L2 - 2, Math.hypot(dx, dy)));
    const targetAngle = Math.atan2(dy, dx);

    const cosElbow = Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2)));
    const bendSign = isRight ? 1 : -1;
    const elbowInterior = Math.acos(cosElbow);
    const desiredForeRel = bendSign * (Math.PI - elbowInterior);

    const cosShoulderOffset = Math.max(-1, Math.min(1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)));
    const shoulderOffset = Math.acos(cosShoulderOffset);
    const desiredUpperWorld = targetAngle - bendSign * shoulderOffset;

    const out = Object.assign({}, baseRotations || {});
    out[upperId] = ((desiredUpperWorld - restUpperAngle) * 180) / Math.PI;
    out[foreId] = ((desiredForeRel - restForeAngle) * 180) / Math.PI;
    return out;
  }

  // Cache for collar-only masked head sprite so original Master-B hair/ears never ghost behind E00–E17 heads
  const collarHeadCache = new WeakMap();
  const emotionHeadImageCache = {};

  function getCollarOnlyHeadBitmap(headBitmap, headPart) {
    if (!headBitmap || typeof document === 'undefined') return headBitmap;
    if (collarHeadCache.has(headBitmap)) return collarHeadCache.get(headBitmap);
    try {
      const w = headPart.rect[2];
      const h = headPart.rect[3];
      const cnv = document.createElement('canvas');
      cnv.width = w;
      cnv.height = h;
      const cctx = cnv.getContext('2d');
      const splitY = HEAD_LANDMARK_MOUNT.collarSplitY;
      cctx.save();
      cctx.beginPath();
      cctx.rect(52, splitY, w - 104, h - splitY);
      cctx.clip();
      cctx.drawImage(headBitmap, 0, 0, w, h);
      cctx.restore();
      collarHeadCache.set(headBitmap, cnv);
      return cnv;
    } catch (_err) {
      return headBitmap;
    }
  }

  function getEmotionHeadImage(emotionCodeOrImg, basePath, onLoad) {
    if (!emotionCodeOrImg) return null;
    if (typeof emotionCodeOrImg === 'object') return emotionCodeOrImg;
    if (typeof Image === 'undefined') return null;
    const code = String(emotionCodeOrImg).trim().toUpperCase();
    const prefix = basePath || 'odyssey/slopling-cast/watson-heads/';
    const url = prefix.replace(/\/?$/, '/') + code + '.png';
    if (emotionHeadImageCache[url]) return emotionHeadImageCache[url];
    const img = new Image();
    if (typeof onLoad === 'function') {
      img.addEventListener('load', function () { onLoad(img, code); });
    }
    img.src = url;
    emotionHeadImageCache[url] = img;
    return img;
  }

  function isImageReady(img) {
    if (!img || typeof img !== 'object') return false;
    if (typeof img.complete === 'boolean' && !img.complete) return false;
    const w = img.naturalWidth !== undefined ? img.naturalWidth : img.width;
    return Number(w) > 0;
  }

  // Render animated 15-part Watson rig with damped spring secondary motion + live E00–E17 head mount
  function renderAnimatedWatson(ctx, manifest, partImages, emotionHeadImg, state, options) {
    options = options || {};
    const rig = (options && options.watsonRig) || (root && root.WatsonRig) || (typeof window !== 'undefined' && window.WatsonRig);
    const mf = manifest || (root && root.WATSON_RIG_MANIFEST) || (typeof window !== 'undefined' && window.WATSON_RIG_MANIFEST);
    if (!ctx || !rig || !mf || !partImages) return null;

    installPresetsIntoWatsonRig(rig);
    const kinState = ensureKineticState(state);

    // If options specify a target preset or rotations, update targets
    if (options.preset) {
      setTargetPose(kinState, options.preset, options.amount === undefined ? 1 : options.amount);
    } else if (options.targetRotations) {
      setTargetPose(kinState, options.targetRotations, options.amount === undefined ? 1 : options.amount);
    }

    // Advance physics unless caller passed explicit static rotations with step === false
    let currentRotations;
    if (options.rotations && options.step === false) {
      currentRotations = options.rotations;
    } else if (options.step !== false) {
      const dt = options.dt !== undefined ? options.dt : (1 / 60);
      currentRotations = stepPhysics(kinState, dt);
      if (options.rotations) {
        currentRotations = Object.assign({}, currentRotations, options.rotations);
      }
    } else {
      currentRotations = kinState.currentRotations || resolvePoseRotations(kinState.activePreset || 'neutral', kinState.poseAmount);
    }

    const resolvedHeadImg = typeof emotionHeadImg === 'string'
      ? getEmotionHeadImage(emotionHeadImg, options.emotionHeadsBasePath, options.onEmotionHeadLoad)
      : emotionHeadImg;

    const shouldMountHead = (options.mountEmotionHead !== false) &&
      (kinState.mountEmotionHead !== false) &&
      isImageReady(resolvedHeadImg);

    const headPart = mf.parts.find(function (p) { return p.id === 'head'; });
    let effectivePartImages = partImages;
    if (shouldMountHead && headPart && partImages.head) {
      effectivePartImages = Object.assign({}, partImages, {
        head: getCollarOnlyHeadBitmap(partImages.head, headPart)
      });
    }

    const drawResult = rig.draw(ctx, mf, effectivePartImages, currentRotations, options);

    // Composite E00–E17 head onto Watson's head matrix/pivot ([512, 302])
    if (shouldMountHead && headPart && drawResult && drawResult.matrices && drawResult.matrices.head) {
      const view = options.view || 'assembled';
      const headMat = drawResult.matrices.head.slice();
      if (view === 'exploded' && rig.EXPLODE && rig.EXPLODE.head) {
        headMat[4] += rig.EXPLODE.head[0];
        headMat[5] += rig.EXPLODE.head[1];
      }

      const natW = resolvedHeadImg.naturalWidth || resolvedHeadImg.width || 172;
      const natH = resolvedHeadImg.naturalHeight || resolvedHeadImg.height || 260;
      const mountScale = (options.headScale || HEAD_LANDMARK_MOUNT.scale) * (260 / natH);
      const speechPulse = 1 + Math.min(0.04, (kinState.speechImpulse || 0) * 0.015);
      const drawW = natW * mountScale;
      const drawH = natH * mountScale * speechPulse;
      const drawX = (options.headCenterX || HEAD_LANDMARK_MOUNT.centerGlobalX) - drawW / 2;
      const drawY = (options.headTopY !== undefined ? options.headTopY : HEAD_LANDMARK_MOUNT.topGlobalY) - (drawH - natH * mountScale) * 0.5;

      ctx.save();
      ctx.setTransform(drawResult.scale, 0, 0, drawResult.scale, drawResult.tx, drawResult.ty);
      ctx.transform(headMat[0], headMat[1], headMat[2], headMat[3], headMat[4], headMat[5]);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(resolvedHeadImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Keep neck joint pin visible on top when in 'joints' diagnostic view
      if (view === 'joints' && drawResult.pivots && drawResult.pivots.head) {
        const xy = drawResult.pivots.head;
        ctx.save();
        ctx.setTransform(drawResult.scale, 0, 0, drawResult.scale, drawResult.tx, drawResult.ty);
        ctx.beginPath();
        ctx.arc(xy[0], xy[1], 11, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9e6';
        ctx.fill();
        ctx.strokeStyle = '#115c61';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(xy[0], xy[1], 3.7, 0, Math.PI * 2);
        ctx.fillStyle = '#115c61';
        ctx.fill();
        ctx.restore();
      }
    }

    return Object.assign({}, drawResult, {
      rotations: currentRotations,
      mountedEmotionHead: Boolean(shouldMountHead),
      state: kinState
    });
  }

  // Terry Gilliam Cutout Operator Vocabulary (Lineage #1) for DOM Stage Cutouts
  const GILLIAM_OPERATORS = {
    drop_in: {
      id: 'drop_in',
      label: 'Gravity Drop-In',
      className: 'scion-op-drop_in',
      durationMs: 620,
      description: 'Gravity drop from top of proscenium with paper squash-and-bounce on wooden floor'
    },
    paper_flip: {
      id: 'paper_flip',
      label: 'Paper-Cardboard Flip',
      className: 'scion-op-paper_flip',
      durationMs: 480,
      description: 'Crisp 2D paper-cardboard horizontal flip with shadow shift'
    },
    recoil: {
      id: 'recoil',
      label: 'Brass-Brad Recoil',
      className: 'scion-op-recoil',
      durationMs: 540,
      description: 'Sudden comic jolt backward with brass-brad wobble'
    },
    enlarge_reveal: {
      id: 'enlarge_reveal',
      label: 'Gilliam Scale-Up Reveal',
      className: 'scion-op-enlarge_reveal',
      durationMs: 580,
      description: 'Sudden Gilliam scale-up punctuation on key line'
    },
    stamp_interrupt: {
      id: 'stamp_interrupt',
      label: 'Heavy Stamp Interrupt',
      className: 'scion-op-stamp_interrupt',
      durationMs: 520,
      stageShake: true,
      description: 'Heavy vertical stomp with stage shake'
    },
    hold_freeze: {
      id: 'hold_freeze',
      label: 'Dramatic Freeze Frame',
      className: 'scion-op-hold_freeze',
      durationMs: 900,
      description: 'High-contrast dramatic freeze frame'
    }
  };

  const KINETIC_CSS = [
    '/* ScionKineticPuppeteer — Terry Gilliam Cutout Physics & Keyframes */',
    '.cutout-actor, .watson-rig-stage-canvas {',
    '  transform-origin: 50% 94%;',
    '  backface-visibility: visible;',
    '}',
    '.scion-op-drop_in {',
    '  animation: scion-gilliam-drop-in 620ms cubic-bezier(0.22, 1, 0.36, 1) both;',
    '}',
    '.scion-op-paper_flip {',
    '  animation: scion-gilliam-paper-flip 480ms cubic-bezier(0.45, 0.05, 0.55, 0.95) both;',
    '}',
    '.scion-op-recoil {',
    '  animation: scion-gilliam-recoil 540ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;',
    '}',
    '.scion-op-enlarge_reveal {',
    '  animation: scion-gilliam-enlarge-reveal 580ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;',
    '  z-index: 18 !important;',
    '}',
    '.scion-op-stamp_interrupt {',
    '  animation: scion-gilliam-stamp-interrupt 520ms cubic-bezier(0.25, 1, 0.5, 1) both;',
    '}',
    '.scion-op-hold_freeze {',
    '  animation: scion-gilliam-hold-freeze 900ms steps(2, end) both;',
    '}',
    '.scion-stage-shake {',
    '  animation: scion-proscenium-shake 420ms ease-in-out both;',
    '}',
    '@keyframes scion-gilliam-drop-in {',
    '  0%   { transform: translateY(-340px) rotate(-6deg) scale(0.94, 1.08); opacity: 0.15; }',
    '  58%  { transform: translateY(14px) rotate(2.5deg) scale(1.09, 0.88); opacity: 1; }',
    '  76%  { transform: translateY(-16px) rotate(-1.5deg) scale(0.97, 1.04); }',
    '  90%  { transform: translateY(4px) rotate(0.6deg) scale(1.02, 0.98); }',
    '  100% { transform: translateY(0) rotate(0deg) scale(1, 1); opacity: 1; }',
    '}',
    '@keyframes scion-gilliam-paper-flip {',
    '  0%   { transform: perspective(900px) rotateY(0deg) scale(1); filter: drop-shadow(0 12px 18px rgba(0,0,0,0.65)); }',
    '  45%  { transform: perspective(900px) rotateY(92deg) scale(1.04, 0.98) skewY(3deg); filter: drop-shadow(2px 14px 4px rgba(0,0,0,0.85)); }',
    '  75%  { transform: perspective(900px) rotateY(-14deg) scale(1.02); filter: drop-shadow(-14px 12px 18px rgba(0,0,0,0.72)); }',
    '  100% { transform: perspective(900px) rotateY(0deg) scale(1); filter: drop-shadow(0 12px 18px rgba(0,0,0,0.65)); }',
    '}',
    '@keyframes scion-gilliam-recoil {',
    '  0%   { transform: translateX(0) rotate(0deg); }',
    '  22%  { transform: translateX(-28px) translateY(-8px) rotate(-9.5deg) scale(0.96, 1.04); }',
    '  48%  { transform: translateX(11px) rotate(5.2deg); }',
    '  70%  { transform: translateX(-6px) rotate(-2.8deg); }',
    '  86%  { transform: translateX(3px) rotate(1.1deg); }',
    '  100% { transform: translateX(0) rotate(0deg); }',
    '}',
    '@keyframes scion-gilliam-enlarge-reveal {',
    '  0%   { transform: scale(1) translateY(0) rotate(0deg); }',
    '  32%  { transform: scale(1.24) translateY(-18px) rotate(-2.2deg); filter: drop-shadow(0 24px 28px rgba(0,0,0,0.85)) brightness(1.07); }',
    '  68%  { transform: scale(1.16) translateY(-10px) rotate(1.1deg); }',
    '  100% { transform: scale(1) translateY(0) rotate(0deg); }',
    '}',
    '@keyframes scion-gilliam-stamp-interrupt {',
    '  0%   { transform: translateY(0) scale(1, 1); }',
    '  28%  { transform: translateY(-44px) rotate(-2deg) scale(0.96, 1.06); }',
    '  52%  { transform: translateY(16px) rotate(1.5deg) scale(1.12, 0.86); }',
    '  74%  { transform: translateY(-6px) scale(0.98, 1.02); }',
    '  100% { transform: translateY(0) scale(1, 1); }',
    '}',
    '@keyframes scion-gilliam-hold-freeze {',
    '  0%   { transform: scale(1.04) rotate(-1.2deg); filter: contrast(1.38) saturate(0.72) sepia(0.22) drop-shadow(0 0 18px rgba(217, 155, 38, 0.55)); }',
    '  85%  { transform: scale(1.04) rotate(-1.2deg); filter: contrast(1.38) saturate(0.72) sepia(0.22) drop-shadow(0 0 18px rgba(217, 155, 38, 0.55)); }',
    '  100% { transform: scale(1) rotate(0deg); filter: none; }',
    '}',
    '@keyframes scion-proscenium-shake {',
    '  0%, 100% { transform: translate(0, 0); }',
    '  20%      { transform: translate(-6px, 5px) rotate(-0.4deg); }',
    '  40%      { transform: translate(6px, -5px) rotate(0.4deg); }',
    '  60%      { transform: translate(-4px, 3px); }',
    '  80%      { transform: translate(3px, -2px); }',
    '}'
  ].join('\n');

  function injectKineticStyles(targetDoc) {
    const doc = targetDoc || (typeof document !== 'undefined' ? document : null);
    if (!doc || !doc.head) return null;
    const existing = doc.getElementById('scion-kinetic-puppeteer-styles');
    if (existing) return existing;
    const styleEl = doc.createElement('style');
    styleEl.id = 'scion-kinetic-puppeteer-styles';
    styleEl.textContent = KINETIC_CSS;
    doc.head.appendChild(styleEl);
    return styleEl;
  }

  // Auto-inject styles in browser environment
  if (typeof document !== 'undefined' && document.head) {
    injectKineticStyles(document);
  }

  function applyGilliamOperator(actorEl, operatorName, options) {
    options = options || {};
    const doc = (actorEl && actorEl.ownerDocument) || (typeof document !== 'undefined' ? document : null);
    if (doc) injectKineticStyles(doc);

    const el = typeof actorEl === 'string' && doc ? doc.querySelector(actorEl) : actorEl;
    const opKey = GILLIAM_OPERATORS[operatorName] ? operatorName : 'drop_in';
    const opSpec = GILLIAM_OPERATORS[opKey];
    if (!el || !el.classList) {
      return { operator: opKey, durationMs: opSpec.durationMs, applied: false, cancel: function () {} };
    }

    // Remove any existing Gilliam operator classes so re-triggering replays cleanly
    Object.keys(GILLIAM_OPERATORS).forEach(function (k) {
      el.classList.remove(GILLIAM_OPERATORS[k].className);
    });
    if (el._scionOpTimer) {
      clearTimeout(el._scionOpTimer);
      el._scionOpTimer = null;
    }

    // Force style reflow for crisp replay
    void el.offsetWidth;

    const durationMs = Number(options.durationMs) || opSpec.durationMs;
    if (options.durationMs) {
      el.style.animationDuration = durationMs + 'ms';
    } else if (el.style) {
      el.style.removeProperty('animation-duration');
    }

    el.classList.add(opSpec.className);
    el.dataset.gilliamOp = opKey;

    // Trigger stage shake on stamp_interrupt
    let stageEl = null;
    if ((opSpec.stageShake || options.stageShake) && options.stageShake !== false && doc) {
      stageEl = options.stageEl ||
        (el.closest && el.closest('#prosceniumStage, .proscenium-stage')) ||
        doc.getElementById('prosceniumStage');
      if (stageEl && stageEl.classList) {
        stageEl.classList.remove('scion-stage-shake');
        void stageEl.offsetWidth;
        stageEl.classList.add('scion-stage-shake');
      }
    }

    function cleanup() {
      if (el && el.classList && !options.persist) {
        el.classList.remove(opSpec.className);
      }
      if (stageEl && stageEl.classList) {
        stageEl.classList.remove('scion-stage-shake');
      }
      if (typeof options.onComplete === 'function') {
        options.onComplete(el, opKey);
      }
    }

    el._scionOpTimer = setTimeout(cleanup, durationMs + 40);

    return {
      operator: opKey,
      durationMs: durationMs,
      applied: true,
      cancel: function () {
        if (el._scionOpTimer) clearTimeout(el._scionOpTimer);
        if (el && el.classList) el.classList.remove(opSpec.className);
        if (stageEl && stageEl.classList) stageEl.classList.remove('scion-stage-shake');
      }
    };
  }

  function gilliamOperatorForCue(emotionCode, actionCue, beatId) {
    const emo = String(emotionCode || 'E00').trim().toUpperCase();
    const cue = String(actionCue || '').trim().toLowerCase();
    const beat = String(beatId || '').trim().toLowerCase();
    const combined = cue + ' ' + beat;

    if (GILLIAM_OPERATORS[cue]) return cue;
    if (/\b(stamp|stomp|interrupt|slam|smash|thunder|crash|cyclops)\b/.test(combined)) return 'stamp_interrupt';
    if (/\b(recoil|startle|jolt|flinch|alarm|monster|siren)\b/.test(combined) || emo === 'E08') return 'recoil';
    if (/\b(flip|turn|reverse|pivot|switch|depart)\b/.test(combined)) return 'paper_flip';
    if (/\b(freeze|hold|silence|withdraw|pause|still|statue)\b/.test(combined) || emo === 'E16' || emo === 'E17') return 'hold_freeze';
    if (/\b(proclaim|reveal|behold|declare|offer|delight|recognize)\b/.test(combined) || emo === 'E05' || emo === 'E06' || emo === 'E14') return 'enlarge_reveal';
    return 'drop_in';
  }

  return {
    PART_IDS: PART_IDS,
    HEAD_LANDMARK_MOUNT: HEAD_LANDMARK_MOUNT,
    RIG_POSES: RIG_POSES,
    JOINT_PHYSICS: JOINT_PHYSICS,
    GILLIAM_OPERATORS: GILLIAM_OPERATORS,
    installPresetsIntoWatsonRig: installPresetsIntoWatsonRig,
    posePresetForEmotionAndCue: posePresetForEmotionAndCue,
    createKineticState: createKineticState,
    setTargetPose: setTargetPose,
    applySpeechImpulse: applySpeechImpulse,
    stepPhysics: stepPhysics,
    solveTwoBoneArmIK: solveTwoBoneArmIK,
    getEmotionHeadImage: getEmotionHeadImage,
    renderAnimatedWatson: renderAnimatedWatson,
    injectKineticStyles: injectKineticStyles,
    applyGilliamOperator: applyGilliamOperator,
    gilliamOperatorForCue: gilliamOperatorForCue
  };
});

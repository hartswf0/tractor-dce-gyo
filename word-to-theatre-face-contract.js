// WORD-TO-THEATRE / FACE CONTRACT
// The face is not one replaceable part. It is a layered performance contract.
// Sources stay distinct so identity, dramatic intent, and execution do not collapse.

export const FACE_SOURCES = Object.freeze({
  LDRAW: 'LDRAW_PRINT',
  HALFWORLD: 'HALFWORLD_FACE',
  ODYSSEY: 'ODYSSEY_DIRECTION',
  MECAFACE: 'MECAFACE'
});

export const FACE_CHANNELS = Object.freeze([
  'identity.head',      // physical head / prosthetic geometry
  'appearance.print',   // static LDraw face print / skin treatment
  'eyes.shape',
  'eyes.gaze',
  'eyes.blink',
  'brows.left',
  'brows.right',
  'mouth.viseme',
  'mouth.shape',
  'mouth.open',
  'mouth.asymmetry',
  'detail.lines',       // wrinkles / scars / temporary expression lines
  'intent',             // semantic dramatic intent from Odyssey / director
  'intensity',
  'enter',
  'release'
]);

export function emptyFacePerformance(actorId = null) {
  return {
    schema: 'word-to-theatre/face-v1',
    actorId,
    sources: {},
    identity: { head: null, prosthetic: null },
    appearance: { print: null, skin: null, style: null, tone: null },
    performance: {
      intent: null,
      intensity: 1,
      eyes: { shape: null, gaze: null, blink: null },
      brows: { left: null, right: null },
      mouth: { viseme: 'REST', shape: null, open: 0, asymmetry: 0 },
      detail: { lines: [] },
      timing: { enter: 0, hold: null, release: 0 }
    }
  };
}

// Static physical/printed LEGO head layer. This does NOT own acting.
export function fromLDrawHead(record = {}) {
  return {
    source: FACE_SOURCES.LDRAW,
    identity: {
      head: record.filename || record.file || null,
      prosthetic: record.prosthetic || null
    },
    appearance: {
      print: record.description || null,
      skin: record.skin ?? null
    }
  };
}

// HALFTRACK / HALFWORLD donor contract. Preserve its native face:{style,tone}
// and allow the same face/say operations to drive this layer.
export function fromHalfworldCast(cast = {}) {
  return {
    source: FACE_SOURCES.HALFWORLD,
    appearance: {
      style: cast.face?.style ?? null,
      tone: cast.face?.tone ?? null,
      skin: cast.look?.skin ?? null
    },
    look: {
      hair: cast.look?.hair ?? null,
      glasses: cast.look?.glasses ?? null,
      beard: cast.look?.beard ?? null
    },
    operations: ['face', 'say']
  };
}

// Odyssey is semantic direction, not geometry. Keep the vocabulary open.
// Example supported by the current Odyssey ROVER work:
// APPLY recognition / ENTER .35 / RELEASE .50.
export function fromOdysseyBeat(beat = {}) {
  const face = beat.FACE || beat.face || {};
  return {
    source: FACE_SOURCES.ODYSSEY,
    performance: {
      intent: face.intent || face.apply || face.APPLY || beat.intent || null,
      intensity: face.intensity ?? 1,
      timing: {
        enter: Number(face.enter ?? face.ENTER ?? 0) || 0,
        hold: face.hold ?? face.HOLD ?? null,
        release: Number(face.release ?? face.RELEASE ?? 0) || 0
      }
    }
  };
}

// Mecabricks MecaFace execution layer. Mouth, eyes and brows remain separable.
// Do not flatten these into a single expression preset.
export function fromMecaFacePose(pose = {}) {
  return {
    source: FACE_SOURCES.MECAFACE,
    performance: {
      eyes: {
        shape: pose.eyeShape ?? pose.eyes?.shape ?? null,
        gaze: pose.gaze ?? pose.eyes?.gaze ?? null,
        blink: pose.blink ?? pose.eyes?.blink ?? null
      },
      brows: {
        left: pose.browLeft ?? pose.brows?.left ?? null,
        right: pose.browRight ?? pose.brows?.right ?? null
      },
      mouth: {
        viseme: pose.viseme || pose.mouth?.viseme || 'REST',
        shape: pose.mouthShape ?? pose.mouth?.shape ?? null,
        open: Number(pose.mouthOpen ?? pose.mouth?.open ?? 0) || 0,
        asymmetry: Number(pose.asymmetry ?? pose.mouth?.asymmetry ?? 0) || 0
      },
      detail: {
        lines: [...(pose.lines || pose.detail?.lines || [])]
      }
    }
  };
}

function mergeDefined(target, patch) {
  if (!patch || typeof patch !== 'object') return target;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) target[key] = [...value];
    else if (typeof value === 'object') {
      target[key] = mergeDefined({ ...(target[key] || {}) }, value);
    } else target[key] = value;
  }
  return target;
}

export function compileFacePerformance({ actorId = null, ldraw, halfworld, odyssey, mecaface } = {}) {
  const out = emptyFacePerformance(actorId);
  const layers = [ldraw, halfworld, odyssey, mecaface].filter(Boolean);
  for (const layer of layers) {
    if (layer.source) out.sources[layer.source] = true;
    mergeDefined(out, layer);
  }
  return out;
}

// Production order: identity first, then semantic intent, then articulated execution.
export function compileFromSources({ actorId, ldrawHead, halfworldCast, odysseyBeat, mecaFacePose } = {}) {
  return compileFacePerformance({
    actorId,
    ldraw: ldrawHead ? fromLDrawHead(ldrawHead) : null,
    halfworld: halfworldCast ? fromHalfworldCast(halfworldCast) : null,
    odyssey: odysseyBeat ? fromOdysseyBeat(odysseyBeat) : null,
    mecaface: mecaFacePose ? fromMecaFacePose(mecaFacePose) : null
  });
}

export const FACE_PRODUCTION_ORDER = Object.freeze([
  'IDENTITY',
  'BODY_PERFORMANCE',
  'ODYSSEY_INTENT',
  'GAZE',
  'MOUTH_VISEME',
  'EYES',
  'BROWS',
  'DETAIL',
  'WATCH',
  'REPAIR'
]);

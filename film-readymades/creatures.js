/* film-readymades/creatures.js — the giants and animals of the Odyssey film as articulated rigs (window.OdysseyCreatures; also a
   CommonJS module for node tools). Until now Polyphemus, the Laestrygonians, Scylla, the rams, the cattle, the dogs and Argos were set
   pieces the performance engine could not give an intent. Here each is a pivot tree built from real LDraw parts (the toy's own
   joints where it has them: the troll's shoulders and wrists, the cow's head, the hose segments of Scylla's necks) and from the set
   pieces' animal parts cut into moving pieces (a goat, a German shepherd, a cow body split at the neck, the hips, the knees, the tail
   and the ears: the cut geometry is written once by tools/creatures/build.js into odyssey/creatures/parts/<kind>.mpd).

   Everything here is a pure function of its inputs, like film-readymades/choreo.js: a pose at t, a gait at t, a herd at t, a heavy
   giant's lag at t are computed from t (a spring or a flock is integrated from 0 on a fixed grid and memoised), so a frame rendered
   offline at t is the frame the player shows at t, scrubbed either way.

   Frames. A creature is authored in its own LDraw frame: LDU, y DOWN, the ground at y 0, facing -z (x < 0 is its right). The world is
   the take's (y up, x and z on the floor, a figure facing +z at heading 0), and a creature stands in it by its root channels:
     world = T(root.x, root.y, root.z) . RY(root.h) . RX(root.pitch) . RZ(root.roll) . scale . FLIP        (FLIP: x, -y, -z)
   the order the choreography player turns a minifig (Euler 'YXZ'), so a creature's heading means what a figure's does.

   Channels (named like the choreography's; radians unless marked):
     root.x root.z root.y   world units, root.h heading (0 faces +z), root.pitch root.roll (a fall, a dog dying onto its side)
     body.dy (LDU up) body.pitch (nose up +) body.roll (+ its left side up) body.yaw     the trunk on the hips / the belly
     head.yaw (+ to its left) head.pitch (+ up) neck.pitch     ear.L ear.R (+ laid back)   tail.pitch (+ up) tail.yaw (+ to its left)
     leg.FL leg.FR leg.HL leg.HR (hip / shoulder pitch; - swings forward, as a minifig's leg)   knee.FL ... (the lower leg; + folds back)
     giants: hips.dy torso.lean torso.twist torso.roll head.yaw head.pitch eye (a replacement eye: 0 open, 1 half, 2 shut)
             arm.R.pitch arm.L.pitch (- raises forward) arm.R.out arm.L.out elbow.R elbow.L (- bends up) hand.R.roll hand.L.roll
             leg.R.pitch leg.L.pitch leg.R.out leg.L.out
     Scylla: neckN.x neckN.y neckN.z (head N's target from its root, LDU in Scylla's frame) neckN.slack neckN.head (the head's pitch), N 1..6
   Limits are in each kind's `channels` (CLAMP below is the table of all of them): the toy's where the toy has the joint, the film's
   play where it has not.

   API (see film-readymades/CREATURES.md):
     OdysseyCreatures.kinds()                          the kinds, with what each needs to do and the scenes that need it
     OdysseyCreatures.define(kind, opts) -> rig        opts: {id, scale, colour, variant}
       rig.channels  [{name, min, max, rest, unit, doc}]   rig.rest() -> {ch: v}   rig.clamp(v)
       rig.pose(v) -> {nodes: {id: M}, world: W}       M: a node's rest-to-world matrix, 12 numbers [x y z a b c d e f g h i]
       rig.rows(v) -> [{file, col, m}]                 the posed creature as LDraw rows in world (y up) or {frame:'ldraw'}
       rig.ldr(v)                                      one frame as an LDraw model (the node files come from the kind's MPD)
       rig.anchor(name, v) -> M                        a grip, the belly a man clings under, an eye, a jaw: where a rider rides
       rig.attach(THREE, group, meshOf) / rig.apply(v) a three.js pivot tree under `group`, posed from v
     OdysseyCreatures.gait(rig, t, params)             a walk, trot or run along a path, feet planted (no sliding): channels at t
     OdysseyCreatures.heavy(rig, t, params)            the giant's walk: its weight lagging the path, waddle, and ground shake (fx)
     OdysseyCreatures.reach(rig, v, hand, target)      a giant's hand to a world point (IK over torso, shoulder, elbow)
     OdysseyCreatures.grope(rig, t, params)            a blind hand searching a lane: sweeps, pats, rests on what is under it
     OdysseyCreatures.herd(params)                     a flock following a leader with separation: .at(i, t), .channels(i, t)
     OdysseyCreatures.strike(rig, t, params)           Scylla's heads: coil, strike, seize, lift
     OdysseyCreatures.throwArc(t, params)              a thrown rock's flight (a prop's world position at t)
     OdysseyCreatures.fragment(id, kind, opts)         an odyssey-choreo/1 creature actor, for a scene sheet's `creatures`
     OdysseyCreatures.sample(C, id, t, {ctx}) -> {v, fx, riders}   a sheet's creature actor at t (keys over its procedures); ctx gives
                                                       what a sheet cannot hold: surface(x, z) for a grope, point(name, t) for a reach,
                                                       ground(x, z, near) the floor under a creature that carries `floor` */
(function (root) {
'use strict';
/* ═════════════ matrices: [x y z a b c d e f g h i], p' = t + R p ═════════════ */
const I12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
function mul(A, B) {
  const [ax, ay, az, a, b, c, d, e, f, g, h, i] = A, [bx, by, bz, A2, B2, C2, D2, E2, F2, G2, H2, I2] = B;
  return [ax + a * bx + b * by + c * bz, ay + d * bx + e * by + f * bz, az + g * bx + h * by + i * bz,
    a * A2 + b * D2 + c * G2, a * B2 + b * E2 + c * H2, a * C2 + b * F2 + c * I2, d * A2 + e * D2 + f * G2, d * B2 + e * E2 + f * H2, d * C2 + e * F2 + f * I2,
    g * A2 + h * D2 + i * G2, g * B2 + h * E2 + i * H2, g * C2 + h * F2 + i * I2];
}
const ap = (M, p) => [M[0] + M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[1] + M[6] * p[0] + M[7] * p[1] + M[8] * p[2], M[2] + M[9] * p[0] + M[10] * p[1] + M[11] * p[2]];
const apv = (M, p) => [M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2], M[9] * p[0] + M[10] * p[1] + M[11] * p[2]];
const T = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const RX = a => { const c = Math.cos(a), s = Math.sin(a); return [0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c]; };
const RY = a => { const c = Math.cos(a), s = Math.sin(a); return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c]; };
const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return [0, 0, 0, c, -s, 0, s, c, 0, 0, 0, 1]; };
const SC = k => [0, 0, 0, k, 0, 0, 0, k, 0, 0, 0, k];
const FLIP = [0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1];
const ROT = { x: RX, y: RY, z: RZ };
function inv(M) {   // any affine inverse (rotation, scale, mirror)
  const [x, y, z, a, b, c, d, e, f, g, h, i] = M, A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g, det = a * A + b * B + c * Cc;
  const R = [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, Cc / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  return [-(R[0] * x + R[1] * y + R[2] * z), -(R[3] * x + R[4] * y + R[5] * z), -(R[6] * x + R[7] * y + R[8] * z), ...R];
}
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), cl01 = v => cl(v, 0, 1), sm = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
const frac = x => x - Math.floor(x);
/* a deterministic noise: the same (seed, t) is always the same value, smooth in t */
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(seed, t) { const i = Math.floor(t), f = t - i, u = sm(f); return lerp(hash(seed * 71 + i), hash(seed * 71 + i + 1), u) * 2 - 1; }

/* ═════════════ the kinds ═════════════ */
/* a node: {id, parent, p: rest pivot [x y z] in the creature frame, rot: [[channel, axis, sign]...] applied in order,
   move: [[channel, axis, sign]] (LDU along an axis), mesh: [{file | part, col, m}] placed in the creature frame at rest,
   swap: {ch, parts: [...]} (a replacement part chosen by the channel's rounded value)} */
const KINDS = {};
const DEG = Math.PI / 180;
function ch(name, min, max, doc, unit = 'rad', rest = 0) { return { name, min, max, doc, unit, rest }; }

/* ── the troll figure (60671 in its sub-parts), the big figure every giant of the line is built on ── */
function troll(kind, o) {
  const col = 16, body = 16, belt = o.belt || 308, skirt = o.skirt || 70, P = [0, -168, 0];   /* the skin is colour 16: the rig's colour (o.colours) */
  const at = (x, y, z) => T(P[0] + x, P[1] + y, P[2] + z);
  const cut = f => ({ file: `cr-${o.cutFrom || kind}-${f}.ldr` });
  const nodes = [
    { id: 'root', parent: null, p: [0, 0, 0] },
    { id: 'hips', parent: 'root', p: [0, -52, 6], move: [['hips.dy', 'y', -1]], rot: [['body.yaw', 'y', -1], ['body.pitch', 'x', -1], ['body.roll', 'z', -1]],
      mesh: [cut('hips')] },
    { id: 'leg.R', parent: 'hips', p: [-16, -40, 8], rot: [['leg.R.pitch', 'x', 1], ['leg.R.out', 'z', 1]], mesh: [cut('leg.R')] },
    { id: 'knee.R', parent: 'leg.R', p: [-16, -20, 6], rot: [['knee.R', 'x', 1]], mesh: [cut('shin.R')] },
    { id: 'leg.L', parent: 'hips', p: [16, -40, 8], rot: [['leg.L.pitch', 'x', 1], ['leg.L.out', 'z', -1]], mesh: [cut('leg.L')] },
    { id: 'knee.L', parent: 'leg.L', p: [16, -20, 6], rot: [['knee.L', 'x', 1]], mesh: [cut('shin.L')] },
    { id: 'torso', parent: 'hips', p: [0, -80, 10], rot: [['torso.twist', 'y', -1], ['torso.lean', 'x', 1], ['torso.roll', 'z', -1]],
      mesh: [cut('torso'), { part: '60634', col: o.back || 70, m: at(0, 0, 0) }] },
    /* the troll's face is the front of its body moulding: the brow and snout cut away as a head, the tusked jaw under it */
    { id: 'head', parent: 'torso', p: [0, -140, -22], rot: [['head.yaw', 'y', -1], ['head.pitch', 'x', -1]], mesh: [cut('head')].concat(o.head || []) },
    { id: 'jaw', parent: 'head', p: [0, -124, -26], rot: [['jaw', 'x', 1]], mesh: [cut('jaw')] },
    { id: 'arm.R', parent: 'torso', p: [-40, -128, 20], rot: [['arm.R.pitch', 'x', 1], ['arm.R.out', 'z', 1]], mesh: [cut('arm.R')] },
    { id: 'elbow.R', parent: 'arm.R', p: [-54, -96, 16], rot: [['elbow.R', 'x', 1]], mesh: [cut('fore.R')] },
    { id: 'hand.R', parent: 'elbow.R', p: [-53.75, -83, -26], rot: [['hand.R.roll', 'z', 1]], mesh: [{ part: '60640', col: o.hands || col, m: at(-53.75, 85, -26) }] },
    { id: 'arm.L', parent: 'torso', p: [40, -128, 20], rot: [['arm.L.pitch', 'x', 1], ['arm.L.out', 'z', -1]], mesh: [cut('arm.L')] },
    { id: 'elbow.L', parent: 'arm.L', p: [54, -96, 16], rot: [['elbow.L', 'x', 1]], mesh: [cut('fore.L')] },
    { id: 'hand.L', parent: 'elbow.L', p: [53.75, -83, -26], rot: [['hand.L.roll', 'z', -1]], mesh: [{ part: '60641', col: o.hands || col, m: at(53.75, 85, -26) }] },
  ];
  /* the Cyclops' one eye where the set piece had it: a white 2 x 2 round tile in the brow, the pupil a replacement part in front of it
     (open, half shut, shut, put out) that looks about (eye.x, eye.y) */
  if (o.eye) { const E = (z, part, c, dy = 0) => ({ part, col: c, m: [0, -148 + dy, z, 1, 0, 0, 0, 0, -1, 0, 1, 0] });
    nodes.find(n => n.id === 'head').mesh.push(E(-58, '14769', 15));   /* the pupil (below) stands 2 LDU proud of it */
    nodes.push({ id: 'eye', parent: 'head', p: [0, -148, -60], move: [['eye.x', 'x', -1], ['eye.y', 'y', -1]],
      /* the states from parts the packs have: open (the black pupil), half shut (the pupil under a lid: a 1 x 2 tile in the skin across
         the upper half of the white), shut (the lid: a 2 x 2 round tile in the skin over the whole eye), put out (the pupil dark red).
         A state is [part, colour, extras]: the extras are meshes placed in the creature frame with the state */
      swap: { ch: 'eye', parts: [['98138', 0], ['98138', 0, [E(-62, '3069b', 16, -10)]], ['14769', 16, []], ['98138', 320]] }, mesh: [E(-60, '98138', 0)] }); }
  const K = {
    kind, title: o.title, family: 'giant', cutFrom: o.cutFrom, colours: o.colours, trim: o.trim, blurb: o.blurb, scenes: o.scenes, needs: o.needs, card: o.card,
    height: 200, nodes,
    cuts: { from: [{ part: '60635', col: body, m: at(0, 0, 0), to: 'torso' }, { part: '60637', col: body, m: at(0, 0, 0), to: 'torso' }, { part: '60672', col, m: at(-40, 40, 20), to: 'arm.R' }, { part: '60673', col, m: at(40, 40, 20), to: 'arm.L' },
      { part: '60638', col: belt, m: at(0, 0, 0), to: 'hips' }, { part: '60644', col: skirt, m: at(0, 0, 0), to: 'hips' }],
      /* the troll's arm is one moulding bent at the elbow: the forearm is what reaches forward under the elbow */
      regions: [['head', { src: 'torso', z: [-99, -18], y: [-999, -126], x: [-26, 26] }], ['jaw', { src: 'torso', z: [-99, -18], y: [-126, -86], x: [-26, 26] }],
        ['fore.R', { src: 'arm.R', y: [-100, 99], z: [-99, 4] }], ['fore.L', { src: 'arm.L', y: [-100, 99], z: [-99, 4] }],
        ['shin.R', { src: 'hips', y: [-20, 99], x: [-99, -1] }], ['shin.L', { src: 'hips', y: [-20, 99], x: [-1, 99] }],
        ['leg.R', { src: 'hips', y: [-38, 99], x: [-99, -1] }], ['leg.L', { src: 'hips', y: [-38, 99], x: [-1, 99] }]] },
    channels: [
      ...(o.eye ? [ch('eye', 0, 3, 'the pupil: 0 open, 1 half shut, 2 shut, 3 put out (a replacement part)', 'index'), ch('eye.x', -9, 9, 'the pupil to its left (+)', 'ldu'), ch('eye.y', -9, 9, 'the pupil up (+)', 'ldu')] : []),
      ch('hips.dy', -150, 30, 'the whole body up (+) or down on the hips: a sit is about -40, a crouch -20', 'ldu'),
      ch('body.yaw', -0.8, 0.8, 'the trunk turned on the hips'), ch('body.pitch', -0.6, 1.2, 'the body tipped back (+) or forward'), ch('body.roll', -0.4, 0.4, 'the waddle: + lifts its left hip'),
      ch('torso.lean', -0.35, 0.9, 'the waist: + bows forward'), ch('torso.twist', -0.8, 0.8, 'the waist turned to its left (+)'), ch('torso.roll', -0.35, 0.35, 'the waist bent sideways'),
      ch('head.yaw', -0.5, 0.5, 'the face turned to its left (+): the head is the front of the body, so a little'), ch('head.pitch', -0.3, 0.45, 'the face up (+)'),
      ch('jaw', -0.05, 0.6, 'the tusked jaw open (+): a roar, a bite, a drink'),
      ch('arm.R.pitch', -3.2, 0.9, 'the shoulder: - raises the arm forward (-1.57 level, -3.1 overhead)'), ch('arm.L.pitch', -3.2, 0.9, 'the shoulder: - raises the arm forward'),
      ch('arm.R.out', -0.3, 1.4, 'the arm away from the body'), ch('arm.L.out', -0.3, 1.4, 'the arm away from the body'),
      ch('elbow.R', -1.2, 0.5, 'the elbow: - bends the forearm up'), ch('elbow.L', -1.2, 0.5, 'the elbow: - bends the forearm up'),
      ch('hand.R.roll', -1.6, 1.6, 'the wrist turned (the grip turns with it)'), ch('hand.L.roll', -1.6, 1.6, 'the wrist turned'),
      ch('leg.R.pitch', -1.6, 0.6, 'the hip: - swings the leg forward (a sit is -1.5)'), ch('leg.L.pitch', -1.6, 0.6, 'the hip: - swings the leg forward'),
      ch('leg.R.out', -0.2, 0.5, 'the leg out to the side'), ch('leg.L.out', -0.2, 0.5, 'the leg out to the side'),
      ch('knee.R', -0.1, 1.6, 'the knee: + folds the shin back (a kneel is 1.5)'), ch('knee.L', -0.1, 1.6, 'the knee: + folds the shin back'),
    ],
    anchors: {
      'grip.R': { node: 'hand.R', p: [-53.75, -83, -34] }, 'grip.L': { node: 'hand.L', p: [53.75, -83, -34] },
      head: { node: 'head', p: [0, -146, -40] }, brow: { node: 'head', p: [0, -164, -44] }, eye: { node: o.eye ? 'eye' : 'head', p: [0, -148, -70] },
      mouth: { node: 'jaw', p: [0, -116, -52] }, lap: { node: 'hips', p: [0, -50, -30] }, 'foot.R': { node: 'knee.R', p: [-16, 0, 0] }, 'foot.L': { node: 'knee.L', p: [16, 0, 0] },
    },
    feet: { 'leg.R': { hip: 'leg.R', knee: 'knee.R', foot: [-16, 0, -2], bend: 1 }, 'leg.L': { hip: 'leg.L', knee: 'knee.L', foot: [16, 0, -2], bend: 1 } },
    presets: {
      stand: {}, sit: { 'hips.dy': -44, 'leg.R.pitch': -1.45, 'leg.L.pitch': -1.45, 'leg.R.out': 0.25, 'leg.L.out': 0.25, 'torso.lean': 0.25 },
      crouch: { 'hips.dy': -14, 'leg.R.pitch': -0.5, 'leg.L.pitch': -0.5, 'body.pitch': 0.3, 'torso.lean': 0.6 },
      roar: { 'head.pitch': 0.5, 'torso.lean': -0.3, 'arm.R.pitch': -2.4, 'arm.L.pitch': -2.4, 'arm.R.out': 0.7, 'arm.L.out': 0.7, 'elbow.R': -0.6, 'elbow.L': -0.6 },
      sprawl: { 'root.pitch': -1.45, 'arm.R.pitch': -2.9, 'arm.L.pitch': -2.2, 'arm.R.out': 0.9, 'arm.L.out': 0.4, 'head.yaw': 0.5, 'leg.L.out': 0.3, eye: 2 },
    },
  };
  return K;
}
KINDS.polyphemus = troll('polyphemus', {
  title: 'Polyphemus', colours: { nougat: 84, tan: 19, olive: 330 }, blurb: 'The Cyclops: the troll big figure of the set piece on its own shoulders and wrists, cut at the waist, the legs, the elbows, the face and the tusked jaw, with the set piece\'s one eye (a pupil that looks about and is swapped: open, half shut, shut, put out).',
  eye: true,
  scenes: ['OD-B09-S07', 'OD-B09-S08', 'OD-B09-S09', 'OD-B09-S10', 'OD-B09-S11'],
  needs: ['WAKE', 'SEIZE (a man in the hand, carried)', 'EAT', 'HERD the flock', 'MOVE_STONE', 'DRINK at giant scale', 'GROPE the rams\' backs at the door (a search that must miss)', 'CARESS the lead ram', 'THROW a torn-off peak', 'the curse: arms raised'],
  card: 'kit.prop-polyphemus',
});
KINDS.laestrygon = troll('laestrygon', {
  title: 'Laestrygonian', colours: { nougat: 84, green: 378, dark: 308, girl: 78 }, trim: 308, cutFrom: 'polyphemus', blurb: 'The cannibal giants of Telepylus: the same troll body in the harbour colours, the helmet for a head, a boulder in the grip; Antiphates and the giant girl are the same rig recoloured and rescaled.',
  head: [{ part: '60636', col: 'trim', m: [0, -168, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] }],   /* the helmet in the rig's trim colour (opts.trim: 308, 70, 72, 320 on the cards) */
  scenes: ['OD-B10-S02'], needs: ['SEIZE a scout (carried)', 'PURSUE on the shore', 'THROW boulders at the fleet', 'THRUST spears at men in the water'],
  card: 'kit.prop-laestrygon',
});

/* ── the quadrupeds: a set piece's animal part cut at the neck, the shoulders and hips, the knees, the tail (and a dog's ears) ── */
function quad(kind, o) {
  const B = o.base, cut = f => ({ file: `cr-${o.cutFrom || kind}-${f}.ldr` }), nodes = [{ id: 'root', parent: null, p: [0, 0, 0] }];
  nodes.push({ id: 'body', parent: 'root', p: o.body, move: [['body.dy', 'y', -1]], rot: [['body.yaw', 'y', -1], ['body.pitch', 'x', -1], ['body.roll', 'z', -1]], mesh: [cut('body')].concat(o.bodyExtra || []) });
  nodes.push({ id: 'head', parent: 'body', p: o.neck, rot: [['head.yaw', 'y', -1], ['head.pitch', 'x', -1]], mesh: o.headPart ? [o.headPart] : [cut('head')] });
  for (const e of o.ears || []) nodes.push({ id: e.id, parent: 'head', p: e.p, rot: [[e.id, 'x', 1], [e.id + '.flick', 'z', e.id.endsWith('L') ? -1 : 1]], mesh: [cut(e.id)] });
  for (const h of o.horns || []) nodes[2].mesh.push(h);
  if (o.tail) nodes.push({ id: 'tail', parent: 'body', p: o.tail, rot: [['tail.yaw', 'y', -1], ['tail.pitch', 'x', -1]], mesh: [cut('tail')] });
  for (const L of ['FL', 'FR', 'HL', 'HR']) {
    const g = o.legs[L];
    nodes.push({ id: 'leg.' + L, parent: 'body', p: g.hip, rot: [['leg.' + L, 'x', 1], ['leg.' + L + '.out', 'z', L.endsWith('L') ? -1 : 1]], mesh: [cut('leg.' + L)] });
    nodes.push({ id: 'knee.' + L, parent: 'leg.' + L, p: g.knee, rot: [['knee.' + L, 'x', 1]], mesh: [cut('knee.' + L)] });
  }
  const chans = [
    ch('body.dy', -60, 20, 'the body up (+) or down: a lie is the belly on the ground', 'ldu'), ch('body.pitch', -0.6, 0.6, 'the body nose-up (+)'), ch('body.roll', -0.5, 0.5, 'the body rolled: + lifts its left side'), ch('body.yaw', -0.3, 0.3, 'the body turned on its legs'),
    ch('head.yaw', -1.2, 1.2, 'the head to its left (+)'), ch('head.pitch', o.headDown || -0.9, 0.7, 'the head up (+), down to graze or to rest on the paws (-)'),
    ch('tail.pitch', -0.9, 1.1, 'the tail up (+) or tucked'), ch('tail.yaw', -0.9, 0.9, 'the tail to its left (+): a wag'),
  ];
  for (const e of o.ears || []) chans.push(ch(e.id, -0.4, 1.3, 'the ear laid back (+), pricked (-)'), ch(e.id + '.flick', -0.4, 0.6, 'the ear turned out'));
  for (const L of ['FL', 'FR', 'HL', 'HR']) chans.push(ch('leg.' + L, -1.6, 1.0, `the ${L[0] === 'F' ? 'shoulder' : 'hip'} (${L[1] === 'L' ? 'left' : 'right'}): - swings the leg forward`),
    ch('leg.' + L + '.out', -0.2, 0.6, 'the leg out to the side'), ch('knee.' + L, L[0] === 'F' ? -0.2 : -1.8, L[0] === 'F' ? 1.9 : 0.3, L[0] === 'F' ? 'the knee: + folds the foreleg back' : 'the hock: - folds the hind foot forward'));
  const feet = {}; for (const L of ['FL', 'FR', 'HL', 'HR']) feet['leg.' + L] = { hip: 'leg.' + L, knee: 'knee.' + L, foot: o.legs[L].foot, bend: L[0] === 'F' ? 1 : -1 };
  return {
    kind, title: o.title, family: 'quadruped', blurb: o.blurb, scenes: o.scenes, needs: o.needs, card: o.card, height: o.height, nodes, channels: chans, feet,
    cuts: { from: [{ part: o.part, col: 16, m: B, to: 'body' }], regions: o.regions },
    colours: o.colours, anchors: o.anchors, gaits: o.gaits,
    presets: Object.assign({ stand: {} }, o.presets || {}),
  };
}
/* the four legs cut as boxes: below the knee (y > knee) the lower leg, below the belly (y > belly) the upper; front of zMid the forelegs */
function legBoxes(knee, belly, zMid) {
  const out = []; for (const [pre, y] of [['knee.', knee], ['leg.', belly]]) for (const L of ['FL', 'FR', 'HL', 'HR'])
    out.push([pre + L, { y: [y, 99], z: L[0] === 'F' ? [-99, zMid] : [zMid, 99], x: L[1] === 'L' ? [0, 99] : [-99, 0] }]);
  return out;
}
/* the goat (95341) the set pieces use for the rams and the flock: y 48 in the part is its hooves */
const GOAT = { base: T(0, -48, 0) };
KINDS.ram = quad('ram', {
  title: 'Ram', part: '95341', base: GOAT.base,
  blurb: 'The Cyclops\' rams and the flock (the goat of the set pieces, scaled up to carry a man beneath): cut at the neck, both shoulders and hips, the knees and the tail; a man rides under the belly.',
  body: [0, -40, 0], neck: [0, -50, -30], tail: [0, -34, 22],
  legs: { FL: { hip: [6, -32, -20], knee: [6, -14, -20], foot: [6, 0, -21] }, FR: { hip: [-6, -32, -20], knee: [-6, -14, -20], foot: [-6, 0, -21] },
    HL: { hip: [6, -32, 15], knee: [6, -14, 17], foot: [6, 0, 16] }, HR: { hip: [-6, -32, 15], knee: [-6, -14, 17], foot: [-6, 0, 16] } },
  regions: [['head', { z: [-99, -26], y: [-99, -44] }], ['tail', { z: [20, 99], y: [-99, -26] }]].concat(legBoxes(-14, -26, -2)),
  anchors: { belly: { node: 'body', p: [0, -24, -2] }, back: { node: 'body', p: [0, -50, 0] }, head: { node: 'head', p: [0, -62, -40] }, mouth: { node: 'head', p: [0, -52, -48] } },
  gaits: { walk: { stride: 28, duty: 0.62, lift: 4, speed: 22, crouch: 2.5, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 36, duty: 0.45, lift: 6, speed: 50, crouch: 3.5, bob: 1.6, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 56, duty: 0.3, lift: 8, speed: 110, crouch: 5, bob: 2.4, phase: { HL: 0, HR: 0.1, FL: 0.5, FR: 0.6 } } },
  colours: { white: 15, black: 0, grey: 71, tan: 19 },
  presets: { graze: { 'head.pitch': -0.85, 'leg.FL': -0.1, 'leg.FR': -0.1 }, lie: { 'body.dy': -22, 'leg.FL': -1.5, 'knee.FL': 1.8, 'leg.FR': -1.5, 'knee.FR': 1.8, 'leg.HL': 0.9, 'knee.HL': -1.6, 'leg.HR': 0.9, 'knee.HR': -1.6 } },
  scenes: ['OD-B09-S08', 'OD-B09-S09', 'OD-B09-S10', 'OD-B09-S11'], needs: ['HERD: the flock driven out past the stone', 'walk in triads bound with withies, a man slung beneath the middle ram', 'the lead ram last, Odysseus under its belly; stopped, stroked, let go', 'SACRIFICE: the great ram led to the altar'],
  card: 'kit.prop-ram',
});
/* the German shepherd (92586), the set pieces' dogs and Argos */
KINDS.dog = quad('dog', {
  title: 'Dog', part: '92586', base: T(0, -48, 0),
  blurb: 'The German shepherd of the set pieces, cut at the neck, shoulders and hips, knees, tail and both ears: Eumaeus\' four dogs (rush, bark, stop short, scatter) and Argos (lift the head, drop the ears, thump the tail, die).',
  body: [0, -40, 0], neck: [0, -48, -24], tail: [0, -40, 20],
  ears: [{ id: 'ear.L', p: [5, -60, -33] }, { id: 'ear.R', p: [-5, -60, -33] }],
  legs: { FL: { hip: [5, -32, -20], knee: [5, -14, -21], foot: [5, 0, -22] }, FR: { hip: [-5, -32, -20], knee: [-5, -14, -21], foot: [-5, 0, -22] },
    HL: { hip: [5, -32, 14], knee: [5, -14, 17], foot: [5, 0, 16] }, HR: { hip: [-5, -32, 14], knee: [-5, -14, 17], foot: [-5, 0, 16] } },
  regions: [['ear.L', { y: [-99, -60], z: [-42, -24], x: [1.5, 99] }], ['ear.R', { y: [-99, -60], z: [-42, -24], x: [-99, -1.5] }], ['head', { z: [-99, -24], y: [-99, -40] }],
    ['tail', { z: [18, 99], y: [-99, -20] }]].concat(legBoxes(-14, -26, -2)),
  anchors: { back: { node: 'body', p: [0, -46, 0] }, head: { node: 'head', p: [0, -58, -36] }, mouth: { node: 'head', p: [0, -50, -46] }, belly: { node: 'body', p: [0, -26, 0] } },
  gaits: { walk: { stride: 28, duty: 0.6, lift: 4, speed: 24, crouch: 2.5, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 38, duty: 0.45, lift: 6, speed: 60, crouch: 3.5, bob: 1.6, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 60, duty: 0.3, lift: 9, speed: 150, crouch: 5, bob: 2.4, phase: { HL: 0, HR: 0.08, FL: 0.45, FR: 0.55 } } },
  colours: { brown: 308, black: 0, white: 15, tan: 28 },
  presets: {
    bark: { 'head.pitch': 0.35, 'ear.L': -0.3, 'ear.R': -0.3, 'tail.pitch': 0.6, 'leg.FL': -0.25, 'leg.FR': -0.25, 'body.pitch': 0.08 },
    lie: { 'body.dy': -24, 'leg.FL': -1.5, 'knee.FL': 0.1, 'leg.FR': -1.5, 'knee.FR': 0.1, 'leg.HL': -1.2, 'knee.HL': -0.2, 'leg.HR': -1.2, 'knee.HR': -0.2, 'head.pitch': -0.35, 'tail.pitch': -0.5 },
    sit: { 'body.pitch': 0.55, 'body.dy': -12, 'leg.HL': -1.4, 'knee.HL': -1.6, 'leg.HR': -1.4, 'knee.HR': -1.6, 'leg.FL': 0.5, 'leg.FR': 0.5, 'head.pitch': -0.2, 'tail.pitch': -0.6 },
  },
  scenes: ['OD-B14-S01', 'OD-B17-S03'], needs: ['PURSUE(charge) the stranger, bark, stop at a distance', 'FLEE when stones fly', 'Argos: lift the head, drop the ears, wag, DIE (a held stillness, breath off)'],
  card: 'kit.prop-dog',
});
/* the cow (64452p01: a body and a head that turns on the toy's own joint), the cattle of the Sun */
KINDS.cattle = quad('cattle', {
  title: 'Cattle of the Sun', part: '64779c01', base: T(0, -48, 0),
  blurb: 'Helios\' cattle: the cow of the set pieces, its head on the toy\'s own joint, the body cut at the shoulders, hips, knees and tail; driven in, and felled (the root rolls it onto its side).',
  body: [0, -44, 0], neck: [0, -58, -36], tail: [0, -58, 52], headDown: -1.0, height: 100,
  headPart: { part: '64835p01c01', col: 16, m: T(0, -58, -36) },
  horns: [{ part: '13564', col: 19, m: [-14, -76, -52, 0, 0, 1, 0, 1, 0, -1, 0, 0] }, { part: '13564', col: 19, m: [14, -76, -52, 0, 0, -1, 0, 1, 0, 1, 0, 0] }],
  legs: { FL: { hip: [12, -36, -34], knee: [12, -16, -34], foot: [12, 0, -35] }, FR: { hip: [-12, -36, -34], knee: [-12, -16, -34], foot: [-12, 0, -35] },
    HL: { hip: [12, -36, 34], knee: [12, -16, 36], foot: [12, 0, 36] }, HR: { hip: [-12, -36, 34], knee: [-12, -16, 36], foot: [-12, 0, 36] } },
  regions: [['tail', { z: [50, 99], y: [-99, -14] }]].concat(legBoxes(-16, -30, 0)),
  anchors: { back: { node: 'body', p: [0, -80, 0] }, head: { node: 'head', p: [0, -66, -76] }, mouth: { node: 'head', p: [0, -52, -92] }, belly: { node: 'body', p: [0, -30, 0] } },
  gaits: { walk: { stride: 32, duty: 0.64, lift: 4, speed: 22, crouch: 3, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 42, duty: 0.45, lift: 6, speed: 50, crouch: 4, bob: 1.6, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 64, duty: 0.3, lift: 9, speed: 110, crouch: 6, bob: 2.4, phase: { HL: 0, HR: 0.1, FL: 0.5, FR: 0.6 } } },
  colours: { white: 15, red: 320, black: 0, tan: 19 },
  presets: { graze: { 'head.pitch': -0.9 }, fallen: { 'root.roll': 1.45, 'leg.FL': -0.4, 'leg.FR': -0.2, 'leg.HL': 0.3, 'leg.HR': 0.1, 'head.pitch': -0.3, 'tail.pitch': -0.4 } },
  scenes: ['OD-B12-S06'], needs: ['HERD: the cattle driven in', 'SACRIFICE: felled (a fall to the side)', 'the omen: the hides crawl, the meat lows on the spits'],
  card: 'kit.prop-cow',
});
/* Circe's beasts: the pig (87621p01), the wolf (48812) and the lion cub (14734) of the set pieces, cut like the ram. Each carries a
   `morph` channel for TRANSFORM (a man into the animal, a part-swap sequence on twos): 0 the animal, 1 nothing drawn (before the
   change), 2 the in-between: only the animal's head on the man (the pig's head is the minifig pig headdress 17351p01; the wolf's and
   the lion's their own cut heads), the man still drawn on all fours under it; the take's swap follows */
function beast(kind, o) { const K = quad(kind, o); K.family = 'quadruped';
  if (o.mask) K.nodes.push({ id: 'morph', parent: 'root', p: [0, 0, 0], swap: { ch: 'morph', parts: [null, null, [o.mask.part, o.mask.col]] }, mesh: [{ part: o.mask.part, col: o.mask.col, m: o.mask.m }] });
  K.morphShows = o.mask ? ['morph'] : ['head'];   /* what the in-between draws */
  K.channels.push(ch('morph', 0, 2, 'the change (TRANSFORM): 0 the animal, 1 not yet drawn, 2 only its head, on the man (a part swap)', 'index'));
  return K; }
KINDS.pig = beast('pig', {
  title: 'Pig', part: '87621p01', base: T(0, -40, 0), height: 44,
  blurb: 'Circe\'s swine: the pig of the set pieces cut at the neck, shoulders and hips, knees and tail; the men she changes go down on all fours and are swapped for it, the headdress pig face the in-between.',
  body: [0, -24, 0], neck: [0, -26, -36], tail: [0, -24, 34],
  legs: { FL: { hip: [7, -14, -17], knee: [7, -5, -17], foot: [7, 0, -18] }, FR: { hip: [-7, -14, -17], knee: [-7, -5, -17], foot: [-7, 0, -18] },
    HL: { hip: [7, -14, 19], knee: [7, -5, 20], foot: [7, 0, 20] }, HR: { hip: [-7, -14, 19], knee: [-7, -5, 20], foot: [-7, 0, 20] } },
  regions: [['head', { z: [-99, -36], y: [-99, 99] }], ['tail', { z: [32, 99], y: [-99, -14] }]].concat(legBoxes(-5, -11, 0)),
  anchors: { back: { node: 'body', p: [0, -44, 0] }, head: { node: 'head', p: [0, -30, -46] }, mouth: { node: 'head', p: [0, -18, -58] }, belly: { node: 'body', p: [0, -12, 0] } },
  gaits: { walk: { stride: 16, duty: 0.66, lift: 1.5, speed: 14, crouch: 1, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 22, duty: 0.45, lift: 4, speed: 34, crouch: 1.5, bob: 1.2, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 32, duty: 0.32, lift: 5, speed: 70, crouch: 2, bob: 1.8, phase: { HL: 0, HR: 0.1, FL: 0.5, FR: 0.6 } } },
  colours: { pink: 29, dark: 5, tan: 19 }, headDown: -0.7,
  presets: { graze: { 'head.pitch': -0.6 }, lie: { 'body.dy': -8, 'leg.FL': -1.2, 'knee.FL': 1.5, 'leg.FR': -1.2, 'knee.FR': 1.5, 'leg.HL': 0.8, 'knee.HL': -1.4, 'leg.HR': 0.8, 'knee.HR': -1.4 } },
  mask: { part: '17351p01', col: 29, m: T(0, 6, 0) },
  scenes: ['OD-B10-S04', 'OD-B10-S05'], needs: ['TRANSFORM: a man down on all fours, the pig face on him, the pig', 'ROOT for acorns in the pen (graze)', 'crowd to the fence at Circe\'s step'],
  card: 'kit.prop-pig',
});
KINDS.wolf = beast('wolf', {
  title: 'Wolf', part: '48812', base: T(0, -48, 0), height: 72,
  blurb: 'Circe\'s enchanted wolves: the wolf of the set pieces cut at the neck, shoulders and hips, knees and tail. They fawn on the men like dogs on a master home from a feast: the head low, the tail wagging, a nuzzle.',
  body: [0, -40, 0], neck: [0, -50, -30], tail: [0, -38, 32],
  legs: { FL: { hip: [6, -28, -28], knee: [6, -14, -28], foot: [6, 0, -29] }, FR: { hip: [-6, -28, -28], knee: [-6, -14, -28], foot: [-6, 0, -29] },
    HL: { hip: [6, -28, 26], knee: [6, -14, 28], foot: [6, 0, 28] }, HR: { hip: [-6, -28, 26], knee: [-6, -14, 28], foot: [-6, 0, 28] } },
  regions: [['head', { z: [-99, -30], y: [-99, -40] }], ['tail', { z: [31, 99], y: [-99, -16] }]].concat(legBoxes(-14, -22, 0)),
  anchors: { back: { node: 'body', p: [0, -54, 0] }, head: { node: 'head', p: [0, -58, -40] }, mouth: { node: 'head', p: [0, -52, -50] }, belly: { node: 'body', p: [0, -24, 0] } },
  gaits: { walk: { stride: 28, duty: 0.6, lift: 4, speed: 24, crouch: 2.5, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 38, duty: 0.45, lift: 6, speed: 60, crouch: 3.5, bob: 1.6, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 60, duty: 0.3, lift: 9, speed: 150, crouch: 5, bob: 2.4, phase: { HL: 0, HR: 0.08, FL: 0.45, FR: 0.55 } } },
  colours: { black: 72, grey: 71, dark: 0 },
  presets: { fawn: { 'head.pitch': -0.45, 'body.pitch': -0.12, 'tail.pitch': 0.3, 'body.dy': -4 }, sit: { 'body.pitch': 0.5, 'body.dy': -12, 'leg.HL': -1.3, 'knee.HL': -1.5, 'leg.HR': -1.3, 'knee.HR': -1.5, 'leg.FL': 0.45, 'leg.FR': 0.45, 'head.pitch': -0.1 },
    lie: { 'body.dy': -22, 'leg.FL': -1.5, 'knee.FL': 0.1, 'leg.FR': -1.5, 'knee.FR': 0.1, 'leg.HL': -1.2, 'knee.HL': -0.2, 'leg.HR': -1.2, 'knee.HR': -0.2, 'head.pitch': -0.35 } },
  scenes: ['OD-B10-S04'], needs: ['FAWN on the men (head low, tail wag, nuzzle)', 'circle, stand off'], card: 'kit.prop-wolf',
});
KINDS.lion = beast('lion', {
  title: 'Lion', part: '14734', base: T(0, 0, 0), height: 60,
  blurb: 'Circe\'s lions: the lion cub of the set pieces, scaled up, cut at the neck, shoulders and hips, knees and tail. They fawn with the wolves.',
  body: [0, -30, -18], neck: [0, -40, -32], tail: [0, -26, 8],
  legs: { FL: { hip: [10, -24, -30], knee: [10, -8, -30], foot: [10, 0, -31] }, FR: { hip: [-10, -24, -30], knee: [-10, -8, -30], foot: [-10, 0, -31] },
    HL: { hip: [9, -24, -6], knee: [9, -8, -5], foot: [9, 0, -5] }, HR: { hip: [-9, -24, -6], knee: [-9, -8, -5], foot: [-9, 0, -5] } },
  regions: [['head', { z: [-99, -32], y: [-99, -28] }], ['tail', { z: [8, 99], y: [-99, 99] }]].concat(legBoxes(-8, -18, -18)),
  anchors: { back: { node: 'body', p: [0, -44, -18] }, head: { node: 'head', p: [0, -46, -40] }, mouth: { node: 'head', p: [0, -36, -48] }, belly: { node: 'body', p: [0, -20, -18] } },
  gaits: { walk: { stride: 22, duty: 0.6, lift: 4, speed: 20, crouch: 2, phase: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 } }, trot: { stride: 30, duty: 0.45, lift: 5, speed: 50, crouch: 3, bob: 1.4, phase: { HL: 0, FR: 0, HR: 0.5, FL: 0.5 } }, run: { stride: 48, duty: 0.3, lift: 8, speed: 120, crouch: 4, bob: 2.2, phase: { HL: 0, HR: 0.08, FL: 0.45, FR: 0.55 } } },
  colours: { gold: 191, tan: 19, orange: 25 },
  presets: { fawn: { 'head.pitch': -0.4, 'body.pitch': -0.1, 'tail.pitch': 0.4, 'body.dy': -3 }, lie: { 'body.dy': -14, 'leg.FL': -1.3, 'knee.FL': 0.2, 'leg.FR': -1.3, 'knee.FR': 0.2, 'leg.HL': -1.1, 'knee.HL': -0.2, 'leg.HR': -1.1, 'knee.HR': -0.2 } },
  scenes: ['OD-B10-S04'], needs: ['FAWN on the men', 'circle'], card: 'kit.prop-lion',
});

/* Scylla: six necks of Technic ribbed-hose segments (the set piece's), each a chain laid along a curve of fixed length from its
   root in the cliff to a head (the classic dragon head) that strikes at a target and lifts what it seized */
const SEG = 6.2, NSEG = 46;
function scylla() {
  const nodes = [{ id: 'root', parent: null, p: [0, 0, 0] }], chans = [], anchors = {};
  const roots = [[-60, -10, 0], [-36, -30, -4], [-12, -4, -2], [12, -34, -2], [36, -8, -4], [60, -26, 0]];
  roots.forEach((r, n) => { const N = n + 1;
    for (let i = 0; i < NSEG; i++) nodes.push({ id: `n${N}.${i}`, parent: 'root', p: [r[0], r[1], r[2] - i * SEG], chain: { neck: N, i }, mesh: [{ part: '71944k02', col: 288, m: [r[0], r[1], r[2] - i * SEG, 1, 0, 0, 0, 0, -1, 0, 1, 0] }] });
    nodes.push({ id: `head${N}`, parent: 'root', p: [r[0], r[1], r[2] - NSEG * SEG], chain: { neck: N, head: true }, mesh: [{ part: '6027', col: 288, m: T(r[0], r[1] + 3, r[2] - NSEG * SEG) }] });
    chans.push(ch(`neck${N}.x`, -260, 260, `head ${N}'s target across the cliff (+ to Scylla's left)`, 'ldu', [-40, -20, -6, 6, 20, 40][n]), ch(`neck${N}.y`, -120, 300, `head ${N}'s target below its root (+ down)`, 'ldu', 60),
      ch(`neck${N}.z`, -NSEG * SEG, 40, `head ${N}'s target out from the cliff (- out)`, 'ldu', -230), ch(`neck${N}.slack`, 0, 1, `the neck's coil (0 a bow, 1 an S)`), ch(`neck${N}.head`, -1.2, 1.2, `head ${N} nodding (+ snout up)`));
    anchors[`jaw${N}`] = { node: `head${N}`, p: [r[0], r[1] + 8, r[2] - NSEG * SEG - 52] };
  });
  return {
    kind: 'scylla', title: 'Scylla', family: 'serpent', height: 300, nodes, channels: chans, anchors, roots,
    blurb: 'Six necks from a cleft in the cliff, each a chain of ribbed-hose segments (the set piece\'s) of fixed length laid along a curve from its root to a dragon head: they coil back, strike together at six rowers, seize and lift them.',
    scenes: ['OD-B12-S04'], needs: ['STRIKE(strike_down): six heads at once', 'LIFT six rowers (hands and feet in the air)', 'hold them up while the ship pulls away'],
    card: 'kit.prop-scyllastrike', presets: { coil: {}, },
  };
}
KINDS.scylla = scylla();

/* ═════════════ a rig ═════════════ */
const CLAMP = {};
for (const K of Object.values(KINDS)) for (const c of K.channels) CLAMP[K.kind + ':' + c.name] = [c.min, c.max];
const ROOTCH = ['root.x', 'root.y', 'root.z', 'root.h', 'root.pitch', 'root.roll'];
function define(kind, opts = {}) {
  const K = KINDS[kind]; if (!K) throw new Error('no such creature: ' + kind);
  const order = [], byId = {}; for (const n of K.nodes) { byId[n.id] = n; order.push(n); }
  const lim = {}; for (const c of K.channels) lim[c.name] = c;
  const colour = opts.colour != null ? (K.colours && K.colours[opts.colour] != null ? K.colours[opts.colour] : opts.colour) : (K.colours ? Object.values(K.colours)[0] : null);
  const rig = {
    kind, K, id: opts.id || kind, scale: opts.scale || 1, colour, trim: opts.trim != null ? opts.trim : K.trim, nodes: order,
    channels: ROOTCH.map(n => ({ name: n, min: -Infinity, max: Infinity, rest: 0, unit: n === 'root.h' || n === 'root.pitch' || n === 'root.roll' ? 'rad' : 'world', doc: 'where it stands in the take' })).concat(K.channels),
    limits: lim,
    rest() { const v = {}; for (const c of K.channels) v[c.name] = c.rest || 0; return v; },
    preset(name) { return Object.assign({}, (K.presets || {})[name] || {}); },
    clamp(v) { const o = {}; for (const k in v) { const c = lim[k]; o[k] = c ? cl(v[k], c.min, c.max) : v[k]; } return o; },
    /* the world matrix of the creature's frame */
    world(v) { const g = k => v[k] || 0;
      return mul(mul(mul(mul(T(g('root.x'), g('root.y'), g('root.z')), RY(g('root.h'))), RX(g('root.pitch'))), RZ(g('root.roll'))), mul(SC(rig.scale), FLIP)); },
    /* every node's matrix, rest creature frame -> creature frame (identity at rest), and -> world */
    local(v0) {
      const v = rig.clamp(v0 || {}), M = {};
      if (K.kind === 'scylla') return scyllaLocal(rig, v);
      for (const n of order) {
        const par = n.parent ? M[n.parent] : I12; let L = T(n.p[0], n.p[1], n.p[2]);
        for (const [c, ax, s] of n.move || []) { const d = (v[c] || 0) * s; L = mul(L, T(ax === 'x' ? d : 0, ax === 'y' ? d : 0, ax === 'z' ? d : 0)); }
        for (const [c, ax, s] of n.rot || []) if (v[c]) L = mul(L, ROT[ax](v[c] * s));
        M[n.id] = mul(mul(par, L), T(-n.p[0], -n.p[1], -n.p[2]));
      }
      return M;
    },
    pose(v) { const W = rig.world(v || {}), L = rig.local(v), out = {}; for (const id in L) out[id] = mul(W, L[id]); return { nodes: out, world: W, local: L }; },
    /* the parts of a node (a replacement part by its channel) */
    /* a node not drawn at v: the change (morph 1 nothing, 2 only the in-between's nodes) */
    hidden(n, v) { const mo = K.morphShows ? Math.round((v || {}).morph || 0) : 0; return mo === 1 || (mo === 2 && !K.morphShows.includes(n.id)); },
    meshOf(n, v) { if (rig.hidden(n, v)) return []; if (n.swap) { const i = cl(Math.round((v || {})[n.swap.ch] || 0), 0, n.swap.parts.length - 1), q = n.swap.parts[i]; if (q == null) return []; return n.mesh.map(m => Object.assign({}, m, Array.isArray(q) ? { part: q[0], col: q[1] } : { part: q })).concat(Array.isArray(q) && q[2] ? q[2] : []); } return n.mesh || []; },
    rows(v, { frame = 'world' } = {}) {
      const P = rig.pose(v), out = [];
      for (const n of order) for (const m of rig.meshOf(n, v)) {
        const M = frame === 'world' ? P.nodes[n.id] : P.local[n.id], mm = m.m || I12, col = m.col === 'trim' ? rig.trim : m.col === 16 && rig.colour != null ? rig.colour : m.col;
        out.push({ node: n.id, file: m.file || null, part: m.part || null, col: m.file ? (rig.colour != null ? rig.colour : 16) : col, m: mul(M, mm) });
      }
      return out;
    },
    ldr(v, title) {
      const f = x => (Math.round(x * 1000) / 1000).toString();
      return [`0 ${title || rig.id}`, `0 // ${kind} posed by film-readymades/creatures.js; node files from odyssey/creatures/parts/${K.cutFrom || kind}.mpd`]
        .concat(rig.rows(v, { frame: 'ldraw' }).map(r => `1 ${r.col} ${r.m.map(f).join(' ')} ${r.file || r.part + '.dat'}`)).join('\n') + '\n';
    },
    /* an anchor's frame in the world: at the anchor, turned with its node, in the creature's axes (y toward its belly, -z its
       front) but at the world's scale, so a minifig hung on it keeps its own size whatever the creature's */
    anchor(name, v) { const a = K.anchors[name]; if (!a) return null; const P = rig.pose(v), M = mul(P.nodes[a.node] || P.world, T(a.p[0], a.p[1], a.p[2]));
      const k = Math.hypot(M[3], M[6], M[9]) || 1; return [M[0], M[1], M[2], ...M.slice(3).map(q => q / k)]; },
    point(name, v) { const M = rig.anchor(name, v); return M ? [M[0], M[1], M[2]] : null; },
    /* three.js: a group per node under `group`, each holding what meshOf(file|part, col) returns; apply(v) poses them */
    attach(THREE, group, meshOf) {
      rig.three = { THREE, group, objs: {} };
      for (const n of order) { const g = new THREE.Group(); g.name = rig.id + ':' + n.id; g.matrixAutoUpdate = false; group.add(g); rig.three.objs[n.id] = g;
        for (const m of n.swap ? [] : n.mesh || []) { const o = meshOf(m.file || m.part, m.file ? (rig.colour != null ? rig.colour : 16) : m.col === 'trim' ? rig.trim : m.col === 16 && rig.colour != null ? rig.colour : m.col); if (!o) continue; setM(THREE, o, m.m || I12); g.add(o); }
        if (n.swap) { g.userData.swap = n.swap.parts.map(p => { if (p == null) return null; const c0 = Array.isArray(p) ? p[1] : n.mesh[0].col, o = meshOf(Array.isArray(p) ? p[0] : p, c0 === 16 && rig.colour != null ? rig.colour : c0); if (!o) return null;
          const extra = Array.isArray(p) && p[2] ? p[2] : []; let s = o; setM(THREE, o, n.mesh[0].m);
          if (extra.length) { s = new THREE.Group(); s.add(o); for (const m of extra) { const e = meshOf(m.part, m.col === 16 && rig.colour != null ? rig.colour : m.col); if (e) { setM(THREE, e, m.m); s.add(e); } } }   /* a lid with the pupil: one state */
          s.visible = false; g.add(s); return s; }); } }
      return rig;
    },
    apply(v) {
      const R = rig.three; if (!R) return; const P = rig.pose(v);
      for (const n of order) { const g = R.objs[n.id]; setM(R.THREE, g, P.nodes[n.id]); g.matrixWorldNeedsUpdate = true; g.visible = !rig.hidden(n, v);
        if (g.userData.swap) { const i = cl(Math.round((v || {})[n.swap.ch] || 0), 0, n.swap.parts.length - 1); g.userData.swap.forEach((o, k) => { if (o) o.visible = k === i; }); } }
    },
  };
  return rig;
}
function setM(THREE, o, M) { o.matrixAutoUpdate = false; o.matrix.set(M[3], M[4], M[5], M[0], M[6], M[7], M[8], M[1], M[9], M[10], M[11], M[2], 0, 0, 0, 1); o.matrixWorldNeedsUpdate = true; }

/* ── Scylla's necks: each a chain of rigid segments of fixed spacing laid along a curve from its root to its target. The curve leaves
   the root along -z (out of the cleft) and arrives at the head; its length is the neck's, so a near target bows the neck out (the
   bow found by bisection), a far one is brought in to reach, and `slack` turns the bow into an S (a coil ready to strike). ── */
function neckCurve(root, v, N, len) {
  const tx = v[`neck${N}.x`] || 0, ty = v[`neck${N}.y`] || 0, tz = v[`neck${N}.z`] != null ? v[`neck${N}.z`] : -230, slack = v[`neck${N}.slack`] || 0;
  let tgt = [root[0] + tx, root[1] + ty, root[2] + tz];
  const d0 = Math.hypot(tx, ty, tz); if (d0 > len * 0.97) { const k = len * 0.97 / d0; tgt = [root[0] + tx * k, root[1] + ty * k, root[2] + tz * k]; }
  /* the curve: a cubic from the root (tangent out of the cliff, -z) to the target, pushed sideways by a bow (b) along the normal */
  const P = (b, u) => {
    const c1 = [root[0], root[1] - 10, root[2] - len * 0.3], c2 = [tgt[0], tgt[1] - len * 0.25 * (1 - slack), tgt[2] + len * 0.2];
    const q = 1 - u, B = [0, 1, 2].map(k => q * q * q * root[k] + 3 * q * q * u * c1[k] + 3 * q * u * u * c2[k] + u * u * u * tgt[k]);
    const w = Math.sin(Math.PI * u) * (1 - slack) + Math.sin(2 * Math.PI * u) * slack;   // a bow, or an S
    return [B[0] + b * 0.25 * w, B[1] - b * w, B[2] + b * 0.35 * w];
  };
  const arc = (b, n = 60) => { let s = 0, p = P(b, 0); for (let i = 1; i <= n; i++) { const q = P(b, i / n); s += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; } return s; };
  let lo = 0, hi = len * 0.6; for (let k = 0; k < 12 && arc(hi) < len; k++) hi *= 1.6;   /* a bow big enough, then bisect to the length */
  if (arc(0) < len) { for (let k = 0; k < 34; k++) { const m = (lo + hi) / 2; if (arc(m) < len) lo = m; else hi = m; } } else lo = 0;
  const b = lo, tab = [[0, P(b, 0)]]; let s = 0; for (let i = 1; i <= 200; i++) { const q = P(b, i / 200), p = tab[i - 1][1]; s += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); tab.push([s, q]); }
  /* the point at arc length x along it (beyond its end, straight on) */
  return x => { if (x >= s) { const a = tab[199][1], c = tab[200][1], L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]) || 1, e = x - s; return [c[0] + (c[0] - a[0]) / L * e, c[1] + (c[1] - a[1]) / L * e, c[2] + (c[2] - a[2]) / L * e]; }
    let i = 1; while (tab[i][0] < x) i++; const [s0, p0] = tab[i - 1], [s1, p1] = tab[i], u = (x - s0) / Math.max(1e-6, s1 - s0); return [0, 1, 2].map(k => lerp(p0[k], p1[k], u)); };
}
function frameAlong(a, b, up = [0, -1, 0]) {   // a matrix at a whose -z runs from a toward b (the segment's rest axis) and whose y is down-ish
  let f = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const L = Math.hypot(...f) || 1; f = f.map(x => x / L);
  const z = f.map(x => -x); let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; let lx = Math.hypot(...x);
  if (lx < 1e-4) { x = [1, 0, 0]; lx = 1; } x = x.map(q => q / lx); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return [a[0], a[1], a[2], x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
}
function scyllaLocal(rig, v) {
  const K = rig.K, M = { root: I12 }, len = NSEG * SEG;
  K.roots.forEach((r, n) => { const N = n + 1, at = neckCurve(r, v, N, len);
    for (let i = 0; i < NSEG; i++) { const a = at(i * SEG), b = at(i * SEG + SEG), F = frameAlong(a, b);
      M[`n${N}.${i}`] = mul(F, T(-r[0], -r[1], -(r[2] - i * SEG))); }
    const a = at(NSEG * SEG - SEG * 2), b = at(NSEG * SEG), F = mul(frameAlong(b, [2 * b[0] - a[0], 2 * b[1] - a[1], 2 * b[2] - a[2]]), RX(-(v[`neck${N}.head`] || 0)));
    M[`head${N}`] = mul(F, T(-r[0], -r[1], -(r[2] - NSEG * SEG))); });
  return M;
}

/* ═════════════ procedures: deterministic functions of t ═════════════ */
/* a path: keys [[t, x, z], ...] (world) eased linearly, or a function t -> [x, z]. Its arc length s(t) is tabulated once on a fixed
   grid (so every query at t, in any order, gets the same s), and the heading follows the direction of travel. */
const PATHS = new WeakMap();
function pathOf(p) {
  if (PATHS.has(p)) return PATHS.get(p);
  /* a function path may carry its own span (fn.t0, fn.t1); else 0..120 s */
  const fn = typeof p === 'function' ? p : keysFn(p), t0 = typeof p === 'function' ? (p.t0 || 0) : p[0][0], t1 = typeof p === 'function' ? (p.t1 || 120) : p[p.length - 1][0] + 1, dt = 1 / 120;
  const n = Math.ceil((t1 - t0) / dt) + 1, S = new Float64Array(n); let q = fn(t0);
  for (let i = 1; i < n; i++) { const r = fn(t0 + i * dt); S[i] = S[i - 1] + Math.hypot(r[0] - q[0], r[1] - q[1]); q = r; }
  const sAt = t => { const x = (cl(t, t0, t1) - t0) / dt, i = Math.min(n - 2, Math.floor(x)); return lerp(S[i], S[i + 1], x - i); };
  /* the place at arc length s (inverse of sAt, by bisection on the table) and the heading there */
  const tAtS = s => { let lo = 0, hi = n - 1; if (s <= 0) return t0; if (s >= S[n - 1]) return t1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] < s) lo = m; else hi = m; } return t0 + (lo + (s - S[lo]) / Math.max(1e-9, S[hi] - S[lo])) * dt; };
  const headAt = t => { const a = fn(t - 0.08), b = fn(t + 0.08); if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05) return null; return Math.atan2(b[0] - a[0], b[1] - a[1]); };
  /* the heading on the grid: moving, the way it goes; standing, the heading it arrived with, turned in place over the half second
     before it sets off the new way (before it has ever moved, the way it will set off) */
  const Hr = new Array(n), Hh = new Float64Array(n), hasH = new Uint8Array(n); for (let i = 0; i < n; i++) Hr[i] = headAt(t0 + i * dt);
  let lastI = -1; const back = new Int32Array(n), fwd = new Int32Array(n);
  for (let i = 0; i < n; i++) { if (Hr[i] != null) lastI = i; back[i] = lastI; } lastI = -1; for (let i = n - 1; i >= 0; i--) { if (Hr[i] != null) lastI = i; fwd[i] = lastI; }
  for (let i = 0; i < n; i++) { if (Hr[i] != null) { Hh[i] = Hr[i]; hasH[i] = 1; continue; } const b = back[i], f = fwd[i]; if (b < 0 && f < 0) continue; hasH[i] = 1;
    if (b < 0) { Hh[i] = Hr[f]; continue; } if (f < 0) { Hh[i] = Hr[b]; continue; } const u = sm(cl01(1 - (f - i) * dt / 0.5)); Hh[i] = Hr[b] + wrapPi(Hr[f] - Hr[b]) * u; }
  for (let i = 1; i < n; i++) Hh[i] = Hh[i - 1] + wrapPi(Hh[i] - Hh[i - 1]);   /* unwrapped, so it interpolates the short way */
  const hAt = (t, h0) => { if (!hasH.some(x => x)) return h0; const x = (cl(t, t0, t1) - t0) / dt, i = Math.min(n - 2, Math.floor(x)); return wrapPi(lerp(Hh[i], Hh[i + 1], x - i)); };
  const P = { fn, sAt, tAtS, headAt, hAt, Hh, dt, t0, t1, total: S[n - 1] };
  PATHS.set(p, P); return P;
}
function keysFn(K) { return t => { if (t <= K[0][0]) return [K[0][1], K[0][2]]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]), e = K[i][3] === 'linear' ? u : sm(u); return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; } const L = K[K.length - 1]; return [L[1], L[2]]; }; }
/* a heading that holds when the creature stops and turns the short way */
function heading(P, t, h0 = 0) { return P.hAt(t, h0); }
/* two bones in the leg's plane (y, z of the parent frame): hip H, knee K, foot F at rest; the angles that put F on target */
function ik2(H, K, F, tgt, bend) {
  const u0 = [K[1] - H[1], K[2] - H[2]], l0 = [F[1] - K[1], F[2] - K[2]], ang = w => Math.atan2(w[1], w[0]);
  const a = Math.hypot(...u0), b = Math.hypot(...l0), d = cl(Math.hypot(tgt[1] - H[1], tgt[2] - H[2]), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const c = cl((d * d - a * a - b * b) / (2 * a * b), -1, 1), th2 = bend * Math.acos(c) - (ang(l0) - ang(u0));
  const r = [u0[0] + Math.cos(th2) * l0[0] - Math.sin(th2) * l0[1], u0[1] + Math.sin(th2) * l0[0] + Math.cos(th2) * l0[1]];
  const th1 = ang([tgt[1] - H[1], tgt[2] - H[2]]) - ang(r);
  return [th1, th2];
}
const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
/* the gait at t: a name ('walk'), an object of its numbers, or a schedule [[t, 'run'], [3.4, 'walk'], ...] blended over `blend` s */
const GNUM = ['stride', 'duty', 'lift', 'speed', 'crouch', 'bob', 'stance'];
function gaitAt(K, spec, t, blend = 0.5) {
  const one = g => Object.assign({ crouch: 2, bob: 1.2, stance: 0 }, (K.gaits || {})[typeof g === 'string' ? g : 'walk'] || {}, typeof g === 'object' && !Array.isArray(g) ? g : {});
  if (!Array.isArray(spec)) return one(spec);
  let k = 0; while (k + 1 < spec.length && spec[k + 1][0] <= t) k++;
  const A = one(spec[k][1]); if (k === 0 || t - spec[k][0] >= blend) return A;
  const B = one(spec[k - 1][1]), u = sm(cl01((t - spec[k][0]) / blend)), out = Object.assign({}, A, { phase: {} });
  for (const n of GNUM) if (A[n] != null || B[n] != null) out[n] = lerp(B[n] != null ? B[n] : A[n], A[n] != null ? A[n] : B[n], u);
  for (const L of Object.keys(Object.assign({}, A.phase, B.phase))) { const a = (B.phase || {})[L] || 0, b = (A.phase || {})[L] || 0; out.phase[L] = a + wrapPi((b - a) * 2 * Math.PI) / (2 * Math.PI) * u; }
  return out;
}
/* the phase clocks: for each leg, the cycles of the stride it has turned so far (the arc length over the stride integrated on a fixed
   grid, plus the leg's own offset in the gait), so a change of gait or of speed never makes a phase jump, and the inverse (the time
   a leg reaches a given phase). A foot's plant is a function of that clock alone, so it cannot move while the foot is down. */
const CLOCKS = new WeakMap();
function clockOf(P, K, spec, sc) {
  let byPath = CLOCKS.get(P); if (!byPath) { byPath = new Map(); CLOCKS.set(P, byPath); }
  const key = K.kind + '|' + sc + '|' + JSON.stringify(spec); if (byPath.has(key)) return byPath.get(key);
  const dt = 1 / 120, n = Math.ceil((P.t1 - P.t0) / dt) + 1, legs = Object.keys(K.feet || {}).map(l => l.split('.')[1]);
  const Ph = new Float64Array(n), X = {}; for (const L of legs) X[L] = new Float64Array(n);
  let sPrev = P.sAt(P.t0); const g0 = gaitAt(K, spec, P.t0); for (const L of legs) X[L][0] = (g0.phase || {})[L] || 0;
  const R = (K.turnR || 22) * sc;   /* turning on the spot steps too: a turn of the body counts as the distance its feet go round */
  for (let i = 1; i < n; i++) { const t = P.t0 + i * dt, sN = P.sAt(t), g = gaitAt(K, spec, t), dh = Math.abs(wrapPi(P.hAt(t, 0) - P.hAt(t - dt, 0)));
    Ph[i] = Ph[i - 1] + (sN - sPrev + dh * R) / (gaitAt(K, spec, t - dt / 2).stride * sc); sPrev = sN;
    for (const L of legs) X[L][i] = Math.max(X[L][i - 1], Ph[i] + ((g.phase || {})[L] || 0)); }   /* never backwards */
  const at = A => t => { const x = (cl(t, P.t0, P.t1) - P.t0) / dt, i = Math.min(n - 2, Math.floor(x)); return lerp(A[i], A[i + 1], x - i); };
  const invOf = A => f => { if (f <= A[0]) return P.t0; if (f >= A[n - 1]) return P.t1; let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m] < f) lo = m; else hi = m; } return P.t0 + (lo + (f - A[lo]) / Math.max(1e-12, A[hi] - A[lo])) * dt; };
  const C = { at: at(Ph), leg: {} }; for (const L of legs) C.leg[L] = { at: at(X[L]), inv: invOf(X[L]) };
  byPath.set(key, C); return C;
}
/* the gait: `params` {path: keys [[t, x, z], ...] or fn t -> [x, z] (world), gait: 'walk' | 'trot' | 'run' | {stride, duty, lift, crouch,
   bob, phase} | a schedule [[t, gait], ...], blend (s), stance (LDU the feet are planted out from under the hips), h0, y, base: {ch: v}}.
   Each foot is planted where its hip will pass over it at mid-stance and stays there until it lifts (so it never slides), swings on
   an arc to its next plant; a creature coming to a stop sets its swinging feet down where it stops. The legs are solved to their feet
   (hip and knee, and turned out on the hip against the body's roll); the body bobs twice a cycle, pitches and sways; the head nods and
   the tail swings. Returns the channels at t (root.* included), and v._feet {leg: {at, planted, u, cyc}}. */
function gait(rig, t, params = {}) {
  const K = rig.K, P = pathOf(params.path), sc = rig.scale, spec = params.gait || 'walk';
  const G = Object.assign(gaitAt(K, spec, t, params.blend), params.stance != null ? { stance: params.stance } : {});
  const clock = clockOf(P, K, Array.isArray(spec) ? spec.map(e => [e[0], e[1]]) : spec, sc), phase = clock.at(t);
  const pos = P.fn(t), h = heading(P, t, params.h0 || 0), y0 = params.y || 0, s = P.sAt(t);
  const v = Object.assign(rig.rest(), params.base || {}, { 'root.x': pos[0], 'root.z': pos[1], 'root.y': y0, 'root.h': h });
  const turn = Math.abs(wrapPi(heading(P, t + 0.05) - heading(P, t - 0.05))) / 0.1 * (K.turnR || 22) * sc;
  const speed = (P.sAt(t + 0.05) - P.sAt(t - 0.05)) / 0.1 + turn, moving = cl01(speed / (G.speed * sc * 0.3 + 1e-6));
  /* the legs never stand quite straight (a straight leg is the solver's singular point and leaves no reach): crouched a little, more
     as it goes faster, and a bob at twice the stride's rate; a pitch and a sway with the stride */
  v['body.dy'] = (v['body.dy'] || 0) - G.crouch * (0.5 + 0.5 * moving) + moving * G.bob * Math.cos(4 * Math.PI * phase);
  v['body.pitch'] = (v['body.pitch'] || 0) + moving * 0.03 * Math.sin(2 * Math.PI * phase);
  v['body.roll'] = (v['body.roll'] || 0) + moving * 0.025 * Math.sin(2 * Math.PI * phase + 0.6);
  if (params.head !== false) v['head.pitch'] = (v['head.pitch'] || 0) + moving * 0.06 * Math.sin(4 * Math.PI * phase + 1);
  if (K.nodes.some(n => n.id === 'tail') && params.tail !== false) v['tail.yaw'] = (v['tail.yaw'] || 0) + moving * 0.25 * Math.sin(2 * Math.PI * phase);
  const Winv = inv(rig.world(v)), L = rig.local(v), nodeOf = id => K.nodes.find(n => n.id === id);
  v._feet = {};
  for (const [legId, F] of Object.entries(K.feet || {})) {
    const L4 = legId.split('.')[1], lc = clock.leg[L4], x = lc.at(t), cyc = Math.floor(x), u = x - cyc;
    const dutyOf = k => gaitAt(K, spec, lc.inv(k), params.blend).duty || 0.6, duty = dutyOf(cyc);   /* each cycle keeps the duty it touched down with */
    const hipN = nodeOf(F.hip), kneeN = nodeOf(F.knee), wide = (G.stance || 0) * Math.sign(F.foot[0]);   /* a wider stance: the feet out from under the hips */
    /* the foot's home in the world when the creature stood at time tt (under its hip, turned with the path's heading then) */
    const homeT = tt => { const q = P.fn(tt), hh = heading(P, tt, h), c = Math.cos(hh), sn = Math.sin(hh), f = [(F.foot[0] + wide) * sc, -F.foot[2] * sc];
      return [q[0] + c * f[0] + sn * f[1], y0, q[1] - sn * f[0] + c * f[1]]; };
    const plant = k => homeT(lc.inv(k + dutyOf(k) / 2));   /* the plant of cycle k: where its hip is at that cycle's mid-stance */
    let tgt, lifted = 0;
    if (u < duty) tgt = plant(cyc);
    else { const w = (u - duty) / (1 - duty), a = plant(cyc), b = plant(cyc + 1), e = sm(w), c = homeT(lc.inv(x)); lifted = Math.sin(Math.PI * w) * moving;   /* c: under the hip where the leg's clock stopped */
      tgt = [lerp(c[0], lerp(a[0], b[0], e), moving), y0 + (G.lift || 4) * sc * lifted, lerp(c[2], lerp(a[2], b[2], e), moving)]; }
    v._feet[legId] = { at: tgt, planted: lifted === 0, u, cyc };
    /* the target in the parent (body) frame at rest coordinates: through the world and the body's own matrix */
    const inBody = ap(inv(L[hipN.parent]), ap(Winv, tgt));
    const [a1, a2] = ik2(hipN.p, kneeN.p, F.foot, inBody, F.bend);
    v[F.hip] = wrapPi(a1) * hipN.rot[0][2]; v[F.knee] = wrapPi(a2) * kneeN.rot[0][2];
    /* sideways: the leg turned out on its hip so the foot stays under its plant as the body rolls and sways */
    const oc = hipN.rot[1]; if (oc) v[oc[0]] = Math.atan2(inBody[0] - hipN.p[0], Math.max(4, inBody[1] - hipN.p[1])) * (oc[2] > 0 ? -1 : 1);
  }
  void s;
  return v;
}
/* a spring the body follows (mass, lag, overshoot damped): x'' = w^2 (target - x) - 2 z w x', from rest at t0, on a fixed 1/240 s grid */
const FOLLOW = new WeakMap();
function follow(fn, t, { w = 4, z = 0.7, t0 = 0 } = {}) {
  let tab = FOLLOW.get(fn); const dt = 1 / 240;
  if (!tab) { tab = { xs: [fn(t0).slice()], vs: [fn(t0).map(() => 0)] }; FOLLOW.set(fn, tab); }
  /* before the spring starts it rests where the path starts (a path that begins after t = 0 is held there): at least two rows tabulated */
  t = Math.max(t, t0); const n = Math.max(1, Math.ceil((t - t0) / dt)) + 1;
  while (tab.xs.length <= n) { const i = tab.xs.length - 1, x = tab.xs[i], vv = tab.vs[i], g = fn(t0 + i * dt), nx = [], nv = [];
    for (let k = 0; k < x.length; k++) { const a = w * w * (g[k] - x[k]) - 2 * z * w * vv[k]; nv.push(vv[k] + a * dt); nx.push(x[k] + nv[k] * dt); }
    tab.xs.push(nx); tab.vs.push(nv); }
  const f = Math.max(0, (t - t0) / dt), i = Math.min(tab.xs.length - 2, Math.floor(f)), u = f - i;
  return { x: tab.xs[i].map((q, k) => lerp(q, tab.xs[i + 1][k], u)), v: tab.vs[i].map((q, k) => lerp(q, tab.vs[i + 1][k], u)) };
}
/* the giant's walk: the body follows the path through a spring (its weight lags, then carries it on past a stop), each rigid leg is
   pitched to its planted foot and the body sinks as the planted leg leans (so the foot stays on the ground), a waddle rolls the body
   over the planted foot so the other swings clear, and each footfall is a jolt of the body and a shake of the ground:
     v._fx.shake   a ring that decays after each footfall (world units: offset a camera or the set by it)
     v._fx.falls   [{foot, t, at}] the footfalls of the last 0.6 s (dust where they landed)
   params {path, stride (LDU), duty, w, z (the spring: stiffness, damping), shake, y, base, arms: false} */
function heavy(rig, t, params = {}) {
  const K = rig.K, sc = rig.scale, P0 = pathOf(params.path), w = params.w || 3.2, z = params.z || 0.75;
  if (!params._lag) { const lagFn = tt => follow(P0.fn, tt, { w, z, t0: P0.t0 }).x; lagFn.t0 = P0.t0; lagFn.t1 = P0.t1 + 8; Object.defineProperty(params, '_lag', { value: lagFn, enumerable: false }); }
  const P = pathOf(params._lag), F = follow(P0.fn, t, { w, z, t0: P0.t0 }), pos = F.x, spd = Math.hypot(F.v[0], F.v[1]);
  const stride = (params.stride || 38) * sc, duty = params.duty || 0.62, s = P.sAt(t), phase = s / stride, h = heading(P0, t, params.h0 || 0), y0 = params.y || 0;   /* it faces where it means to go, even rocking back past a stop */
  const moving = cl01(spd / (12 * sc));
  const v = Object.assign(rig.rest(), params.base || {}, { 'root.x': pos[0], 'root.z': pos[1], 'root.y': y0, 'root.h': h });
  const legs = [['leg.R', 0], ['leg.L', 0.5]], fx = { shake: 0, falls: [] }, tg = {};
  let sink = 0, roll = 0;
  for (const [id, ph] of legs) {
    const Fd = K.feet[id], x = phase + ph, cyc = Math.floor(x), u = x - cyc;
    const home = S => { const tt = P.tAtS(S), q = P.fn(tt), hh = heading(P0, tt, h), c = Math.cos(hh), sn = Math.sin(hh), f = [Fd.foot[0] * sc, -Fd.foot[2] * sc]; return [q[0] + c * f[0] + sn * f[1], y0, q[1] - sn * f[0] + c * f[1]]; };
    const plant = k => home((k + duty / 2 - ph) * stride);
    if (u < duty) tg[id] = { at: plant(cyc), planted: true };
    else { const ww = (u - duty) / (1 - duty), a = plant(cyc), b = plant(cyc + 1), c = home(s), e = sm(ww);
      tg[id] = { at: [lerp(c[0], lerp(a[0], b[0], e), moving), y0, lerp(c[2], lerp(a[2], b[2], e), moving)], planted: false, lift: Math.sin(Math.PI * ww) * moving };
      roll += (id === 'leg.R' ? -1 : 1) * tg[id].lift; }
    /* the footfalls: each touch-down (u = 0) is where arc length (k - ph) * stride was reached */
    for (let k = cyc; k > cyc - 4; k--) { const tk = P.tAtS((k - ph) * stride); if (tk > t || tk <= P0.t0 + 0.05 || k < 1) continue; const age = t - tk;
      if (age < 1.5) fx.shake += (params.shake != null ? params.shake : 2.5) * sc * Math.exp(-age * 6) * Math.sin(age * 2 * Math.PI * 7);
      if (age < 0.6) fx.falls.push({ foot: id, t: tk, at: plant(k) }); }
  }
  /* the body: rolled over the planted foot (the waddle), the trunk counter-rolled, a turn of the hips with the stride */
  v['body.roll'] = (v['body.roll'] || 0) + 0.07 * roll;
  v['torso.roll'] = (v['torso.roll'] || 0) - 0.05 * roll;
  v['body.yaw'] = (v['body.yaw'] || 0) + moving * 0.07 * Math.sin(2 * Math.PI * phase);
  /* the weight: leaning into a start, back against a stop (the spring's acceleration); the arms swing against the legs */
  const F2 = follow(P0.fn, t + 0.05, { w, z, t0: P0.t0 }), acc = [(F2.v[0] - F.v[0]) / 0.05, (F2.v[1] - F.v[1]) / 0.05];
  const along = (acc[0] * Math.sin(h) + acc[1] * Math.cos(h)) / (60 * sc);
  v['torso.lean'] = (v['torso.lean'] || 0) + cl(along * 0.4, -0.25, 0.3) + moving * 0.1;
  if (params.arms !== false) { v['arm.R.pitch'] = (v['arm.R.pitch'] || 0) - moving * 0.3 * Math.sin(2 * Math.PI * phase); v['arm.L.pitch'] = (v['arm.L.pitch'] || 0) + moving * 0.3 * Math.sin(2 * Math.PI * phase); }
  v['head.pitch'] = (v['head.pitch'] || 0) - moving * 0.04 * Math.cos(4 * Math.PI * phase);
  /* the legs: twice round, the first to find how far the planted leg's lean lowers the hips, the second with the hips there */
  /* the body carried a little low (the knees never lock), bobbing down onto each footfall; then each leg solved to its foot (hip and
     knee in the leg's plane, turned out on the hip so the foot stays under its plant as the body rolls) */
  v['hips.dy'] = (v['hips.dy'] || 0) - (params.crouch != null ? params.crouch : 1.8) - moving * 1.2 * (0.5 - 0.5 * Math.cos(4 * Math.PI * (phase - 0.08)));
  const Wi = inv(rig.world(v)), L = rig.local(v);
  for (const [id] of legs) { const Fd = K.feet[id], hipN = K.nodes.find(n => n.id === Fd.hip), kneeN = K.nodes.find(n => n.id === Fd.knee);
    const q = ap(inv(L[hipN.parent]), ap(Wi, tg[id].at)); if (!tg[id].planted) q[1] -= (params.lift != null ? params.lift : 6) * (tg[id].lift || 0);
    const [a1, a2] = ik2(hipN.p, kneeN.p, Fd.foot, q, Fd.bend); v[Fd.hip + '.pitch'] = wrapPi(a1) * hipN.rot[0][2]; v[Fd.knee] = wrapPi(a2) * kneeN.rot[0][2];
    const oc = hipN.rot[1]; if (oc) v[oc[0]] = Math.atan2(q[0] - hipN.p[0], Math.max(8, q[1] - hipN.p[1])) * (oc[2] > 0 ? -1 : 1); }
  v._fx = fx; v._feet = tg;
  return v;
}
/* hands to world points: damped least squares over the chain (the torso's twist and lean, each shoulder's pitch and out, each elbow),
   solved from the pose given (never from the last frame's answer: the same inputs are always the same pose). One hand:
   reach(rig, v, 'R', [x, y, z]); both at once (they share the torso): reach(rig, v, [['R', p], ['L', q]]). */
function reach(rig, v0, hand, target, { iters = 40, use, weight = 1 } = {}) {
  const goals = Array.isArray(hand) ? hand : [[hand, target]], v = Object.assign({}, v0);
  const chs = use || ['torso.twist', 'torso.lean'].concat(...goals.map(([h]) => [`arm.${h}.pitch`, `arm.${h}.out`, `elbow.${h}`]));
  const err = q => [].concat(...goals.map(([h, p]) => { const g = rig.point('grip.' + h, q); return [p[0] - g[0], p[1] - g[1], p[2] - g[2]]; }));
  const lam = 30 * rig.scale, damp = { 'torso.twist': 0.3, 'torso.lean': 0.18 }, n = goals.length * 3;
  for (let it = 0; it < iters; it++) {
    const e = err(v); if (Math.hypot(...e) < 0.5 * rig.scale) break;
    const J = chs.map(c => { const q = Object.assign({}, v); q[c] = (q[c] || 0) + 1e-3; const e2 = err(q); return e.map((x, k) => (x - e2[k]) / 1e-3); });
    /* dq = W J^T (J W J^T + lam^2 I)^-1 e */
    const A = []; for (let r = 0; r < n; r++) { A.push([]); for (let c2 = 0; c2 < n; c2++) A[r].push(J.reduce((s, j, k) => s + j[r] * j[c2] * (damp[chs[k]] || 1), 0) + (r === c2 ? lam * lam : 0)); }
    const x = solveN(A, e);
    chs.forEach((c, k) => { const d = J[k].reduce((s, jj, r) => s + jj * x[r], 0) * (damp[c] || 1) * weight, L = rig.limits[c]; v[c] = L ? cl((v[c] || 0) + d, L.min, L.max) : (v[c] || 0) + d; });
  }
  return v;
}
function solveN(A, b) {   // Gaussian elimination with partial pivoting (n <= 9)
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) return new Array(n).fill(0);
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  const x = new Array(n).fill(0); for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}
/* the blind search: a hand swept to and fro across what is in front of the giant (along its own left-right), reaching in and out,
   patting down onto whatever is under it (surface(x, z) -> the world y of a back there, or null), each hand on its own rhythm.
   params {hand ('R' | 'L'; both when absent, solved together), center: [x, y, z] (world), width, depth, period, pat (pats a second),
   hover, surface, base, seed}. Returns the channels, v._target {R, L} (where each hand was sent) and v._touch {R, L} (a palm on a back). */
function grope(rig, t, params = {}) {
  const hands = params.hand ? [params.hand] : ['R', 'L'], c = params.center, W = params.width || 60, D = params.depth || 20, per = params.period || 3.2;
  const base = Object.assign({}, params.base || rig.rest()), h = base['root.h'] || 0, left = [Math.cos(h), -Math.sin(h)], fwd = [Math.sin(h), Math.cos(h)];
  const goals = [], out = { targets: {}, touch: {} };
  for (const hand of hands) {
    const seed = (params.seed || 0) + (hand === 'R' ? 1 : 2), ph = t / per + (hand === 'R' ? 0 : 0.5);
    const side = (hand === 'R' ? -1 : 1) * W * (0.3 + 0.2 * Math.sin(2 * Math.PI * ph)), reachIn = D * noise1(seed, t * 0.6);   /* each hand works its own half */
    const x = c[0] + left[0] * side + fwd[0] * reachIn, z = c[2] + left[1] * side + fwd[1] * reachIn;
    const pat = Math.max(0, Math.sin(2 * Math.PI * (params.pat || 1.6) * t + seed)) ** 3;
    let y = c[1] + (params.hover != null ? params.hover : 14) * rig.scale * (1 - pat), touch = false;
    const top = params.surface ? params.surface(x, z) : null, clear = (params.palm != null ? params.palm : 11) * rig.scale;   /* the grip sits a palm's depth above what it touches */
    if (top != null && y < top + clear) { y = top + clear; touch = true; }
    base[`hand.${hand}.roll`] = (base[`hand.${hand}.roll`] || 0) + (hand === 'R' ? 1 : -1) * 1.2;   // the palm turned down
    goals.push([hand, [x, y, z]]); out.targets[hand] = [x, y, z]; out.touch[hand] = touch;
  }
  const v = reach(rig, base, goals, null, params);
  v._target = out.targets; v._touch = out.touch;
  return v;
}
/* the herd: n animals following a leader's path with separation, a formation (rows of `abreast`, `gap` apart) or a loose flock
   (spread). Integrated on a fixed 1/60 s grid from params.t0 and memoised: .at(i, t) -> {x, z, h, s}, .path(i) -> a path function,
   .channels(rig, i, t, gaitName) -> the gait's channels for animal i. params {n, path, abreast, gap, spacing, spread, seed, speed} */
function herd(params) {
  const P = pathOf(params.path), n = params.n || 6, dt = 1 / 60, t0 = P.t0, abreast = params.abreast || 1, gap = params.gap || 30, spacing = params.spacing || 60;
  const seed = params.seed || 3, spread = params.spread != null ? params.spread : 0.35, maxV = params.speed || 80, sep = params.separation || 34;
  const slots = []; for (let i = 0; i < n; i++) { const row = Math.floor(i / abreast), col = i % abreast - (abreast - 1) / 2;
    slots.push({ back: row * spacing + (hash(seed + i) - 0.5) * spacing * spread, side: col * gap + (hash(seed * 3 + i) - 0.5) * gap * spread * (abreast > 1 ? 0.3 : 1.2) }); }
  /* an animal's place in the formation: `back` behind the leader along the path (before the path's start, back along its first
     heading: the flock waits in a file), `side` across it */
  const target = (i, t) => { const S = P.sAt(t) - slots[i].back, tt = P.tAtS(Math.max(0, S)), q = P.fn(tt), h = heading(P, tt, 0), e = Math.min(0, S);
    return [q[0] + Math.cos(h) * slots[i].side + Math.sin(h) * e, q[1] - Math.sin(h) * slots[i].side + Math.cos(h) * e]; };
  const X = [], V = []; for (let i = 0; i < n; i++) { X.push([target(i, t0)]); V.push([[0, 0]]); }
  const step = k => { const t = t0 + k * dt;
    for (let i = 0; i < n; i++) { const x = X[i][k], vv = V[i][k], g = target(i, t + dt); let ax = (g[0] - x[0]) * 6 - vv[0] * 4.4, az = (g[1] - x[1]) * 6 - vv[1] * 4.4;
      for (let j = 0; j < n; j++) if (j !== i) { const y = X[j][k], dx = x[0] - y[0], dz = x[1] - y[1], d = Math.hypot(dx, dz); if (d < sep && d > 1e-3) { const f = ((sep - d) / sep) ** 2 * 400; ax += dx / d * f; az += dz / d * f; } }
      let nv = [vv[0] + ax * dt, vv[1] + az * dt]; const sp = Math.hypot(...nv); if (sp > maxV) nv = nv.map(q => q * maxV / sp);
      V[i].push(nv); X[i].push([x[0] + nv[0] * dt, x[1] + nv[1] * dt]); } };
  const ensure = t => { const k = Math.ceil((t - t0) / dt) + 1; while (X[0].length <= k) step(X[0].length - 1); };
  const at1 = (i, t) => { t = Math.max(t0, t); ensure(t); const f = (t - t0) / dt, k = Math.floor(f), u = f - k; return [lerp(X[i][k][0], X[i][k + 1][0], u), lerp(X[i][k][1], X[i][k + 1][1], u)]; };
  const paths = []; for (let i = 0; i < n; i++) paths.push(tt => at1(i, tt));
  return {
    n, slots, path: i => paths[i],
    at(i, t) { const q = at1(i, t), Pi = pathOf(paths[i]); return { x: q[0], z: q[1], h: heading(Pi, t, 0), s: Pi.sAt(t) }; },
    channels(rig, i, t, g = 'walk', extra = {}) { return gait(rig, t, Object.assign({ path: paths[i], gait: g }, extra)); },
  };
}
/* Scylla's heads: each coils back, strikes at its target at t0 + delay, holds (the seizing), then lifts toward the cleft.
   params {targets: [[x, y, z] (world) x6], t0, strike: 0.35, hold: 0.6, lift: 4, liftTo: [dx, dy, dz] (Scylla frame), delays, base (where
   Scylla is: root.x, root.y, root.z, root.h)} */
function strike(rig, t, params = {}) {
  const v = Object.assign(rig.rest(), params.base || {}), W = rig.world(v), Wi = inv(W), n = 6, fx = { seized: [] };
  for (let N = 1; N <= n; N++) {
    const r = rig.K.roots[N - 1], d = (params.delays || [0, 0.08, 0.03, 0.12, 0.05, 0.1])[N - 1], t0 = (params.t0 || 0) + d, ts = params.strike || 0.35, th = params.hold || 0.6, tl = params.lift || 4;
    const tgt = params.targets && params.targets[N - 1] ? ap(Wi, params.targets[N - 1]) : [r[0], r[1] + 160, r[2] - 150];
    const aim = [tgt[0] - r[0], tgt[1] - r[1] - 20, tgt[2] - r[2] + 52];   // the snout (52 ahead of the head's joint) on the target
    const coil = [r[0] * 0.2 + 30 * Math.sin(N * 1.7), 40 + 30 * hash(N), -60];
    const sway = u => [18 * noise1(N * 5, u * 0.7), 10 * noise1(N * 9, u * 0.9), 12 * noise1(N * 13, u * 0.5)];
    let p, slack = 0.2, hd = 0;
    if (t < t0 - 1.2) { p = coil.map((q, k) => q + sway(t)[k]); slack = 0.55; }
    else if (t < t0) { const u = sm(cl01((t - (t0 - 1.2)) / 1.2)); p = coil.map((q, k) => q + sway(t)[k] + [0, -30, 40][k] * u); slack = 0.55 + 0.4 * u; hd = 0.4 * u; }   // drawn back, the S tightening
    else if (t < t0 + ts) { const u = cl01((t - t0) / ts), e = u * u; const c2 = coil.map((q, k) => q + [0, -30, 40][k]); p = c2.map((q, k) => lerp(q, aim[k], e)); slack = lerp(0.95, 0.1, u); hd = lerp(0.4, -0.5, u); }
    else if (t < t0 + ts + th) { p = aim.map((q, k) => q + sway(t)[k] * 0.2); slack = 0.1; hd = -0.5; fx.seized.push(N); }
    else { const u = sm(cl01((t - t0 - ts - th) / tl)), lt = params.liftTo || [0, -60, -40]; p = aim.map((q, k) => lerp(q, lt[k] + [0, 30, 0][k], u) + sway(t)[k] * 0.3); slack = lerp(0.1, 0.5, u); hd = lerp(-0.5, 0.3, u); fx.seized.push(N); }
    v[`neck${N}.x`] = p[0]; v[`neck${N}.y`] = p[1]; v[`neck${N}.z`] = p[2]; v[`neck${N}.slack`] = slack; v[`neck${N}.head`] = hd;
  }
  v._fx = fx; return v;
}
/* a thrown thing's flight: from `from` at t0 to `to` at t1 (world), a parabola under gravity g (world units/s^2): its place at t */
function throwArc(t, { from, to, t0, t1, g = 980 }) {
  const u = cl01((t - t0) / (t1 - t0)), T1 = t1 - t0, tt = u * T1, vy = (to[1] - from[1]) / T1 + 0.5 * g * T1;
  return [lerp(from[0], to[0], u), from[1] + vy * tt - 0.5 * g * tt * tt, lerp(from[2], to[2], u)];
}

/* ═════════════ the scene sheet: creature actors in odyssey-choreo/1 ═════════════ */
/* A sheet (odyssey/choreo/<scene>.json) holds its creatures beside its actors, so the minifig player never clamps a creature's channel
   with a minifig's limits:
     creatures: { polyphemus: { kind: 'polyphemus', scale: 1.4, colour: 84, layer: 'abs' | 'add', floor: y (the ground it stands on),
                   present: [[t0, t1], ...] (when the take stages it; absent: always),
                   procs: [{ type: 'gait'|'heavy'|'grope'|'reach'|'strike'|'preset'|'herd', from, to, fade, ...params }],
                   channels: { 'arm.R.pitch': [[t, v, ease], ...], 'head.yaw@life': [...] },
                   riders: [{ actor: 'odysseus', at: 'belly', from, to, offset: [x, y, z], lie: 'under' | 'across' | 'upright', turn: [rx, ry, rz] }] } }
   At t: the rest pose, each procedure over its span (faded in and out over `fade` s), then the keys (absolute replace the procedures'
   values, `layer: 'add'` adds). Sampled on the sheet's step (twos) like the actors. */
const EASE = { linear: u => u, in: u => u * u, out: u => 1 - (1 - u) * (1 - u), inOut: sm, step: u => (u >= 1 ? 1 : 0), hold: u => (u >= 1 ? 1 : 0),
  back: u => { const s = 1.4; u -= 1; return u * u * ((s + 1) * u + s) + 1; } };
function drawT(t, step) { const f = step === 'ones' ? 24 : step === 'threes' ? 8 : 12; return Math.floor(t * f + 1e-6) / f; }
function sampleKeys(K, t) {
  if (!K || !K.length) return null; if (t <= K[0][0]) return K[0][1];
  let lo = 0, hi = K.length - 1; if (t >= K[hi][0]) return K[hi][1];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (K[m][0] <= t) lo = m; else hi = m; }
  const a = K[lo], b = K[hi], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * (EASE[b[2] || 'inOut'] || sm)(cl01(u));
}
/* how a rider lies on its anchor (a minifig's figure frame in the anchor's): 'under' on its back beneath a belly, its head to the
   creature's head, its face up; 'across' slung over a back or in a fist, face down; 'upright' as the anchor stands */
const LIE = { under: [0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0], across: [0, 0, 0, 0, 0, 1, 0, -1, 0, 1, 0, 0], upright: I12 };
const RIGS = new WeakMap();
function rigFor(C, id) { let m = RIGS.get(C); if (!m) { m = {}; RIGS.set(C, m); } if (!m[id]) { const A = C.creatures[id]; m[id] = define(A.kind, { id, scale: A.scale, colour: A.colour }); } return m[id]; }
function runProc(rig, p, t, v, ctx = {}) {
  switch (p.type) {
    case 'preset': return Object.assign({}, v, rig.preset(p.name));
    case 'gait': return gait(rig, t, Object.assign({}, p, { base: Object.assign({}, v, p.base || {}) }));
    case 'heavy': return heavy(rig, t, Object.assign(p, { base: Object.assign({}, v, p.base || {}) }));
    case 'grope': return grope(rig, t, Object.assign({}, p, { surface: p.surface || ctx.surface, base: Object.assign({}, v, p.base || {}) }));   /* ctx.surface(x, z): the backs under the hands */
    case 'reach': { if (Array.isArray(p.hand)) return reach(rig, v, p.hand, null, p);   /* both hands: [['R', point], ['L', point]] */
      const tg = typeof p.target === 'function' ? p.target(t) : typeof p.target === 'string' && ctx.point ? ctx.point(p.target, t) : p.target; return tg ? reach(rig, v, p.hand || 'R', tg, p) : v; }   /* a target by name: ctx.point('odysseus:head', t) */
    case 'strike': return Object.assign({}, v, strike(rig, t, Object.assign({}, p, { base: Object.assign({}, v, p.base || {}) })));   /* from the pose sampled so far (where Scylla stands) */
    case 'herd': { const H = p._herd || (p._herd = herd(p)); return H.channels(rig, p.index || 0, t, p.gait || 'walk', { base: v }); }
    default: return v;
  }
}
function sample(C, id, t, { stepped = true, ctx = {} } = {}) {
  const A = (C.creatures || {})[id]; if (!A) return null; const rig = rigFor(C, id), tq = stepped ? drawT(t, C.step || 'twos') : t;
  let v = Object.assign(rig.rest(), A.at ? { 'root.x': A.at[0], 'root.y': A.at[1], 'root.z': A.at[2], 'root.h': A.at[3] || 0 } : {}); let fx = {};
  for (const p of A.procs || []) {
    const a = p.from != null ? p.from : -Infinity, b = p.to != null ? p.to : Infinity, fade = p.fade || 0; if (tq < a - 1e-9 || tq > b + fade) continue;
    const w = fade ? Math.min(cl01((tq - a) / fade + (a === -Infinity ? 1 : 0)), tq > b ? 1 - cl01((tq - b) / fade) : 1) : 1, out = runProc(rig, p, Math.min(tq, b), v, ctx);
    if (out._fx) fx = Object.assign(fx, out._fx); if (out._feet) fx.feet = out._feet; if (out._touch != null) fx.touch = out._touch;
    const nv = {}; for (const k of Object.keys(Object.assign({}, v, out))) { if (k[0] === '_') continue; const x0 = v[k] || 0, x1 = out[k] != null ? out[k] : x0; nv[k] = k === 'root.h' ? x0 + wrapPi(x1 - x0) * w : lerp(x0, x1, w); } v = nv;
  }
  /* a lane keyed '@span' holds only between its first and last key (a place taken for a moment: the in-between of a change) */
  const keyed = {}; for (const [key, K] of Object.entries(A.channels || {})) { if (/@span$/.test(key) && K.length && (tq < K[0][0] - 1e-6 || tq >= K[K.length - 1][0] - 1e-6)) continue; const x = sampleKeys(K, tq); if (x == null) continue; const c = key.split('@')[0]; keyed[c] = (keyed[c] || 0) + x; }
  for (const c in keyed) v[c] = (A.layer === 'add' ? (v[c] || 0) : 0) + keyed[c];
  /* the ground: a creature stood on `floor` (the engine's reading of the set) is lifted or lowered to the floor the caller's ray finds
     under it now (ctx.ground(x, z, near): the take's own ray in the player, the probed grid in the tools), so it walks on the set */
  if (A.floor != null && ctx.ground) { const g = ctx.ground(v['root.x'] || 0, v['root.z'] || 0, A.floor); if (g != null && isFinite(g)) { v['root.y'] = (v['root.y'] || 0) + g - A.floor; fx.ground = g; } }
  v = rig.clamp(v);
  const riders = [];
  for (const R of A.riders || []) { if ((R.from != null && tq < R.from) || (R.to != null && tq > R.to)) continue;
    let M = rig.anchor(R.at, v); if (!M) continue; if (R.offset) M = mul(M, T(...R.offset)); if (R.lie && LIE[R.lie]) M = mul(M, LIE[R.lie]); if (R.turn) M = mul(mul(mul(M, RX(R.turn[0] || 0)), RY(R.turn[1] || 0)), RZ(R.turn[2] || 0));
    riders.push({ actor: R.actor, at: R.at, m: M }); }
  /* present: the windows [[t0, t1], ...] in which the take stages this creature (its prop is in those keys); outside them it is not drawn */
  const hidden = Array.isArray(A.present) && !A.present.some(([a, b]) => tq >= a - 1e-6 && tq < b - 1e-6);
  return { v, fx, riders: hidden ? [] : riders, rig, hidden };
}
/* a creature actor for a sheet, ready to be given keys and procedures */
function fragment(id, kind, opts = {}) {
  const K = KINDS[kind]; if (!K) throw new Error('no such creature: ' + kind);
  return { [id]: Object.assign({ kind, scale: opts.scale || 1, colour: opts.colour != null ? opts.colour : undefined, layer: opts.layer || 'abs', at: opts.at || [0, 0, 0, 0], procs: opts.procs || [], channels: opts.channels || {}, riders: opts.riders || [] }, opts.floor != null ? { floor: opts.floor } : {}) };
}
function kinds() { return Object.values(KINDS).map(K => ({ kind: K.kind, title: K.title, family: K.family, blurb: K.blurb, scenes: K.scenes, needs: K.needs, card: K.card,
  nodes: K.nodes.filter(n => !n.chain || n.chain.head || n.chain.i === 0).map(n => ({ id: n.id, parent: n.parent, p: n.p, channels: (n.rot || []).concat(n.move || []).map(r => r[0]).concat(n.swap ? [n.swap.ch] : []) })),
  channels: K.channels, anchors: Object.keys(K.anchors || {}), presets: Object.keys(K.presets || {}), gaits: Object.keys(K.gaits || {}) })); }

const API = { version: 1, KINDS, CLAMP, LIE, kinds, define, gait, heavy, follow, reach, grope, herd, strike, throwArc, fragment, sample, sampleKeys, drawT, pathOf,
  m: { mul, ap, apv, inv, T, RX, RY, RZ, I12, FLIP }, noise1 };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.OdysseyCreatures = API;
})(typeof window !== 'undefined' ? window : globalThis);

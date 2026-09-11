/* world/minifig.js — any minifig, on pivots: the player's rig and the crowd's template.

   A definition names the parts and colours. The skeleton is a tree of empty
   groups: hip, shoulder and neck pivots with a slot per part carrying the kit
   offset, so the same pose maths drives the player's meshes and the crowd's
   instances. The saber is hung at the fist pointing forward and up; a swing
   is a horizontal slash. Units: LDU, M per metre. Figure frame: LDraw Y down,
   facing −z; soles at y = FEET. */
(function () {
'use strict';
const DEG = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = u => u * u * (3 - 2 * u);
const WALK = 2.15, RUN = 4.10, TURN = 7, FEET = 72, HEAD_M = 1.7, ORBIT = 8.2 / 4.65;
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), M1 = new THREE.Matrix4();

/* the kit's own offsets (build-75421.py figure()), in the figure frame: the hand's origin is the end of the forearm core, its stem inside */
const HAND_R = [-23.8634, 26.5956, -10.321, 0.985, -0.12019, 0.12019, 0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const HAND_L = [23.8634, 26.5956, -10.321, 0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const mul3 = (a, b) => [a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8], a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8], a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
const ap3 = (a, v) => [a[0] * v[0] + a[1] * v[1] + a[2] * v[2], a[3] * v[0] + a[4] * v[1] + a[5] * v[2], a[6] * v[0] + a[7] * v[1] + a[8] * v[2]];
/* 3820.dat: the grip's centre sits 9.9 LDU in front of the hand's origin and the fist is tilted 14.5°; a held part's handle runs along y through its origin.
   A blaster, a sword or a pickaxe (body up, -y) mounts at the grip as is; a bar whose origin is one end (the saber blade, a spear) is turned over so it rises out of the fist. */
const GRIP_AT = [0, -0.8229, -9.8948], GRIP_ROT = rx(14.5 * DEG), FLIP = rx(Math.PI), ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function toolMount(hand, bar) { const R = hand.slice(3), p = ap3(R, GRIP_AT), rot = mul3(mul3(R, GRIP_ROT), bar ? FLIP : ID3); return [hand[0] + p[0], hand[1] + p[1], hand[2] + p[2], ...rot]; }
const TOOL_R = toolMount(HAND_R, false), TOOL_L_BAR = toolMount(HAND_L, true);
const MUZZLE = [0, -22.4, -36];                             // 58247's front disc, in the blaster's own frame; the barrel runs -z
const AIM = -60 * DEG;                                      // the arm angle that levels a blaster held in the 45° hand with its 14.5° grip
/** Slot table: name → [pivot, x, y, z, 9 matrix entries] in the figure frame. */
const SLOTS = {
  legR: ['legRP', 0, 44, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legL: ['legLP', 0, 44, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], hips: ['hipsP', 0, 32, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  torso: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], cape: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], collar: ['torsoP', 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  armR: ['armRP', -15.552, 9, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1], armL: ['armLP', 15.552, 9, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1],
  handR: ['armRP', ...HAND_R], handL: ['armLP', ...HAND_L],
  head: ['headP', 0, -24, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], hat: ['headP', 0, -24, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  weaponL: ['armLP', ...TOOL_L_BAR], weaponR: ['armRP', ...TOOL_R],
};
const PIVOTS = { hipsP: [null, 0, 32, 0], torsoP: ['hipsP', 0, -32, 0], legRP: ['hipsP', 0, 12, 0], legLP: ['hipsP', 0, 12, 0], armRP: ['torsoP', -15.552, 9, 0], armLP: ['torsoP', 15.552, 9, 0], headP: ['torsoP', 0, -24, 0] };
const PIVOT_ABS = { hipsP: [0, 32, 0], torsoP: [0, 0, 0], legRP: [0, 44, 0], legLP: [0, 44, 0], armRP: [-15.552, 9, 0], armLP: [15.552, 9, 0], headP: [0, -24, 0] };

/* ───────────────────────── definitions ───────────────────────── */
const DEFS = {
  vader: { name: 'Vader', legs: 0, hips: 0, torso: 0, arms: 0, hands: 0, head: 0, hat: ['30368', 0], weapon: ['saber', '30374', 36], cape: ['522', 0], collar: ['20551c01', 0], saber: true },
  trooper: { name: 'Stormtrooper', legs: 15, hips: 15, torso: 15, arms: 15, hands: 0, head: 0, hat: ['30408', 15], weapon: ['blaster', '58247', 0], ride: { kit: 'atst' } },
  pilot: { name: 'Rebel pilot', legs: 71, hips: 71, torso: 25, arms: 25, hands: 14, head: 14, hat: ['30370', 71], weapon: ['blaster', '58247', 0], ride: { kit: 'xwing' } },
  luke: { name: 'Luke', legs: 19, hips: 19, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 14], weapon: ['saber', '30374', 33], saber: true, ride: { kit: 'xwing' } },
  leia: { name: 'Leia', legs: 15, hips: 15, torso: 15, arms: 15, hands: 14, head: 14, hat: ['30409', 308], weapon: ['blaster', '58247', 0], ride: { kind: 'speeder', len: 6, col: 15 } },
  han: { name: 'Han', legs: 272, hips: 0, torso: 15, arms: 15, hands: 14, head: 14, hat: ['3901', 308], weapon: ['blaster', '58247', 0], ride: { kind: 'plane', len: 10, col: 71 } },
  chewbacca: { name: 'Chewbacca', legs: 70, hips: 70, torso: 70, arms: 70, hands: 70, head: 70, hat: ['30483', 70], weapon: ['blaster', '2570', 70], bare: true, ride: { kind: 'truck', len: 8, col: 70 } },
  yoda: { name: 'Yoda', legs: 19, hips: 19, torso: 19, arms: 19, hands: 378, head: 378, hat: ['41880', 378], weapon: ['saber', '30374', 34], saber: true, short: true, bare: true, ride: { kind: 'speeder', len: 5, col: 2 } },
  c3po: { name: 'C-3PO', legs: 297, hips: 297, torso: 297, arms: 297, hands: 297, head: 297, hat: ['30480', 297], weapon: null, bare: true, ride: { kind: 'car', len: 6, col: 297 } },
  rey: { name: 'Rey', legs: 28, hips: 28, torso: 19, arms: 19, hands: 14, head: 14, hat: ['20877', 308], weapon: ['blaster', '58247', 0], ride: { kind: 'speeder', len: 7, col: 28 } },
  citizen: { name: 'Citizen', legs: 1, hips: 1, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 0], weapon: null, ride: { kind: 'car', len: 6, col: 4 } },
  rebel: { name: 'Rebel trooper', legs: 15, hips: 15, torso: 15, arms: 15, hands: 14, head: 14, hat: ['30370', 15], weapon: ['blaster', '58247', 0], crowd: true },   // the Hoth trench: white parka, white cap, a blaster
  /* Springfield: the sculpted heads carry the face (two expressions each on disk, swapped like replacement heads), the bodies are plain parts in the show's colours */
  homer: { name: 'Homer', legs: 1, hips: 1, torso: 15, arms: 15, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, faces: { calm: '15527p01', wide: '15527p02' }, parts: [['legR', '3816', 1], ['legL', '3817', 1], ['hips', '3815', 1], ['torso', '973', 15], ['armR', '3818', 15], ['armL', '3819', 15], ['handR', '3820', 14], ['handL', '3820', 14], ['head', '15527p02', 14]], ride: { kind: 'car', len: 7, col: 322 } },
  marge: { name: 'Marge', legs: 2, hips: 2, torso: 2, arms: 2, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, woman: true, faces: { right: '15522p01', wide: '15522p02' }, parts: [['legR', '3816', 2], ['legL', '3817', 2], ['hips', '3815', 2], ['torso', '973', 2], ['armR', '3818', 2], ['armL', '3819', 2], ['handR', '3820', 14], ['handL', '3820', 14], ['head', '15522p02', 14]], ride: { kind: 'car', len: 7, col: 25 } },
  bart: { name: 'Bart', legs: 1, hips: 1, torso: 25, arms: 25, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, short: true, faces: { left: '15523p01', calm: '15523p02' }, parts: [['hips', '16709', 1], ['torso', '973pd12', 25], ['armR', '3818', 25], ['armL', '3819', 25], ['handR', '3820', 14], ['handL', '3820', 14], ['head', '15523p02', 14]], ride: { kind: 'board', len: 4, col: 4 } },
  lisa: { name: 'Lisa', legs: 4, hips: 4, torso: 4, arms: 4, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, short: true, woman: true, faces: { worried: '15524p01', calm: '15524p02' }, parts: [['hips', '16709', 4], ['torso', '973', 4], ['armR', '3818', 4], ['armL', '3819', 4], ['handR', '3820', 14], ['handL', '3820', 14], ['head', '15524p02', 14]] },
  maggie: { name: 'Maggie', legs: 1, hips: 1, torso: 1, arms: 1, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, short: true, baby: true, faces: { wide: '15525p01', worried: '15525p02' }, parts: [['hips', '15526', 1], ['head', '15525p02', 14]] },
  flanders: { name: 'Ned Flanders', legs: 71, hips: 71, torso: 2, arms: 2, hands: 14, head: 14, hat: null, weapon: null, sculpt: true, parts: [['legR', '3816', 71], ['legL', '3817', 71], ['hips', '3815', 71], ['torso', '973', 2], ['armR', '3818', 2], ['armL', '3819', 2], ['handR', '3820', 14], ['handL', '3820', 14], ['head', '15529p01', 14]] },
  /* Ithaca: plain heads that take a drawn face, hair in the halfworld's colours */
  penelope: { name: 'Penelope', legs: 15, hips: 15, torso: 15, arms: 15, hands: 78, head: 78, hat: ['3625', 0], weapon: null, woman: true, face: 'halfworld:penelope' },
  odysseus: { name: 'Odysseus', legs: 308, hips: 308, torso: 320, arms: 320, hands: 78, head: 78, hat: ['21787', 70], weapon: null, cape: ['522', 320], face: 'halfworld:odysseus' },
  eurycleia: { name: 'Eurycleia', legs: 308, hips: 308, torso: 19, arms: 19, hands: 78, head: 78, hat: ['3625', 15], weapon: null, woman: true, face: 'halfworld:eurycleia' },
  telemachus: { name: 'Telemachus', legs: 308, hips: 308, torso: 272, arms: 272, hands: 78, head: 78, hat: ['21787', 0], weapon: null, cape: ['522', 272], face: 'halfworld:telemachus' },
  phemius: { name: 'Phemius', legs: 4, hips: 4, torso: 4, arms: 4, hands: 78, head: 78, hat: ['3901', 70], weapon: null, face: 'halfworld:eumaeus' },
  athena: { name: 'Athena', legs: 15, hips: 15, torso: 15, arms: 15, hands: 78, head: 78, hat: ['30409', 297], weapon: null, cape: ['522', 272], woman: true, face: 'halfworld:athena' },
  suitor: { name: 'Suitor', legs: 70, hips: 70, torso: 70, arms: 70, hands: 78, head: 78, hat: ['3901', 0], weapon: null, crowd: true, face: 'halfworld:alcinous' },
};
/* ride: the vehicle that stands by the spawn for this character (Vader has the TIE); vehicles.js lays it as lm-me */
/* a bare head is the character's own (a mask over the plain head is the whole face), a short figure stands on one-piece legs */
const CITIZEN_TORSOS = [4, 1, 2, 14, 15, 19, 25, 70, 5, 27, 72], CITIZEN_HAIR = [0, 70, 4, 6, 15, 308, 28], WOMEN_HAIR = ['3625', '12890', '20877', '30409'];
function citizen(seed) { const d = { ...DEFS.citizen }; d.torso = d.arms = CITIZEN_TORSOS[seed % CITIZEN_TORSOS.length]; const woman = (seed >> 1) % 2 === 1; d.hat = [woman ? WOMEN_HAIR[(seed >> 3) % WOMEN_HAIR.length] : '3901', CITIZEN_HAIR[(seed >> 3) % CITIZEN_HAIR.length]]; d.legs = d.hips = [1, 0, 72, 28][(seed >> 6) % 4]; d.woman = woman; return d; }

/** The parts a definition needs, in order: [slot, partFile, colour]. */
function partsOf(def) {
  if (def.parts) return def.parts.map(p => p.slice());   // a cast member lists its own parts (sculpted heads, printed torsos, a baby's body); any part the harvest does not carry loads through the shared loader with its print
  const out = def.short ? [['hips', '16709', def.hips]] : [['legR', '3816', def.legs], ['legL', '3817', def.legs], ['hips', '3815', def.hips]];
  out.push(['torso', '973', def.torso], ['armR', '3818', def.arms], ['armL', '3819', def.arms], ['handR', '3820', def.hands], ['handL', '3820', def.hands]);
  if (!def.bare) out.push(['head', '3626b', def.head]);
  if (def.hat) out.push(['hat', def.hat[0], def.hat[1]]);
  if (def.weapon) out.push([def.weapon[0] === 'saber' ? 'weaponL' : 'weaponR', def.weapon[1], def.weapon[2]]);
  if (def.cape) out.push(['cape', def.cape[0], def.cape[1]]);
  if (def.collar) out.push(['collar', def.collar[0], def.collar[1]]);
  return out;
}
const fmt = v => (Math.round(v * 1e4) / 1e4).toString();
/** LDraw lines for the parse, one per part, placed in the figure frame. */
function lines(def) { return partsOf(def).map(([slot, part, col]) => { const s = SLOTS[slot]; return `1 ${col} ${s.slice(1, 13).map(fmt).join(' ')} parts/${part}.dat`; }); }
/** One identity line per part file the crowd may need, for harvesting raw geometry. */
const CROWD_PARTS = ['3816', '3817', '3815', '973', '3818', '3819', '3820', '3626b', '30408', '3901', '30370', '58247', '30374', '3062b', '30368', '522', '20551c01', '41880', '30483', '30480', '30409', '3625', '12890', '20877', '16709', '2570'];
const SHORT = 16;                                             // one-piece short legs end 16 LDU higher than the hinged pair
const harvestLines = () => CROWD_PARTS.map(p => `1 16 0 0 0 1 0 0 0 1 0 0 0 1 parts/${p}.dat`);

/* ───────────────────────── the skeleton ───────────────────────── */
function skeleton(M, def) {
  const feet = def && def.short ? FEET - SHORT : FEET;
  const figure = new THREE.Group(); figure.name = 'minifig'; const flip = new THREE.Group(); flip.rotation.x = Math.PI; figure.add(flip);
  const P = {};
  for (const [name, [parent, x, y, z]] of Object.entries(PIVOTS)) { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); (parent ? P[parent] : flip).add(g); P[name] = g; }
  P.hipsP.position.set(0, -(feet - 32), 0);
  const S = {};
  for (const [name, def] of Object.entries(SLOTS)) {
    const g = new THREE.Group(); g.name = 'slot:' + name; const pa = PIVOT_ABS[def[0]];
    g.position.set(def[1] - pa[0], def[2] - pa[1], def[3] - pa[2]);
    M1.set(def[4], def[5], def[6], 0, def[7], def[8], def[9], 0, def[10], def[11], def[12], 0, 0, 0, 0, 1); g.quaternion.setFromRotationMatrix(M1);
    P[def[0]].add(g); S[name] = g;
  }
  return { figure, flip, ...P, slots: S, M, pos: figure.position, heading: 0, speed: 0, phase: 0, gait: 0, t: 0, swing: null, aim: 0, hit: null, vel: new THREE.Vector3(), radius: 0.5 * M,
    cam: { yaw: 0, pitch: 0.18, pos: new THREE.Vector3(), look: new THREE.Vector3(), set: false }, height: feet + 28, feet, health: 100, def: null, mounted: {} };
}
/** Hang parsed part groups (in partsOf order) on the skeleton's slots; the groups' own kit transforms are dropped. */
function mount(rig, groups, def, scene) {
  rig.def = def; const parts = partsOf(def);
  groups.forEach((g, i) => { const slot = parts[i][0]; g.position.set(0, slot === 'hat' && def.bare ? 24 : 0, 0); g.quaternion.identity(); g.scale.setScalar(1); g.name = slot; rig.slots[slot].add(g); /* a whole-head mask has its origin at the neck, a hat at the crown */ rig.mounted[slot] = { group: g, part: parts[i][1], col: parts[i][2] };
    g.traverse(o => { if (o.isMesh && o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.fog = true; }); });
  if (scene) scene.add(rig.figure);
  return rig;
}
function facing(rig, out) { return out.set(Math.sin(rig.heading), 0, Math.cos(rig.heading)); }

/** Joint angles from a state: gait, phase, swing (saber, 0..1 or null), aim (blaster raised 0..1), t. */
function pose(rig, st) {
  const s = Math.sin(st.phase), g = st.gait;
  rig.legRP.rotation.x = g * -35 * DEG * s; rig.legLP.rotation.x = -rig.legRP.rotation.x;
  const feet = rig.feet || FEET; rig.hipsP.position.y = -(feet - 32) - g * 1.5 * Math.abs(Math.cos(st.phase));
  rig.torsoP.rotation.z = g * 0.03 * s; rig.torsoP.position.y = -32 - 0.4 * Math.sin(2 * Math.PI * 0.35 * st.t) * (1 - g);
  rig.headP.rotation.y = 0.35 * Math.sin(0.3 * st.t) * (1 - g);
  let armL = g * -25 * DEG * s, armR = g * 25 * DEG * s, twist = g * 0.06 * s;
  if (st.swing != null) {                          // the slash: arm forward, torso sweeps across
    const u = st.swing, raise = u < 0.25 ? smooth(u / 0.25) : u > 0.8 ? 1 - smooth((u - 0.8) / 0.2) : 1;
    armL = armL + (-90 * DEG - armL) * raise;
    twist = 0.8 * (u < 0.15 ? -smooth(u / 0.15) : u < 0.7 ? -1 + 2 * smooth((u - 0.15) / 0.55) : 1 - smooth((u - 0.7) / 0.3));
    if (rig.def && rig.def.weapon && rig.def.weapon[0] === 'saber') twist = -twist;   // the saber hand leads
  }
  if (st.aim) armR = armR + (AIM - armR) * st.aim;
  if (st.sit) { rig.legRP.rotation.x = -90 * DEG; rig.legLP.rotation.x = -90 * DEG; armL = -60 * DEG; armR = -60 * DEG; twist = 0; rig.hipsP.position.y = -(feet - 32) + 20; rig.torsoP.rotation.z = 0; }   // in the seat: legs forward, hands on the wheel
  rig.armLP.rotation.x = armL; rig.armRP.rotation.x = armR; rig.torsoP.rotation.y = twist;
}

/** ctl: { move: {x, z, mag} world-space, run, saber (trigger), aim }; world: { groundH, pushOut(pos, r) } */
function step(rig, dt, ctl, world) {
  const M = rig.M; rig.t += dt;
  if (rig.air) return stepAir(rig, dt, world);
  const mv = ctl.move, want = mv.mag > 0.02 ? mv.mag * (ctl.run ? RUN : WALK) * M : 0;
  if (mv.mag > 0.02) { const goal = Math.atan2(mv.x, mv.z); let d = goal - rig.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); rig.heading += clamp(d, -TURN * dt, TURN * dt); }
  rig.speed += (want - rig.speed) * (1 - Math.exp(-dt * 10));
  facing(rig, V1); const before = V2.copy(rig.pos);
  rig.pos.addScaledVector(V1, rig.speed * dt);
  const g0 = world.groundH(before.x, before.z), g1 = world.groundH(rig.pos.x, rig.pos.z), run = Math.hypot(rig.pos.x - before.x, rig.pos.z - before.z);
  if (run > 1e-3 && g1 - g0 > 30 && (g1 - g0) / run > 1.3) { rig.pos.copy(before); rig.speed *= 0.3; }   // a knee-high step (a brick, rubble) is fine; a wall is not
  if (world.pushOut) world.pushOut(rig.pos, rig.radius);
  rig.pos.y = world.groundH(rig.pos.x, rig.pos.z);
  rig.vel.subVectors(rig.pos, before).divideScalar(Math.max(dt, 1e-3));
  rig.figure.rotation.y = rig.heading;
  const v = rig.speed / M; rig.phase += (4.35 + 1.62 * v) * dt;
  rig.gait = clamp(rig.gait + (v > 0.08 ? 1 : -1) * dt / 0.15, 0, 1);
  if (ctl.saber && !rig.swing && rig.def && rig.def.saber) rig.swing = { t0: rig.t, struck: false };
  let u = null;
  if (rig.swing) {
    u = (rig.t - rig.swing.t0) / 0.42;
    if (u >= 0.42 && !rig.swing.struck) { rig.swing.struck = true; rig.hit = facing(rig, V3).multiplyScalar(1.6 * M).add(rig.pos); rig.hit.y += 1.1 * M; }
    if (u >= 1) { rig.swing = null; u = null; }
  }
  if (ctl.aim) { rig.aim = 1; rig.aimUntil = rig.t + 1.2; }                                   // a shot snaps the arm up and keeps it there a moment
  else if (rig.t < (rig.aimUntil || 0)) rig.aim = 1; else rig.aim += (0 - rig.aim) * (1 - Math.exp(-dt * 6));
  pose(rig, { phase: rig.phase, gait: rig.gait, t: rig.t, swing: u, aim: rig.aim });
}

/** Thrown: the rig flies until it meets the ground again. vel in LDU/s. */
function throwRig(rig, vel) { rig.air = true; rig.vy = vel.y; rig.airVel = rig.airVel || new THREE.Vector3(); rig.airVel.set(vel.x, 0, vel.z); rig.pos.y += 2; rig.speed = 0; rig.landed = 0; }
function stepAir(rig, dt, world) {
  const M = rig.M; rig.vy -= 9.8 * M * dt; rig.pos.y += rig.vy * dt; rig.pos.addScaledVector(rig.airVel, dt); rig.airVel.multiplyScalar(1 - dt * 0.8);
  if (world.pushOut) world.pushOut(rig.pos, rig.radius);
  const g = world.groundH(rig.pos.x, rig.pos.z);
  if (rig.pos.y <= g) { rig.pos.y = g; rig.landed = -rig.vy; rig.air = false; rig.vy = 0; rig.airVel.set(0, 0, 0); }
  rig.vel.set(rig.airVel.x, rig.vy, rig.airVel.z); rig.figure.rotation.y = rig.heading; rig.figure.rotation.x = rig.air ? clamp(-rig.vy / (8 * M), -0.5, 0.5) : 0;
  pose(rig, { phase: rig.phase, gait: 0, t: rig.t, swing: null, aim: 0 }); rig.armRP.rotation.x -= 1.2; rig.armLP.rotation.x -= 1.2;   // arms up, flailing
}
/** HLIÐARENDI's walking rig, scaled to a 3 m minifig. */
function camera(rig, camera, dt, look, world, portrait, build) {
  const M = rig.M, c = rig.cam;
  c.yaw -= look.dx; c.pitch = clamp(c.pitch + look.dy, build ? 0.3 : -0.38, build ? 0.62 : 0.52);
  const r = (portrait ? 4.65 : 4.15) * ORBIT * M * (build ? 1.2 : 1);
  V1.copy(rig.pos); V1.y += HEAD_M * M;
  if (build) { V1.x -= Math.sin(c.yaw) * 3 * M; V1.z -= Math.cos(c.yaw) * 3 * M; V1.y -= 0.9 * M; }   // building: from above, looking past the figure at the ground ahead
  V2.set(V1.x + Math.sin(c.yaw) * Math.cos(c.pitch) * r, V1.y + Math.sin(c.pitch) * r + 0.28 * M, V1.z + Math.cos(c.yaw) * Math.cos(c.pitch) * r);
  // the camera comes in along its line rather than climbing over the head: it stops short of a hillside or a wall behind the figure
  { const n = 12, minF = 0.12; let f = 1; for (let i = 1; i <= n; i++) { const t = i / n, x = V1.x + (V2.x - V1.x) * t, y = V1.y + (V2.y - V1.y) * t, z = V1.z + (V2.z - V1.z) * t; if (y < world.groundH(x, z) + 0.6 * M || (world.solid && world.solid(x, y, z))) { f = Math.max(minF, (i - 1.5) / n); break; } }
    if (f < 1) V2.lerpVectors(V1, V2, f); const gy = world.groundH(V2.x, V2.z) + 0.6 * M; if (V2.y < gy) V2.y = gy; }
  if (!c.set) { c.pos.copy(V2); c.look.copy(V1); c.set = true; }
  const k = 1 - Math.exp(-dt * 6); c.pos.lerp(V2, k); c.look.lerp(V1, k);
  camera.position.copy(c.pos); camera.up.copy(UP); camera.lookAt(c.look);
}
function moveFromStick(rig, stick, out) {
  const y = rig.cam.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  out.x = fx * stick.y + rx * stick.x; out.z = fz * stick.y + rz * stick.x;
  const h = Math.hypot(out.x, out.z); if (h > 1) { out.x /= h; out.z /= h; } out.mag = Math.min(1, h);
  return out;
}
/** Where the blade's tip is, in world space (for the saber test and for hits). */
function saberTip(rig, out) { const s = rig.slots.weaponL; s.updateWorldMatrix(true, false); return out.set(0, 80, 0).applyMatrix4(s.matrixWorld); }
function fist(rig, out) { const s = rig.slots.weaponL; s.updateWorldMatrix(true, false); return out.set(0, 0, 0).applyMatrix4(s.matrixWorld); }
/** The muzzle of a held blaster, world space, and the direction it points. */
function muzzle(rig, outPos, outDir) { const s = rig.slots.weaponR; s.updateWorldMatrix(true, false); muzzleAt(s.matrixWorld, outPos); if (outDir) outDir.set(0, 0, -1).transformDirection(s.matrixWorld); return outPos; }
/** The muzzle for a blaster whose slot has this world matrix (the crowd's template). */
function muzzleAt(matrix, out) { return out.set(MUZZLE[0], MUZZLE[1], MUZZLE[2]).applyMatrix4(matrix); }
/** Every mounted part with its world matrix and colour: what falls when the figure comes apart. */
function burst(rig) {
  rig.figure.updateMatrixWorld(true);
  return Object.entries(rig.mounted).map(([slot, m]) => ({ part: m.part, col: m.col, matrix: m.group.matrixWorld.clone() }));
}

window.Minifig = { DEFS, citizen, partsOf, lines, harvestLines, CROWD_PARTS, SLOTS, skeleton, mount, pose, step, throwRig, camera, moveFromStick, facing, saberTip, fist, muzzle, muzzleAt, toolMount, burst, FEET, WALK, RUN, HAND_R, HAND_L, MUZZLE, AIM };
})();

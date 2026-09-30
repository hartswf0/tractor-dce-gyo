#!/usr/bin/env node
/* tools/creatures/films.js — the creature rigs' test films, rendered on the CPU (tools/creatures/raster.js) from
   film-readymades/creatures.js alone: every frame is the rig's pose at t, so what these show is what the player will show.
     node tools/creatures/films.js [--out dir] [--small] [name ...]      names: ram-rider herd polyphemus-grope argos scylla dogs giant-walk
   Writes <out>/<name>.mp4, <name>.jpg (the poster), <name>-sheet.jpg (a contact sheet of 12 frames) and prints the checks each film
   makes of itself (feet that slide while planted, a rider through the belly, a hand through a back). --out defaults to the scratch
   directory given by CREATURES_OUT or odyssey/creatures/media. */
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../../film-readymades/creatures.js'), S = require('./stage'), R = require('./raster'), F = require('./minifig');
const { mul, ap, T, RX, RY, RZ } = C.m;
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const OUT = opt('out', process.env.CREATURES_OUT || path.join(__dirname, '../../odyssey/creatures/media'));
const SMALL = args.includes('--small'), W = SMALL ? 320 : 480, H = SMALL ? 180 : 270, FPS = 24;
const names = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const LIE_UNDER = [0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0];   // a figure on its back under a creature: its head to the creature's head, its face up
const checks = {};
function note(film, k, v) { (checks[film] = checks[film] || {})[k] = Math.max(checks[film][k] || 0, v); }
/* feet: how far a planted foot moved since the frame before (same plant), how far below the ground it went */
function footCheck(film, rig, v, mem) {
  if (!v._feet) return; const P = rig.pose(v);
  for (const [leg, F2] of Object.entries(rig.K.feet)) { const ft = v._feet[leg]; if (!ft) continue; const p = ap(P.nodes[F2.knee || F2.hip], F2.foot);
    const key = rig.id + leg, m = mem[key]; if (ft.planted && m && m.planted && m.cyc === ft.cyc) note(film, 'foot slide per frame (LDU)', Math.hypot(p[0] - m.p[0], p[2] - m.p[2]));
    note(film, 'foot below ground (LDU)', Math.max(0, -p[1])); mem[key] = { p, planted: ft.planted, cyc: ft.cyc }; }
}
const RENDER = (cam, meshes, extra = {}) => R.render(Object.assign({ W, H, ss: 2, cam, meshes, sun: [-0.5, 1, -0.45], ground: { y: 0, size: 1400, tile: 40, cx: extra.gx || 0, cz: extra.gz || 0 } }, extra));
async function shoot(name, dur, frame) {
  const n = Math.round(dur * FPS), file = path.join(OUT, name + '.mp4'); const t0 = Date.now();
  const kept = await S.film(file, W, H, FPS, n, i => frame(i / FPS, i), { keep: 12 });
  const lab = kept.map(k => R.label(k.img, `${name} ${(k.i / FPS).toFixed(2)} S`, { scale: 1, h: 12 }));
  S.jpeg(path.join(OUT, name + '-sheet.jpg'), R.sheet(lab, 4), 4); S.jpeg(path.join(OUT, name + '.jpg'), kept[Math.min(kept.length - 1, Math.floor(kept.length * 0.6))].img, 3);
  console.log(`${name}: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${path.relative(process.cwd(), file)}`, JSON.stringify(checks[name] || {}));
}
/* scenery: a real LDraw part set in the world (y up) at (x, y, z), scaled by k, turned by ry */
const part = (p, col, x, y, z, k = 1, ry = 0, ky = k) => ({ part: p, col, m: mul(mul(T(x, y, z), RY(ry)), [0, 0, 0, k, 0, 0, 0, -ky, 0, 0, 0, -k]) });
const rock = (x, z, k, ry = 0, col = 72, ky = k) => part('53934p01c01', col, x, 72 * ky, z, k, ry, ky);   // the 4 x 4 x 3 rock (its top is its origin), standing on the ground
const SEA = { c0: [70, 110, 140], c1: [64, 102, 132] }, DUNG = [120, 96, 70];
/* a figure sitting on the ground (or a bench at height y), facing heading h */
const sitter = (x, y, z, h, o = {}) => F.fig(mul(mul(T(x, y + 44, z), RY(h)), [0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, -1]), Object.assign({ legs: [-1.5, -1.5] }, o));
/* a figure hung from an anchor frame (creature axes, world scale), offset and turned */
const hung = (A, off, R, o) => F.fig(mul(mul(A, T(...off)), R), o);
const lerpA = (a, b, u) => a.map((q, k) => q + (b[k] - q) * u), clamp01 = u => Math.max(0, Math.min(1, u)), smooth = u => { u = clamp01(u); return u * u * (3 - 2 * u); };

const FILMS = {
  /* a ram walking with a man slung beneath its belly, clinging to the wool (B09-S10) */
  'ram-rider': () => {
    const rig = C.define('ram', { id: 'lead', scale: 2.4, colour: 'white' }), mem = {};
    const path_ = [[0, -260, 0], [0.8, -260, 0], [7.2, 220, 0], [8, 220, 0]].map(([t, x, z]) => [t, x, z, 'linear']);
    return shoot('ram-rider', 8, t => {
      const v = C.gait(rig, t, { path: path_, gait: 'walk', stance: 5 }); footCheck('ram-rider', rig, v, mem);
      const man = S.figure(hung(rig.anchor('belly', v), [0, 22, -8], LIE_UNDER, { arms: [-1.45, -1.45], legs: [-1.55, -1.55], colours: { torso: 320, legs: 19, hair: 0 } }));
      note('ram-rider', 'rider into the belly (LDU)', Math.max(0, -S.bounds(man).min[1] - rig.point('belly', v)[1] - 6));   // the hands grip the wool: 6 allowed
      const c = rig.point('back', v);
      return RENDER(S.cam([c[0] * 0.6, 55, 0], 480, 22, 8), S.meshes(rig, v).concat(man), { gx: c[0] });
    });
  },
  /* the flock driven out of the cave past the stone: a herd following its leader with separation (B09-S08, B09-S10) */
  herd: () => {
    const n = 7, rigs = [], mem = {};
    for (let i = 0; i < n; i++) rigs.push(C.define('ram', { id: 'ram' + i, scale: i === n - 1 ? 2.4 : 1.5 + 0.12 * (i % 4), colour: i === 2 ? 'black' : i === 4 ? 'grey' : 'white' }));
    const H = C.herd({ n, path: [[0, 0, -520], [0.5, 0, -520], [7, 0, 120], [10, 260, 330]], spacing: 70, spread: 0.5, seed: 7, speed: 110 });
    /* the cave mouth: rock panels either side of the lane, the door stone rolled aside */
    const set = [part('6083', 72, -170, 168 * 1.5, -60, 1.5, 0.25), part('6083', 71, 170, 168 * 1.5, -60, 1.5, -0.25), part('6083', 72, -330, 168 * 1.3, -120, 1.3, 0.1), part('6083', 72, 330, 168 * 1.3, -120, 1.3, -0.1),
      part('6083', 72, 0, 168 * 1.2 + 190, -110, 1.6, 0), rock(-150, 60, 0.9, 0.7)];
    const scenery = S.figure(set);
    return shoot('herd', 10, t => {
      const ms = scenery.slice();
      for (let i = 0; i < n; i++) { const v = H.channels(rigs[i], i, t, 'walk'); footCheck('herd', rigs[i], v, mem); ms.push(...S.meshes(rigs[i], v)); }
      /* separation: the closest two animals' centres */
      let dmin = 1e9; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = H.at(i, t), b = H.at(j, t); dmin = Math.min(dmin, Math.hypot(a.x - b.x, a.z - b.z)); }
      note('herd', 'closest two (world units, want > 30)', -dmin);
      return RENDER(S.cam([40, 40, 40], 620, 28, 16), ms);
    });
  },
  /* Polyphemus seated in the door, both hands feeling the backs of the rams that pass in threes, men beneath the middle ones: the
     search passes over them and misses (B09-S10) */
  'polyphemus-grope': () => {
    const G = C.define('polyphemus', { scale: 1.7 }), mem = {};
    const n = 6, rigs = []; for (let i = 0; i < n; i++) rigs.push(C.define('ram', { id: 'r' + i, scale: i === n - 1 ? 2.4 : 2.0, colour: i % 3 === 1 ? 'white' : i === 0 ? 'grey' : 'white' }));
    const H = C.herd({ n, path: [[0, 20, -420], [1, 20, -420], [14, 20, 520]], abreast: 3, gap: 44, spacing: 150, spread: 0.1, seed: 2, speed: 90 });
    H.slots[n - 1].side = 0; H.slots[n - 1].back = 380;   // the lead ram last and alone
    const seat = Object.assign(G.rest(), G.preset('sit'), { 'root.x': -125, 'root.z': 0, 'root.h': Math.PI / 2, 'head.pitch': -0.1 });
    const set = S.figure([part('6083', 72, -250, 168 * 1.6, -150, 1.6, 1.2), part('6083', 72, -260, 168 * 1.6, 170, 1.6, 1.9), rock(220, -120, 1.2, 0.5), rock(230, 110, 1.4, 2)]);
    /* the rams' backs under a point, for the hands to rest on */
    return shoot('polyphemus-grope', 14, t => {
      const vs = rigs.map((r, i) => H.channels(r, i, t, 'walk', { stance: i % 3 === 1 || i === n - 1 ? 5 : 0 }));
      const backs = vs.map((v, i) => ({ p: rigs[i].point('back', v), r: 14 * rigs[i].scale, len: 26 * rigs[i].scale, h: v['root.h'] }));
      const surface = (x, z) => { let top = null; for (const b of backs) { const dx = x - b.p[0], dz = z - b.p[2], c = Math.cos(b.h), s = Math.sin(b.h), along = dx * s + dz * c, side = dx * c - dz * s;
        if (Math.abs(side) < b.r && Math.abs(along) < b.len) { const y = b.p[1] - 0.5 * (side / b.r) ** 2 * 10; top = top == null ? y : Math.max(top, y); } } return top; };
      const v = C.grope(G, t, { center: [10, 100, 0], width: 200, depth: 36, period: 3.4, surface, base: seat });
      v['head.yaw'] = 0.25 * Math.sin(t * 0.7); v['eye'] = 2; v['jaw'] = 0.08 + 0.06 * Math.sin(t * 1.3);
      const ms = set.concat(S.meshes(G, v));
      vs.forEach((vv, i) => { ms.push(...S.meshes(rigs[i], vv)); footCheck('polyphemus-grope', rigs[i], vv, mem);
        if (i % 3 === 1 || i === n - 1) ms.push(...S.figure(hung(rigs[i].anchor('belly', vv), [0, 22, -8], LIE_UNDER, { arms: [-1.45, -1.45], legs: [-1.55, -1.55], colours: { torso: i === n - 1 ? 272 : 320, legs: 19, hair: 0 } }))); });
      /* the palm into a back: the grip's height below the surface under it */
      for (const hnd of ['R', 'L']) { const g = G.point('grip.' + hnd, v), top = surface(g[0], g[2]); if (top != null) note('polyphemus-grope', 'palm into a back (world units)', Math.max(0, top - (g[1] - 6))); }
      return RENDER(S.cam([-30, 80, 10], 620, 62, 18), ms);
    });
  },
  /* Argos on the dung heap: he lifts his head, drops his ears, beats his tail; then dies, a held stillness (B17-S03). Played from a
     scene sheet's creature actor through OdysseyCreatures.sample, as the player will play it */
  argos: () => {
    const sheet = { format: 'odyssey-choreo/1', step: 'twos', creatures: C.fragment('argos', 'dog', { scale: 1.3, colour: 'brown', at: [0, 30, 0, -0.5], procs: [{ type: 'preset', name: 'lie' }], layer: 'add',
      channels: {
        'head.pitch': [[0, -0.25], [2.0, -0.25], [2.8, 0.45, 'out'], [6.5, 0.4], [7.2, 0.15], [9.2, 0.1], [10.4, -0.55, 'in'], [14, -0.55]],
        'head.yaw': [[0, 0], [2.8, 0.25], [6, 0.35], [9.2, 0.3], [10.4, 0.1]],
        'ear.L': [[0, 0.55], [2.6, 0.55], [3.0, -0.2, 'back'], [4.6, -0.2], [5.2, 0.75], [14, 0.75]], 'ear.R': [[0, 0.55], [2.7, 0.55], [3.1, -0.2, 'back'], [4.7, -0.2], [5.3, 0.75], [14, 0.75]],
        'tail.yaw': [[0, 0]].concat(Array.from({ length: 12 }, (_, k) => [5.3 + k * 0.28, k % 2 ? -0.45 : 0.45, 'inOut'])).concat([[8.9, 0], [14, 0]]),
        'tail.pitch': [[0, 0], [5.0, 0.5], [8.8, 0.4], [9.4, -0.1], [14, -0.1]],
        'body.dy@breath': [[0, 0]].concat(Array.from({ length: 16 }, (_, k) => [0.3 + k * 0.6, k % 2 ? 0 : 0.9])).concat([[9.9, 0.9], [10.8, -1.5, 'in'], [14, -1.5]]),
        'root.roll': [[0, 0], [9.6, 0], [11.2, 1.3, 'in'], [14, 1.3]], 'root.y': [[0, 0], [9.6, 0], [11.2, 8, 'in'], [14, 8]], 'root.x': [[0, 0], [9.6, 0], [11.2, -14, 'in'], [14, -14]],
        'leg.FL': [[0, 0], [9.6, 0], [11.2, 0.9], [14, 0.9]], 'leg.FR': [[0, 0], [9.6, 0], [11.2, 0.7], [14, 0.7]],
      } }) };
    /* the dung heap: a low mound of plates in two browns, three plates deep in the middle */
    const hp = []; [[0, 0, 0, 0, '3034', 6], [0, 24, 0, 0, '3034', 308], [0, -24, 0, 0, '3034', 6], [-10, 12, 8, 0.2, '3020', 308], [14, -8, 8, -0.3, '3020', 6], [0, 36, 0, 0, '3710', 308],
      [-6, 0, 16, 0.1, '3021', 6], [30, -30, 0, 1.2, '3710', 6], [-40, 30, 0, 0.8, '3710', 308]].forEach(([x, z, y, r, pt, c]) => hp.push(part(pt, c === 6 ? 28 : 6, x, y + 8, z, 1.1, r - 0.5, 1)));
    const heap = S.figure(hp);
    return shoot('argos', 14, t => {
      const s = C.sample(sheet, 'argos', t), v = Object.assign({}, s.v);
      return RENDER(S.cam([0, 40, 0], 280, 50, 20), heap.concat(S.meshes(s.rig, v)), { ground: { y: 0, size: 600, tile: 30, c0: [178, 160, 118], c1: [170, 152, 110] } });
    });
  },
  /* Scylla's six necks from the cleft: coiled, drawn back, striking together at six rowers, seizing and lifting them (B12-S04) */
  scylla: () => {
    const rig = C.define('scylla', { scale: 1 }), base = { 'root.x': 0, 'root.y': 250, 'root.z': -60, 'root.h': 0 };
    const rowers = [-100, -60, -20, 20, 60, 100].map((x, i) => ({ x, z: 170 + (i % 2) * 22, y: 16 }));
    const targets = rowers.map(r => [r.x, r.y + 60, r.z]);
    const cliff = S.figure([part('6083', 72, 0, 420, -140, 1.9), part('6083', 71, -170, 300, -130, 1.4, 0.3), part('6083', 72, 170, 320, -130, 1.5, -0.3), part('6083', 72, 0, 170, -120, 1.2, 3.14),
      part('3034', 6, 0, 8, 180, 1.6), part('3034', 6, 0, 8, 212, 1.6), part('3034', 6, 0, 8, 148, 1.6)]);
    return shoot('scylla', 9, t => {
      const v = Object.assign(C.strike(rig, t, { t0: 4.2, targets, strike: 0.35, hold: 0.5, lift: 3.2, liftTo: [0, -40, -40] }), base);
      const ms = cliff.concat(S.meshes(rig, v));
      rowers.forEach((r, i) => { const N = i + 1, seized = t > 4.2 + 0.35 + [0, 0.08, 0.03, 0.12, 0.05, 0.1][i];
        if (!seized) ms.push(...S.figure(sitter(r.x, r.y, r.z, Math.PI, { arms: [-0.8 + 0.3 * Math.sin(t * 3 + i), -0.8 + 0.3 * Math.sin(t * 3 + i + 0.4)], colours: { torso: [320, 4, 272, 19, 71, 28][i], legs: 19, hair: 6 } })));
        else ms.push(...S.figure(hung(rig.anchor('jaw' + N, v), [0, 30, 0], [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], { arms: [-2.6 + 0.5 * Math.sin(t * 9 + i), -2.8 + 0.5 * Math.cos(t * 8 + i)], legs: [0.5 * Math.sin(t * 10 + i), -0.5 * Math.sin(t * 10 + i)], colours: { torso: [320, 4, 272, 19, 71, 28][i], legs: 19, hair: 6 } }))); });
      return RENDER(S.cam([0, 170, 60], 820, 18, 12), ms, { ground: Object.assign({ y: 0, size: 1600, tile: 60 }, SEA) });
    });
  },
  /* Eumaeus' four dogs rush the stranger, stop short barking, and scatter when the stones fly (B14-S01) */
  dogs: () => {
    const cols = ['brown', 'black', 'tan', 'white'], rigs = cols.map((c, i) => C.define('dog', { id: 'dog' + i, scale: 1.1, colour: c })), mem = {};
    const stops = [[-60, 40], [-20, 70], [30, 72], [70, 45]], starts = [[-300, -500], [-120, -560], [120, -540], [320, -480]], flee = [[-420, -200], [-200, -520], [260, -520], [480, -160]];
    const paths = rigs.map((r, i) => [[0, ...starts[i]], [0.3 + 0.15 * i, ...starts[i]], [3.2 + 0.1 * i, ...stops[i]], [6.4, ...stops[i]], [8.6, ...flee[i]]]);
    return shoot('dogs', 9, t => {
      const ms = S.figure(sitter(0, 0, 150, Math.PI, { arms: [-0.4, -0.4], head: 0.2 * Math.sin(t) })), P = [];
      rigs.forEach((r, i) => {
        const v = C.gait(r, t, { path: paths[i], gait: [[0, 'run'], [3.0 + 0.1 * i, 'trot'], [3.6, 'walk'], [6.3, 'run']], blend: 0.4 });
        /* barking at the stop: the head jerks up with each bark, the ears pricked, the tail up */
        if (t > 3.3 && t < 6.5) { const b = Math.max(0, Math.sin((t - 3.3) * 2 * Math.PI * (1.6 + 0.2 * i))) ** 4; v['head.pitch'] += 0.35 * b + 0.15; v['ear.L'] = v['ear.R'] = -0.3; v['tail.pitch'] = 0.8; v['body.pitch'] += 0.12 * b; }
        if (t > 6.4) { v['ear.L'] = v['ear.R'] = 1.1; v['tail.pitch'] = -0.8; }
        footCheck('dogs', r, v, mem); ms.push(...S.meshes(r, v)); });
      /* the stones in the air from Eumaeus' hand (off right) */
      for (let k = 0; k < 3; k++) { const t0 = 5.9 + k * 0.35; if (t > t0 && t < t0 + 0.7) { const p = C.throwArc(t, { from: [260, 40, 200], to: [stops[k + 1][0] + 10, 0, stops[k + 1][1]], t0, t1: t0 + 0.7 }); ms.push(...S.figure([part('3005', 72, p[0], p[1] + 12, p[2], 0.6)])); } }
      return RENDER(S.cam([0, 30, -160], 620, 118, 16), ms);
    });
  },
  /* a Laestrygonian's heavy walk down the harbour (the body lags the path, the ground shakes at each footfall) and a boulder hurled
     two-handed overhead at the fleet (B10-S02) */
  'giant-walk': () => {
    const rig = C.define('laestrygon', { scale: 1.5 }), mem = {};
    const params = { path: [[0, -330, 0], [0.6, -330, 0], [5.6, 120, 0], [11, 120, 0]] };
    const keys = { t0: 6.4, t1: 7.9 }, target = [620, 0, 60];
    return shoot('giant-walk', 11, t => {
      let v = C.heavy(rig, t, params); const fx = v._fx; delete v._fx;
      /* the throw: both arms back over the head, then over and forward; the rock leaves the hands at t1 */
      const up = smooth((t - keys.t0) / 0.9), over = smooth((t - keys.t1 + 0.25) / 0.35);
      for (const s of ['R', 'L']) { v['arm.' + s + '.pitch'] = v['arm.' + s + '.pitch'] * (1 - up) + (-3.0 * up) * (1 - over) + (-1.2) * over; v['arm.' + s + '.out'] = 0.25 * up * (1 - over); v['elbow.' + s] = -0.9 * up * (1 - over); }
      v['torso.lean'] += -0.3 * up * (1 - over) + 0.45 * over; v['jaw'] = 0.4 * up;
      const ms = S.meshes(rig, v), gR = rig.point('grip.R', v), gL = rig.point('grip.L', v), mid = lerpA(gR, gL, 0.5);
      const rp = t < keys.t1 ? [mid[0], mid[1] + 10, mid[2]] : C.throwArc(t, { from: [mid[0], mid[1] + 10, mid[2]], to: target, t0: keys.t1, t1: keys.t1 + 1.6 });
      ms.push(...S.figure([part('53934p01c01', 72, rp[0], rp[1] + 30, rp[2], 0.55, t * (t > keys.t1 ? 3 : 0))]));
      footCheck('giant-walk', rig, Object.assign({ _feet: Object.fromEntries(Object.entries(v._feet).map(([k, f]) => [k, Object.assign({ cyc: 0 }, f)])) }, v), mem);
      const shake = fx.shake || 0, c = rig.point('head', v);
      return RENDER(S.cam([Math.min(c[0], 200) + 60, 150 + shake, 0], 900, 20, 10), ms, { gx: c[0] });
    });
  },
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const n of names.length ? names : Object.keys(FILMS)) { if (!FILMS[n]) { console.log('no film', n); continue; } await FILMS[n](); }
})();

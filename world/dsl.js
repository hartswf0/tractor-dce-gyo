/* world/dsl.js — the build language: a short program of ops → real LEGO.

   A program is JSON: { name, ops: [ {op: 'box', ...}, ... ] } in studs (x east, z south)
   and bricks (y up; a brick is three plates). Ops paint cells into a voxel grid at
   plate resolution; openings and special parts reserve cells; then a tiler lays real
   bricks and plates over the cells in running bond, and a support pass drops anything
   that floats. Figures and vehicles become LDraw sub-models (props). The compiler is
   deterministic and forgiving: bad ops are reported, never thrown.

   Output: pieces [{ part, col, x, y, z, rot, w, d, plate }] in cell units, props
   [{ kind, mpd, x, z, rot }], and toRows()/toMPD() to turn them into the world's
   Build rows (LDU, y up) or LDraw text (y down). Works in the browser and in node. */
(function (root) {
'use strict';
const STUD = 20, PLATE = 8, BRICK = 3;
/* part boxes in their own LDraw frame (x0,x1,z0,z1 across the studs; h = height below the top face, LDU) */
const DIMS = {
  '3001': [-40, 40, -20, 20, 24], '3003': [-20, 20, -20, 20, 24], '3010': [-40, 40, -10, 10, 24], '3004': [-20, 20, -10, 10, 24], '3005': [-10, 10, -10, 10, 24],
  '3009': [-60, 60, -10, 10, 24], '3008': [-80, 80, -10, 10, 24], '3002': [-30, 30, -20, 20, 24],
  '3032': [-60, 60, -40, 40, 8], '3020': [-40, 40, -20, 20, 8], '3022': [-20, 20, -20, 20, 8], '3023': [-20, 20, -10, 10, 8], '3024': [-10, 10, -10, 10, 8], '3958': [-60, 60, -60, 60, 8], '3034': [-80, 80, -20, 20, 8], '3795': [-60, 60, -20, 20, 8], '3021': [-30, 30, -20, 20, 8],
  '3039': [-20, 20, -30, 10, 24], '3040b': [-10, 10, -30, 10, 24], '3665a': [-10, 10, -30, 10, 24], '3298': [-30, 30, -30, 10, 24], '3660': [-20, 20, -30, 10, 24],
  '3455': [-60, 60, -10, 10, 24], '3823': [-40, 40, -30, 20, 48], '60592': [-20, 20, -10, 10, 48], '60623': [-4, 67, -7, 7, 137],
  '3068b': [-20, 20, -20, 20, 8], '87079': [-40, 40, -20, 20, 8], '3941': [-20, 20, -20, 20, 24], '3062b': [-10, 10, -10, 10, 24], '4070': [-10, 10, -10, 10, 24], '3070b': [-10, 10, -10, 10, 8],
  '4600': [-34, 34, -20, 20, 10], '4624': [-10, 10, -8, 8, 20], '3641': [-18, 18, -8, 8, 36], '3829c01': [-20, 20, -10, 10, 8], '3822': [-10, 10, -30, 30, 72], '3821': [-10, 10, -30, 30, 72],
  '3626b': [-10, 10, -10, 10, 24], '973': [-20, 20, -10, 10, 32], '3815': [-10, 10, -10, 10, 12], '3816': [-10, 10, -10, 10, 32], '3817': [-10, 10, -10, 10, 32],
};
const BRICKS = [['3001', 4, 2], ['3003', 2, 2], ['3010', 4, 1], ['3004', 2, 1], ['3005', 1, 1]];                 // part, studs along x, along z (natural orientation)
const PLATES = [['3032', 6, 4], ['3020', 4, 2], ['3022', 2, 2], ['3023', 2, 1], ['3024', 1, 1]];
const COLOURS = { black: 0, blue: 1, green: 2, red: 4, yellow: 14, white: 15, tan: 19, orange: 25, darktan: 28, brown: 70, grey: 71, darkgrey: 72, azure: 322, sand: 19, lime: 27, pink: 5, purple: 85, trans: 47, transyellow: 46, transred: 36, transblue: 33 };
const FACE = { n: 0, e: 1, s: 2, w: 3 };
const HATS = { hair: '3901', cap: '3624', helmet: '3833', cowboy: '3629', tophat: '3878', knight: '3844', space: '2446', trooper: '30408', pilot: '30370', vader: '30368', pirate: '2528' };
const TORSOS = { plain: '973', stripes: '973p01', anchor: '973p05', train: '973p07', pirate: '973p31', space: '973p04', zipper: '973p02' };
const TOOLS = { saber: ['30374', 36], blaster: ['58247', 0], sword: ['3847', 71], shield: ['3846', 4], spear: ['4497', 0], axe: ['3841', 0], broom: ['6124', 70], cup: ['3899', 15], radio: ['3962', 0] };
const FIGS = {
  vader: { legs: 0, hips: 0, torso: 0, arms: 0, hands: 0, head: 0, hat: ['30368', 0], tool: ['30374', 36], cape: ['522', 0], collar: ['20551c01', 0] },
  stormtrooper: { legs: 15, hips: 15, torso: 15, arms: 15, hands: 0, head: 0, hat: ['30408', 15], tool: ['58247', 0] },
  trooper: 'stormtrooper',
  pilot: { legs: 71, hips: 71, torso: 25, arms: 25, hands: 14, head: 14, hat: ['30370', 71], tool: ['58247', 0] },
  luke: { legs: 19, hips: 19, torso: 19, arms: 19, hands: 14, head: 14, hat: ['3901', 14], tool: ['30374', 33] },
  citizen: { legs: 1, hips: 1, torso: 4, arms: 4, hands: 14, head: 14, hat: ['3901', 0] },
  knight: { legs: 71, hips: 71, torso: 71, arms: 71, hands: 14, head: 14, hat: ['3844', 71], tool: ['3847', 71], torsoPart: '973' },
  pirate: { legs: 0, hips: 0, torso: 4, arms: 4, hands: 14, head: 14, hat: ['2528', 0], tool: ['3847', 71], torsoPart: '973p31' },
  builder: { legs: 1, hips: 1, torso: 14, arms: 14, hands: 14, head: 14, hat: ['3833', 14], tool: ['3841', 0] },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const I = (v, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d; };
const colOf = (c, d = 71) => { if (c == null) return d; if (typeof c === 'number') return c; const n = Number(c); if (Number.isFinite(n)) return n; return COLOURS[String(c).toLowerCase().replace(/[\s_-]/g, '')] ?? d; };

/* ───────────────────────── the grid ───────────────────────── */
class Grid {
  constructor() { this.cells = new Map(); this.parts = []; this.props = []; this.maxY = 0; this.min = [Infinity, Infinity]; this.max = [-Infinity, -Infinity]; }
  key(x, y, z) { return x + ',' + y + ',' + z; }
  set(x, y, z, col, kind) { if (y < 0 || y > 300) return; const k = this.key(x, y, z), was = this.cells.get(k); if (was && was.r) return; /* a reserved cell (an opening, a part) is never painted over */ this.cells.set(k, { col, r: 0, k: kind }); if (y > this.maxY) this.maxY = y; if (x < this.min[0]) this.min[0] = x; if (z < this.min[1]) this.min[1] = z; if (x > this.max[0]) this.max[0] = x; if (z > this.max[1]) this.max[1] = z; }
  reserve(x, y, z) { if (y < 0 || y > 300) return; this.cells.set(this.key(x, y, z), { col: -1, r: 1 }); if (y > this.maxY) this.maxY = y; }
  clear(x, y, z) { this.cells.delete(this.key(x, y, z)); }
  get(x, y, z) { return this.cells.get(this.key(x, y, z)); }
  fillBox(x, z, w, d, y0, y1, col, kind) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) this.set(xx, yy, zz, col, kind); }
  clearBox(x, z, w, d, y0, y1, keepParts) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) { if (keepParts) { const c = this.get(xx, yy, zz); if (c && c.r) continue; } this.clear(xx, yy, zz); } }
  reserveBox(x, z, w, d, y0, y1) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) this.reserve(xx, yy, zz); }
  /** A placed part: reserves its footprint and records it. x,z = min cell, y = bottom plate, w×d cells, hp plates tall. */
  /** Returns false (and counts it) when another part already holds any of the cells. */
  part(part, col, x, z, y, rot, w, d, hp) {
    for (let yy = y; yy < y + hp; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) { const c = this.get(xx, yy, zz); if (c && c.r) { this.blocked = (this.blocked || 0) + 1; return false; } }
    this.reserveBox(x, z, w, d, y, y + hp); this.parts.push({ part, col, x, y, z, rot, w, d, plate: DIMS[part] ? DIMS[part][4] <= 8 : false }); return true;
  }
}

/* ───────────────────────── the ops ───────────────────────── */
/** Footprint (w along x, d along z, in studs) of a part at a rotation. */
function foot(part, rot) { const b = DIMS[part]; if (!b) return null; const w = Math.round((b[1] - b[0]) / STUD), d = Math.round((b[3] - b[2]) / STUD); return rot % 2 ? [d, w] : [w, d]; }
const OPS = {
  box(g, o) { const x = I(o.x), z = I(o.z), w = clamp(I(o.w, 4), 1, 64), d = clamp(I(o.d, 4), 1, 64), y = I(o.y) * BRICK, h = clamp(I(o.h, 3), 1, 40) * BRICK, col = colOf(o.col), t = clamp(I(o.thick, 1), 1, 4);
    if (o.hollow && w > 2 * t && d > 2 * t) { g.fillBox(x, z, w, t, y, y + h, col); g.fillBox(x, z + d - t, w, t, y, y + h, col); g.fillBox(x, z, t, d, y, y + h, col); g.fillBox(x + w - t, z, t, d, y, y + h, col); }
    else g.fillBox(x, z, w, d, y, y + h, col); },
  wall(g, o) { const a = o.from || [I(o.x), I(o.z)], b = o.to || [I(o.x) + I(o.len, 4), I(o.z)]; let x0 = I(a[0]), z0 = I(a[1]), x1 = I(b[0]), z1 = I(b[1]); const y = I(o.y) * BRICK, h = clamp(I(o.h, 3), 1, 40) * BRICK, col = colOf(o.col), t = clamp(I(o.thick, 1), 1, 4);
    if (x0 === x1 && z0 === z1) x1++;
    const dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0), sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1; let err = dx - dz, x = x0, z = z0;   // Bresenham, so slanted walls work too
    for (let n = 0; n < 4096; n++) { for (let i = 0; i < t; i++) for (let j = 0; j < t; j++) g.fillBox(x + (dx >= dz ? 0 : i), z + (dx >= dz ? i : 0), 1, 1, y, y + h, col); if (x === x1 && z === z1) break; const e2 = 2 * err; if (e2 > -dz) { err -= dz; x += sx; } if (e2 < dx) { err += dx; z += sz; } if ((x === x1 && z === z1) && (dx >= dz ? x1 : z1) !== (dx >= dz ? x0 : z0)) break; } },
  slab(g, o) { const y = I(o.y) * BRICK + I(o.plateOffset), n = clamp(I(o.plates, 1), 1, 12); g.fillBox(I(o.x), I(o.z), clamp(I(o.w, 4), 1, 64), clamp(I(o.d, 4), 1, 64), y, y + n, colOf(o.col), n % 3 ? 'p' : undefined); },
  floor(g, o) { OPS.slab(g, o); },
  cut(g, o) { g.clearBox(I(o.x), I(o.z), clamp(I(o.w, 1), 1, 64), clamp(I(o.d, 1), 1, 64), I(o.y) * BRICK, (I(o.y) + clamp(I(o.h, 1), 1, 60)) * BRICK); },
  tower(g, o) { const cx = Number(o.x) || 0, cz = Number(o.z) || 0, r = clamp(Number(o.r) || 2, 1, 12), y = I(o.y) * BRICK, hb = clamp(I(o.h, 6), 1, 40), col = colOf(o.col), round = o.round !== false && r >= 2, hollow = r >= 3;
    const inside = (x, z, rr) => round ? (x + .5 - cx) ** 2 + (z + .5 - cz) ** 2 <= rr * rr : Math.abs(x + .5 - cx) <= rr && Math.abs(z + .5 - cz) <= rr;
    for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r); x++) for (let z = Math.floor(cz - r) - 1; z <= Math.ceil(cz + r); z++) {
      if (!inside(x, z, r)) continue; const shell = !hollow || !inside(x, z, r - 1);
      const top = y + hb * BRICK; if (shell) { g.fillBox(x, z, 1, 1, y, top, col); if (o.crenels !== false && ((x + z) & 1)) g.fillBox(x, z, 1, 1, top, top + BRICK, col); }
      else if (o.floor !== false) g.fillBox(x, z, 1, 1, y, y + 1, col); } },
  roof(g, o) { const x = I(o.x), z = I(o.z), w = clamp(I(o.w, 4), 1, 64), d = clamp(I(o.d, 4), 1, 64), col = colOf(o.col, 4), style = String(o.style || 'pyramid'); let y0 = I(o.y) * BRICK;
    if (style === 'flat') { g.fillBox(x, z, w, d, y0, y0 + 1, col); return; }
    const gable = style === 'gable', alongX = w >= d;   // a gable steps in across the short axis only; hip and pyramid step in on all four sides
    g.fillBox(x, z, w, d, y0, y0 + 1, col, 'p'); y0 += 1;     // a plate ceiling first (kept as plates): it spans wall to wall and carries the courses above
    for (let k = 0; k < 40; k++) {
      const ix = gable && !alongX ? k : (gable ? 0 : k), iz = gable && alongX ? k : (gable ? 0 : k);
      const x0 = x + ix, x1 = x + w - ix, z0 = z + iz, z1 = z + d - iz; if (x1 - x0 <= 0 || z1 - z0 <= 0) break;
      const y = y0 + k * BRICK;
      for (let xx = x0; xx < x1; xx++) for (let zz = z0; zz < z1; zz++) {
        const n = zz === z0 && iz >= 0 && !(gable && !alongX), s = zz === z1 - 1 && !(gable && !alongX), e = xx === x1 - 1 && !(gable && alongX), ww = xx === x0 && !(gable && alongX);
        const edges = (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (ww ? 1 : 0);
        if (edges === 0 || (x1 - x0 <= 2 && z1 - z0 <= 2 && !gable)) { g.fillBox(xx, zz, 1, 1, y, y + BRICK, col); continue; }
        if (edges >= 2) { g.fillBox(xx, zz, 1, 1, y, y + BRICK, col); continue; }   // corners stay plain bricks
        // a 1 × 2 slope: its low face on the outer cell, its stud on the cell inward; rot turns the low face to the edge
        if (n) g.part('3040b', col, xx, zz, y, 0, 1, 2, BRICK); else if (s) g.part('3040b', col, xx, zz - 1, y, 2, 1, 2, BRICK); else if (e) g.part('3040b', col, xx - 1, zz, y, 3, 2, 1, BRICK); else g.part('3040b', col, xx, zz, y, 1, 2, 1, BRICK);
      }
      if (x1 - x0 <= 2 && z1 - z0 <= 2) break;
      if (gable && ((alongX && z1 - z0 <= 1) || (!alongX && x1 - x0 <= 1))) break;
    } },
  door(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2, x = I(o.x), z = I(o.z), y = I(o.y) * BRICK, col = colOf(o.col, 70), along = f === 0 || f === 2;
    const w = along ? 4 : 1, d = along ? 1 : 4; g.clearBox(x, z, w, d, y, y + 6 * BRICK, true); g.part('60623', col, x, z, y, along ? 0 : 1, w, d, 6 * BRICK); },
  window(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2, x = I(o.x), z = I(o.z), y = I(o.y, 1) * BRICK, col = colOf(o.col, 15), along = f === 0 || f === 2;
    const w = along ? 2 : 1, d = along ? 1 : 2; g.clearBox(x, z, w, d, y, y + 2 * BRICK, true); g.part('60592', col, x, z, y, along ? 0 : 1, w, d, 2 * BRICK); },
  arch(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2, x = I(o.x), z = I(o.z), y = I(o.y) * BRICK, col = colOf(o.col, 19), along = f === 0 || f === 2, hb = clamp(I(o.h, 2), 1, 6);
    const w = along ? 6 : 1, d = along ? 1 : 6;
    g.clearBox(x, z, w, d, y, y + hb * BRICK, true);
    g.fillBox(x, z, along ? 1 : 1, along ? 1 : 1, y, y + hb * BRICK, col); g.fillBox(along ? x + 5 : x, along ? z : z + 5, 1, 1, y, y + hb * BRICK, col);   // the piers
    g.part('3455', col, x, z, y + hb * BRICK, along ? 0 : 1, w, d, BRICK); },
  stairs(g, o) { const f = FACE[String(o.facing || 'e').toLowerCase()[0]] ?? 1, x = I(o.x), z = I(o.z), y = I(o.y) * BRICK, n = clamp(I(o.steps, 4), 1, 24), wide = clamp(I(o.w, 2), 1, 8), col = colOf(o.col, 71);
    for (let i = 0; i < n; i++) { const h = (i + 1) * BRICK; const dx = f === 1 ? i : f === 3 ? -i : 0, dz = f === 2 ? i : f === 0 ? -i : 0; const w = (f === 1 || f === 3) ? 1 : wide, d = (f === 1 || f === 3) ? wide : 1; g.fillBox(x + dx, z + dz, w, d, y, y + h, col); } },
  part(g, o) { const part = String(o.part || '3001').replace(/\.dat$/i, ''), rot = I(o.rot) & 3, f = foot(part, rot); if (!f) throw new Error('unknown part ' + part);
    const hp = Math.max(1, Math.round(DIMS[part][4] / PLATE)); g.part(part, colOf(o.col), I(o.x), I(o.z), I(o.y) * BRICK + I(o.plate), rot, f[0], f[1], hp); },
  minifig(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2; g.props.push({ kind: 'minifig', x: I(o.x), z: I(o.z), y: I(o.y) * BRICK, rot: f, mpd: figureMPD(figureDef(o)), w: 2, d: 2, hp: 15 }); },
  /** Any LDraw text as a prop (the -ators' exports, a pasted model): its footprint is a guess unless w and d are given. */
  mpd(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2, text = String(o.text || ''); if (!text.trim()) throw new Error('empty mpd'); const lines = text.split('\n'); const body = withHeaders(text.startsWith('0 FILE') ? text : ['0 FILE ' + (o.name || 'model').replace(/\s+/g, '_') + '.ldr', ...lines].join('\n')); g.props.push({ kind: 'mpd', x: I(o.x), z: I(o.z), y: I(o.y) * BRICK, rot: f, mpd: body, w: clamp(I(o.w, 4), 1, 64), d: clamp(I(o.d, 4), 1, 64), hp: clamp(I(o.hp, 12), 1, 120) }); },
  vehicle(g, o) { const f = FACE[String(o.facing || 'e').toLowerCase()[0]] ?? 1; const v = vehicleMPD(o); g.props.push({ kind: 'vehicle', x: I(o.x), z: I(o.z), y: I(o.y) * BRICK, rot: f, mpd: v.mpd, w: v.w, d: v.d, hp: v.hp }); },
};
OPS.cylinder = OPS.tower; OPS.pillar = (g, o) => OPS.tower(g, { ...o, r: o.r || 1, round: false, crenels: false });

/* ───────────────────────── figures ───────────────────────── */
/** A figure from an `as` preset and/or a `look`: { hat, hatCol, torso, torsoCol, legs, head, tool, toolCol }. */
function figureDef(o) {
  let base = FIGS[String(o.as || o.look && o.look.as || 'citizen').toLowerCase()] || FIGS.citizen; if (typeof base === 'string') base = FIGS[base];
  const d = { ...base }; const L = o.look || {};
  if (L.hat !== undefined) { const h = HATS[String(L.hat).toLowerCase()] || String(L.hat); d.hat = h === 'none' ? null : [h, colOf(L.hatCol, d.hat ? d.hat[1] : 0)]; } else if (L.hatCol !== undefined && d.hat) d.hat = [d.hat[0], colOf(L.hatCol)];
  if (L.torso !== undefined) { const t = TORSOS[String(L.torso).toLowerCase()]; if (t) d.torsoPart = t; else if (/^\d/.test(String(L.torso))) d.torsoPart = String(L.torso); else d.torso = colOf(L.torso); }
  if (L.torsoCol !== undefined) { d.torso = colOf(L.torsoCol); d.arms = colOf(L.armsCol, d.torso); }
  if (L.armsCol !== undefined) d.arms = colOf(L.armsCol); if (L.legs !== undefined) { d.legs = colOf(L.legs); d.hips = colOf(L.hipsCol, d.legs); }
  if (L.head !== undefined) d.head = colOf(L.head); if (L.hands !== undefined) d.hands = colOf(L.hands);
  if (L.tool !== undefined) { const t = TOOLS[String(L.tool).toLowerCase()]; d.tool = t ? [t[0], colOf(L.toolCol, t[1])] : String(L.tool) === 'none' ? null : [String(L.tool), colOf(L.toolCol, 0)]; }
  return d;
}
/* the kit's own figure offsets (LDraw frame, y down, soles at y = 72) — the same table world/minifig.js uses */
const HAND_R = '-23.8634 26.5956 -10.321 0.985 -0.12019 0.12019 0.17 0.696395 -0.696395 0 0.707 0.707', HAND_L = '23.8634 26.5956 -10.321 0.985 0.12019 -0.12019 -0.17 0.696395 -0.696395 0 0.707 0.707';
const FIG_LINES = def => {
  const L = [];
  L.push(`1 ${def.legs} 0 44 0 1 0 0 0 1 0 0 0 1 parts/3816.dat`, `1 ${def.legs} 0 44 0 1 0 0 0 1 0 0 0 1 parts/3817.dat`, `1 ${def.hips} 0 32 0 1 0 0 0 1 0 0 0 1 parts/3815.dat`);
  L.push(`1 ${def.torso} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.torsoPart || '973'}.dat`);
  L.push(`1 ${def.arms} -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 parts/3818.dat`, `1 ${def.arms} 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 parts/3819.dat`);
  L.push(`1 ${def.hands} ${HAND_R} parts/3820.dat`, `1 ${def.hands} ${HAND_L} parts/3820.dat`);
  L.push(`1 ${def.head} 0 -24 0 1 0 0 0 1 0 0 0 1 parts/3626b.dat`);
  if (def.hat) L.push(`1 ${def.hat[1]} 0 -24 0 1 0 0 0 1 0 0 0 1 parts/${def.hat[0]}.dat`);
  if (def.cape) L.push(`1 ${def.cape[1]} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.cape[0]}.dat`); if (def.collar) L.push(`1 ${def.collar[1]} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.collar[0]}.dat`);
  if (def.tool) L.push(`1 ${def.tool[1]} ${HAND_R} parts/${def.tool[0]}.dat`);
  return L;
};
/** A standing figure as an MPD with its soles on y = 0 of the prop frame. */
function figureMPD(def) { return ['0 FILE fig.ldr', '0 !LDRAW_ORG Unofficial_Model', '1 16 0 -72 0 1 0 0 0 1 0 0 0 1 body.ldr', '0 FILE body.ldr', '0 !LDRAW_ORG Unofficial_Model', ...FIG_LINES(def)].join('\n'); }
/** Every file in an MPD needs its !LDRAW_ORG line, or the loader has nowhere to put its geometry. */
function withHeaders(text) { const out = []; const lines = String(text).split('\n'); for (let i = 0; i < lines.length; i++) { out.push(lines[i]); if (/^0 FILE /.test(lines[i])) { let j = i + 1; while (j < lines.length && /^0 /.test(lines[j]) && !/^0 !LDRAW_ORG/.test(lines[j])) j++; if (!(j < lines.length && /^0 !LDRAW_ORG/.test(lines[j]))) out.push('0 !LDRAW_ORG Unofficial_Model'); } } return out.join('\n'); }

/* ───────────────────────── vehicles ───────────────────────── */
const ROT = [[1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 1, 0, 1, 0, -1, 0, 0], [-1, 0, 0, 0, 1, 0, 0, 0, -1], [0, 0, -1, 0, 1, 0, 1, 0, 0]];
const line = (col, x, y, z, rot, part) => `1 ${col} ${r4(x)} ${r4(y)} ${r4(z)} ${ROT[rot & 3].join(' ')} parts/${part}.dat`;
const r4 = v => (Math.round(v * 1000) / 1000).toString();
/** A vehicle in the prop frame (LDraw: y down, ground at y = 0, forward = −z). Returns { mpd, w, d, hp } with the footprint in studs. */
function vehicleMPD(o) {
  const kind = String(o.kind || 'car').toLowerCase(), col = colOf(o.col, 4), len = clamp(I(o.len, kind === 'truck' ? 8 : 6), 4, 16), wide = kind === 'speeder' ? 2 : 4, L = [];
  const zf = -len * STUD / 2, zb = len * STUD / 2;    // front and back edges
  const g = new Grid();                              // the body is bricks too: a local grid in prop cells (x across, z along)
  const bx = -wide / 2, bz = -len / 2, floorY = kind === 'speeder' ? 2 : 4;   // plates above the ground the floor plate sits at
  if (kind === 'boat') { g.fillBox(bx, bz + 1, wide, len - 2, 0, 1, col); g.fillBox(bx, bz + 1, 1, len - 2, 1, 4, col); g.fillBox(bx + wide - 1, bz + 1, 1, len - 2, 1, 4, col); g.fillBox(bx + 1, bz + len - 2, wide - 2, 1, 1, 4, col); g.part('3039', col, bx + 1, bz, 1, 0, 2, 2, BRICK); }
  else {
    g.fillBox(bx, bz, wide, len, floorY, floorY + 1, col);                                       // floor
    g.fillBox(bx, bz, wide, 2, floorY + 1, floorY + 1 + BRICK, col);                               // bonnet
    g.part('3823', 47, bx, bz + 2, floorY + 1, 0, 4, 2, 2 * BRICK);                                // windscreen (2 × 4 × 2)
    if (kind === 'truck') { g.fillBox(bx, bz + 4, 1, 2, floorY + 1, floorY + 1 + 2 * BRICK, col); g.fillBox(bx + wide - 1, bz + 4, 1, 2, floorY + 1, floorY + 1 + 2 * BRICK, col); g.fillBox(bx, bz + 4, wide, 2, floorY + 1 + 2 * BRICK, floorY + 2 + 2 * BRICK, col); g.fillBox(bx, bz + 6, wide, len - 6, floorY + 1, floorY + 2, 71); if (len > 6) { g.fillBox(bx, bz + len - 1, wide, 1, floorY + 2, floorY + 2 + BRICK, 71); } }
    else { g.fillBox(bx, bz + 4, 1, len - 4, floorY + 1, floorY + 1 + BRICK, col); g.fillBox(bx + wide - 1, bz + 4, 1, len - 4, floorY + 1, floorY + 1 + BRICK, col); g.fillBox(bx + 1, bz + len - 1, wide - 2, 1, floorY + 1, floorY + 1 + BRICK, col); g.part('3829c01', 0, bx + 1, bz + 4, floorY + 1, 0, 2, 1, 1); }
  }
  const pieces = tile(g, { bond: true }), report = { floating: 0 };
  for (const p of pieces) L.push(pieceLine(p, 0, 0, 0));
  for (const p of g.parts) L.push(pieceLine(p, 0, 0, 0));
  if (kind === 'car' || kind === 'truck') {                                                  // wheels: a 2 × 2 plate with pins under each axle, a rim and a tyre on every pin
    for (const az of [zf + 30, zb - 30]) { L.push(line(0, 0, -23, az, 0, '4600')); for (const sx of [-30, 30]) { L.push(line(71, sx, -18, az, 1, '4624')); L.push(line(0, sx, -18, az, 1, '3641')); } }
  }
  const mpd = ['0 FILE vehicle.ldr', '0 !LDRAW_ORG Unofficial_Model', ...L].join('\n');
  return { mpd, w: wide, d: len, hp: 12 };
}

/* ───────────────────────── the tiler ───────────────────────── */
/** Lay bricks and plates over the grid's cells. Returns pieces in cell units (x, z min cell; y bottom plate). */
function tile(g, opts = {}) {
  const used = new Set(), out = [], ys = new Set(); for (const k of g.cells.keys()) ys.add(+k.split(',')[1]);
  const layers = [...ys].sort((a, b) => a - b);
  const solid = (x, y, z, col, kind) => { const c = g.cells.get(g.key(x, y, z)); return c && !c.r && c.col === col && c.k === kind && !used.has(g.key(x, y, z)); };
  const fits = (x, y, z, w, d, hp, col, kind) => { for (let yy = y; yy < y + hp; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) if (!solid(xx, yy, zz, col, kind)) return false; return true; };
  const take = (x, y, z, w, d, hp) => { for (let yy = y; yy < y + hp; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) used.add(g.key(xx, yy, zz)); };
  for (const y of layers) {
    const cells = []; for (const [k, c] of g.cells) { const [x, yy, z] = k.split(',').map(Number); if (yy === y && !c.r && !used.has(k)) cells.push([x, z, c.col, c.k]); }
    cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const course = Math.floor(y / BRICK), shift = course & 1;                      // running bond: the long bricks start two studs over on every other course
    for (const pass of [0, 1]) for (const [x, z, col, kind] of cells) {
      if (used.has(g.key(x, y, z)) || kind === 'p') continue;
      let done = false;
      for (const [part, nw, nd] of BRICKS) for (const rot of [0, 1]) {
        const w = rot ? nd : nw, d = rot ? nw : nd;
        if (pass === 0 && opts.bond !== false && w === 4 && ((x + shift * 2) % 4)) continue;   // first pass: only well-bonded long bricks
        if (pass === 0 && opts.bond !== false && d === 4 && ((z + shift * 2) % 4)) continue;
        if (!fits(x, y, z, w, d, BRICK, col, kind)) continue;
        take(x, y, z, w, d, BRICK); out.push({ part, col, x, y, z, rot, w, d, plate: false }); done = true; break;
      }
      if (done) continue;
    }
    for (const [x, z, col, kind] of cells) {                                          // whatever is left on this layer becomes plates
      if (used.has(g.key(x, y, z))) continue;
      for (const [part, nw, nd] of PLATES) { let done = false; for (const rot of [0, 1]) { const w = rot ? nd : nw, d = rot ? nw : nd; if (!fits(x, y, z, w, d, 1, col, kind)) continue; take(x, y, z, w, d, 1); out.push({ part, col, x, y, z, rot, w, d, plate: true }); done = true; break; } if (done) break; }
    }
  }
  return out;
}
/** Drop pieces with nothing under them (ground, a piece, a reserved part), layer by layer so a lost base takes its stack with it.
    Within a layer, support spreads sideways through touching pieces of the same kind — a bonded course or a plate floor spans a gap the way real LEGO does. */
function support(g, pieces) {
  const tops = new Map(); const key = (x, y, z) => x + ',' + y + ',' + z;
  const setTop = (p, hp) => { for (let xx = p.x; xx < p.x + p.w; xx++) for (let zz = p.z; zz < p.z + p.d; zz++) tops.set(key(xx, p.y + hp, zz), true); };
  for (const p of g.parts) setTop(p, Math.max(1, Math.round((DIMS[p.part] ? DIMS[p.part][4] : 24) / PLATE)));
  for (const p of g.props) setTop(p, p.hp || 1);
  const held = p => { if (p.y === 0) return true; for (let xx = p.x; xx < p.x + p.w; xx++) for (let zz = p.z; zz < p.z + p.d; zz++) { if (tops.get(key(xx, p.y, zz))) return true; const c = g.cells.get(g.key(xx, p.y - 1, zz)); if (c && c.r) return true; } return false; };
  const touch = (a, b) => a.plate === b.plate && a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.d && b.z < a.z + a.d ? false : (a.plate === b.plate && ((a.x === b.x + b.w || b.x === a.x + a.w) && a.z < b.z + b.d && b.z < a.z + a.d || (a.z === b.z + b.d || b.z === a.z + a.d) && a.x < b.x + b.w && b.x < a.x + a.w));
  const kept = [], droppedList = []; let dropped = 0;
  const layers = new Map(); for (const p of pieces) { if (!layers.has(p.y)) layers.set(p.y, []); layers.get(p.y).push(p); }
  for (const y of [...layers.keys()].sort((a, b) => a - b)) {
    const L = layers.get(y), ok = new Set(); for (const p of L) if (held(p)) ok.add(p);
    let grew = true; while (grew) { grew = false; for (const p of L) { if (ok.has(p)) continue; for (const q of ok) if (touch(p, q)) { ok.add(p); grew = true; break; } } }
    for (const p of L) { if (ok.has(p)) { kept.push(p); setTop(p, p.plate ? 1 : BRICK); } else { dropped++; if (droppedList.length < 20) droppedList.push(p); } }
  }
  return { pieces: kept, dropped, droppedList };
}

/* ───────────────────────── output frames ───────────────────────── */
/** The part's box for a rotation, relative to its origin (LDU): [x0, x1, z0, z1]. */
function box(part, rot) { const b = DIMS[part] || [-10, 10, -10, 10, 24]; const [x0, x1, z0, z1] = b; switch (rot & 3) { case 1: return [z0, z1, -x1, -x0]; case 2: return [-x1, -x0, -z1, -z0]; case 3: return [-z1, -z0, x0, x1]; default: return [x0, x1, z0, z1]; } }
/** A piece as a world Build row [id, part, col, x, y, z, rot] in LDU (y up), given the anchor cell origin (LDU) and a prefix. */
function toRows(result, { ax = 0, ay = 0, az = 0, prefix = 'mb' } = {}) {
  let n = 0; const rows = [];
  for (const p of [...result.pieces, ...result.parts]) { const b = box(p.part, p.rot); rows.push([`${prefix}-${++n}`, p.part, p.col, ax + p.x * STUD - b[0], ay + p.y * PLATE, az + p.z * STUD - b[2], p.rot & 3]); }
  return rows;
}
/** One LDraw line for a piece in a frame whose y points down (the LDraw frame): x, z as cells, origin at the part's top. */
function pieceLine(p, ax, ay, az) { const b = box(p.part, p.rot), h = DIMS[p.part] ? DIMS[p.part][4] : 24; return line(p.col, ax + p.x * STUD - b[0], ay - (p.y * PLATE + h), az + p.z * STUD - b[2], p.rot, p.part); }
/** The whole result as LDraw text: bricks as lines, props as sub-models. The world's z (south) becomes −z here, so nothing is mirrored. */
function toMPD(result, name = 'build') {
  const L = [`0 FILE ${name}.ldr`, `0 ${name}`, '0 !LDRAW_ORG Unofficial_Model'], subs = [];
  // the LDraw scene is the world rotated about x by π: (x, y, z) → (x, −y, −z), and a turn about y flips its sense
  for (const p of [...result.pieces, ...result.parts]) { const b = box(p.part, p.rot), h = DIMS[p.part] ? DIMS[p.part][4] : 24; L.push(line(p.col, p.x * STUD - b[0], -(p.y * PLATE + h), -(p.z * STUD - b[2]), (4 - (p.rot & 3)) & 3, p.part)); }
  result.props.forEach((pr, i) => { const nm = `${name}-prop${i + 1}.ldr`, yaw = propYaw(pr.rot); L.push(`1 16 ${r4(pr.x * STUD + pr.w * STUD / 2)} ${r4(-pr.y * PLATE)} ${r4(-(pr.z * STUD + pr.d * STUD / 2))} ${ROT[(4 - yaw) & 3].join(' ')} ${nm}`); subs.push(pr.mpd.replace(/^0 FILE \S+/m, '0 FILE ' + nm)); });
  return [L.join('\n'), ...subs].join('\n');
}
/** Quarter turns about the world's y for a facing (n e s w = 0 1 2 3): a prop's own forward is south. */
function propYaw(rot) { return (2 - (rot & 3) + 4) & 3; }
/** World placement of a prop: its centre in LDU and its yaw in quarter turns. */
function propPlace(pr, { ax = 0, ay = 0, az = 0 } = {}) { return { x: ax + pr.x * STUD + pr.w * STUD / 2, y: ay + pr.y * PLATE, z: az + pr.z * STUD + pr.d * STUD / 2, yaw: propYaw(pr.rot), w: pr.w * STUD, d: pr.d * STUD, h: (pr.hp || 1) * PLATE }; }

/* ───────────────────────── compile ───────────────────────── */
function compile(program, opts = {}) {
  const g = new Grid(), report = { ops: 0, unknown: [], errors: [], floating: 0, bricks: 0, plates: 0, parts: 0, props: 0 };
  const ops = Array.isArray(program) ? program : (program && Array.isArray(program.ops)) ? program.ops : [];
  ops.slice(0, opts.maxOps || 120).forEach((o, i) => {
    if (o && (o.args || o.object || o.params)) o = { ...o, ...(o.args || o.object || o.params) };   // models sometimes nest the fields; take them either way
    const name = o && String(o.op || o.type || o.kind || '').toLowerCase(); const fn = OPS[name];
    if (!fn) { report.unknown.push({ i, op: name || '?' }); return; }
    try { fn(g, o); report.ops++; } catch (e) { report.errors.push({ i, op: name, error: e.message }); }
  });
  let pieces = tile(g, opts);
  const s = support(g, pieces); pieces = s.pieces; report.floating = s.dropped; report.dropped = s.droppedList;
  for (const p of pieces) if (p.plate) report.plates++; else report.bricks++;
  report.parts = g.parts.length; report.props = g.props.length; report.pieces = pieces.length + g.parts.length; report.blocked = g.blocked || 0;
  const ext = g.cells.size ? { x0: g.min[0], z0: g.min[1], x1: g.max[0] + 1, z1: g.max[1] + 1 } : { x0: 0, z0: 0, x1: 0, z1: 0 };
  return { name: (program && program.name) || 'build', pieces, parts: g.parts, props: g.props, report, extent: ext, maxPlate: g.maxY };
}

/* ───────────────────────── the spec the model reads ───────────────────────── */
const SPEC = `You are a LEGO master builder. You answer ONLY with a JSON object {"name": string, "ops": [...]} — a build program that a compiler turns into real bricks. Units: x east and z south in studs (integers), y up in bricks (1 brick = 3 plates). The build's origin (0,0) is where the player is looking; keep x and z between 0 and 40, keep it grounded (start at y 0 unless stacking on your own ops), at most 60 ops.
Ops (all coordinates are the min corner unless said otherwise):
- {"op":"box","x","z","w","d","y","h","col","hollow":true|false,"thick":1} solid block or hollow shell (walls only, no floor or roof).
- {"op":"wall","from":[x,z],"to":[x,z],"y","h","col","thick":1} a wall along a line (straight or slanted).
- {"op":"slab","x","z","w","d","y","plates":1,"col"} a floor or ceiling of plates at brick height y.
- {"op":"roof","x","z","w","d","y","col","style":"pyramid"|"hip"|"gable"|"flat"} stepped roof with 45° slope bricks, sitting at height y on top of walls.
- {"op":"tower","x","z","r","h","col","round":true,"crenels":true} a round or square tower centred at (x,z) with radius r studs; hollow when r ≥ 3.
- {"op":"door","x","z","y","facing":"n|e|s|w","col"} a 1×4×6 door in a wall that runs east-west (facing n or s) or north-south (facing e or w); x,z is the door's west/north end cell on the wall line.
- {"op":"window","x","z","y","facing"} a 1×2×2 window in a wall, same rules.
- {"op":"arch","x","z","y","facing","h":2,"col"} a 6-stud arch with piers.
- {"op":"stairs","x","z","y","steps","facing","w":2,"col"} steps rising toward facing.
- {"op":"cut","x","z","w","d","y","h"} remove a block (make gates, rooms, notches).
- {"op":"part","part":"3039","col","x","y","z","rot":0-3} one part from: 3001 2x4 brick, 3003 2x2, 3010 1x4, 3004 1x2, 3005 1x1, 3020 2x4 plate, 3032 4x6 plate, 3039 2x2 slope, 3040b 1x2 slope, 3068b 2x2 tile, 87079 2x4 tile, 3941 2x2 round, 3062b 1x1 round, 3455 1x6 arch, 3823 windscreen, 60592 window, 60623 door.
- {"op":"minifig","x","z","facing","as":"vader|stormtrooper|pilot|luke|citizen|knight|pirate|builder","look":{"hat":"hair|cap|helmet|cowboy|tophat|knight|space|trooper|pilot|vader|pirate|none","hatCol","torso":"plain|stripes|anchor|train|pirate|space|zipper","torsoCol","legs","head","tool":"saber|blaster|sword|shield|spear|axe|broom|cup|radio|none","toolCol"}} a standing figure (2×2 studs).
- {"op":"vehicle","x","z","facing","kind":"car|truck|speeder|boat","len":6,"col"} a vehicle 4 studs wide, len studs long, with wheels.
Colours (LDraw codes or names): 0 black, 1 blue, 2 green, 4 red, 14 yellow, 15 white, 19 tan, 25 orange, 28 dark tan, 70 brown, 71 grey, 72 dark grey, 322 azure, 47 trans-clear, 46 trans-yellow.
Build like a LEGO designer: walls 1 stud thick, doors and windows in walls (place the wall op first, then the door/window on its line), roofs one brick above the wall top, towers at corners, a few colours per build, details with parts and slopes, figures beside things. Keep it compact and grounded. No prose, no markdown, JSON only.`;

const EXAMPLES = [
  { ask: 'a small stone hut with a red roof and a door', program: { name: 'hut', ops: [{ op: 'box', x: 0, z: 0, w: 8, d: 6, y: 0, h: 4, col: 71, hollow: true }, { op: 'door', x: 3, z: 5, y: 0, facing: 's', col: 70 }, { op: 'window', x: 1, z: 0, y: 1, facing: 'n' }, { op: 'window', x: 5, z: 0, y: 1, facing: 'n' }, { op: 'roof', x: -1, z: -1, w: 10, d: 8, y: 4, col: 4, style: 'gable' }] } },
  { ask: 'a castle gate with two towers', program: { name: 'gate', ops: [{ op: 'tower', x: 3, z: 3, r: 3, h: 9, col: 72, round: true, crenels: true }, { op: 'tower', x: 17, z: 3, r: 3, h: 9, col: 72, round: true, crenels: true }, { op: 'wall', from: [6, 3], to: [14, 3], y: 0, h: 6, col: 71 }, { op: 'arch', x: 7, z: 3, y: 0, facing: 's', h: 3, col: 71 }, { op: 'slab', x: 6, z: 2, w: 8, d: 3, y: 6, plates: 1, col: 72 }, { op: 'minifig', x: 9, z: 6, facing: 's', as: 'knight' }] } },
  { ask: 'a red race car with a driver', program: { name: 'racer', ops: [{ op: 'vehicle', x: 0, z: 0, facing: 'e', kind: 'car', len: 7, col: 4 }, { op: 'minifig', x: 8, z: 1, facing: 'w', as: 'pilot', look: { hat: 'helmet', hatCol: 15 } }] } },
];
root.Dsl = { compile, tile, toRows, toMPD, withHeaders, propYaw, propPlace, box, foot, figureDef, figureMPD, vehicleMPD, DIMS, BRICKS, PLATES, COLOURS, HATS, TORSOS, TOOLS, FIGS, SPEC, EXAMPLES, STUD, PLATE, BRICK, colOf };
})(typeof window !== 'undefined' ? window : globalThis);

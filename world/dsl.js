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
  '2453b': [-10, 10, -10, 10, 120], '3185': [-40, 40, -10, 10, 48], '4589': [-10, 10, -10, 10, 24], '3710': [-40, 40, -10, 10, 8],
  '3788': [-40, 40, -20, 20, 16], '3854': [-20, 20, -10, 10, 72], '3031': [-40, 40, -40, 40, 8], '3037': [-40, 40, -30, 10, 24],
  '3626b': [-10, 10, -10, 10, 24], '973': [-20, 20, -10, 10, 32], '3815': [-10, 10, -10, 10, 12], '3816': [-10, 10, -10, 10, 32], '3817': [-10, 10, -10, 10, 32],
};
const BRICKS = [['3001', 4, 2], ['3008', 8, 1], ['3009', 6, 1], ['3003', 2, 2], ['3010', 4, 1], ['3004', 2, 1], ['3005', 1, 1]];                 // part, studs along x, along z (natural orientation)
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
  constructor() { this.cells = new Map(); this.parts = []; this.props = []; this.maxY = 0; this.op = -1; this.min = [Infinity, Infinity]; this.max = [-Infinity, -Infinity]; }
  key(x, y, z) { return x + ',' + y + ',' + z; }
  set(x, y, z, col, kind) { if (y < 0 || y > 300) return; const k = this.key(x, y, z), was = this.cells.get(k); if (was && was.r) return; /* a reserved cell (an opening, a part) is never painted over */ this.cells.set(k, { col, r: 0, k: kind, op: this.op }); if (y > this.maxY) this.maxY = y; if (x < this.min[0]) this.min[0] = x; if (z < this.min[1]) this.min[1] = z; if (x > this.max[0]) this.max[0] = x; if (z > this.max[1]) this.max[1] = z; }
  reserve(x, y, z) { if (y < 0 || y > 300) return; this.cells.set(this.key(x, y, z), { col: -1, r: 1 }); if (y > this.maxY) this.maxY = y; }
  clear(x, y, z) { this.cells.delete(this.key(x, y, z)); }
  get(x, y, z) { return this.cells.get(this.key(x, y, z)); }
  /** The highest plate anything occupies over a footprint, or null when the column is empty. */
  topAt(x, z, w, d) { for (let yy = this.maxY; yy >= 0; yy--) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) if (this.cells.has(this.key(xx, yy, zz))) return yy; return null; }
  fillBox(x, z, w, d, y0, y1, col, kind) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) this.set(xx, yy, zz, col, kind); }
  clearBox(x, z, w, d, y0, y1, keepParts) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) { if (keepParts) { const c = this.get(xx, yy, zz); if (c && c.r) continue; } this.clear(xx, yy, zz); } }
  reserveBox(x, z, w, d, y0, y1) { for (let yy = y0; yy < y1; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) this.reserve(xx, yy, zz); }
  /** A placed part: reserves its footprint and records it. x,z = min cell, y = bottom plate, w×d cells, hp plates tall. */
  /** Returns false (and counts it) when another part already holds any of the cells. */
  part(part, col, x, z, y, rot, w, d, hp) {
    for (let yy = y; yy < y + hp; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) { const c = this.get(xx, yy, zz); if (c && c.r) { this.blocked = (this.blocked || 0) + 1; return false; } }
    this.reserveBox(x, z, w, d, y, y + hp); this.parts.push({ part, col, x, y, z, rot, w, d, plate: DIMS[part] ? DIMS[part][4] <= 8 : false, op: this.op }); return true;
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
  window(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2, x = I(o.x), z = I(o.z), col = colOf(o.col, 15), along = f === 0 || f === 2; let y = I(o.y, 1) * BRICK;
    const w = along ? 2 : 1, d = along ? 1 : 2, top = g.topAt(x, z, w, d); if (top != null && y + 2 * BRICK > top + 1) y = Math.max(0, top + 1 - 2 * BRICK);   // a window never rises past the wall it sits in
    g.clearBox(x, z, w, d, y, y + 2 * BRICK, true); g.part('60592', col, x, z, y, along ? 0 : 1, w, d, 2 * BRICK); },
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
  walker(g, o) { const f = FACE[String(o.facing || 's').toLowerCase()[0]] ?? 2; const v = walkerMPD(o); g.props.push({ kind: 'walker', x: I(o.x), z: I(o.z), y: I(o.y) * BRICK, rot: f, mpd: v.mpd, w: v.w, d: v.d, hp: v.hp }); },
};
OPS.band = (g, o) => { const x = I(o.x), z = I(o.z), w = clamp(I(o.w, 4), 1, 64), d = clamp(I(o.d, 4), 1, 64), y = I(o.y) * BRICK + I(o.plate), h = o.plates ? clamp(I(o.plates), 1, 12) : clamp(I(o.h, 1), 1, 40) * BRICK, col = colOf(o.col);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) { const c = g.get(xx, yy, zz); if (c && !c.r) c.col = col; } };   // recolours what stands there: stripes, sills, trims
OPS.column = (g, o) => { const x = I(o.x), z = I(o.z), y = I(o.y) * BRICK + I(o.plate), hb = clamp(I(o.h, 5), 1, 40), col = colOf(o.col, 15); let k = 0;
  for (; k + 5 <= hb; k += 5) g.part('2453b', col, x, z, y + k * BRICK, 0, 1, 1, 5 * BRICK);
  if (k < hb) g.fillBox(x, z, 1, 1, y + k * BRICK, y + hb * BRICK, col); };
OPS.fence = (g, o) => { const a = o.from || [I(o.x), I(o.z)], b = o.to || [I(o.x) + I(o.len, 4), I(o.z)], x0 = I(a[0]), z0 = I(a[1]), x1 = I(b[0]), z1 = I(b[1]), y = I(o.y) * BRICK, col = colOf(o.col, 15);
  const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0), n = Math.max(1, Math.floor((alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0)) / 4)), sx = x1 >= x0 ? 1 : -1, sz = z1 >= z0 ? 1 : -1;
  for (let i = 0; i < n; i++) { const x = alongX ? (sx > 0 ? x0 + i * 4 : x0 - i * 4 - 3) : x0, z = alongX ? z0 : (sz > 0 ? z0 + i * 4 : z0 - i * 4 - 3); g.part('3185', col, x, z, y, alongX ? 0 : 1, alongX ? 4 : 1, alongX ? 1 : 4, 2 * BRICK); } };
OPS.tree = (g, o) => { const x = I(o.x), z = I(o.z), y = I(o.y) * BRICK, hb = clamp(I(o.h, 3), 1, 12), trunk = colOf(o.trunk, 70), col = colOf(o.col, 2), r = clamp(I(o.r, 1), 1, 3);
  for (let k = 0; k < hb; k++) g.part('3062b', trunk, x, z, y + k * BRICK, 0, 1, 1, BRICK);
  const top = y + hb * BRICK; for (let k = 0; k <= r; k++) { const rr = r - k; g.fillBox(x - rr, z - rr, 2 * rr + 1, 2 * rr + 1, top + k * BRICK, top + (k + 1) * BRICK, col); }
  g.part('4589', col, x, z, top + (r + 1) * BRICK, 0, 1, 1, BRICK); };
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
/* the kit's own figure offsets (LDraw frame, y down, soles at y = 72) — the same table world/minifig.js uses; a tool goes in the fist (3820's grip: 9.9 LDU ahead of the hand's origin, 14.5° tilt) */
const HAND_R_M = [-23.8634, 26.5956, -10.321, 0.985, -0.12019, 0.12019, 0.17, 0.696395, -0.696395, 0, 0.707, 0.707], HAND_L_M = [23.8634, 26.5956, -10.321, 0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707];
const rx3 = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const mul3 = (a, b) => [a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8], a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8], a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
const ap3 = (a, v) => [a[0] * v[0] + a[1] * v[1] + a[2] * v[2], a[3] * v[0] + a[4] * v[1] + a[5] * v[2], a[6] * v[0] + a[7] * v[1] + a[8] * v[2]];
const GRIP_ROT = rx3(14.5 * Math.PI / 180), FLIP3 = rx3(Math.PI);
const toolMount = (hand, bar) => { const R = hand.slice(3), p = ap3(R, [0, -0.8229, -9.8948]), rot = mul3(mul3(R, GRIP_ROT), bar ? FLIP3 : [1, 0, 0, 0, 1, 0, 0, 0, 1]); return [hand[0] + p[0], hand[1] + p[1], hand[2] + p[2], ...rot]; };
const mat = m => m.map(v => +(+v).toFixed(4)).join(' ');
const HAND_R = mat(HAND_R_M), HAND_L = mat(HAND_L_M), TOOL_R = mat(toolMount(HAND_R_M, false)), TOOL_R_BAR = mat(toolMount(HAND_R_M, true));
const BARS = new Set(['30374', '4497', '6124', '3836']);                       // parts whose origin is one end of a bar: turned over to rise from the fist
const FIG_LINES = def => {
  const L = [];
  L.push(`1 ${def.legs} 0 44 0 1 0 0 0 1 0 0 0 1 parts/3816.dat`, `1 ${def.legs} 0 44 0 1 0 0 0 1 0 0 0 1 parts/3817.dat`, `1 ${def.hips} 0 32 0 1 0 0 0 1 0 0 0 1 parts/3815.dat`);
  L.push(`1 ${def.torso} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.torsoPart || '973'}.dat`);
  L.push(`1 ${def.arms} -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 parts/3818.dat`, `1 ${def.arms} 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 parts/3819.dat`);
  L.push(`1 ${def.hands} ${HAND_R} parts/3820.dat`, `1 ${def.hands} ${HAND_L} parts/3820.dat`);
  L.push(`1 ${def.head} 0 -24 0 1 0 0 0 1 0 0 0 1 parts/3626b.dat`);
  if (def.hat) L.push(`1 ${def.hat[1]} 0 -24 0 1 0 0 0 1 0 0 0 1 parts/${def.hat[0]}.dat`);
  if (def.cape) L.push(`1 ${def.cape[1]} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.cape[0]}.dat`); if (def.collar) L.push(`1 ${def.collar[1]} 0 0 0 1 0 0 0 1 0 0 0 1 parts/${def.collar[0]}.dat`);
  if (def.tool) L.push(`1 ${def.tool[1]} ${BARS.has(String(def.tool[0])) ? TOOL_R_BAR : TOOL_R} parts/${def.tool[0]}.dat`);
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
  const kind = String(o.kind || 'car').toLowerCase(), col = colOf(o.col, 4), len = clamp(I(o.len, kind === 'truck' ? 10 : kind === 'bus' ? 12 : kind === 'plane' ? 8 : kind === 'board' ? 4 : 6), 4, 16), wide = kind === 'speeder' || kind === 'plane' || kind === 'board' ? 2 : 4, L = [];
  const zf = -len * STUD / 2, zb = len * STUD / 2;    // front and back edges
  const g = new Grid();                              // the body is bricks too: a local grid in prop cells (x across, z along)
  const bx = -wide / 2, bz = -len / 2, floorY = kind === 'speeder' || kind === 'board' ? 2 : 4;   // plates above the ground the floor plate sits at
  if (kind === 'boat') { g.fillBox(bx, bz + 1, wide, len - 2, 0, 1, col); g.fillBox(bx, bz + 1, 1, len - 2, 1, 4, col); g.fillBox(bx + wide - 1, bz + 1, 1, len - 2, 1, 4, col); g.fillBox(bx + 1, bz + len - 2, wide - 2, 1, 1, 4, col);
    g.part('3039', col, bx + 1, bz, 1, 0, 2, 2, BRICK); g.part('3040b', col, bx, bz, 1, 0, 1, 2, BRICK); g.part('3040b', col, bx + wide - 1, bz, 1, 0, 1, 2, BRICK);   // the bow: a slope in the middle, a slope each side
    g.fillBox(bx + 1, bz + 2, 1, 1, 4, 5, 71); g.part('3829c01', 0, bx + 1, bz + 3, 4, 0, 2, 1, 1); g.fillBox(bx + 1, bz + len - 3, wide - 2, 1, 4, 4 + BRICK, 15); }   // a helm and a cabin block at the stern
  else if (kind === 'plane') {
    g.fillBox(bx, bz + 1, wide, len - 1, floorY, floorY + 1, col);                              // the fuselage floor
    g.part('3039', col, bx, bz, floorY + 1, 0, 2, 2, BRICK); g.part('3062b', 0, bx, bz - 1, floorY, 0, 1, 1, BRICK); g.part('3062b', 0, bx + 1, bz - 1, floorY, 0, 1, 1, BRICK);   // a sloped nose and the propeller boss
    for (let zz = bz + 2; zz < bz + len - 2; zz++) g.fillBox(bx, zz, wide, 1, floorY + 1, floorY + 1 + BRICK, col);   // the body
    g.part('3829c01', 0, bx, bz + 2, floorY + 1 + BRICK, 0, 2, 1, 1);                         // the stick
    g.fillBox(bx, bz + 3, wide, 1, floorY + 1 + BRICK, floorY + 2 + BRICK, 0);               // the seat
    const wz = bz + Math.floor(len / 2) - 1; g.fillBox(bx - 4, wz, wide + 8, 2, floorY + 1, floorY + 2, col);   // wings: plates 10 studs across
    g.part('3040b', col, bx, bz + len - 2, floorY + 1 + BRICK, 2, 1, 2, BRICK); g.part('3040b', col, bx + 1, bz + len - 2, floorY + 1 + BRICK, 2, 1, 2, BRICK);   // the tail fin
    g.fillBox(bx - 2, bz + len - 2, wide + 4, 1, floorY + 1, floorY + 2, col);                // the tailplane
    g.fillBox(bx, bz + 2, wide, len - 4, floorY - 2, floorY, 0);                               // undercarriage skids
  }
  else if (kind === 'speeder') {
    g.fillBox(bx, bz, wide, len, floorY, floorY + 1, col);                                       // the deck
    g.part('3039', col, bx, bz, floorY + 1, 0, 2, 2, BRICK);                                     // the nose: a 2×2 slope
    g.part('3829c01', 0, bx, bz + 2, floorY + 1, 0, 2, 1, 1);                                    // handlebars
    g.fillBox(bx, bz + 3, wide, 1, floorY + 1, floorY + 2, 0);                                   // the seat
    for (let zz = bz + 4; zz < bz + len - 2; zz++) g.fillBox(bx, zz, wide, 1, floorY + 1, floorY + 1 + BRICK, col);   // the engine block
    g.part('3040b', col, bx, bz + len - 2, floorY + 1, 2, 1, 2, BRICK); g.part('3040b', col, bx + 1, bz + len - 2, floorY + 1, 2, 1, 2, BRICK);   // rear fins
    g.fillBox(bx, bz + 1, wide, len - 2, floorY - 2, floorY, 0);                                 // a dark skid underneath, so it hovers
  } else if (kind === 'board') { g.fillBox(bx, bz, wide, len, floorY, floorY + 1, col); g.fillBox(bx, bz, wide, 1, floorY + 1, floorY + 2, col); }   // a skateboard: a plate deck on small wheels, a kick at the tail
  else {   // car, truck and bus: a two-plate chassis on real wheels under mudguards, a bonnet, a windscreen, a cabin with a roof
    const arches = [bz + 1, bz + len - 3], isArch = zz => arches.some(a => zz === a || zz === a + 1), body = floorY + 2;   // the axles sit two studs from each end
    for (let zz = bz - 1; zz < bz + len; zz++) if (!isArch(zz)) g.fillBox(bx, zz, wide, 1, floorY, floorY + 2, col);      // the chassis, one stud further forward for the bumper
    for (const a of arches) g.part('3788', col, bx, a, floorY, 0, wide, 2, 2);                                              // mudguards over the wheels
    g.part('3062b', 46, bx, bz - 1, body, 0, 1, 1, BRICK); g.part('3062b', 46, bx + wide - 1, bz - 1, body, 0, 1, 1, BRICK);   // headlights
    g.fillBox(bx + 1, bz - 1, wide - 2, 1, body, body + 1, 0);                                                              // the bumper
    if (kind === 'bus') {
      g.part('3823', 47, bx, bz, body, 0, 4, 2, 2 * BRICK); g.fillBox(bx, bz, wide, 2, body + 2 * BRICK, body + 3 * BRICK, col);   // a windscreen with a brow above it
      for (let zz = bz + 2; zz < bz + len - 1; zz++) { const k = (zz - bz - 2) % 3, win = k === 1 && zz + 1 < bz + len - 1;   // a pillar, then a window two studs long
        for (const xx of [bx, bx + wide - 1]) { if (win) g.part('3854', 47, xx, zz, body, 1, 1, 2, 3 * BRICK); else if (k === 0) g.fillBox(xx, zz, 1, 1, body, body + 3 * BRICK, col); } }
      g.fillBox(bx, bz + len - 1, wide, 1, body, body + 3 * BRICK, col);                                                  // the back wall
      g.fillBox(bx, bz, wide, len, body + 3 * BRICK, body + 3 * BRICK + 1, col);                                            // the roof
      g.part('3829c01', 0, bx + 1, bz + 2, body, 0, 2, 1, 1);                                                               // the driver's wheel
      for (let zz = bz + 4; zz < bz + len - 2; zz += 2) g.fillBox(bx + 1, zz, wide - 2, 1, body, body + 1, 71);          // seats
    } else {
      for (let xx = bx; xx < bx + wide; xx++) g.part('3040b', col, xx, bz, body, 0, 1, 2, BRICK);                            // the bonnet slopes down to the front
      g.part('3823', 47, bx, bz + 2, body, 0, 4, 2, 2 * BRICK);                                                             // windscreen (2 × 4 × 2)
      const cab = kind === 'truck' ? bz + 5 : bz + len - 1;                                                                 // where the cabin ends: a truck's bed, a car's boot
      for (let zz = bz + 4; zz < cab; zz++) { g.fillBox(bx, zz, 1, 1, body, body + BRICK, col); g.fillBox(bx + wide - 1, zz, 1, 1, body, body + BRICK, col); }   // the cabin's sides, waist high
      g.part('3829c01', 0, bx + 1, bz + 4, body, 0, 2, 1, 1);                                                               // the wheel
      if (cab > bz + 5) g.fillBox(bx + 1, bz + 5, wide - 2, 1, body, body + 1, 0);                                          // a seat behind it
      g.part('3005', col, bx, cab - 1, body + BRICK, 0, 1, 1, BRICK); g.part('3005', col, bx + wide - 1, cab - 1, body + BRICK, 0, 1, 1, BRICK);   // rear pillars
      g.fillBox(bx, bz + 2, wide, cab - bz - 2, body + 2 * BRICK, body + 2 * BRICK + 1, col);                              // the roof, from the windscreen back to the pillars
      if (kind === 'truck') {
        g.fillBox(bx, cab, wide, len - 5, body, body + 1, 71);                                                              // the bed
        if (len - 5 >= 4) { g.part('3185', 71, bx, cab, body + 1, 1, 1, 4, 2 * BRICK); g.part('3185', 71, bx + wide - 1, cab, body + 1, 1, 1, 4, 2 * BRICK); }   // fence rails
        g.fillBox(bx, bz + len - 1, wide, 1, body + 1, body + 1 + BRICK, 71);                                               // the tailgate
      } else {
        g.fillBox(bx, bz + len - 1, wide, 1, body, body + BRICK, col);                                                      // the boot
        g.part('3062b', 36, bx, bz + len - 1, body + BRICK, 0, 1, 1, BRICK); g.part('3062b', 36, bx + wide - 1, bz + len - 1, body + BRICK, 0, 1, 1, BRICK);   // tail lights
      }
    }
  }
  const pieces = tile(g, { bond: true }), report = { floating: 0 };
  for (const p of pieces) L.push(pieceLine(p, 0, 0, 0));
  for (const p of g.parts) L.push(pieceLine(p, 0, 0, 0));
  const subs = [];
  if (kind === 'car' || kind === 'truck' || kind === 'bus' || kind === 'board') {              // wheels: a 2 × 2 plate with pins under each axle; each rim and tyre a sub-model on its pin, so it can spin and steer (a board: bare rims, close in)
    const B = kind === 'board', ax = B ? 20 : 40, wx = B ? 22 : 30, wy = B ? -10 : -18, py = B ? -14 : -23;
    for (const [az, fr] of [[zf + ax, 'f'], [zb - ax, 'r']]) { L.push(line(0, 0, py, az, 0, '4600')); for (const [sx, lr] of [[-wx, 'l'], [wx, 'r']]) { const nm = `wheel-${fr}${lr}.ldr`; L.push(`1 16 ${sx} ${wy} ${r4(az)} 1 0 0 0 1 0 0 0 1 ${nm}`); subs.push([`0 FILE ${nm}`, '0 !LDRAW_ORG Unofficial_Model', line(B ? 0 : 71, 0, 0, 0, 1, '4624'), ...(B ? [] : [line(0, 0, 0, 0, 1, '3641')])].join('\n')); } }
  }
  const mpd = [['0 FILE vehicle.ldr', '0 !LDRAW_ORG Unofficial_Model', ...L].join('\n'), ...subs].join('\n');
  return { mpd, w: kind === 'plane' ? wide + 8 : wide, d: len, hp: 12 };
}

/** An Imperial walker as sub-models, so its legs can swing: body.ldr, head.ldr and leg-*.ldr, each with its origin at its joint.
    atat: a body 8 × 20 studs on four 2 × 2 legs 22 bricks tall with plate feet, a neck and a head with chin guns (16 m).
    atst: a 6 × 6 head with chin and cheek guns on two legs 12 bricks tall (8 m). Grey 71, joints and guns 72. */
function walkerMPD(o) {
  const kind = String(o.kind || 'atat').toLowerCase() === 'atst' ? 'atst' : 'atat', col = colOf(o.col, 71), dark = 72;
  const legH = kind === 'atat' ? 22 * BRICK : 12 * BRICK, hip = legH + 1;                    // plates from the sole to the hip (a plate foot under the column)
  const file = (name, lines) => [`0 FILE ${name}`, '0 !LDRAW_ORG Unofficial_Model', ...lines].join('\n');
  const partLines = (g, ay) => { const out = []; for (const p of tile(g, { bond: true })) out.push(pieceLine(p, 0, ay, 0)); for (const p of g.parts) out.push(pieceLine(p, 0, ay, 0)); return out; };
  const leg = new Grid(); leg.part('3031', dark, -2, -2, 0, 0, 4, 4, 1); leg.fillBox(-1, -1, 2, 2, 1, hip, col); leg.fillBox(-1, -1, 2, 2, hip - BRICK, hip, dark);   // a plate foot, a column, a dark hip
  const legText = file('leg.ldr', partLines(leg, hip * PLATE));                                // origin at the hip: rotation.x swings it
  const main = ['0 FILE walker.ldr', '0 !LDRAW_ORG Unofficial_Model'], subs = [];
  const at = (name, x, yPlates, z) => `1 16 ${r4(x * STUD)} ${r4(-yPlates * PLATE)} ${r4(z * STUD)} 1 0 0 0 1 0 0 0 1 ${name}`;
  let w, d, hp;
  if (kind === 'atat') {
    const body = new Grid(); body.fillBox(-4, -10, 8, 20, 0, 4 * BRICK, col); body.fillBox(-4, -10, 8, 20, 4 * BRICK, 4 * BRICK + 1, dark);   // the hull, a dark deck on top
    body.fillBox(-1, -13, 2, 3, 2 * BRICK, 4 * BRICK, dark);                                     // the neck, forward from the hull's top
    const head = new Grid(); head.fillBox(-2, -3, 4, 6, 0, 2 * BRICK, col); head.part('3037', col, -2, -4, BRICK, 0, 4, 2, BRICK);   // the head, a slope at its brow
    head.part('3062b', dark, -2, -5, 0, 0, 1, 1, BRICK); head.part('3062b', dark, 1, -5, 0, 0, 1, 1, BRICK);   // chin guns
    subs.push(file('body.ldr', partLines(body, 0)), file('head.ldr', partLines(head, 0)));
    main.push(at('body.ldr', 0, hip, 0), at('head.ldr', 0, hip + 2 * BRICK, -16));
    for (const [nm, x, z] of [['leg-fl.ldr', -2, -8], ['leg-fr.ldr', 2, -8], ['leg-rl.ldr', -2, 7], ['leg-rr.ldr', 2, 7]]) { main.push(at(nm, x, hip, z)); subs.push(legText.replace('0 FILE leg.ldr', '0 FILE ' + nm)); }
    w = 8; d = 32; hp = hip + 4 * BRICK + 1;
  } else {
    const head = new Grid(); head.fillBox(-3, -3, 6, 6, 0, 3 * BRICK, col); head.fillBox(-3, -3, 6, 6, 3 * BRICK, 3 * BRICK + 1, dark);
    head.part('3062b', dark, -2, -4, 0, 0, 1, 1, BRICK); head.part('3062b', dark, 1, -4, 0, 0, 1, 1, BRICK);      // chin guns
    head.part('3062b', dark, -4, -1, BRICK, 0, 1, 1, BRICK); head.part('3062b', dark, 3, -1, BRICK, 0, 1, 1, BRICK);   // cheek guns
    subs.push(file('head.ldr', partLines(head, 0)));
    main.push(at('head.ldr', 0, hip, 0));
    for (const [nm, x] of [['leg-l.ldr', -2], ['leg-r.ldr', 2]]) { main.push(at(nm, x, hip, 0)); subs.push(legText.replace('0 FILE leg.ldr', '0 FILE ' + nm)); }
    w = 8; d = 10; hp = hip + 3 * BRICK + 1;
  }
  return { mpd: [main.join('\n'), ...subs].join('\n'), w, d, hp };
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
    const cells = []; for (const [k, c] of g.cells) { const [x, yy, z] = k.split(',').map(Number); if (yy === y && !c.r && !used.has(k)) cells.push([x, z, c.col, c.k, c.op]); }
    cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const course = Math.floor(y / BRICK), shift = course & 1;                      // running bond: the long bricks start two studs over on every other course
    for (const pass of [0, 1]) for (const [x, z, col, kind, op] of cells) {
      if (used.has(g.key(x, y, z)) || kind === 'p') continue;
      let done = false;
      for (const [part, nw, nd] of BRICKS) for (const rot of [0, 1]) {
        const w = rot ? nd : nw, d = rot ? nw : nd;
        if (pass === 0 && opts.bond !== false && w >= 4 && ((x + shift * 2) % 4)) continue;   // first pass: only well-bonded long bricks
        if (pass === 0 && opts.bond !== false && d >= 4 && ((z + shift * 2) % 4)) continue;
        if (!fits(x, y, z, w, d, BRICK, col, kind)) continue;
        take(x, y, z, w, d, BRICK); out.push({ part, col, x, y, z, rot, w, d, plate: false, op }); done = true; break;
      }
      if (done) continue;
    }
    for (const [x, z, col, kind, op] of cells) {                                      // whatever is left on this layer becomes plates
      if (used.has(g.key(x, y, z))) continue;
      for (const [part, nw, nd] of PLATES) { let done = false; for (const rot of [0, 1]) { const w = rot ? nd : nw, d = rot ? nw : nd; if (!fits(x, y, z, w, d, 1, col, kind)) continue; take(x, y, z, w, d, 1); out.push({ part, col, x, y, z, rot, w, d, plate: true, op }); done = true; break; } if (done) break; }
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
  for (const p of [...result.pieces, ...result.parts]) { const b = box(p.part, p.rot); rows.push([`${prefix}-${++n}`, p.part, p.col, ax + p.x * STUD - b[0], ay + p.y * PLATE, az + p.z * STUD - b[2], p.rot & 3, p.op == null ? -1 : p.op]); }
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
/* An op moved into a group's frame: shifted by the group's origin and turned k quarter turns about it ((x, z) → (z, −x) per turn, the draft's own turn). Rect ops turn as rects, cell ops as cells, facings and part rotations turn with them. */
const RECT = new Set(['box', 'slab', 'floor', 'cut', 'band', 'roof']), CELL = new Set(['door', 'window', 'arch', 'stairs', 'column', 'minifig', 'vehicle', 'walker', 'part', 'mpd', 'pillar']), CENTRE = new Set(['tower', 'cylinder', 'tree']);
const turnRect = (x, z, w, d, k) => { for (let j = 0; j < k; j++) { const nx = z, nz = -x - w; x = nx; z = nz; const t = w; w = d; d = t; } return [x, z, w, d]; };
const turnPoint = (x, z, k) => { for (let j = 0; j < k; j++) { const nx = z; z = -x; x = nx; } return [x, z]; };
const FACES = 'nesw';
function placeIn(o, gx, gz, gy, k) {
  if (!o || typeof o !== 'object') return o; if (o.args || o.object || o.params) o = { ...o, ...(o.args || o.object || o.params) };
  const name = String(o.op || o.type || o.kind || '').toLowerCase(), out = { ...o }; k &= 3;
  if (name === 'group') { const [x, z] = turnPoint(I(o.x), I(o.z), k); out.x = x + gx; out.z = z + gz; out.y = I(o.y) + gy; out.turn = (I(o.turn) + k) & 3; return out; }
  if (name === 'wall' || name === 'fence') {
    const a = o.from || [I(o.x), I(o.z)], b = o.to || [I(o.x) + I(o.len, 4), I(o.z)];
    const pa = turnPoint(I(a[0]), I(a[1]), k), pb = turnPoint(I(b[0]), I(b[1]), k); out.from = [pa[0] + gx, pa[1] + gz]; out.to = [pb[0] + gx, pb[1] + gz]; delete out.x; delete out.z; delete out.len;
  } else if (RECT.has(name)) { const [x, z, w, d] = turnRect(I(o.x), I(o.z), Math.max(1, I(o.w, 4)), Math.max(1, I(o.d, 4)), k); out.x = x + gx; out.z = z + gz; out.w = w; out.d = d; }
  else if (CENTRE.has(name)) { const [x, z] = turnPoint(Number(o.x) || 0, Number(o.z) || 0, k); out.x = x + gx; out.z = z + gz; }
  else if (CELL.has(name)) { const [x, z] = turnRect(I(o.x), I(o.z), 1, 1, k); out.x = x + gx; out.z = z + gz; if (o.facing != null) { const f = FACE[String(o.facing).toLowerCase()[0]]; if (f != null) out.facing = FACES[(f - k + 4) & 3]; } if (name === 'part') out.rot = (I(o.rot) - k + 4) & 3; }
  else { out.x = I(o.x) + gx; out.z = I(o.z) + gz; }
  if (name !== 'stairs' || o.y != null) out.y = I(o.y, name === 'window' ? 1 : 0) + gy; else out.y = gy;
  return out;
}
/** Every op with the groups opened, for words and counts. */
function flatOps(ops, depth = 0) { const out = []; for (const o of ops || []) { if (!o) continue; const name = String(o.op || o.type || '').toLowerCase(); if (name === 'group' && depth < 4) out.push(...flatOps(Array.isArray(o.ops) ? o.ops : [], depth + 1)); else out.push(o); } return out; }
/** The plan against the build: each planned part should stand as a group of about its planned size; a part that left no pieces vanished. */
function checkPlan(plan, res) {
  const notes = []; const parts = plan && Array.isArray(plan.parts) ? plan.parts : []; if (!parts.length || !res) return notes;
  const groups = res.report.groups || [], all = [...res.pieces, ...res.parts];
  for (const pt of parts) {
    const nm = String(pt.name || '').trim().toLowerCase(); if (!nm) continue;
    const grp = groups.find(g => g.name.toLowerCase() === nm); if (!grp) { notes.push(`part "${pt.name}" has no group`); continue; }
    const mine = all.filter(p => p.op === grp.i), props = res.props.filter(p => p.op === grp.i);
    if (!mine.length && !props.length) { notes.push(`part "${pt.name}" vanished: its group built nothing`); continue; }
    const size = Array.isArray(pt.size) ? pt.size.map(n => I(n)) : null; if (!size || !mine.length) continue;
    const w = Math.max(...mine.map(p => p.x + p.w)) - Math.min(...mine.map(p => p.x)), d = Math.max(...mine.map(p => p.z + p.d)) - Math.min(...mine.map(p => p.z)), h = Math.ceil((Math.max(...mine.map(p => p.y + (p.plate ? 1 : 3))) - Math.min(...mine.map(p => p.y))) / 3);
    const off = (a, b) => b > 0 && Math.abs(a - b) > Math.max(2, 0.4 * b);
    if (off(w, size[0]) || off(d, size[1]) || off(h, size[2])) notes.push(`part "${pt.name}" planned ${size[0]}×${size[1]}×${size[2]}, built ${w}×${d}×${h}`);
  }
  return notes;
}
function compile(program, opts = {}) {
  const g = new Grid(), report = { ops: 0, unknown: [], errors: [], floating: 0, bricks: 0, plates: 0, parts: 0, props: 0, groups: [], vanished: [] };
  const ops = Array.isArray(program) ? program : (program && Array.isArray(program.ops)) ? program.ops : [];
  /* one op: a group runs its children at its offset and turn with the group's own index on every piece, so the code panel folds it and a tap lights the whole subassembly */
  const run = (o, i, depth) => {
    if (o && (o.args || o.object || o.params)) o = { ...o, ...(o.args || o.object || o.params) };   // models sometimes nest the fields; take them either way
    const name = o && String(o.op || o.type || o.kind || '').toLowerCase();
    if (name === 'group') {
      if (depth > 3) { report.errors.push({ i, op: name, error: 'groups nest too deep' }); return; }
      const kids = Array.isArray(o.ops) ? o.ops : [], gx = I(o.x), gz = I(o.z), gy = I(o.y), k = I(o.turn) & 3, c0 = g.cells.size, p0 = g.parts.length, q0 = g.props.length;
      g.op = i; for (const c of kids.slice(0, 200)) run(placeIn(c, gx, gz, gy, k), i, depth + 1);
      const grp = { i, name: String(o.name || `group ${i + 1}`).slice(0, 40), ops: kids.length, planned: Array.isArray(o.size) ? o.size.slice(0, 3).map(n => I(n)) : null, cells: g.cells.size - c0, parts: g.parts.length - p0, props: g.props.length - q0 };
      if (!depth) { report.groups.push(grp); if (!grp.cells && !grp.parts && !grp.props) report.vanished.push(grp.name); } report.ops++;   // the panel folds the top groups; an inner one is part of its outer
      return;
    }
    const fn = OPS[name];
    if (!fn) { report.unknown.push({ i, op: name || '?' }); return; }
    const n0 = g.props.length; if (!depth) g.op = i;
    try { fn(g, o); report.ops++; } catch (e) { report.errors.push({ i, op: name, error: e.message }); }
    for (let k = n0; k < g.props.length; k++) { g.props[k].src = { ...o, op: name }; g.props[k].op = i; }   // a prop remembers the op that made it, so a read build can say it again
  };
  ops.slice(0, opts.maxOps || 600).forEach((o, i) => run(o, i, 0));
  let pieces = tile(g, opts);
  const s = support(g, pieces); pieces = s.pieces; report.floating = s.dropped; report.dropped = s.droppedList;
  for (const p of pieces) if (p.plate) report.plates++; else report.bricks++;
  report.parts = g.parts.length; report.props = g.props.length; report.pieces = pieces.length + g.parts.length; report.blocked = g.blocked || 0;
  const ext = g.cells.size ? { x0: g.min[0], z0: g.min[1], x1: g.max[0] + 1, z1: g.max[1] + 1 } : { x0: 0, z0: 0, x1: 0, z1: 0 };
  return { name: (program && program.name) || 'build', pieces, parts: g.parts, props: g.props, report, extent: ext, maxPlate: g.maxY };
}

/* ───────────────────────── build → words ───────────────────────── */
const PLAIN = new Set([...BRICKS.map(b => b[0]), ...PLATES.map(p => p[0]), '3002', '3958', '3034', '3795', '3021', '3710']);
const NAMES = {}; for (const [n, c] of Object.entries(COLOURS)) if (!(c in NAMES)) NAMES[c] = n.replace(/^darkgrey$/, 'dark grey').replace(/^darktan$/, 'dark tan').replace(/^trans/, 'trans-');
const PART_NAMES = { '3039': '2×2 slope', '3040b': '1×2 slope', '3665a': 'inverted slope', '3298': '2×3 slope', '3660': 'inverted 2×2 slope', '3068b': '2×2 tile', '87079': '2×4 tile', '3070b': '1×1 tile', '3941': '2×2 round brick', '3062b': '1×1 round brick', '4070': 'headlight brick', '3823': 'windscreen', '4600': 'wheel plate', '4624': 'rim', '3641': 'tyre', '3829c01': 'steering wheel', '2453b': 'column', '3185': 'fence', '4589': 'cone', '3455': 'arch', '60592': 'window', '60623': 'door' };
const colName = c => NAMES[c] || ('colour ' + c);
/** Read pieces (Build rows [id, part, col, x, y, z, rot] in LDU, y up) and props ({x, y, z, yaw, src}) back into a program. Lossy on purpose: roofs come back as slope parts. */
function decompile(rows, props = [], opts = {}) {
  const items = [];
  for (const r of rows) { const part = String(r[1]), rot = (r[6] | 0) & 3, b = box(part, rot), f = foot(part, rot); if (!f) continue; items.push({ part, col: r[2] | 0, x: Math.round((r[3] + b[0]) / STUD), y: Math.round(r[4] / PLATE), z: Math.round((r[5] + b[2]) / STUD), rot, w: f[0], d: f[1], hp: Math.max(1, Math.round((DIMS[part] ? DIMS[part][4] : 24) / PLATE)) }); }
  const ps = props.map(p => { const src = p.src && typeof p.src === 'object' ? p.src : null; const kind = src ? String(src.op || src.kind || 'mpd') : 'mpd'; const w = kind === 'minifig' ? 2 : kind === 'vehicle' ? (String(src.kind || 'car') === 'speeder' ? 2 : 4) : clamp(I(src && src.w, 4), 1, 64), d = kind === 'minifig' ? 2 : kind === 'vehicle' ? clamp(I(src.len, String(src.kind || 'car') === 'truck' ? 10 : 6), 4, 16) : clamp(I(src && src.d, 4), 1, 64); return { src, kind, w, d, x: Math.round(p.x / STUD - w / 2), z: Math.round(p.z / STUD - d / 2), y: Math.round(p.y / PLATE), yaw: (p.yaw | 0) & 3, mpd: p.mpd }; });
  if (!items.length && !ps.length) return { name: opts.name || 'nothing', ops: [], anchor: { x: 0, y: 0, z: 0 } };
  const ax = Math.min(...items.map(i => i.x), ...ps.map(p => p.x)), az = Math.min(...items.map(i => i.z), ...ps.map(p => p.z)), ay = Math.min(...items.map(i => i.y), ...ps.map(p => p.y));
  for (const i of items) { i.x -= ax; i.z -= az; i.y -= ay; } for (const p of ps) { p.x -= ax; p.z -= az; p.y -= ay; }
  const cells = new Map(), key = (x, y, z) => x + ',' + y + ',' + z, specials = [];
  for (const i of items) { if (PLAIN.has(i.part)) { for (let yy = i.y; yy < i.y + i.hp; yy++) for (let xx = i.x; xx < i.x + i.w; xx++) for (let zz = i.z; zz < i.z + i.d; zz++) cells.set(key(xx, yy, zz), i.col); } else specials.push(i); }
  const has = (x, y, z, col) => cells.get(key(x, y, z)) === col;
  const used = new Set(), boxes = [];
  const keys = [...cells.keys()].map(k => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
  for (const [x, y, z] of keys) {
    if (used.has(key(x, y, z))) continue; const col = cells.get(key(x, y, z));
    let w = 1; while (has(x + w, y, z, col) && !used.has(key(x + w, y, z))) w++;
    let d = 1; for (; ; d++) { let ok = true; for (let xx = x; xx < x + w; xx++) if (!has(xx, y, z + d, col) || used.has(key(xx, y, z + d))) { ok = false; break; } if (!ok) break; }
    let h = 1; for (; ; h++) { let ok = true; for (let xx = x; xx < x + w && ok; xx++) for (let zz = z; zz < z + d; zz++) if (!has(xx, y + h, zz, col) || used.has(key(xx, y + h, zz))) { ok = false; break; } if (!ok) break; }
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) for (let zz = z; zz < z + d; zz++) used.add(key(xx, yy, zz));
    boxes.push({ x, y, z, w, d, h, col });
  }
  /* four one-stud walls around an empty middle become one hollow box (the greedy cut may give the side walls the corner cells or not) */
  const ops = [], taken = new Set();
  for (const T of boxes) {
    if (taken.has(T) || T.d !== 1 || T.w < 3) continue;
    const same = b => !taken.has(b) && b !== T && b.y === T.y && b.h === T.h && b.col === T.col;
    const L = boxes.find(b => same(b) && b.w === 1 && b.x === T.x && b.z === T.z + 1), R = L && boxes.find(b => same(b) && b.w === 1 && b.x === T.x + T.w - 1 && b.z === T.z + 1 && b.d === L.d);
    if (!L || !R) continue;
    let B = boxes.find(b => same(b) && b.d === 1 && b.x === T.x && b.w === T.w && b.z === T.z + L.d + 1), D = L.d + 2;
    if (!B) { B = boxes.find(b => same(b) && b.d === 1 && b.x === T.x + 1 && b.w === T.w - 2 && b.z === T.z + L.d); D = L.d + 1; }
    if (!B || D < 3) continue;
    taken.add(T); taken.add(B); taken.add(L); taken.add(R); const H = { x: T.x, y: T.y, z: T.z, w: T.w, d: D, h: T.h, col: T.col, hollow: true }; boxes.push(H); taken.add(H); ops.push(...boxOp(H));
  }
  for (const b of boxes) if (!taken.has(b)) ops.push(...boxOp(b));
  ops.sort((a, b) => (a.y + (a.plateOffset || 0) / 3) - (b.y + (b.plateOffset || 0) / 3) || a.z - b.z || a.x - b.x);
  const FACES = ['n', 'e', 's', 'w'];
  for (const i of specials) {
    const yb = Math.floor(i.y / 3), pl = i.y % 3;
    if (i.part === '60623' && !pl) ops.push({ op: 'door', x: i.x, z: i.z, y: yb, facing: i.rot & 1 ? 'e' : 's', col: i.col });
    else if (i.part === '60592' && !pl) ops.push({ op: 'window', x: i.x, z: i.z, y: yb, facing: i.rot & 1 ? 'e' : 's', col: i.col });
    else if (i.part === '3455' && !pl && i.y >= 3) { let y0 = i.y; const ex = i.rot & 1 ? i.x : i.x + 5, ez = i.rot & 1 ? i.z + 5 : i.z; while (y0 > 0 && cells.has(key(i.x, y0 - 1, i.z)) && cells.has(key(ex, y0 - 1, ez))) y0--; if ((i.y - y0) % 3 === 0 && i.y > y0) ops.push({ op: 'arch', x: i.x, z: i.z, y: y0 / 3, h: (i.y - y0) / 3, facing: i.rot & 1 ? 'e' : 's', col: i.col }); else ops.push(partOp(i)); }
    else ops.push(partOp(i));
  }
  for (const p of ps) {
    const facing = FACES[(2 - p.yaw + 4) & 3];
    if (p.src && p.kind !== 'mpd') ops.push({ ...p.src, op: p.kind, x: p.x, z: p.z, y: Math.round(p.y / 3), facing });
    else ops.push({ op: 'mpd', name: (p.src && p.src.name) || 'model', x: p.x, z: p.z, y: Math.round(p.y / 3), facing, w: p.w, d: p.d, text: (p.src && p.src.text) || p.mpd || '' });
  }
  return { name: opts.name || 'what stands here', ops, anchor: { x: ax * STUD, y: ay * PLATE, z: az * STUD } };
}
/** A cell box as ops: whole bricks where the box is brick-aligned, plates for the rest (a slab holds at most 12 plates). */
function boxOp(b) {
  const out = []; let y = b.y; const end = b.y + b.h;
  const slab = (x, z, w, d, y0, n) => out.push({ op: 'slab', x, z, w, d, y: Math.floor(y0 / 3), plateOffset: y0 % 3, plates: n, col: b.col });
  while (y < end) {
    if (y % 3 === 0 && end - y >= 3) { const h = Math.floor((end - y) / 3) * 3, o = { op: 'box', x: b.x, z: b.z, w: b.w, d: b.d, y: y / 3, h: h / 3, col: b.col }; if (b.hollow) o.hollow = true; out.push(o); y += h; continue; }
    const n = Math.min(end - y, y % 3 ? 3 - y % 3 : end - y, 12);
    if (b.hollow) { slab(b.x, b.z, b.w, 1, y, n); slab(b.x, b.z + b.d - 1, b.w, 1, y, n); slab(b.x, b.z + 1, 1, b.d - 2, y, n); slab(b.x + b.w - 1, b.z + 1, 1, b.d - 2, y, n); } else slab(b.x, b.z, b.w, b.d, y, n);
    y += n;
  }
  return out;
}
function partOp(i) { const o = { op: 'part', part: i.part, col: i.col, x: i.x, z: i.z, y: Math.floor(i.y / 3), rot: i.rot }; if (i.y % 3) o.plate = i.y % 3; return o; }
/** The ops of a program that is still being written: the name if it is there, and every op object that is already complete. */
function partialProgram(text) {
  text = String(text || ''); const out = { name: '', ops: [], complete: false };
  const nm = text.match(/"name"\s*:\s*"((?:[^"\\]|\\.)*)"/); if (nm) out.name = nm[1];
  const at = text.search(/"ops"\s*:\s*\[/); if (at < 0) return out;
  let i = text.indexOf('[', at) + 1, depth = 0, start = -1, inStr = false, esc = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { try { out.ops.push(JSON.parse(text.slice(start, i + 1))); } catch (e) { } start = -1; } }
    else if (c === ']' && depth === 0) { out.complete = true; break; }
  }
  return out;
}
/** One op in words. */
function captionOp(o) { if (o && String(o.op || o.type || '').toLowerCase() === 'group') { const n = flatOps(Array.isArray(o.ops) ? o.ops : []).length; return `${String(o.name || 'a group')}: ${n} op${n === 1 ? '' : 's'}`; } const c = caption({ name: 'x', ops: [o] }); return c.replace(/^x: /, ''); }
/** Deterministic words for a program: what a reader would say it is. */
function caption(program) {
  const ops = flatOps((program && program.ops) || []), said = new Map(), add = t => said.set(t, (said.get(t) || 0) + 1);
  for (let o of ops) {
    if (!o) continue; if (o.args || o.object || o.params) o = { ...o, ...(o.args || o.object || o.params) };
    const op = String(o.op || o.type || '').toLowerCase(), c = colName(colOf(o.col, op === 'roof' ? 4 : op === 'door' ? 70 : op === 'window' ? 15 : 71));
    switch (op) {
      case 'box': add(`a ${c} ${o.hollow ? 'hollow ' : ''}box ${I(o.w, 4)}×${I(o.d, 4)} studs, ${I(o.h, 3)} brick${I(o.h, 3) === 1 ? '' : 's'} tall${I(o.y) ? ` at height ${I(o.y)}` : ''}`); break;
      case 'wall': { const a = o.from || [I(o.x), I(o.z)], b = o.to || [I(o.x) + I(o.len, 4), I(o.z)]; add(`a ${c} wall ${Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])))} studs long, ${I(o.h, 3)} bricks tall`); break; }
      case 'slab': case 'floor': add(`a ${c} floor of plates ${I(o.w, 4)}×${I(o.d, 4)}${I(o.y) ? ` at height ${I(o.y)}` : ''}`); break;
      case 'roof': add(`a ${c} ${String(o.style || 'pyramid')} roof ${I(o.w, 4)}×${I(o.d, 4)}`); break;
      case 'tower': case 'cylinder': add(`a ${c} ${o.round === false ? 'square ' : 'round '}tower, radius ${Number(o.r) || 2}, ${I(o.h, 6)} bricks tall${o.crenels === false ? '' : ' with crenels'}`); break;
      case 'pillar': add(`a ${c} pillar ${I(o.h, 6)} bricks tall`); break;
      case 'door': add(`a ${c} door facing ${String(o.facing || 's')[0]}`); break;
      case 'window': add(`a window facing ${String(o.facing || 's')[0]}`); break;
      case 'arch': add(`a ${c} arch ${I(o.h, 2)} bricks high`); break;
      case 'stairs': add(`${c} stairs of ${I(o.steps, 4)} steps rising ${String(o.facing || 'e')[0]}`); break;
      case 'cut': add(`an opening cut ${I(o.w, 1)}×${I(o.d, 1)}`); break;
      case 'band': add(`a ${c} band`); break; case 'column': add(`a ${c} column ${I(o.h, 5)} bricks tall`); break; case 'fence': add(`a ${c} fence`); break; case 'tree': add(`a tree ${I(o.h, 3)} bricks tall`); break;
      case 'part': add(`a ${c} ${PART_NAMES[String(o.part)] || 'part ' + String(o.part)}`); break;
      case 'minifig': { const as = String(o.as || (o.look && o.look.as) || 'citizen'), L = o.look || {}; add(`a ${as}${L.tool ? ` with a ${L.tool}` : ''}${L.hat ? ` in a ${L.hat}` : ''} facing ${String(o.facing || 's')[0]}`); break; }
      case 'vehicle': add(`a ${c} ${String(o.kind || 'car')} ${I(o.len, 6)} studs long facing ${String(o.facing || 'e')[0]}`); break;
      case 'walker': add(`an ${String(o.kind || 'atat').toUpperCase().replace('AT', 'AT-')} walker facing ${String(o.facing || 's')[0]}`); break;
      case 'mpd': add(`a model called ${String(o.name || 'model')}`); break;
      default: add(`something (${op || '?'})`);
    }
  }
  const words = [...said].map(([t, n]) => n > 1 ? `${n} × ${t.replace(/^an? /, '')}` : t);
  return `${(program && program.name) || 'build'}: ${words.join(' · ') || 'nothing yet'}`;
}

/* ───────────────────────── the spec the model reads ───────────────────────── */
const SPEC = `You are a LEGO master builder. You answer ONLY with a JSON object {"name": string, "ops": [...]} — a build program that a compiler turns into real bricks. Units: x east and z south in studs (integers), y up in bricks (1 brick = 3 plates). The build's origin (0,0) is where the player is looking; keep x and z between 0 and 40, keep it grounded (start at y 0 unless stacking on your own ops), at most 80 ops.
Ops (all coordinates are the min corner unless said otherwise):
- {"op":"box","x","z","w","d","y","h","col","hollow":true|false,"thick":1} solid block or hollow shell (walls only, no floor or roof).
- {"op":"wall","from":[x,z],"to":[x,z],"y","h","col","thick":1} a wall along a line (straight or slanted).
- {"op":"slab","x","z","w","d","y","plates":1,"col"} a floor or ceiling of plates at brick height y.
- {"op":"roof","x","z","w","d","y","col","style":"pyramid"|"hip"|"gable"|"flat"} stepped roof with 45° slope bricks, sitting at height y on top of walls; make it one stud wider than the walls on each side.
- {"op":"tower","x","z","r","h","col","round":true,"crenels":true} a round or square tower centred at (x,z) with radius r studs; hollow when r ≥ 3.
- {"op":"door","x","z","y","facing":"n|e|s|w","col"} a 1×4×6 door in a wall that runs east-west (facing n or s) or north-south (facing e or w); x,z is the door's west/north end cell on the wall line.
- {"op":"window","x","z","y","facing"} a 1×2×2 window in a wall, same rules; y is normally 1 or 2.
- {"op":"arch","x","z","y","facing","h":2,"col"} a 6-stud arch with piers.
- {"op":"stairs","x","z","y","steps","facing","w":2,"col"} steps rising toward facing.
- {"op":"cut","x","z","w","d","y","h"} remove a block (make gates, rooms, notches).
- {"op":"band","x","z","w","d","y","h":1,"col"} recolour whatever already stands in that block: stripes on a tower, a sill line, a trim course. Put it after the ops it colours.
- {"op":"column","x","z","y","h":5,"col"} a slender 1×1 column (tall column bricks), for porches and colonnades.
- {"op":"fence","from":[x,z],"to":[x,z],"y","col"} fence panels along a straight line, one every 4 studs.
- {"op":"tree","x","z","h":3,"r":1,"col","trunk"} a tree: a round trunk h bricks tall and a stepped green crown of radius r with a cone on top.
- {"op":"part","part":"3039","col","x","y","z","rot":0-3,"plate":0} one part from: 3001 2x4 brick, 3003 2x2, 3010 1x4, 3004 1x2, 3005 1x1, 3009 1x6, 3008 1x8, 3020 2x4 plate, 3032 4x6 plate, 3039 2x2 slope, 3040b 1x2 slope, 3068b 2x2 tile, 87079 2x4 tile, 3941 2x2 round, 3062b 1x1 round, 3455 1x6 arch, 3823 windscreen, 60592 window, 60623 door, 2453b 1x1x5 column, 3185 fence, 4589 cone.
- {"op":"minifig","x","z","facing","as":"vader|stormtrooper|pilot|luke|citizen|knight|pirate|builder","look":{"hat":"hair|cap|helmet|cowboy|tophat|knight|space|trooper|pilot|vader|pirate|none","hatCol","torso":"plain|stripes|anchor|train|pirate|space|zipper","torsoCol","legs","head","tool":"saber|blaster|sword|shield|spear|axe|broom|cup|radio|none","toolCol"}} a standing figure (2×2 studs).
- {"op":"vehicle","x","z","facing","kind":"car|truck|bus|speeder|boat|plane","len":6,"col"} a vehicle the player can ride (use it whenever the brief asks for something to drive or fly and a kind fits; the player can also turn any build into a ride): cars, trucks and buses drive (4 studs wide, real wheels under mudguards, headlights, a windscreen, a roof), boats float; speeders (2 wide) and planes (2 wide with wings 10 across, a tail fin) fly. len ≥ 6, trucks 10, buses 12, planes 8.
- {"op":"walker","x","z","facing","kind":"atat|atst","col"} an Imperial walker the player can ride: the atat is 8 × 32 studs and 16 m tall on four legs, the atst 8 × 10 on two; legs swing, chin guns fire.
- {"op":"group","name":"left tower","x","z","y":0,"turn":0-3,"size":[w,d,h],"ops":[...]} a named subassembly: its ops are written in the group's own frame (origin 0,0 at the group's x,z; turn is quarter turns clockwise seen from above) and count as one op of the 80. Name every part of a build that has a name of its own (a tower, a wing, the porch) so it can be changed alone; size is the box you mean it to fill, in studs and bricks.
Colours (LDraw codes or names): 0 black, 1 blue, 2 green, 4 red, 14 yellow, 15 white, 19 tan, 25 orange, 28 dark tan, 70 brown, 71 grey, 72 dark grey, 322 azure, 47 trans-clear, 46 trans-yellow, 36 trans-red.
Design rules a LEGO designer follows:
- Proportions: a door is 6 bricks tall, so walls with a door are at least 6 bricks; windows sit at y 1 or 2; a roof begins at the wall top (y = wall y + h); a tower stands about twice the wall height; a house is at least 8×6 studs; a floor between storeys is a slab.
- Colour discipline: two or three colours for the body plus one accent (roof, trims, door). Use band for stripes and sills instead of many small boxes.
- Openings live on wall lines: place the wall or hollow box first, then doors and windows on that same line (same z for a south/north wall, same x for an east/west wall), evenly spaced every 3 studs.
- Details that read as LEGO: crenels on towers, a slab awning over a shop door, a lamp (part 3062b col 46) on a post, fences around yards, trees beside houses, a slab step at a door, columns at a porch.
- Always ground the build; nothing floats. Build bottom-up: base, walls, openings, floors, roofs, trims, then figures and vehicles beside things with facing set toward the viewer (s) when unsure.
- Spend ops where they change the silhouette or meaning. A compact recognisable build beats a huge plain box. Never a prose answer, never markdown: JSON only.`;

const EXAMPLES = [
  { ask: 'a small stone hut with a red roof and a door', program: { name: 'hut', ops: [{ op: 'box', x: 0, z: 0, w: 8, d: 6, y: 0, h: 6, col: 71, hollow: true }, { op: 'door', x: 2, z: 5, y: 0, facing: 's', col: 70 }, { op: 'window', x: 1, z: 0, y: 2, facing: 'n' }, { op: 'window', x: 5, z: 0, y: 2, facing: 'n' }, { op: 'band', x: 0, z: 0, w: 8, d: 6, y: 5, h: 1, col: 72 }, { op: 'roof', x: -1, z: -1, w: 10, d: 8, y: 6, col: 4, style: 'gable' }, { op: 'tree', x: 11, z: 4, h: 3, r: 1 }] } },
  { ask: 'a castle gate with two towers', program: { name: 'gate', ops: [{ op: 'tower', x: 3, z: 3, r: 3, h: 9, col: 72, round: true, crenels: true }, { op: 'tower', x: 17, z: 3, r: 3, h: 9, col: 72, round: true, crenels: true }, { op: 'wall', from: [6, 3], to: [14, 3], y: 0, h: 6, col: 71 }, { op: 'arch', x: 7, z: 3, y: 0, facing: 's', h: 3, col: 71 }, { op: 'slab', x: 6, z: 2, w: 8, d: 3, y: 6, plates: 1, col: 72 }, { op: 'minifig', x: 9, z: 6, facing: 's', as: 'knight' }] } },
  { ask: 'a red race car with a driver', program: { name: 'racer', ops: [{ op: 'vehicle', x: 0, z: 0, facing: 'e', kind: 'car', len: 7, col: 4 }, { op: 'minifig', x: 8, z: 1, facing: 'w', as: 'pilot', look: { hat: 'helmet', hatCol: 15 } }] } },
  { ask: 'a lighthouse with red bands and a lamp room', program: { name: 'lighthouse', ops: [{ op: 'box', x: 0, z: 0, w: 8, d: 8, y: 0, h: 1, col: 72 }, { op: 'tower', x: 4, z: 4, r: 3, h: 11, y: 1, col: 15, round: true, crenels: false }, { op: 'band', x: 0, z: 0, w: 8, d: 8, y: 3, h: 2, col: 4 }, { op: 'band', x: 0, z: 0, w: 8, d: 8, y: 8, h: 2, col: 4 }, { op: 'door', x: 2, z: 6, y: 1, facing: 's', col: 0 }, { op: 'slab', x: 0, z: 0, w: 8, d: 8, y: 12, plates: 3, col: 72 }, { op: 'column', x: 1, z: 1, y: 13, h: 2, col: 0 }, { op: 'column', x: 6, z: 1, y: 13, h: 2, col: 0 }, { op: 'column', x: 1, z: 6, y: 13, h: 2, col: 0 }, { op: 'column', x: 6, z: 6, y: 13, h: 2, col: 0 }, { op: 'part', part: '3941', col: 46, x: 3, z: 3, y: 13, rot: 0 }, { op: 'roof', x: 0, z: 0, w: 8, d: 8, y: 15, col: 4, style: 'pyramid' }, { op: 'fence', from: [-2, 10], to: [10, 10], y: 0, col: 15 }, { op: 'minifig', x: 3, z: 9, facing: 's', as: 'pirate' }] } },
  { ask: 'a small shop with an awning and a sign', program: { name: 'shop', ops: [{ op: 'box', x: 0, z: 0, w: 10, d: 8, y: 0, h: 6, col: 19, hollow: true }, { op: 'door', x: 3, z: 7, y: 0, facing: 's', col: 1 }, { op: 'window', x: 0, z: 7, y: 1, facing: 's' }, { op: 'window', x: 8, z: 7, y: 1, facing: 's' }, { op: 'slab', x: -1, z: 8, w: 12, d: 2, y: 6, plates: 1, col: 4 }, { op: 'band', x: 0, z: 0, w: 10, d: 8, y: 5, h: 1, col: 1 }, { op: 'roof', x: 0, z: 0, w: 10, d: 8, y: 6, col: 72, style: 'flat' }, { op: 'column', x: -1, z: 9, y: 0, h: 6, col: 15 }, { op: 'column', x: 10, z: 9, y: 0, h: 6, col: 15 }, { op: 'vehicle', x: 12, z: 2, facing: 's', kind: 'truck', len: 10, col: 1 }, { op: 'minifig', x: 5, z: 10, facing: 's', as: 'citizen', look: { tool: 'cup' } }] } },
  { ask: 'a stone bridge over a stream', program: { name: 'bridge', ops: [{ op: 'box', x: 0, z: 0, w: 4, d: 6, y: 0, h: 3, col: 72 }, { op: 'box', x: 12, z: 0, w: 4, d: 6, y: 0, h: 3, col: 72 }, { op: 'arch', x: 4, z: 0, y: 0, facing: 's', h: 2, col: 72 }, { op: 'arch', x: 4, z: 5, y: 0, facing: 's', h: 2, col: 72 }, { op: 'slab', x: 0, z: 0, w: 16, d: 6, y: 3, plates: 3, col: 71 }, { op: 'fence', from: [0, 0], to: [16, 0], y: 4, col: 72 }, { op: 'fence', from: [0, 5], to: [16, 5], y: 4, col: 72 }, { op: 'tree', x: 18, z: 3, h: 4, r: 2 }, { op: 'minifig', x: 7, z: 2, facing: 'e', as: 'luke' }] } },
  { ask: 'a small yellow plane to fly', program: { name: 'plane', ops: [{ op: 'vehicle', x: 4, z: 0, facing: 's', kind: 'plane', len: 8, col: 14 }, { op: 'minifig', x: 0, z: 2, facing: 'e', as: 'pilot' }, { op: 'fence', from: [-2, 10], to: [14, 10], y: 0, col: 15 }] } },
];
root.Dsl = { compile, decompile, caption, captionOp, partialProgram, placeIn, flatOps, checkPlan, tile, toRows, toMPD, withHeaders, propYaw, propPlace, box, foot, figureDef, figureMPD, vehicleMPD, walkerMPD, DIMS, BRICKS, PLATES, COLOURS, HATS, TORSOS, TOOLS, FIGS, SPEC, EXAMPLES, STUD, PLATE, BRICK, colOf };
})(typeof window !== 'undefined' ? window : globalThis);

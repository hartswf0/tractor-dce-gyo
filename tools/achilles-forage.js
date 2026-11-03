#!/usr/bin/env node
/**
 * tools/achilles-forage.js — The Shield of Achilles (Iliad XVIII, 478–608)
 * Operative Ekphrasis: From Imagetext to Worldtext (Bolter & Hartsoe)
 *
 * Builds, audits, stages, blocks, and bundles the complete LEGO LDraw world
 * of Homer's Shield of Achilles across its 5 concentric folds and 6 operative zones:
 *   - 1 Master Concentric World Card (ACH-WORLD-SHIELD)
 *   - 12 Scene Rehearsal Cards (ACH-Z01-S01 .. ACH-Z06-S01) with Previs Timelines
 *   - 45 Asset Cards (Locations, Characters, Ensembles, Creatures, Divine Scale, Props, Set Pieces, Environments, Sound)
 *   - Pre-bundled LDraw part packs (achilles/packs/*.json) for zero-latency WebGL rendering
 *   - Hand Butter editable scenes (achilles/butter/*.json)
 *   - Kit & Metallurgy catalog (achilles/kit.json) and Forage Index (achilles/forage.json)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'ldraw');
const OUT = path.join(ROOT, 'achilles');

/* ═══════════════════════════════════════════════════════════════════════════
   1. LDRAW GEOMETRY, PART RESOLVER, AND STUD-JOINT VERIFIER
   ═══════════════════════════════════════════════════════════════════════════ */

const I12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];

function mul(A, B) {
  const [ax, ay, az, a, b, c, d, e, f, g, h, i] = A;
  const [bx, by, bz, A2, B2, C2, D2, E2, F2, G2, H2, I2] = B;
  return [
    ax + a * bx + b * by + c * bz,
    ay + d * bx + e * by + f * bz,
    az + g * bx + h * by + i * bz,
    a * A2 + b * D2 + c * G2, a * B2 + b * E2 + c * H2, a * C2 + b * F2 + c * I2,
    d * A2 + e * D2 + f * G2, d * B2 + e * E2 + f * H2, d * C2 + e * F2 + f * I2,
    g * A2 + h * D2 + i * G2, g * B2 + h * E2 + i * H2, g * C2 + h * F2 + i * I2
  ];
}

const apply = (M, x, y, z) => [
  M[0] + M[3] * x + M[4] * y + M[5] * z,
  M[1] + M[6] * x + M[7] * y + M[8] * z,
  M[2] + M[9] * x + M[10] * y + M[11] * z
];

const T = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const RY = q => {
  const c = [1, 0, -1, 0][q & 3], s = [0, 1, 0, -1][q & 3];
  return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c];
};
const RYa = a => {
  const c = Math.cos(a), s = Math.sin(a);
  return [0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c];
};
const RXa = a => {
  const c = Math.cos(a), s = Math.sin(a);
  return [0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c];
};

const fmt = v => {
  const r = Math.round(v * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toString();
};
const lineOf = r => `1 ${r.col} ${r.m.map(fmt).join(' ')} ${r.part}.dat`;
const norm = s => String(s || '').trim().replace(/\\/g, '/').toLowerCase();

function fileFor(ref) {
  const id = norm(ref).replace(/\.dat$/, '').replace(/^parts\//, '').replace(/^p\//, '');
  const tries = id.startsWith('s/')
    ? [['parts', id]]
    : (id.startsWith('48/') || id.startsWith('8/'))
      ? [['p', id]]
      : [['parts', id], ['p', id], ['parts', 's/' + id]];
  for (const [dir, rel] of tries) {
    const f = path.join(LIB, dir, rel + '.dat');
    if (fs.existsSync(f)) return f;
  }
  return null;
}

const exists = id => !!fileFor(id);

const descCache = new Map();
function describe(id) {
  const k = norm(id).replace(/\.dat$/, '');
  if (descCache.has(k)) return descCache.get(k);
  const f = fileFor(k);
  let d = k;
  if (f) {
    const first = fs.readFileSync(f, 'utf8').split(/\r?\n/, 1)[0] || '';
    d = first.replace(/^0\s*/, '').replace(/^~?/, '').trim();
  }
  descCache.set(k, d);
  return d;
}

const STUD_RE = /^(stud|stud2|stud2a|stud6|stud6a|stud10|stud13|stud15|stud17a|stud-logo\d*|stud2-logo\d*|studa|studel|studline)\.dat$/;
const infoCache = new Map();

function info(ref, depth = 0) {
  const id = norm(ref).replace(/\.dat$/, '');
  if (infoCache.has(id)) return infoCache.get(id);
  const out = { ok: true, missing: [], box: null, studs: [] };
  infoCache.set(id, out);
  const f = fileFor(id);
  if (!f) {
    out.ok = false;
    out.missing.push(id);
    return out;
  }
  const grow = (x, y, z) => {
    const b = out.box;
    if (!b) out.box = [x, y, z, x, y, z];
    else {
      if (x < b[0]) b[0] = x;
      if (y < b[1]) b[1] = y;
      if (z < b[2]) b[2] = z;
      if (x > b[3]) b[3] = x;
      if (y > b[4]) b[4] = y;
      if (z > b[5]) b[5] = z;
    }
  };
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const t = l.trim().split(/\s+/);
    const k = t[0];
    if (k === '1' && t.length >= 15) {
      const M = t.slice(2, 14).map(Number);
      const sub = norm(t.slice(14).join(' '));
      if (STUD_RE.test(path.basename(sub))) {
        out.studs.push([M[0], M[1], M[2]]);
      }
      if (depth < 10) {
        const si = info(sub, depth + 1);
        if (!si.ok) {
          for (const m of si.missing) if (!out.missing.includes(m)) out.missing.push(m);
        }
        if (si.box) {
          const [x0, y0, z0, x1, y1, z1] = si.box;
          for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) {
            const p = apply(M, x, y, z);
            grow(p[0], p[1], p[2]);
          }
        }
        for (const s of si.studs) {
          out.studs.push(apply(M, s[0], s[1], s[2]));
        }
      }
    } else if (k === '3' && t.length >= 11) {
      for (let i = 2; i <= 8; i += 3) grow(+t[i], +t[i + 1], +t[i + 2]);
    } else if (k === '4' && t.length >= 14) {
      for (let i = 2; i <= 11; i += 3) grow(+t[i], +t[i + 1], +t[i + 2]);
    }
  }
  if (!out.box) out.box = [-10, -24, -10, 10, 0, 10];
  return out;
}

function worldBox(r) {
  const inf = info(r.part);
  if (!inf.box) return [-10, -24, -10, 10, 0, 10];
  const [x0, y0, z0, x1, y1, z1] = inf.box;
  let b = null;
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) {
    const [wx, wy, wz] = apply(r.m, x, y, z);
    if (!b) b = [wx, wy, wz, wx, wy, wz];
    else {
      if (wx < b[0]) b[0] = wx;
      if (wy < b[1]) b[1] = wy;
      if (wz < b[2]) b[2] = wz;
      if (wx > b[3]) b[3] = wx;
      if (wy > b[4]) b[4] = wy;
      if (wz > b[5]) b[5] = wz;
    }
  }
  return b;
}

function bounds(rows) {
  let b = null;
  for (const r of rows) {
    const wb = worldBox(r);
    if (!wb) continue;
    if (!b) b = [...wb];
    else {
      if (wb[0] < b[0]) b[0] = wb[0];
      if (wb[1] < b[1]) b[1] = wb[1];
      if (wb[2] < b[2]) b[2] = wb[2];
      if (wb[3] > b[3]) b[3] = wb[3];
      if (wb[4] > b[4]) b[4] = wb[4];
      if (wb[5] > b[5]) b[5] = wb[5];
    }
  }
  return b || [-20, -24, -20, 20, 0, 20];
}

function audit(rows) {
  if (!rows.length) return { pieces: 0, joints: 0, anchored: 0, held: 0, floating: [], floor: 0 };
  const boxes = rows.map(worldBox);
  let floor = -Infinity;
  for (const b of boxes) if (b && b[4] > floor) floor = b[4];

  // Count stud joints and contact graph
  let joints = 0;
  const adj = Array.from({ length: rows.length }, () => []);
  const jointAdj = Array.from({ length: rows.length }, () => []);

  // Spatial bucket by 40 LDU in X,Z for fast neighbor lookup
  const grid = new Map();
  for (let i = 0; i < rows.length; i++) {
    const b = boxes[i];
    if (!b) continue;
    const gx0 = Math.floor(b[0] / 40), gx1 = Math.floor(b[3] / 40);
    const gz0 = Math.floor(b[2] / 40), gz1 = Math.floor(b[5] / 40);
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gz = gz0; gz <= gz1; gz++) {
        const k = gx + ',' + gz;
        let arr = grid.get(k);
        if (!arr) { arr = []; grid.set(k, arr); }
        arr.push(i);
      }
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const b1 = boxes[i];
    if (!b1) continue;
    const inf = info(rows[i].part);
    const studs = inf.studs.map(s => apply(rows[i].m, s[0], s[1], s[2]));
    const gx0 = Math.floor(b1[0] / 40), gx1 = Math.floor(b1[3] / 40);
    const gz0 = Math.floor(b1[2] / 40), gz1 = Math.floor(b1[5] / 40);
    const seen = new Set([i]);
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gz = gz0; gz <= gz1; gz++) {
        const cand = grid.get(gx + ',' + gz);
        if (!cand) continue;
        for (const j of cand) {
          if (seen.has(j)) continue;
          seen.add(j);
          const b2 = boxes[j];
          if (!b2) continue;
          // Check AABB contact (within 4.5 LDU tolerance for clips/hands/pins)
          const ox = Math.min(b1[3], b2[3]) - Math.max(b1[0], b2[0]);
          const oy = Math.min(b1[4], b2[4]) - Math.max(b1[1], b2[1]);
          const oz = Math.min(b1[5], b2[5]) - Math.max(b1[2], b2[2]);
          if (ox >= -4.5 && oy >= -4.5 && oz >= -4.5) {
            adj[i].push(j);
            adj[j].push(i);
          }
          // Check stud joints from i into j's underside
          let ijJoints = 0;
          for (const [sx, sy, sz] of studs) {
            if (sx >= b2[0] - 3 && sx <= b2[3] + 3 && sz >= b2[2] - 3 && sz <= b2[5] + 3 && Math.abs(sy - b2[4]) <= 6) {
              ijJoints++;
            }
          }
          if (ijJoints > 0) {
            joints += ijJoints;
            jointAdj[i].push(j);
            jointAdj[j].push(i);
          }
        }
      }
    }
  }

  // BFS from ground pieces
  const grounded = [];
  for (let i = 0; i < rows.length; i++) {
    if (boxes[i] && boxes[i][4] >= floor - 10) grounded.push(i);
  }
  const visJoint = new Uint8Array(rows.length);
  const qJ = [...grounded];
  for (const g of grounded) visJoint[g] = 1;
  while (qJ.length) {
    const u = qJ.pop();
    for (const v of jointAdj[u]) if (!visJoint[v]) { visJoint[v] = 1; qJ.push(v); }
  }
  const visAll = new Uint8Array(rows.length);
  const qA = [...grounded];
  for (const g of grounded) visAll[g] = 1;
  while (qA.length) {
    const u = qA.pop();
    for (const v of adj[u]) if (!visAll[v]) { visAll[v] = 1; qA.push(v); }
  }

  let anchored = 0, held = 0;
  const floating = [];
  for (let i = 0; i < rows.length; i++) {
    if (visJoint[i]) anchored++;
    else if (visAll[i]) held++;
    else floating.push(i);
  }
  return { pieces: rows.length, joints, anchored, held, floating, floor };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. HEPHAESTUS'S METALLURGICAL PALETTE & COMPONENT BUILDERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Homer's Five Metals & Materials on the Shield of Achilles:
 * - Gold (χρυσός): LDraw 297 (Pearl Gold) / 14 (Yellow) / 46 (Trans-Yellow)
 * - Silver (ἄργυρος): LDraw 179 (Flat Silver) / 71 (Light Bluish Grey)
 * - Bronze / Copper (χαλκός): LDraw 28 (Dark Tan) / 70 (Reddish Brown) / 84 (Medium Nougat)
 * - Tin (κασσίτερος): LDraw 71 (Light Bluish Grey) / 15 (White)
 * - Kyanos / Dark-Blue Enamel (κύανος): LDraw 272 (Dark Blue) / 33 (Trans-Dark Blue)
 * - Ploughed Black Glebe (μελαίνετο): LDraw 0 (Black) / 308 (Dark Brown)
 * - Crimson Blood of Ker (δαφοινεός): LDraw 320 (Dark Red) / 4 (Red)
 */
const C = {
  black: 0,
  blue: 1,
  green: 2,
  dturq: 3,
  red: 4,
  yellow: 14,
  white: 15,
  tan: 19,
  purple: 22,
  orange: 25,
  dtan: 28,
  tDBlue: 33,
  tGreen: 34,
  tRed: 36,
  tBlue: 43,
  tYellow: 46,
  tClear: 47,
  tOrange: 57,
  rbrown: 70,
  lbg: 71,      // Tin (κασσίτερος)
  dbg: 72,      // Dark Iron / Basalt
  nougat: 84,   // Warm Bronze
  lilac: 85,
  silver: 179,  // Silver (ἄργυρος)
  dblue: 272,   // Kyanos (κύανος)
  dgreen: 288,
  gold: 297,    // Gold (χρυσός)
  dbrown: 308,  // Thrice-Ploughed Furrow
  dred: 320,    // Crimson Cloak of Ker / Wine-Dark
  olive: 330,   // Olive Grove
  sgreen: 378,
  sblue: 379,
  azure: 322
};

const METAL_CATEGORY = {
  297: 'gold', 14: 'gold', 46: 'gold',
  179: 'silver', 47: 'silver',
  28: 'bronze', 70: 'bronze', 84: 'bronze', 19: 'bronze', 25: 'bronze', 57: 'bronze',
  71: 'tin', 15: 'tin', 72: 'tin',
  272: 'kyanos', 33: 'kyanos', 1: 'kyanos', 43: 'kyanos', 322: 'kyanos', 379: 'kyanos',
  0: 'niello', 308: 'niello', 320: 'crimson', 4: 'crimson', 36: 'crimson',
  2: 'flora', 288: 'flora', 330: 'flora', 378: 'flora', 22: 'crimson'
};

function countMetals(rows) {
  const m = { gold: 0, silver: 0, bronze: 0, tin: 0, kyanos: 0, niello: 0, crimson: 0, flora: 0 };
  for (const r of rows) {
    const k = METAL_CATEGORY[r.col] || 'bronze';
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

/* Component representation: { name, how, source, local: [{part,col,m}], subs: [{c,M}], m } */
function rowsOf(c, M = I12) {
  const MM = mul(M, c.m || I12);
  return [
    ...(c.local || []).map(r => ({ ...r, m: mul(MM, r.m) })),
    ...(c.subs || []).flatMap(s => rowsOf(s.c, mul(MM, s.M)))
  ];
}

function settle(c, doCenter = true) {
  const rows = rowsOf({ ...c, m: I12 });
  if (!rows.length) return { ...c, m: I12 };
  const b = bounds(rows);
  const cx = doCenter ? Math.round(((b[0] + b[3]) / 2) / 20) * 20 : 0;
  const cz = doCenter ? Math.round(((b[2] + b[5]) / 2) / 20) * 20 : 0;
  const fy = c.floorY != null ? c.floorY : b[4];
  return { ...c, m: T(-cx, -fy, -cz) };
}

function make(name, how, source, local = [], subs = [], extra = {}) {
  return settle({ name, how, source, local, subs, m: I12, ...extra }, extra.center !== false);
}

function foot(c) {
  const rows = rowsOf(c);
  const b = bounds(rows);
  return {
    w: Math.max(2, Math.round((b[3] - b[0]) / 20)),
    d: Math.max(2, Math.round((b[5] - b[2]) / 20)),
    h: Math.round(b[4] - b[1]),
    b
  };
}

/**
 * Place a list of LDraw parts by stud coordinates (x, z in studs; base in LDU where y=0 is ground, y negative is UP).
 * Automatically places the part's bottom (box[4]) at `base`.
 */
function REAL(name, list, extra = {}) {
  const partsUsed = [...new Set(list.map(p => p.id))];
  const rows = list.map(p => {
    const id = norm(p.id).replace(/\.dat$/, '');
    const inf = info(id);
    const bmax = inf.box ? inf.box[4] : 0;
    const rot = p.m || RY(p.q || 0);
    const y = p.y != null ? p.y : (p.base != null ? p.base : 0) - bmax;
    return {
      part: id,
      col: p.col != null ? p.col : C.lbg,
      m: mul(T((p.x || 0) * 20, y, (p.z || 0) * 20), rot)
    };
  });
  return make(name, extra.how || 'kit', { kit: name, parts: partsUsed.slice(0, 8).join(' '), ...extra.source }, rows, [], extra);
}

const R = (id, col, x, z, base = 0, q = 0) => ({ id, col, x, z, base, q });

/** Compose multiple sub-components at stud offsets [comp, xStuds, zStuds, quarterTurn, yLDU] */
function at(name, items, extra = {}) {
  const subs = items.filter(Boolean).map(([c, x = 0, z = 0, q = 0, y = 0]) => ({
    c,
    M: mul(T(x * 20, y, z * 20), RY(q))
  }));
  return make(name, extra.how || 'assembly', { kit: name, ...extra.source }, [], subs, extra);
}

/** Arrange components side-by-side in a neat grid for ensemble/asset display */
function group(name, comps, o = {}) {
  const gap = o.gap != null ? o.gap : 2;
  const maxW = o.maxW || 22;
  const placed = [];
  let cx = 0, cz = 0, rowD = 0;
  for (const c of comps) {
    const f = foot(c);
    if (cx > 0 && cx + f.w > maxW) {
      cx = 0;
      cz += rowD + gap;
      rowD = 0;
    }
    placed.push([c, cx + f.w / 2, cz + f.d / 2, o.q || 0, 0]);
    cx += f.w + gap;
    if (f.d > rowD) rowD = f.d;
  }
  return at(name, placed, { how: 'ensemble', center: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. RUNNING-BOND COURSING, SLABS, COLUMNS & ARCHITECTURAL PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tile a rectangular slab of w × d studs using real LDraw plates (8 LDU tall) */
function slabParts(x0, z0, w, d, col, base = 0) {
  const TILES = [
    ['3958', 6, 6],
    ['3032', 6, 4],
    ['3020', 4, 2],
    ['3031', 4, 4],
    ['3795', 6, 2],
    ['3021', 3, 2],
    ['3022', 2, 2],
    ['3023', 2, 1],
    ['3024', 1, 1]
  ];
  const grid = Array.from({ length: d }, () => new Uint8Array(w));
  const out = [];
  for (let dz = 0; dz < d; dz++) {
    for (let dx = 0; dx < w; dx++) {
      if (grid[dz][dx]) continue;
      for (const [id, pw, pd] of TILES) {
        for (const [tw, td, q] of [[pw, pd, 0], [pd, pw, 1]]) {
          if (dx + tw <= w && dz + td <= d) {
            let ok = true;
            for (let zz = dz; zz < dz + td && ok; zz++) {
              for (let xx = dx; xx < dx + tw; xx++) if (grid[zz][xx]) { ok = false; break; }
            }
            if (ok) {
              for (let zz = dz; zz < dz + td; zz++) for (let xx = dx; xx < dx + tw; xx++) grid[zz][xx] = 1;
              out.push({ id, col, x: x0 + dx + (tw - 1) / 2, z: z0 + dz + (td - 1) / 2, base, q });
              break;
            }
          }
        }
        if (grid[dz][dx]) break;
      }
    }
  }
  return out;
}

/** Stone coursing in running bond along X or Z, using 1x2 masonry bricks (98283) and 1x2/1x1 bricks */
function coursing(col, a, b, fixedCoord, courses, o = {}) {
  const { alongZ = false, base = 0, holes = [], id2 = '98283', band = null, k0 = 0 } = o;
  const out = [];
  for (let k = 0; k < courses; k++) {
    const y = base - 24 * k;
    const c = (band && k === courses - 1) ? band : (k === 0 && o.plinth ? o.plinth : col);
    const studs = [];
    for (let v = a; v <= b + 1e-6; v += 1) {
      const inHole = holes.some(([f, t, c0, c1]) => v >= f - 1e-6 && v <= t + 1e-6 && k >= c0 && k <= c1);
      if (!inHole) studs.push(v);
    }
    for (let i = 0; i < studs.length;) {
      const v = studs[i];
      const pair = i + 1 < studs.length && Math.abs(studs[i + 1] - v - 1) < 1e-6 && ((Math.round(v - a) + k + k0) % 2 === 0);
      const u = pair ? v + 0.5 : v;
      const id = pair ? id2 : '3005';
      out.push(alongZ
        ? { id, col: c, x: fixedCoord, z: u, base: y, q: 1 }
        : { id, col: c, x: u, z: fixedCoord, base: y, q: 0 });
      i += pair ? 2 : 1;
    }
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. MINIFIGURE SKELETON, HOMERIC WARDROBE & DIVINE SCALE BUILDERS
   ═══════════════════════════════════════════════════════════════════════════ */

const HAND_R_M = [-23.688, -5.24, -9.884, 0.985, -0.12, 0.12, 0.17, 0.697, -0.697, 0, 0.707, 0.707];
const HAND_L_M = [23.688, -5.24, -9.884, 0.985, -0.12, -0.12, 0.002, 0.717, -0.697, 0.17, 0.686, 0.707];
const BARS = new Set(['30374', '4497', '6124', '3957a', '95049', '95050', '43899', '37341d']);

function rx3(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
function mul3(a, b) {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
  ];
}
function ap3(a, v) {
  return [
    a[0] * v[0] + a[1] * v[1] + a[2] * v[2],
    a[3] * v[0] + a[4] * v[1] + a[5] * v[2],
    a[6] * v[0] + a[7] * v[1] + a[8] * v[2]
  ];
}
const GRIP_ROT = rx3(14.5 * Math.PI / 180);
const FLIP3 = rx3(Math.PI);

function toolMount(hand, id) {
  const bar = BARS.has(id);
  const R3 = hand.slice(3);
  const p = ap3(R3, [0, -0.8229, -9.8948]);
  const rot = mul3(mul3(R3, GRIP_ROT), bar ? FLIP3 : [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  return [hand[0] + p[0], hand[1] + p[1], hand[2] + p[2], ...rot];
}

function fig(spec, name = 'Homeric figure') {
  const skin = spec.skin ?? C.yellow;
  const top = spec.top ?? C.white;
  const legs = spec.legs ?? C.tan;
  const hips = spec.hips ?? legs;
  const arms = spec.arms ?? top;
  const hands = spec.hands ?? skin;
  const torso = spec.torso || '973';
  const face = spec.face || '3626bp01';
  const rows = [
    { part: '3816', col: legs, m: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
    { part: '3817', col: legs, m: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
    { part: '3815', col: hips, m: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
    { part: exists(torso) ? torso : '973', col: top, m: [0, -32, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] },
    { part: '3818', col: arms, m: [-15.552, -23, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1] },
    { part: '3819', col: arms, m: [15.552, -23, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1] },
    { part: '3820', col: hands, m: HAND_R_M },
    { part: '3820', col: hands, m: HAND_L_M },
    { part: exists(face) ? face : '3626bp01', col: skin, m: [0, -56, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] }
  ];
  if (spec.hat && exists(spec.hat[0])) {
    rows.push({ part: spec.hat[0], col: spec.hat[1] ?? C.dbrown, m: [0, -56, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] });
  }
  if (spec.R && exists(spec.R[0])) {
    rows.push({ part: spec.R[0], col: spec.R[1] ?? C.gold, m: toolMount(HAND_R_M, spec.R[0]) });
  }
  if (spec.L && exists(spec.L[0])) {
    rows.push({ part: spec.L[0], col: spec.L[1] ?? C.silver, m: toolMount(HAND_L_M, spec.L[0]) });
  }
  if (spec.plinth !== false) {
    // Stand figure on a 2x2 round or square bronze/stone plinth plate so it anchors cleanly in standalone and group cards
    rows.push({ part: '3022', col: spec.plinthCol ?? C.dtan, m: [0, 28, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1] });
  }
  return make(name, 'figure', { figure: name, role: spec.role || 'mortal' }, rows);
}

/**
 * Brick-Built Divine Scale Figure (Iliad 18.516–519):
 * "And Mars and Pallas Minerva led them, both golden, and clad in golden garments,
 *  beautiful and large with their arms, like gods, both very conspicuous; but the people were smaller."
 */
function divineGiant(name, o = {}) {
  const armor = o.armor ?? C.gold;
  const tunic = o.tunic ?? C.gold;
  const trim = o.trim ?? C.silver;
  const skin = o.skin ?? C.gold;
  const cloak = o.cloak ?? C.dred;
  const list = [
    // Pedestal base (4x4 plate)
    R('3031', trim, 0, 0, 0),
    // Greaves & sandals (2x2 columns, 3 courses tall)
    R('3003', armor, -1, 0, -8), R('3003', armor, 1, 0, -8),
    R('3003', armor, -1, 0, -32), R('3003', armor, 1, 0, -32),
    R('3003', skin, -1, 0, -56), R('3003', skin, 1, 0, -56),
    // Chiton skirt & silver belt (6x2 wide)
    R('3020', tunic, -1, 0, -80), R('3020', tunic, 1, 0, -80),
    R('3001', tunic, 0, 0, -88),
    R('3020', trim, 0, 0, -112),
    // Cuirass torso & broad divine shoulders (6 studs wide)
    R('3001', armor, 0, 0, -120),
    R('3004', armor, -2.5, 0, -120, 1), R('3004', armor, 2.5, 0, -120, 1),
    R('3001', armor, 0, 0, -144),
    R('3004', skin, -2.5, 0, -144, 1), R('3004', skin, 2.5, 0, -144, 1),
    // Flowing divine cloak down the back
    R('3001', cloak, 0, -1.5, -96),
    R('3001', cloak, 0, -1.5, -120),
    R('3001', cloak, 0, -1.5, -144),
    // Neck & Head with radiant eyes
    R('3022', skin, 0, 0, -168),
    R('3003', skin, 0, 0, -176),
    R('3024', C.tYellow, -0.5, 0.5, -200), R('3024', C.tYellow, 0.5, 0.5, -200),
    R('3003', skin, 0, 0, -208),
    // High golden crest / helmet
    R('3020', armor, 0, 0, -232, 1),
    R('3040b', o.crest || C.red, 0, -0.5, -240, 0),
    R('3040b', o.crest || C.red, 0, 0.5, -240, 2),
    // Right hand spear / pillar of bronze & gold
    R('3941', trim, -2.5, 1, -120),
    R('2453b', armor, -2.5, 1, -144),
    R('4589', C.tYellow, -2.5, 1, -264),
    // Left hand Aegis / Great Round Shield (Dish 4x4 Inverted in Gold)
    R('3004', armor, 2.5, 1, -144),
    R('3960', o.shieldCol || C.gold, 2.5, 1.5, -168)
  ];
  return REAL(name, list, { how: 'divine_scale', source: { scale: 'Divine (11 bricks tall vs 4-brick mortal)', role: o.role || 'Olympian God' } });
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. HOMERIC CREATURES, PROPS & SET-DESIGN KIT VOCABULARY (KIT)
   ═══════════════════════════════════════════════════════════════════════════ */

const KIT = {
  /** Lofty-horned ox of gold or tin (Iliad 18.573-574: βοῶν ὀρθοκραιράων... χρυσοῖο τετεύχατο κασσιτέρου τε) */
  ox: (col = C.gold, hornCol = C.silver, name = 'lofty-horned ox') => REAL(name, [
    R('3032', C.dtan, 0, 0, 0), // 4x6 baseplate footing
    R('64452', col, 0, 0, -8),  // Animal Cow body
    R('64847', hornCol, -0.5, -1.8, -56),
    R('64847', hornCol, 0.5, -1.8, -56)
  ], { how: 'creature' }),

  /** Terrible lion (σμερδαλέω δὲ λέοντε) — sculpted tawny/gold lion with Lion Head brick 30274 & crouching body */
  lion: (col = C.nougat, mane = C.gold, name = 'terrible lion') => REAL(name, [
    R('3032', C.dtan, 0, 0, 0),
    R('3001', col, 0, -0.5, -8, 1),
    R('3003', mane, 0, 1, -8),
    R('30274', mane, 0, 1.5, -32), // Brick 2x3x3 with Lion's Head Carving!
    R('3040b', col, 0, -2, -32, 2),
    R('14734', col, 0, -1, -32)
  ], { how: 'creature' }),

  /** White-wooled sheep (ὀΐων ἀργεννάων) — Goat/Sheep 95341 + woolly fleece build */
  sheep: (col = C.white, name = 'white-wooled sheep') => REAL(name, [
    R('3020', C.green, 0, 0, 0, 1),
    R('95341', col, -0.5, 0, -8),
    // Second woolly lamb beside it
    R('3004', C.lbg, 1, 0, -8, 1),
    R('3003', col, 1, 0, -32),
    R('3023', C.black, 1, 1, -40)
  ], { how: 'creature' }),

  /** Swift-footed hound (κύνες πόδας ἀργοὶ) */
  hound: (col = C.rbrown, name = 'swift-footed hound') => REAL(name, [
    R('3020', C.dtan, 0, 0, 0, 1),
    R('92586', col, 0, 0, -8)
  ], { how: 'creature' }),

  /** Nimble-footed cavalry horse (ἀερσιπόδων ἵππων) */
  horse: (col = C.rbrown, name = 'nimble-footed horse') => REAL(name, [
    R('3032', C.dtan, 0, 0, 0, 1),
    R('10509', col, 0, 0, -8)
  ], { how: 'creature' }),

  /** Hephaestus's Golden-Wheeled Self-Moving Tripod (Iliad 18.373-377) */
  tripod: (name = 'golden-wheeled tripod') => REAL(name, [
    R('3031', C.dbg, 0, 0, 0),
    // Golden wheels at the base
    R('4624', C.gold, -1.5, -1.5, -8), R('4624', C.gold, 1.5, -1.5, -8), R('4624', C.gold, 0, 1.5, -8),
    // Three bronze/gold legs rising to the cauldron
    R('3062b', C.gold, -1, -1, -8), R('3062b', C.gold, 1, -1, -8), R('3062b', C.gold, 0, 1, -8),
    R('3062b', C.gold, -1, -1, -32), R('3062b', C.gold, 1, -1, -32), R('3062b', C.gold, 0, 1, -32),
    // Cauldron bowl (Dish 4x4 + ring + ears/handles)
    R('3031', C.gold, 0, 0, -56),
    R('3960', C.gold, 0, 0, -64),
    R('3941', C.nougat, 0, 0, -88),
    R('6141', C.tOrange, -0.5, -0.5, -112), R('6141', C.tYellow, 0.5, 0.5, -112)
  ]),

  /** Hephaestus's Great Anvil & Forge Hearth */
  anvilAndForge: () => REAL('forge anvil and hearth', [
    // Basalt hearth base
    ...slabParts(-4, -4, 8, 8, C.dbg, 0),
    // Roaring furnace at back
    R('3001', C.dbg, 0, -2.5, -8), R('3001', C.dbg, -2, -2.5, -8), R('3001', C.dbg, 2, -2.5, -8),
    R('3001', C.black, 0, -2.5, -32),
    R('3062b', C.tOrange, -1, -2, -56), R('3062b', C.tRed, 0, -2, -56), R('3062b', C.tYellow, 1, -2, -56),
    R('4589', C.orange, -1, -2, -80), R('4589', C.yellow, 0, -2, -80), R('4589', C.red, 1, -2, -80),
    // Ingots of bronze, tin, gold, and silver in the fire
    R('3069b', C.gold, -1, -1.5, -16), R('3069b', C.silver, 1, -1.5, -16),
    R('3069b', C.nougat, -2, -1.5, -16), R('3069b', C.lbg, 2, -1.5, -16),
    // The Great Anvil Block (ἀκμόθετον μέγαν ἄκμονα) in the foreground
    R('3003', C.dbrown, 0, 1.5, -8),
    R('3003', C.dbg, 0, 1.5, -32),
    R('3001', C.silver, 0, 1.5, -56),
    R('3040b', C.silver, -1.5, 1.5, -56, 3), R('3040b', C.silver, 1.5, 1.5, -56, 1),
    R('3068b', C.gold, 0, 1.5, -80) // Shield disk blank being hammered!
  ]),

  /** The Two Talents of Gold on the Agora Center Stone (Iliad 18.507: δύω χρυσοῖο τάλαντα) */
  twoTalentsOfGold: () => REAL('two talents of gold', [
    R('3031', C.lbg, 0, 0, 0),
    R('3022', C.white, 0, 0, -8),
    R('3941', C.white, 0, 0, -16),
    R('3022', C.white, 0, 0, -40),
    // Two gleaming talents of gold side by side
    R('3069b', C.gold, -0.5, 0, -48),
    R('3069b', C.gold, 0.5, 0, -48),
    R('6141', C.gold, -0.5, 0, -56),
    R('6141', C.gold, 0.5, 0, -56)
  ]),

  /** Polished Stone Seat of the Elders in the Sacred Circle (ξεστοῖσι λίθοισιν ἱερῷ ἐνὶ κύκλῳ) */
  elderSeat: (col = C.white) => REAL('polished stone seat', [
    R('3022', C.lbg, 0, 0, 0),
    R('3003', col, 0, 0, -8),
    R('3068b', col, 0, 0, -32)
  ]),

  /** Ionic/Homeric Fluted Column */
  column: (h = 6, col = C.white, capCol = C.gold) => REAL('column', [
    R('3022', col, 0, 0, 0),
    ...Array.from({ length: h }, (_, i) => R('3941', col, 0, 0, -8 - i * 24)),
    R('3022', capCol, 0, 0, -8 - h * 24),
    R('3068b', col, 0, 0, -16 - h * 24)
  ]),

  /** Golden Vine Cluster on Silver Stake (Iliad 18.562-563: μέλανες δ᾽ ἀνὰ βότρυες ἦσαν, ἑστήκει δὲ κάμαξι διαμπερὲς ἀργυρέῃσιν) */
  goldenVineRow: (len = 8) => {
    const list = [...slabParts(-len / 2, -1, len, 3, C.dbrown, 0)];
    for (let x = -len / 2 + 1; x < len / 2; x += 2) {
      // Silver pole/prop (3062b stack in Flat Silver 179)
      list.push(R('3062b', C.silver, x, 0, -8));
      list.push(R('3062b', C.silver, x, 0, -32));
      list.push(R('3062b', C.silver, x, 0, -56));
      // Golden vine canopy (Pearl Gold 297 & Yellow 14)
      list.push(R('3023', C.gold, x, 0, -80));
      list.push(R('2417', C.gold, x, 0, -88));
      // Black grape clusters hanging (μέλανες βότρυες — Black 0 & Dark Purple 22)
      list.push(R('3062b', C.black, x - 0.5, 0.5, -56));
      list.push(R('6141', C.purple, x + 0.5, -0.5, -56));
    }
    return REAL('golden vines on silver poles', list);
  },

  /** Kyanos Trench & Fence of Tin (Iliad 18.564-565: ἀμφὶ δὲ κυανέην κάπετον, περὶ δ᾽ ἕρκος ἔλασσε κασσιτέροιο) */
  kyanosTrenchAndTinFence: (len = 12) => {
    const list = [
      ...slabParts(-len / 2, -2, len, 5, C.dtan, 0),
      // Kyanos trench: Dark Blue (272) + Trans-Dark Blue (33) enamel tiles
      ...slabParts(-len / 2, -1, len, 2, C.dblue, -8),
    ];
    for (let x = -len / 2 + 1; x < len / 2; x += 2) {
      list.push(R('3068b', C.tDBlue, x, -0.5, -16));
    }
    // Fence of Tin (Light Bluish Grey 71 + Flat Silver 179 1x4 fences 3185)
    for (let x = -len / 2 + 2; x <= len / 2 - 2; x += 4) {
      list.push(R('3185', C.silver, x, 1, -8));
    }
    // Single wooden path/bridge across the trench (μία δ᾽ οἴη ἀταρπὸς)
    list.push(R('3020', C.rbrown, 0, -0.5, -16, 1));
    list.push(R('3069b', C.tan, 0, -0.5, -24, 1));
    return REAL('kyanos trench and tin fence', list);
  },

  /** Thrice-Ploughed Furrow Strip: Golden Glebe Turning Black Behind the Plough (Iliad 18.548-549) */
  blackeningFurrow: (len = 14) => {
    const list = [...slabParts(-len / 2, -2, len, 4, C.gold, 0)];
    // Behind the plough (left half: x < 0), the golden soil turns black (μελαίνετο)!
    for (let x = -len / 2; x < 0; x++) {
      list.push(R('3023', C.black, x + 0.5, -1, -8, 1));
      list.push(R('3023', C.dbrown, x + 0.5, 1, -8, 1));
      list.push(R('3069b', C.black, x + 0.5, -1, -16, 1));
    }
    // Ahead of the plough (right half: x >= 0), unploughed gleaming gold
    for (let x = 0; x < len / 2; x += 2) {
      list.push(R('3068b', C.gold, x + 1, -1, -8));
      list.push(R('3068b', C.gold, x + 1, 1, -8));
    }
    // The bronze ploughshare at x = 0
    list.push(R('3004', C.rbrown, 0, 0, -8));
    list.push(R('3040b', C.silver, 1, 0, -8, 1));
    return REAL('blackening golden furrow', list);
  },

  /** The Sacrificial Oak & Feast Table (Iliad 18.558-560: κήρυκες δ᾽ ἀπάνευθε ὑπὸ δρυῒ δαῖτα πένοντο) */
  sacrificialOakAndFeast: () => REAL('sacrificial oak and feast', [
    ...slabParts(-4, -4, 8, 8, C.green, 0),
    // Great spreading Oak tree
    R('3941', C.rbrown, -2, -2, -8), R('3941', C.rbrown, -2, -2, -32), R('3941', C.rbrown, -2, -2, -56),
    R('2417', C.dgreen, -2, -2, -80), R('2417', C.green, -3, -1, -88), R('2417', C.olive, -1, -3, -88),
    R('3470', C.dgreen, -2, -2, -80),
    // Stone altar with fire & sacrificed ox roast
    R('3001', C.white, 1.5, -1, -8),
    R('3020', C.gold, 1.5, -1, -32),
    R('3062b', C.tOrange, 1, -1, -40), R('4589', C.orange, 1, -1, -64),
    R('3062b', C.rbrown, 2, -1, -40),
    // Feast table where women strew white barley meal (ἄλφιτα λευκὰ)
    R('3062b', C.rbrown, -1, 2, -8), R('3062b', C.rbrown, 2, 2, -8),
    R('3020', C.tan, 0.5, 2, -32),
    R('6141', C.white, -0.5, 2, -40), R('6141', C.white, 0.5, 2, -40), R('6141', C.white, 1.5, 2, -40),
    R('2343', C.gold, 2, 2, -40)
  ]),

  /** Potter's Wheel Comparison (Iliad 18.600-601: ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται) */
  pottersWheel: () => REAL('potters trial wheel', [
    R('3031', C.dtan, 0, 0, 0),
    // Stone bench for the sitting potter
    R('3003', C.lbg, -1, 0, -8),
    // Revolving wheel axle & disk
    R('3941', C.dbrown, 1, 0, -8),
    R('3960', C.silver, 1, 0, -32),
    // Amphora/urn taking shape on the wheel
    R('3941', C.nougat, 1, 0, -40),
    R('4589', C.nougat, 1, 0, -64)
  ]),

  /** Oceanus Wave Segment (Iliad 18.607-608: ποταμοῖο μέγα σθένος Ὠκεανοῖο) */
  oceanusWave: (len = 10) => {
    const list = [
      ...slabParts(-len / 2, -2, len, 4, C.dblue, 0),
      // Triple glittering rim of bronze, tin, and gold on the outer edge (z = -1.5)
      ...Array.from({ length: len / 2 }, (_, i) => R('3023', C.nougat, -len / 2 + i * 2 + 1, -1.5, -8)),
      ...Array.from({ length: len / 2 }, (_, i) => R('3023', C.silver, -len / 2 + i * 2 + 1, -1.5, -16)),
      ...Array.from({ length: len / 2 }, (_, i) => R('3069b', C.gold, -len / 2 + i * 2 + 1, -1.5, -24)),
      // Rolling wave crests (93273 double curved slopes + trans-dark-blue & white foam 6141)
      ...Array.from({ length: len - 2 }, (_, i) => R('93273', i % 2 ? C.dblue : C.blue, -len / 2 + 1.5 + i, 0.5, -8)),
      ...Array.from({ length: Math.floor(len / 2) }, (_, i) => R('6141', C.white, -len / 2 + 2 + i * 2, 0.5, -41)),
      ...Array.from({ length: Math.floor(len / 2) }, (_, i) => R('6141', C.tClear, -len / 2 + 1 + i * 2, 1.2, -16))
    ];
    return REAL('oceanus wave and triple rim', list);
  },

  /** Silver Baldric & Triple Rim Segment (ἀργύρεος τελαμών & τρίπλαξ μαρμαρέη) */
  silverBaldric: () => REAL('silver baldric and triple border', [
    ...slabParts(-6, -2, 12, 4, C.nougat, 0),
    // Triple glittering border: course 1 bronze, course 2 tin, course 3 gold
    ...coursing(C.nougat, -5.5, 5.5, -1.5, 1, { base: -8 }),
    ...coursing(C.lbg, -5.5, 5.5, -1.5, 1, { base: -32 }),
    ...coursing(C.gold, -5.5, 5.5, -1.5, 1, { base: -56 }),
    // Arched silver strap (ἀργύρεος τελαμών)
    R('3003', C.silver, -4, 0.5, -8), R('3003', C.silver, 4, 0.5, -8),
    R('3003', C.silver, -4, 0.5, -32), R('3003', C.silver, 4, 0.5, -32),
    R('3455', C.silver, 0, 0.5, -56),
    R('3020', C.silver, 0, 0.5, -80),
    R('3069b', C.gold, -1, 0.5, -88), R('3069b', C.gold, 1, 0.5, -88)
  ]),

  /** Shepherd's Thatched Hut / Steading in the Sheep Glen (κλισίαι κατηρεφέες ἰδὲ σηκοί, 18.589) */
  shepherdSteading: () => REAL('shepherd roofed steading and fold', [
    ...slabParts(-5, -4, 10, 8, C.green, 0),
    // Low stone sheepfold wall in front
    ...coursing(C.lbg, -4.5, 4.5, 3, 2, { base: -8 }),
    ...coursing(C.lbg, -3.5, 2.5, -4.5, 2, { alongZ: true, base: -8 }),
    ...coursing(C.lbg, -3.5, 2.5, 4.5, 2, { alongZ: true, base: -8 }),
    // Thatched shepherd cottage at the back
    ...coursing(C.tan, -3.5, 3.5, -3, 4, { base: -8 }),
    ...coursing(C.tan, -3, 0, -3.5, 4, { alongZ: true, base: -8 }),
    ...coursing(C.tan, -3, 0, 3.5, 4, { alongZ: true, base: -8 }),
    // Pitched roof in dark tan / reddish brown thatch
    ...slabParts(-4, -3.5, 8, 4, C.rbrown, -104),
    R('3039', C.dtan, -2, -2, -112), R('3039', C.dtan, 0, -2, -112), R('3039', C.dtan, 2, -2, -112),
    R('3039', C.dtan, -2, -1, -112, 2), R('3039', C.dtan, 0, -1, -112, 2), R('3039', C.dtan, 2, -1, -112, 2)
  ]),

  /** Cosmic Sun & Moon Orbs (Ἠέλιόν τ᾽ ἀκάμαντα Σελήνην τε πλήθουσαν, 18.484) */
  sunAndMoon: () => REAL('unwearied sun and full moon', [
    ...slabParts(-5, -2, 10, 4, C.dblue, 0),
    // The Unwearied Sun (Golden pedestal + 6x6 inverted gold dish + trans-yellow corona rays)
    R('3941', C.gold, -2.5, 0, -8), R('3941', C.gold, -2.5, 0, -32),
    R('44375a', C.gold, -2.5, 0, -56),
    R('11609', C.tYellow, -2.5, 0, -64),
    R('6141', C.tOrange, -3.5, -1, -64), R('6141', C.tOrange, -1.5, 1, -64),
    // The Full Moon (Silver pedestal + 6x6 inverted silver dish + trans-clear crescent glow)
    R('3941', C.silver, 2.5, 0, -8), R('3941', C.silver, 2.5, 0, -32),
    R('44375a', C.silver, 2.5, 0, -56),
    R('6141', C.tClear, 2.5, 0, -64), R('6141', C.white, 3.5, 0, -64)
  ]),

  /** The Four Constellations: Pleiades, Hyades, Might of Orion & The Bear/Wain (18.485–489) */
  constellations: () => {
    const list = [...slabParts(-6, -6, 12, 12, C.dblue, 0)];
    // Central Polar Axis (North Celestial Pole)
    list.push(R('3941', C.gold, 0, 0, -8), R('11609', C.tYellow, 0, 0, -32));
    // 1. The Bear / Wain (Ἄρκτον / Ἄμαξαν) — 7 golden stars in the dipper/wagon pattern watching Orion
    for (const [x, z] of [[-4, -4], [-2.5, -4], [-1.5, -3], [-0.5, -2], [0.5, -2], [0.5, -3.5], [-1.5, -4.2]]) {
      list.push(R('3062b', C.silver, x, z, -8), R('11609', C.gold, x, z, -32));
    }
    // 2. The Might of Orion (σθένος Ὠρίωνος) — 3 belt stars + 2 shoulders + 2 knees + sword
    for (const [x, z, c] of [[2, 2, C.gold], [3, 2.5, C.gold], [4, 3, C.gold], [1.5, 0.5, C.tOrange], [4.5, 1, C.tClear], [1.5, 4.5, C.tBlue], [4.5, 4.5, C.gold], [3, 3.8, C.tYellow]]) {
      list.push(R('3062b', C.dblue, x, z, -8), R('11609', c, x, z, -32));
    }
    // 3. The Pleiades (Πληϊάδας — seven clustered sister stars)
    for (const [x, z] of [[-4, 1], [-3, 1], [-3.5, 2], [-2.5, 2], [-4, 2.8], [-3, 2.8], [-2, 1.5]]) {
      list.push(R('6141', C.tBlue, x, z, -8), R('11609', C.tClear, x, z, -16));
    }
    // 4. The Hyades (Ὑάδας — V-shaped bull's brow with red Aldebaran)
    for (const [x, z, c] of [[-1, 4, C.tOrange], [-2, 3.2, C.gold], [-3, 2.4, C.gold], [-2, 4.5, C.gold], [-3, 5, C.gold]]) {
      list.push(R('6141', c, x, z, -8));
    }
    return REAL('constellations bear wain and orion', list);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. THE 45 ASSET CARDS OF THE SHIELD OF ACHILLES
   ═══════════════════════════════════════════════════════════════════════════ */

function buildCharacterCards() {
  return {
    'character.hephaestus': {
      name: 'Hephaestus, the Illustrious Lame Smith-God',
      type: 'character',
      zone: 'Z01',
      lines: '18.468–482',
      greek: 'Ἥφαιστος... θῆκεν ἐν ἀκμοθέτῳ μέγαν ἄκμονα, γέντο δὲ χειρὶ ῥαιστῆρα κρατερήν',
      role: 'Olympian Artificer',
      comp: fig({
        role: 'Olympian Artificer',
        skin: C.nougat,
        top: C.dbrown,
        legs: C.rbrown,
        arms: C.nougat,
        face: '3626bp39',
        hat: ['3901', C.dbrown],
        R: ['55295', C.silver], // Hammer (ῥαιστῆρα)
        L: ['3846', C.gold],    // Shield blank
        plinthCol: C.gold
      }, 'Hephaestus at the Anvil')
    },
    'character.thetis': {
      name: 'Silver-Footed Thetis',
      type: 'character',
      zone: 'Z01',
      lines: '18.468–477',
      greek: 'Θέτις ἀργυρόπεζα',
      role: 'Nereid Goddess',
      comp: fig({
        role: 'Nereid Goddess',
        skin: C.yellow,
        top: C.dblue,
        legs: C.silver, // Silver-footed (ἀργυρόπεζα)!
        hips: C.dblue,
        face: '3626bp02',
        hat: ['12890', C.black],
        R: ['95049', C.silver],
        plinthCol: C.silver
      }, 'Silver-Footed Thetis')
    },
    'character.bride': {
      name: 'The Bride Conducted Under Brilliant Torches',
      type: 'character',
      zone: 'Z02',
      lines: '18.492–493',
      greek: 'νύμφας δ᾽ ἐκ θαλάμων δαΐδων ὕπο λαμπομενάων ἠγίνεον ἀνὰ ἄστυ',
      role: 'Bride of the Peace City',
      comp: fig({
        role: 'Bride',
        skin: C.yellow,
        top: C.white,
        legs: C.white,
        face: '3626bp02',
        hat: ['39262', C.gold], // Golden bridal crown
        R: ['3741ac04', C.red],
        L: ['2343', C.gold],
        plinthCol: C.white
      }, 'The Veiled Bride')
    },
    'character.bridegroom': {
      name: 'The Bridegroom Leading the Wedding Feast',
      type: 'character',
      zone: 'Z02',
      lines: '18.491–495',
      greek: 'ἐν τῇ μέν ῥα γάμοι τ᾽ ἔσαν εἰλαπίναι τε',
      role: 'Bridegroom',
      comp: fig({
        role: 'Bridegroom',
        skin: C.yellow,
        top: C.dred,
        legs: C.white,
        face: '3626bp01',
        hat: ['3901', C.dbrown],
        R: ['3959', C.gold], // Blazing marriage torch
        L: ['2343', C.gold],
        plinthCol: C.gold
      }, 'The Bridegroom')
    },
    'character.litigant-payer': {
      name: 'The Payer Litigant (Claiming Full Blood-Price Paid)',
      type: 'character',
      zone: 'Z02',
      lines: '18.498–500',
      greek: 'ὁ μὲν εὔχετο πάντ᾽ ἀποδοῦναι δήμῳ πιφαύσκων',
      role: 'Agora Litigant',
      comp: fig({
        role: 'Agora Litigant (Payer)',
        skin: C.yellow,
        top: C.sblue,
        legs: C.tan,
        face: '3626bp05',
        hat: ['3901', C.rbrown],
        R: ['2343', C.gold],
        plinthCol: C.lbg
      }, 'Payer Litigant')
    },
    'character.litigant-denier': {
      name: 'The Kinsman Litigant (Denying Anything Received)',
      type: 'character',
      zone: 'Z02',
      lines: '18.500–501',
      greek: 'ὁ δ᾽ ἀναίνετο μηδὲν ἑλέσθαι',
      role: 'Agora Litigant',
      comp: fig({
        role: 'Agora Litigant (Denier)',
        skin: C.yellow,
        top: C.dred,
        legs: C.dtan,
        face: '3626bp0f',
        hat: ['3901', C.black],
        R: ['95050', C.bronze || C.dtan],
        plinthCol: C.lbg
      }, 'Denier Litigant')
    },
    'character.speaker-elder': {
      name: 'Elder Rising in the Sacred Circle with Herald’s Staff',
      type: 'character',
      zone: 'Z02',
      lines: '18.503–506',
      greek: 'οἱ δὲ γέροντες εἵατ᾽ ἐπὶ ξεστοῖσι λίθοισ᾽ ἱερῷ ἐνὶ κύκλῳ, σκῆπτρα δὲ κηρύκων ἐν χέρσ᾽ ἔχον',
      role: 'Dicast Elder (γέρων)',
      comp: fig({
        role: 'Dicast Elder',
        skin: C.yellow,
        top: C.white,
        legs: C.white,
        face: '3626bp0e',
        hat: ['3901', C.white],
        R: ['95049', C.gold], // Sceptre of the loud-voiced herald
        plinthCol: C.white
      }, 'Elder of the Sacred Circle')
    },
    'character.rejoicing-king': {
      name: 'The Silent King Rejoicing over the Harvest Furrow',
      type: 'character',
      zone: 'Z04',
      lines: '18.556–557',
      greek: 'βασιλεὺς δ᾽ ἐν τοῖσι σιωπῇ σκῆπτρον ἔχων ἑστήκει ἐπ᾽ ὄγμου γηθόσυνος κῆρ',
      role: 'Basileus (βασιλεύς)',
      comp: fig({
        role: 'Basileus',
        skin: C.yellow,
        top: C.purple,
        legs: C.gold,
        face: '3626bp01',
        hat: ['39262', C.gold],
        R: ['95049', C.gold], // Royal staff (σκῆπτρον)
        plinthCol: C.gold
      }, 'The Silent Rejoicing King')
    },
    'character.headland-cupbearer': {
      name: 'The Wine-Bearer at the End of the Furrow',
      type: 'character',
      zone: 'Z04',
      lines: '18.545–546',
      greek: 'τοῖσι δ᾽ ἔπειτ᾽ ἐν χερσὶ δέπας μελιηδέος οἴνου δόσκεν ἀνὴρ ἐπιών',
      role: 'Headland Steward',
      comp: fig({
        role: 'Wine-Bearer',
        skin: C.yellow,
        top: C.tan,
        legs: C.rbrown,
        face: '3626bp01',
        hat: ['3901', C.rbrown],
        R: ['2343', C.gold], // Cup of sweet wine (δέπας μελιηδέος οἴνου)
        L: ['3899', C.dred],
        plinthCol: C.dbrown
      }, 'Headland Wine-Bearer')
    },
    'character.linus-boy': {
      name: 'The Boy Singing the Linus Song on the Shrill Lyre',
      type: 'character',
      zone: 'Z04',
      lines: '18.569–571',
      greek: 'τοῖσιν δ᾽ ἐν μέσσοισι πάϊς φόρμιγγι λιγείῃ ἱμερόεν κιθάριζε, λίνον δ᾽ ὑπὸ καλὸν ἄειδε λεπταλέῃ φωνῇ',
      role: 'Vineyard Aoidos',
      comp: fig({
        role: 'Vineyard Singer',
        skin: C.yellow,
        top: C.sblue,
        legs: C.white,
        face: '3626bp01',
        hat: ['3901', C.yellow],
        R: ['95050', C.gold], // Phorminx / Lyre
        plinthCol: C.gold
      }, 'The Linus-Song Boy')
    }
  };
}

function buildDivineCards() {
  return {
    'divine_fx.golden-ares': {
      name: 'Golden Ares (Mars), Conspicuous in Golden Armor',
      type: 'divine_fx',
      zone: 'Z03',
      lines: '18.516–519',
      greek: 'ἦρχε δ᾽ ἄρα σφιν Ἄρης καὶ Παλλὰς Ἀθήνη ἄμφω χρυσείω, χρύσεια δὲ εἵματα ἕσθην, καλὼ καὶ μεγάλω σὺν τεύχεσιν',
      role: 'War God (Divine Scale)',
      comp: divineGiant('Golden Ares', {
        armor: C.gold,
        tunic: C.gold,
        trim: C.nougat,
        skin: C.gold,
        cloak: C.dred,
        crest: C.red,
        shieldCol: C.gold,
        role: 'Ares (11 bricks tall vs 4-brick mortal)'
      })
    },
    'divine_fx.golden-athena': {
      name: 'Golden Pallas Athena (Minerva) with Golden Aegis',
      type: 'divine_fx',
      zone: 'Z03',
      lines: '18.516–519',
      greek: 'καὶ Παλλὰς Ἀθήνη ἄμφω χρυσείω... λαοὶ δ᾽ ὑπ᾽ ὀλίζονες ἦσαν',
      role: 'War Goddess (Divine Scale)',
      comp: divineGiant('Golden Pallas Athena', {
        armor: C.gold,
        tunic: C.white,
        trim: C.silver,
        skin: C.gold,
        cloak: C.dblue,
        crest: C.gold,
        shieldCol: C.silver,
        role: 'Pallas Athena (11 bricks tall vs 4-brick mortal)'
      })
    },
    'divine_fx.ker-crimson-fate': {
      name: 'Destructive Fate (Ker) in Blood-Crimsoned Cloak Dragging the Slain',
      type: 'divine_fx',
      zone: 'Z03',
      lines: '18.535–538',
      greek: 'ἐν δ᾽ Ἔρις ἐν δὲ Κυδοιμὸς ὁμίλεον, ἐν δ᾽ ὀλοὴ Κήρ... εἷμα δ᾽ ἔχ᾽ ἀμφ᾽ ὤμοισι δαφοινεὸν αἵματι φωτῶν',
      role: 'Battle Daimon',
      comp: at('Crimson Ker dragging the slain', [
        [fig({
          role: 'Destructive Fate (Κήρ)',
          skin: C.white,
          top: C.dred,
          legs: C.dred,
          arms: C.black,
          face: '3626bp0f',
          hat: ['98366', C.black],
          R: ['3847', C.dred],
          plinthCol: C.dred
        }, 'Ker in Crimson Cloak'), -1.5, 0, 0, 0],
        // Fallen warrior dragged by the feet
        [fig({
          role: 'Fallen Warrior',
          skin: C.yellow,
          top: C.dtan,
          legs: C.rbrown,
          face: '3626bp05',
          hat: ['3844', C.lbg],
          plinthCol: C.dred
        }, 'Wounded Mortal'), 1.5, 0, 2, 0]
      ])
    },
    'divine_fx.eris-and-kydoimos': {
      name: 'Strife (Eris) and Tumult (Kydoimos) Mingling in the Fray',
      type: 'divine_fx',
      zone: 'Z03',
      lines: '18.535–540',
      greek: 'ἐν δ᾽ Ἔρις ἐν δὲ Κυδοιμὸς ὁμίλεον',
      role: 'Personified Battle Daimones',
      comp: group('Eris and Kydoimos', [
        fig({
          role: 'Eris (Strife)',
          skin: C.white,
          top: C.black,
          legs: C.dred,
          face: '3626bp0f',
          hat: ['12890', C.black],
          R: ['3959', C.tRed],
          plinthCol: C.black
        }, 'Eris (Strife)'),
        fig({
          role: 'Kydoimos (Tumult)',
          skin: C.lbg,
          top: C.dbg,
          legs: C.black,
          face: '3626bp39',
          hat: ['98366', C.dbg],
          R: ['4497', C.silver],
          L: ['3876', C.dred],
          plinthCol: C.dbg
        }, 'Kydoimos (Tumult)')
      ])
    },
    'divine_fx.unwearied-sun-and-moon': {
      name: 'The Unwearied Sun and the Full Moon',
      type: 'divine_fx',
      zone: 'Z01',
      lines: '18.484',
      greek: 'Ἠέλιόν τ᾽ ἀκάμαντα Σελήνην τε πλήθουσαν',
      role: 'Cosmic Luminaries',
      comp: KIT.sunAndMoon()
    },
    'divine_fx.constellations-bear-orion': {
      name: 'The Constellations: Pleiades, Hyades, Orion & The Unbathing Bear',
      type: 'divine_fx',
      zone: 'Z01',
      lines: '18.485–489',
      greek: 'Πληϊάδας θ᾽ Ὑάδας τε τό τε σθένος Ὠρίωνος Ἄρκτον θ᾽, ἣν καὶ Ἄμαξαν ἐπίκλησιν καλέουσιν, ἥ τ᾽ αὐτοῦ στρέφεται καί τ᾽ Ὠρίωνα δοκεύει, οἴη δ᾽ ἄμμορός ἐστι λοετρῶν Ὠκεανοῖο',
      role: 'Crown of Heaven',
      comp: KIT.constellations()
    }
  };
}

function buildEnsembleCards() {
  return {
    'ensemble.bridal-torchbearers-and-matrons': {
      name: 'Bridal Torchbearers, Whirling Youths & Admiring Women at Portals',
      type: 'ensemble',
      zone: 'Z02',
      lines: '18.492–496',
      greek: 'κοῦροι δ᾽ ὀρχηστῆρες ἐδίνεον, ἐν δ᾽ ἄρα τοῖσιν αὐλοὶ φόρμιγγές τε βοὴν ἔχον· αἱ δὲ γυναῖκες ἱστάμεναι θαύμαζον ἐπὶ προθύροισιν ἑκάστη',
      role: 'Wedding Procession',
      comp: group('Bridal Procession Ensemble', [
        fig({ top: C.gold, legs: C.white, hat: ['3901', C.dbrown], R: ['3959', C.tOrange] }, 'Torchbearer 1'),
        fig({ top: C.dred, legs: C.white, hat: ['3901', C.black], R: ['3959', C.tOrange] }, 'Torchbearer 2'),
        fig({ top: C.sblue, legs: C.white, hat: ['3901', C.yellow], R: ['95050', C.gold] }, 'Phorminx Player'),
        fig({ top: C.sgreen, legs: C.white, hat: ['3901', C.rbrown], R: ['30374', C.silver] }, 'Aulos Flute Player'),
        fig({ top: C.white, legs: C.lilac, face: '3626bp02', hat: ['12890', C.dbrown] }, 'Matron at Portal 1'),
        fig({ top: C.tan, legs: C.white, face: '3626bp02', hat: ['12890', C.black] }, 'Matron at Portal 2')
      ])
    },
    'ensemble.sacred-circle-elders-and-heralds': {
      name: 'The Elders on Polished Stones & Loud-Voiced Heralds',
      type: 'ensemble',
      zone: 'Z02',
      lines: '18.502–506',
      greek: 'λαοὶ δ᾽ ἀμφοτέροισιν ἐπήπυον ἀμφὶς ἀρωγοί· κήρυκες δ᾽ ἄρα λαὸν ἐρήτυον· οἱ δὲ γέροντες εἵατ᾽ ἐπὶ ξεστοῖσι λίθοισ᾽ ἱερῷ ἐνὶ κύκλῳ',
      role: 'Sacred Circle Council',
      comp: group('Sacred Circle Elders and Heralds', [
        fig({ top: C.white, legs: C.white, face: '3626bp0e', hat: ['3901', C.white], R: ['95049', C.gold] }, 'Elder 1'),
        fig({ top: C.white, legs: C.tan, face: '3626bp0e', hat: ['3901', C.lbg], R: ['95049', C.gold] }, 'Elder 2'),
        fig({ top: C.tan, legs: C.white, face: '3626bp39', hat: ['3901', C.white], R: ['95049', C.gold] }, 'Elder 3'),
        fig({ top: C.dblue, legs: C.white, face: '3626bp0e', hat: ['3901', C.lbg], R: ['95049', C.gold] }, 'Elder 4'),
        fig({ top: C.dred, legs: C.dtan, face: '3626bp05', hat: ['98366', C.silver], R: ['95050', C.silver] }, 'Herald Restraining Crowd 1'),
        fig({ top: C.dred, legs: C.dtan, face: '3626bp05', hat: ['98366', C.silver], R: ['95050', C.silver] }, 'Herald Restraining Crowd 2')
      ])
    },
    'ensemble.besieging-and-besieged-armies': {
      name: 'The Two Glittering Armies & Wall Defenders (Wives, Children, Old Men)',
      type: 'ensemble',
      zone: 'Z03',
      lines: '18.509–515',
      greek: 'τὴν δ᾽ ἑτέρην πόλιν ἀμφὶ δύω στρατοὶ εἵατο λαῶν τεύχεσι λαμπόμενοι... τεῖχος μέν ῥ᾽ ἄλοχοί τε φίλαι καὶ νήπια τέκνα ῥύατ᾽ ἐφεσταότες, μετὰ δ᾽ ἀνέρες οὓς ἔχε γῆρας',
      role: 'Siege Forces & Rampart Guards',
      comp: group('Siege Armies and Wall Defenders', [
        fig({ top: C.nougat, legs: C.rbrown, hat: ['98366', C.gold], R: ['4497', C.silver], L: ['3876', C.gold] }, 'First Army Hoplite 1'),
        fig({ top: C.nougat, legs: C.rbrown, hat: ['3844', C.gold], R: ['3847', C.silver], L: ['3876', C.nougat] }, 'First Army Hoplite 2'),
        fig({ top: C.dbg, legs: C.black, hat: ['98366', C.silver], R: ['4497', C.silver], L: ['3876', C.silver] }, 'Second Army Hoplite 1'),
        fig({ top: C.dbg, legs: C.black, hat: ['3844', C.silver], R: ['3847', C.silver], L: ['3876', C.dred] }, 'Second Army Hoplite 2'),
        fig({ top: C.white, legs: C.sblue, face: '3626bp02', hat: ['12890', C.dbrown] }, 'Beloved Wife on the Wall'),
        fig({ top: C.tan, legs: C.white, face: '3626bp0e', hat: ['3901', C.white], R: ['3957a', C.rbrown] }, 'Aged Defender on the Wall')
      ])
    },
    'ensemble.river-scouts-and-piping-shepherds': {
      name: 'Two Bronze-Clad Scouts & Two Shepherds Piping on the Syrinx',
      type: 'ensemble',
      zone: 'Z03',
      lines: '18.523–526',
      greek: 'τοῖσι δ᾽ ἔπειτ᾽ ἀπάνευθε δύω σκοποὶ εἵατο λαῶν... δύω δ᾽ ἅμ᾽ ἕποντο νομῆες τερπόμενοι σύριγξι· δόλον δ᾽ οὔ τι προνόησαν',
      role: 'River Ambush Actors',
      comp: group('Two Scouts and Two Piping Shepherds', [
        fig({ top: C.nougat, legs: C.dtan, hat: ['98366', C.nougat], R: ['4497', C.nougat], L: ['3876', C.nougat] }, 'Bronze-Clad Scout 1'),
        fig({ top: C.nougat, legs: C.dtan, hat: ['3844', C.nougat], R: ['3847', C.nougat], L: ['3876', C.nougat] }, 'Bronze-Clad Scout 2'),
        fig({ top: C.olive, legs: C.rbrown, hat: ['3901', C.dbrown], R: ['30374', C.tan], L: ['4496', C.rbrown] }, 'Piping Shepherd 1'),
        fig({ top: C.tan, legs: C.rbrown, hat: ['3901', C.rbrown], R: ['30374', C.tan], L: ['4496', C.rbrown] }, 'Piping Shepherd 2')
      ])
    },
    'ensemble.ploughmen-and-reapers': {
      name: 'Ploughmen, Sickle-Reapers, Three Sheaf-Binders & Gathering Boys',
      type: 'ensemble',
      zone: 'Z04',
      lines: '18.542–556',
      greek: 'πολλοὶ δ᾽ ἀροτῆρες ἐν αὐτῇ ζεύγεα δινεύοντες... ἔριθοι ἤμων ὀξείας δρεπάνας ἐν χερσὶν ἔχοντες... τρεῖς δ᾽ ἄρ᾽ ἀμαλλοδετῆρες ἐφέστασαν',
      role: 'Agricultural Laborers',
      comp: group('Ploughmen, Reapers and Sheaf-Binders', [
        fig({ top: C.rbrown, legs: C.dbrown, hat: ['3901', C.dbrown], R: ['3957a', C.rbrown] }, 'Ploughman 1'),
        fig({ top: C.dtan, legs: C.dbrown, hat: ['3901', C.black], R: ['3957a', C.rbrown] }, 'Ploughman 2'),
        fig({ top: C.tan, legs: C.dtan, hat: ['3901', C.rbrown], R: ['37341d', C.silver] }, 'Sickle-Reaper 1'),
        fig({ top: C.tan, legs: C.dtan, hat: ['3901', C.dbrown], R: ['37341d', C.silver] }, 'Sickle-Reaper 2'),
        fig({ top: C.olive, legs: C.rbrown, hat: ['3901', C.black], R: ['4523', C.gold] }, 'Sheaf-Binder (ἀμαλλοδετήρ)'),
        fig({ top: C.white, legs: C.tan, hat: ['3901', C.yellow] }, 'Boy Gathering Handfuls')
      ])
    },
    'ensemble.vintage-maidens-and-youths': {
      name: 'Tender-Minded Maidens & Youths Carrying Woven Baskets of Grapes',
      type: 'ensemble',
      zone: 'Z04',
      lines: '18.567–572',
      greek: 'παρθενικαὶ δὲ καὶ ἠΐθεοι ἀταλὰ φρονέοντες πλεκτοῖς ἐν ταλάροισι φέρον μελιηδέα καρπόν',
      role: 'Vintage Gatherers',
      comp: group('Vintage Maidens and Youths', [
        fig({ top: C.white, legs: C.lilac, face: '3626bp02', hat: ['12890', C.dbrown], R: ['4523', C.tan] }, 'Vintage Maiden 1'),
        fig({ top: C.sblue, legs: C.white, face: '3626bp02', hat: ['12890', C.yellow], R: ['4523', C.tan] }, 'Vintage Maiden 2'),
        fig({ top: C.tan, legs: C.white, hat: ['3901', C.dbrown], R: ['4523', C.tan] }, 'Vintage Youth 1'),
        fig({ top: C.gold, legs: C.white, hat: ['3901', C.black], R: ['4523', C.tan] }, 'Vintage Youth 2')
      ])
    },
    'ensemble.four-golden-herdsmen': {
      name: 'The Four Golden Herdsmen (νομῆες χρύσειοι τέσσαρες)',
      type: 'ensemble',
      zone: 'Z05',
      lines: '18.577–578',
      greek: 'χρύσειοι δὲ νομῆες ἅμ᾽ ἐστιχόωντο βόεσσι τέσσαρες',
      role: 'Golden Herdsmen',
      comp: group('Four Golden Herdsmen', [
        fig({ skin: C.gold, top: C.gold, legs: C.gold, hat: ['3901', C.gold], R: ['4496', C.gold], plinthCol: C.gold }, 'Golden Herdsman 1'),
        fig({ skin: C.gold, top: C.gold, legs: C.gold, hat: ['3901', C.gold], R: ['4497', C.gold], plinthCol: C.gold }, 'Golden Herdsman 2'),
        fig({ skin: C.gold, top: C.gold, legs: C.gold, hat: ['3901', C.gold], R: ['4496', C.gold], plinthCol: C.gold }, 'Golden Herdsman 3'),
        fig({ skin: C.gold, top: C.gold, legs: C.gold, hat: ['3901', C.gold], R: ['3957a', C.gold], plinthCol: C.gold }, 'Golden Herdsman 4')
      ])
    },
    'ensemble.daedalean-choros-dancers': {
      name: 'Knossian Youths with Golden Swords & Maidens with Fair Garlands, Plus Two Tumblers',
      type: 'ensemble',
      zone: 'Z06',
      lines: '18.593–606',
      greek: 'τῶν δ᾽ αἱ μὲν λεπτὰς ὀθόνας ἔχον, οἱ δὲ χιτῶνας εἵατ᾽ ἐϋννήτους, ἦκα στίλβοντας ἐλαίῳ· καί ῥ᾽ αἱ μὲν καλὰς στεφάνας ἔχον, οἱ δὲ μαχαίρας εἶχον χρυσείας ἐξ ἀργυρέων τελαμώνων... δοιὼ δὲ κυβιστητῆρε κατ᾽ αὐτοὺς μολπῆς ἐξάρχοντες ἐδίνευον κατὰ μέσσους',
      role: 'Daedalean Choros & Tumblers',
      comp: group('Daedalean Choros and Two Tumblers', [
        fig({ top: C.white, legs: C.white, face: '3626bp02', hat: ['39262', C.gold] }, 'Maiden with Fair Garland 1'),
        fig({ top: C.gold, legs: C.silver, hat: ['3901', C.dbrown], R: ['3847', C.gold] }, 'Youth with Golden Sword on Silver Belt 1'),
        fig({ top: C.white, legs: C.lilac, face: '3626bp02', hat: ['39262', C.gold] }, 'Maiden with Fair Garland 2'),
        fig({ top: C.gold, legs: C.silver, hat: ['3901', C.black], R: ['3847', C.gold] }, 'Youth with Golden Sword on Silver Belt 2'),
        fig({ top: C.sblue, legs: C.gold, hat: ['3901', C.yellow] }, 'Acrobatic Tumbler 1 (κυβιστητήρ)'),
        fig({ top: C.dred, legs: C.gold, hat: ['3901', C.rbrown] }, 'Acrobatic Tumbler 2 (κυβιστητήρ)')
      ])
    }
  };
}

function buildCreatureCards() {
  return {
    'creature.gold-and-tin-oxen': {
      name: 'Herd of Lofty-Horned Oxen in Gold and Tin',
      type: 'creature',
      zone: 'Z05',
      lines: '18.573–574',
      greek: 'ἐν δ᾽ ἀγέλην ποίησε βοῶν ὀρθοκραιράων· αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέρου τε',
      role: 'Pastoral Herd',
      comp: group('Oxen of Gold and Tin', [
        KIT.ox(C.gold, C.silver, 'Golden Ox 1'),
        KIT.ox(C.lbg, C.gold, 'Tin Ox 1'),
        KIT.ox(C.gold, C.silver, 'Golden Ox 2'),
        KIT.ox(C.lbg, C.gold, 'Tin Ox 2')
      ])
    },
    'creature.two-terrible-lions-and-bull': {
      name: 'Two Terrible Lions Seizing the Bellowing Bull',
      type: 'creature',
      zone: 'Z05',
      lines: '18.579–583',
      greek: 'σμερδαλέω δὲ λέοντε δύ᾽ ἐν πρώτῃσι βόεσσιν ταῦρον ἐρύγμηλον ἐχέτην· ὁ δὲ μακρὰ μεμυκὼς ἕλκετο',
      role: 'Predator Attack',
      comp: at('Two Terrible Lions and the Bellowing Bull', [
        [KIT.lion(C.nougat, C.gold, 'Terrible Lion 1'), -4, 0, 1, 0],
        [KIT.ox(C.gold, C.dred, 'Bellowing Bull (ταῦρος ἐρύγμηλος)'), 0, 0, 0, 0],
        [KIT.lion(C.nougat, C.dbrown, 'Terrible Lion 2'), 4, 0, 3, 0]
      ])
    },
    'creature.nine-swift-dogs': {
      name: 'Nine Swift-Footed Dogs Barking and Darting Back',
      type: 'creature',
      zone: 'Z05',
      lines: '18.578, 584–586',
      greek: 'κύνες πόδας ἀργοὶ ἕποντο ἐννέα... ἵσταντο δὲ μάλ᾽ ἐγγύς, ὑλάοντές τε καὶ ἐκτὸς ἀλυσκάζοντες',
      role: 'Herdsmen’s Pack (9 Dogs)',
      comp: group('Nine Swift-Footed Dogs', Array.from({ length: 9 }, (_, i) =>
        KIT.hound(i % 2 ? C.rbrown : C.dtan, `Swift Hound ${i + 1}`)
      ), { maxW: 16 })
    },
    'creature.white-wooled-sheep-flock': {
      name: 'Fair Flock of White-Wooled Sheep',
      type: 'creature',
      zone: 'Z05',
      lines: '18.529, 587–589',
      greek: 'πώεα καλὰ ὀΐων ἀργεννάων... νομὸν ποίησε μέγαν ὀΐων ἀργεννάων',
      role: 'Pastoral Flock',
      comp: group('White-Wooled Sheep Flock', [
        KIT.sheep(C.white, 'White Sheep Pair 1'),
        KIT.sheep(C.white, 'White Sheep Pair 2'),
        KIT.sheep(C.white, 'White Sheep Pair 3')
      ])
    },
    'creature.nimble-cavalry-horses': {
      name: 'Nimble-Footed Horses of the Besiegers',
      type: 'creature',
      zone: 'Z03',
      lines: '18.531–532',
      greek: 'αὐτίκ᾽ ἐφ᾽ ἵππων βάντες ἀερσιπόδων μετεκίαθον',
      role: 'Cavalry Mounts',
      comp: group('Nimble-Footed Horses', [
        KIT.horse(C.rbrown, 'War Horse 1'),
        KIT.horse(C.black, 'War Horse 2')
      ])
    }
  };
}

function buildPropAndEnvironmentCards() {
  return {
    'prop.two-talents-of-gold': {
      name: 'The Two Talents of Gold on the Agora Judgment Stone',
      type: 'prop',
      zone: 'Z02',
      lines: '18.507–508',
      greek: 'κεῖτο δ᾽ ἄρ᾽ ἐν μέσσοισι δύω χρυσοῖο τάλαντα, τῷ δόμεν ὃς μετὰ τοῖσι δίκην ἰθύντατα εἴποι',
      role: 'Legal Prize (δύω τάλαντα)',
      comp: KIT.twoTalentsOfGold()
    },
    'prop.self-moving-tripod': {
      name: 'Hephaestus’s Golden-Wheeled Self-Moving Tripod',
      type: 'prop',
      zone: 'Z01',
      lines: '18.373–377',
      greek: 'τρίποδας... χρύσεα δέ σφ᾽ ὑπὸ κύκλα ἑκάστῳ πυθμένι θῆκεν, ὄφρά οἱ αὐτόματοι θεῖον δυσαίατ᾽ ἀγῶνα',
      role: 'Automaton of the Forge',
      comp: KIT.tripod()
    },
    'prop.silver-baldric-and-triple-rim': {
      name: 'The Silver Baldric & Triple Glittering Border',
      type: 'prop',
      zone: 'Z01',
      lines: '18.479–480',
      greek: 'περὶ δ᾽ ἄντυγα βάλλε φαεινὴν τρίπλακα μαρμαρέην, ἐκ δ᾽ ἀργύρεον τελαμῶνα',
      role: 'Shield Rim & Strap',
      comp: KIT.silverBaldric()
    },
    'prop.potters-wheel-comparison': {
      name: 'The Potter’s Trial Wheel (Homeric Simile for the Choros)',
      type: 'prop',
      zone: 'Z06',
      lines: '18.600–601',
      greek: 'ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται, αἴ κε θέῃσιν',
      role: 'Simile Apparatus',
      comp: KIT.pottersWheel()
    },
    'set_piece.blackening-golden-furrow': {
      name: 'The Thrice-Ploughed Furrow (Golden Glebe Turning Black Behind)',
      type: 'set_piece',
      zone: 'Z04',
      lines: '18.548–549',
      greek: 'ἡ δὲ μελαίνετο ὄπισθεν, ἀρηρομένῃ δὲ ἐῴκει χρυσείη περ ἐοῦσα· τὸ δὴ περὶ θαῦμα τέτυκτο',
      role: 'Memory-Model State Transition',
      comp: KIT.blackeningFurrow(14)
    },
    'set_piece.kyanos-trench-and-tin-fence': {
      name: 'Dark-Blue Kyanos Trench, Fence of Tin & Golden Vines on Silver Poles',
      type: 'set_piece',
      zone: 'Z04',
      lines: '18.561–566',
      greek: 'ἀμφὶ δὲ κυανέην κάπετον, περὶ δ᾽ ἕρκος ἔλασσε κασσιτέροιο· μία δ᾽ οἴη ἀταρπὸς ἐπ᾽ αὐτὴν',
      role: 'Metallurgical Enclosure',
      comp: at('Vineyard Enclosure and Golden Vines', [
        [KIT.goldenVineRow(10), 0, -2, 0, 0],
        [KIT.kyanosTrenchAndTinFence(12), 0, 2, 0, 0]
      ])
    },
    'set_piece.oak-sacrifice-feast': {
      name: 'The Sacrificial Oak, Roasted Ox & White Barley Meal Table',
      type: 'set_piece',
      zone: 'Z04',
      lines: '18.558–560',
      greek: 'κήρυκες δ᾽ ἀπάνευθε ὑπὸ δρυῒ δαῖτα πένοντο, βοῦν δ᾽ ἱερεύσαντες μέγαν ἄμφεπον· αἱ δὲ γυναῖκες δεῖπνον ἐρίθοισιν λεύκ᾽ ἄλφιτα πολλὰ πάλυνον',
      role: 'Harvest Feast',
      comp: KIT.sacrificialOakAndFeast()
    },
    'environment.river-oceanus-rim': {
      name: 'The Mighty Strength of the River Oceanus Around the Extreme Rim',
      type: 'environment',
      zone: 'Z06',
      lines: '18.607–608',
      greek: 'ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο',
      role: 'Cosmic Boundary',
      comp: KIT.oceanusWave(12)
    },
    'sound_source.lyres-flutes-and-syrinx': {
      name: 'Acoustic Instruments of the Shield: Bridal Aulos, Linus Phorminx & Herdsmen’s Syrinx',
      type: 'sound_source',
      zone: 'Z04',
      lines: '18.495, 526, 569–570',
      greek: 'αὐλοὶ φόρμιγγές τε βοὴν ἔχον... τερπόμενοι σύριγξι... πάϊς φόρμιγγι λιγείῃ ἱμερόεν κιθάριζε',
      role: 'Diegetic Soundscape',
      comp: group('Instruments of the Shield', [
        fig({ top: C.sblue, legs: C.white, hat: ['3901', C.yellow], R: ['95050', C.gold] }, 'Phorminx Lyre Player'),
        fig({ top: C.sgreen, legs: C.white, hat: ['3901', C.dbrown], R: ['30374', C.silver] }, 'Bridal Aulos Player'),
        fig({ top: C.olive, legs: C.rbrown, hat: ['3901', C.rbrown], R: ['30374', C.tan] }, 'Syrinx Pipe Shepherd')
      ])
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. THE 12 HERO LOCATION SETS (WITH SPATIAL MARKS FOR SCENE BLOCKING)
   ═══════════════════════════════════════════════════════════════════════════ */

const M = (x, z, face = 0, note = '') => ({ x, z, face, note });

function buildLocationSets() {
  return {
    // 1. Hephaestus's Forge (18.468-482)
    'location.hephaestus-forge': {
      name: 'Hephaestus’s Bronze Foundry & Twenty Tripods',
      zone: 'Z01',
      lines: '18.468–482',
      greek: 'βῆ δ᾽ ἐπὶ φύσας... ἐν δ᾽ ἐτίθει πυρὶ χαλκὸν ἀτειρέα κασσίτερόν τε καὶ χρυσὸν τιμῆντα καὶ ἄργυρον',
      size: [28, 24],
      marks: {
        hephaestus: M(0, 3, 0, 'At the great anvil block'),
        thetis: M(-6, 4, 1, 'Watching beside the silver-inlaid throne'),
        tripod1: M(-8, -4, 0, 'Self-moving tripod West'),
        tripod2: M(8, -4, 0, 'Self-moving tripod East'),
        baldric: M(6, 4, 3, 'Finished triple rim & silver strap')
      },
      comp: at('Hephaestus Foundry Set', [
        [REAL('foundry floor', [
          ...slabParts(-14, -12, 28, 24, C.dbg, 0),
          ...coursing(C.black, -13.5, 13.5, -11.5, 5, { base: -8, band: C.gold }),
          ...coursing(C.dbg, -11.5, 5.5, -13.5, 4, { alongZ: true, base: -8 }),
          ...coursing(C.dbg, -11.5, 5.5, 13.5, 4, { alongZ: true, base: -8 })
        ]), 0, 0, 0, 0],
        [KIT.anvilAndForge(), 0, -2, 0, -8],
        [KIT.tripod('Tripod W'), -9, -6, 0, -8],
        [KIT.tripod('Tripod E'), 9, -6, 0, -8],
        [KIT.column(5, C.nougat, C.gold), -11, -9, 0, -8],
        [KIT.column(5, C.nougat, C.gold), 11, -9, 0, -8]
      ])
    },

    // 2. The Cosmic Boss (18.483-490)
    'location.cosmic-boss': {
      name: 'The Five-Fold Cosmic Vault (Earth, Heaven, Sea & Stars)',
      zone: 'Z01',
      lines: '18.483–490',
      greek: 'Ἐν μὲν γαῖαν ἔτευξ᾽, ἐν δ᾽ οὐρανόν, ἐν δὲ θάλασσαν, Ἠέλιόν τ᾽ ἀκάμαντα Σελήνην τε πλήθουσαν',
      size: [28, 28],
      marks: {
        sun: M(-6, 0, 0, 'West quadrant: Unwearied Sun'),
        moon: M(6, 0, 0, 'East quadrant: Full Moon'),
        bear: M(0, -6, 0, 'North Pole: The Bear/Wain revolving'),
        orion: M(0, 6, 2, 'South quadrant: Might of Orion')
      },
      comp: at('Cosmic Boss Set', [
        [REAL('five-fold cosmic boss', [
          // Fold 1: Bronze base
          ...slabParts(-14, -14, 28, 28, C.nougat, 0),
          // Fold 2: Tin ring
          ...slabParts(-12, -12, 24, 24, C.lbg, -8),
          // Fold 3: Kyanos heaven & sea dome
          ...slabParts(-10, -10, 20, 20, C.dblue, -16),
          // Fold 4: Earth & Sea central island
          ...slabParts(-6, -6, 12, 12, C.green, -24),
          // Fold 5: Golden umbilical boss (ὀμφαλός)
          R('50990a', C.gold, 0, 0, -32),
          R('3960', C.tYellow, 0, 0, -40)
        ]), 0, 0, 0, 0],
        [KIT.sunAndMoon(), 0, -8, 0, -24],
        [KIT.constellations(), 0, 4, 0, -24]
      ])
    },

    // 3. City at Peace I: Bridal Street (18.491-496)
    'location.peace-bridal-street': {
      name: 'Colonnaded Street & Portals of the City at Peace',
      zone: 'Z02',
      lines: '18.491–496',
      greek: 'Ἐν δὲ δύω ποίησε πόλεις μερόπων ἀνθρώπων καλάς· ἐν τῇ μέν ῥα γάμοι τ᾽ ἔσαν εἰλαπίναι τε',
      size: [30, 24],
      marks: {
        bride: M(-2, 2, 1, 'Center of the torchlit wedding procession'),
        bridegroom: M(2, 2, 1, 'Leading the bride from her chamber'),
        dancers: M(0, 6, 0, 'Whirling in a circle to flutes and lyres'),
        portals: M(0, -5, 0, 'Women admiring at the house portals')
      },
      comp: at('Peace City Bridal Street', [
        [REAL('paved street and portals', [
          ...slabParts(-15, -12, 30, 24, C.tan, 0),
          // Flagstone wedding avenue
          ...slabParts(-14, -2, 28, 8, C.lbg, -8),
          // Back wall with three house portals (ἐπὶ προθύροισιν)
          ...coursing(C.white, -14.5, 14.5, -9.5, 6, {
            base: -8,
            band: C.gold,
            holes: [[-10.5, -7.5, 0, 4], [-1.5, 1.5, 0, 4], [7.5, 10.5, 0, 4]]
          }),
          // Golden lintels over the portals
          R('3455', C.gold, -9, -9.5, -128),
          R('3455', C.gold, 0, -9.5, -128),
          R('3455', C.gold, 9, -9.5, -128)
        ]), 0, 0, 0, 0],
        [KIT.column(5, C.white, C.gold), -12, -6, 0, -8],
        [KIT.column(5, C.white, C.gold), -5, -6, 0, -8],
        [KIT.column(5, C.white, C.gold), 5, -6, 0, -8],
        [KIT.column(5, C.white, C.gold), 12, -6, 0, -8]
      ])
    },

    // 4. City at Peace II: The Sacred Circle & Agora (18.497-508)
    'location.peace-agora-circle': {
      name: 'The Agora & Sacred Circle of Polished Stones',
      zone: 'Z02',
      lines: '18.497–508',
      greek: 'λαοὶ δ᾽ εἰν ἀγορῇ ἔσαν ἀθρόοι· ἔνθα δὲ νεῖκος ὠρώρει, δύο δ᾽ ἄνδρες ἐνείκεον εἵνεκα ποινῆς',
      size: [30, 28],
      marks: {
        talents: M(0, 0, 0, 'Center: Two talents of gold'),
        payer: M(-3, 1, 1, 'Payer litigant appealing to the people'),
        denier: M(3, 1, 3, 'Denier litigant refusing payment'),
        elder: M(0, -4, 0, 'Rising elder speaking judgment with staff'),
        elders: M(0, -7, 0, 'Seated elders in the sacred circle'),
        heralds: M(0, 6, 2, 'Heralds holding back the shouting crowd')
      },
      comp: at('Agora Sacred Circle Set', [
        [REAL('agora pavement', [
          ...slabParts(-15, -14, 30, 28, C.lbg, 0),
          // Circular ring of the Sacred Circle (ἱερῷ ἐνὶ κύκλῳ) in white & gold plates
          ...slabParts(-9, -9, 18, 18, C.tan, -8),
          ...slabParts(-6, -6, 12, 12, C.dblue, -16)
        ]), 0, 0, 0, 0],
        // 8 Polished Stone Seats arranged in a circle around the center!
        ...Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI * 2) / 8;
          return [KIT.elderSeat(C.white), Math.round(Math.cos(a) * 8), Math.round(Math.sin(a) * 8), i % 4, -8];
        }),
        [KIT.twoTalentsOfGold(), 0, 0, 0, -16],
        [KIT.column(6, C.white, C.gold), -12, -10, 0, -8],
        [KIT.column(6, C.white, C.gold), 12, -10, 0, -8]
      ])
    },

    // 5. City at War I: Besieged Ramparts (18.509-519)
    'location.war-city-walls': {
      name: 'The Besieged Citadel Walls & Scaean Gate',
      zone: 'Z03',
      lines: '18.509–519',
      greek: 'Τὴν δ᾽ ἑτέρην πόλιν ἀμφὶ δύω στρατοὶ εἵατο λαῶν τεύχεσι λαμπόμενοι',
      size: [32, 26],
      marks: {
        ares: M(-4, 2, 0, 'Golden Ares leading the sortie'),
        athena: M(4, 2, 0, 'Golden Pallas Athena leading the sortie'),
        armies: M(0, 7, 2, 'Two glittering armies before the walls'),
        wall_defenders: M(0, -6, 0, 'Wives, children, and elders on the battlements')
      },
      comp: at('Besieged Citadel Walls Set', [
        [REAL('citadel ramparts', [
          ...slabParts(-16, -13, 32, 26, C.dtan, 0),
          // Great crenellated stone wall of the besieged city
          ...coursing(C.lbg, -14.5, 14.5, -5.5, 7, {
            base: -8,
            plinth: C.dbg,
            band: C.nougat,
            holes: [[-2.5, 2.5, 0, 4]]
          }),
          // Crenellations along the rampart walk
          ...[-13, -10, -7, -4, 4, 7, 10, 13].map(x => R('3003', C.lbg, x, -5.5, -176)),
          // Flanking bastion towers
          ...coursing(C.dbg, -8.5, -3.5, -14.5, 8, { alongZ: true, base: -8 }),
          ...coursing(C.dbg, -8.5, -3.5, 14.5, 8, { alongZ: true, base: -8 })
        ]), 0, 0, 0, 0]
      ])
    },

    // 6. City at War II: River Ambush (18.520-540)
    'location.war-river-ambush': {
      name: 'The River Watering-Place & Reed Ambush Bank',
      zone: 'Z03',
      lines: '18.520–540',
      greek: 'οἱ δ᾽ ὅτε δή ῥ᾽ ἵκανον ὅθι σφίσιν εἶκε λοχῆσαι, ἐν ποταμῷ, ὅθι τ᾽ ἀρδμὸς ἔην πάντεσσι βοτοῖσιν',
      size: [32, 26],
      marks: {
        scouts: M(-8, -3, 1, 'Two scouts crouched in the river reeds'),
        herds: M(0, 0, 3, 'Oxen and white sheep at the watering-place'),
        ker: M(3, 5, 0, 'Crimson Ker dragging the slain through the battle'),
        eris: M(-4, 5, 1, 'Eris and Kydoimos clashing on the bank'),
        cavalry: M(9, 4, 3, 'Besiegers charging on nimble horses')
      },
      comp: at('River Ambush Set', [
        [REAL('river watering-place', [
          ...slabParts(-16, -13, 32, 26, C.dtan, 0),
          // Winding river channel (ἐν ποταμῷ) in kyanos blue + trans-dark-blue
          ...slabParts(-16, -4, 32, 7, C.dblue, -8),
          ...slabParts(-16, -3, 32, 5, C.tDBlue, -16),
          // Waving reeds & ambush rocks along the bank
          R('53934p01c01', C.dbg, -10, -6, -8),
          R('42291', C.dbg, 10, -6, -8),
          ...[-12, -8, -4, 4, 8, 12].map(x => R('6255', C.olive, x, -4.5, -16)),
          ...[-10, -6, 6, 10].map(x => R('2417', C.dgreen, x, 3.5, -8))
        ]), 0, 0, 0, 0]
      ])
    },

    // 7. Labors of the Field I: Thrice-Ploughed Fallow (18.541-549)
    'location.field-plough-fallow': {
      name: 'The Soft Thrice-Ploughed Fallow (Golden Glebe Turning Black)',
      zone: 'Z04',
      lines: '18.541–549',
      greek: 'Ἐν δ᾽ ἐτίθει νειὸν μαλακὴν, πίειραν ἄρουραν, εὐρεῖαν τρίπολον... ἡ δὲ μελαίνετο ὄπισθεν',
      size: [32, 26],
      marks: {
        ploughmen: M(-2, 0, 1, 'Ploughmen turning their yoked teams in the furrow'),
        oxen: M(4, 0, 1, 'Yoked oxen pulling the bronze plough'),
        cupbearer: M(11, 0, 3, 'Man at the headland offering the cup of sweet wine')
      },
      comp: at('Thrice-Ploughed Fallow Set', [
        [REAL('fallow headland', [
          ...slabParts(-16, -13, 32, 26, C.gold, 0),
          // Three parallel furrows (τρίπολον) where golden earth turns black behind
          ...slabParts(-14, -9, 14, 4, C.black, -8),
          ...slabParts(-14, -2, 18, 4, C.black, -8),
          ...slabParts(-14, 5, 10, 4, C.black, -8),
          ...slabParts(0, -9, 14, 4, C.dbrown, -8),
          ...slabParts(4, -2, 10, 4, C.gold, -8),
          ...slabParts(-4, 5, 18, 4, C.gold, -8)
        ]), 0, 0, 0, 0],
        [KIT.blackeningFurrow(16), 0, 0, 0, -8]
      ])
    },

    // 8. Labors of the Field II: King's Harvest & Oak Feast (18.550-560)
    'location.field-harvest-oak': {
      name: 'The Deep-Corn Harvest Field & Sacrificial Oak',
      zone: 'Z04',
      lines: '18.550–560',
      greek: 'Ἐν δ᾽ ἐτίθει τέμενος βαθύληϊον· ἔνθα δ᾽ ἔριθοι ἤμων ὀξείας δρεπάνας ἐν χερσὶν ἔχοντες',
      size: [32, 26],
      marks: {
        king: M(0, 2, 0, 'The King standing in silence at his staff, rejoicing'),
        reapers: M(-6, 0, 1, 'Reapers cutting the deep corn with sickles and sheaf-binders'),
        feast: M(8, -4, 0, 'Heralds under the oak sacrificing the ox & women strewing barley')
      },
      comp: at('King Harvest Set', [
        [REAL('deep-corn royal temenos', [
          ...slabParts(-16, -13, 32, 26, C.tan, 0),
          // Standing golden grain stalks on the left
          ...[-13, -11, -9, -7, -5].flatMap(x => [-6, -3, 0, 3, 6].map(z => R('3062b', C.gold, x, z, -8))),
          ...[-13, -11, -9, -7, -5].flatMap(x => [-6, -3, 0, 3, 6].map(z => R('4589', C.yellow, x, z, -32))),
          // Bound golden sheaves lying along the furrow
          ...[-2, 1, 4].map(x => R('3004', C.gold, x, -3, -8))
        ]), 0, 0, 0, 0],
        [KIT.sacrificialOakAndFeast(), 8, -4, 0, -8]
      ])
    },

    // 9. Labors of the Field III: The Golden Vineyard (18.561-572)
    'location.field-golden-vineyard': {
      name: 'The Golden Vineyard with Kyanos Trench, Tin Fence & Single Path',
      zone: 'Z04',
      lines: '18.561–572',
      greek: 'Ἐν δ᾽ ἐτίθει σταφυλῇσι μέγα βρίθουσαν ἀλωὴν καλὴν χρυσείην· μέλανες δ᾽ ἀνὰ βότρυες ἦσαν',
      size: [32, 26],
      marks: {
        linus_boy: M(0, 1, 0, 'Boy in the midst playing the shrill lyre and singing the Linus song'),
        gatherers: M(-4, 4, 1, 'Maidens and youths carrying sweet fruit in woven baskets'),
        path: M(0, 8, 0, 'The single path across the kyanos trench')
      },
      comp: at('Golden Vineyard Set', [
        [REAL('vineyard ground', [...slabParts(-16, -13, 32, 26, C.dtan, 0)]), 0, 0, 0, 0],
        [KIT.goldenVineRow(14), 0, -6, 0, -8],
        [KIT.goldenVineRow(14), 0, -2, 0, -8],
        [KIT.kyanosTrenchAndTinFence(16), 0, 5, 0, -8]
      ])
    },

    // 10. Pastoral I: Cattle, River & Lions (18.573-586)
    'location.pastoral-river-byre': {
      name: 'The Murmuring River, Waving Reeds & Cattle Pasture',
      zone: 'Z05',
      lines: '18.573–586',
      greek: 'αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέρου τε, μυκηθμῷ δ᾽ ἀπὸ κόπρου ἐπεσσεύοντο νομόνδε πὰρ ποταμὸν κελάδοντα, παρὰ ῥοδανὸν δονακῆα',
      size: [34, 26],
      marks: {
        lions_bull: M(-5, 1, 0, 'Two terrible lions seizing the bellowing bull in front'),
        oxen: M(5, -2, 3, 'Herd of gold and tin oxen rushing from byre to pasture'),
        herdsmen: M(2, 4, 3, 'Four golden herdsmen pressing up'),
        dogs: M(-1, 5, 3, 'Nine swift dogs barking and darting back')
      },
      comp: at('Pastoral River and Cattle Byre Set', [
        [REAL('pasture and murmuring river', [
          ...slabParts(-17, -13, 34, 26, C.green, 0),
          // Murmuring river along the front/back (πὰρ ποταμὸν κελάδοντα)
          ...slabParts(-17, -11, 34, 5, C.dblue, -8),
          ...slabParts(-17, -10, 34, 3, C.tDBlue, -16),
          // Waving reed bed (παρὰ ῥοδανὸν δονακῆα)
          ...[-14, -10, -6, -2, 2, 6, 10, 14].map(x => R('6255', C.olive, x, -6, -8)),
          // Timber cattle byre (κόπρος) on the right
          ...coursing(C.rbrown, 8.5, 15.5, -4.5, 4, { base: -8 }),
          ...slabParts(8, -5, 8, 5, C.dtan, -104)
        ]), 0, 0, 0, 0]
      ])
    },

    // 11. Pastoral II: White Sheep Glen (18.587-589)
    'location.pastoral-sheep-glen': {
      name: 'The Fair Wooded Glen, Sheepfolds & Roofed Steadings',
      zone: 'Z05',
      lines: '18.587–589',
      greek: 'Ἐν δὲ νομὸν ποίησε περικλυτὸς Ἀμφιγυήεις ἐν καλῇ βήσσῃ μέγαν οἰῶν ἀργεννάων, σταθμούς τε κλισίας τε κατηρεφέας ἰδὲ σηκούς',
      size: [30, 24],
      marks: {
        flock: M(0, 3, 0, 'White-wooled sheep grazing the glen'),
        herdsmen: M(-6, 4, 1, 'Shepherds watching by the fold')
      },
      comp: at('Sheep Glen Set', [
        [REAL('wooded glen floor', [
          ...slabParts(-15, -12, 30, 24, C.sgreen, 0),
          R('3470', C.olive, -11, -7, -8),
          R('3471', C.dgreen, 11, -7, -8),
          R('3778', C.dgreen, -12, 5, -8),
          R('3470', C.green, 12, 5, -8)
        ]), 0, 0, 0, 0],
        [KIT.shepherdSteading(), 0, -3, 0, -8]
      ])
    },

    // 12. Zone VI: The Daedalean Choros & River Oceanus Rim (18.590-608)
    'location.choros-oceanus-court': {
      name: 'The Daedalean Dancing Floor of Knossos & River Oceanus Rim',
      zone: 'Z06',
      lines: '18.590–608',
      greek: 'Ἐν δὲ χορὸν ποίκιλλε περικλυτὸς Ἀμφιγυήεις, τῷ ἴκελον οἷόν ποτ᾽ ἐνὶ Κνωσῷ εὐρείῃ Δαίδαλος ἤσκησεν καλλιπλοκάμῳ Ἀριάδνῃ... ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο',
      size: [34, 28],
      marks: {
        dancers: M(0, 0, 0, 'Youths and maidens whirling like a potter’s wheel and in rows'),
        tumblers: M(0, 2, 0, 'Two tumblers spinning in the midst'),
        potter: M(-10, 4, 1, 'Potter testing the wheel fitted to his hands'),
        crowd: M(9, 4, 3, 'Delighted crowd standing around the choros')
      },
      comp: at('Daedalean Choros and Oceanus Set', [
        [REAL('knossos labyrinth mosaic floor', [
          ...slabParts(-17, -14, 34, 28, C.tan, 0),
          // Labyrinthine checkered mosaic court in white, gold, and kyanos blue
          ...Array.from({ length: 8 }, (_, ix) =>
            Array.from({ length: 8 }, (__, iz) =>
              R('3022', (ix + iz) % 2 === 0 ? C.white : ((ix + iz) % 4 === 1 ? C.gold : C.dblue), -7 + ix * 2, -7 + iz * 2, -8)
            )
          ).flat()
        ]), 0, 0, 0, 0],
        [KIT.column(6, C.dred, C.gold), -10, -6, 0, -8],
        [KIT.column(6, C.dred, C.gold), 10, -6, 0, -8],
        [KIT.pottersWheel(), -11, 5, 0, -8],
        [KIT.oceanusWave(16), 0, -11, 0, -8]
      ])
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. THE 12 DIRECTED REHEARSAL SCENES & PREVIS TIMELINES
   ═══════════════════════════════════════════════════════════════════════════ */

function buildScenes(locs, chars, divs, ens, creas, props) {
  return [
    {
      id: 'ACH-Z01-S01',
      name: 'Zone I · Scene 1: Hephaestus’s Forge & The Five-Fold Shield',
      zone: 'Z01',
      zoneTitle: 'The Construction and Cosmic Design (478–490)',
      lines: '18.468–482',
      greek: 'Πρῶταคลὲν σάκος ποίει μέγα τε στιβαρόν τε πάντοσε δαιδάλλων, περὶ δ᾽ ἄντυγα βάλλε φαεινὴν τρίπλακα μαρμαρέην, ἐκ δ᾽ ἀργύρεον τελαμῶνα.',
      buckley: 'First of all he formed a shield, both large and solid, adorning it all over; and around it he threw a shining border, triple, glittering; and from it suspended a silver belt. Five were the folds of the shield itself; but on it he formed many ornaments with cunning skill.',
      locationId: 'location.hephaestus-forge',
      cast: [
        ['character.hephaestus', 'hephaestus'],
        ['character.thetis', 'thetis'],
        ['prop.self-moving-tripod', 'tripod1'],
        ['prop.silver-baldric-and-triple-rim', 'baldric']
      ],
      worldModel: {
        vision: 'Crucible glow of bronze (28), tin (71), gold (297), and silver (179) ingots against basalt forge walls (72); twenty golden-wheeled tripods.',
        memory: 'Twenty bellows blow into the crucibles by degree as Hephaestus’s work requires; five metallic folds laminate into a single world-surface.',
        controller: 'Hephaestus hammers the five folds on the great anvil while silver-footed Thetis receives the operative world-shield.'
      },
      shots: [
        { name: 'The Roaring Bellows', beat: 'Hephaestus turns his twenty bellows to the fire and casts bronze, tin, priceless gold, and silver into the flame.', cam: 'crane', target: [0, -40, 0], from: [-180, -140, 260], to: [-120, -90, 210], sec: 4.5, act: { who: 'hephaestus', anim: 'hammer' } },
        { name: 'Silver-Footed Thetis Waits', beat: 'Thetis watches as the great anvil takes the five-fold laminate of the shield.', cam: 'two-shot', target: [-60, -45, 40], from: [80, -70, 220], to: [40, -65, 190], sec: 4.0, act: { who: 'thetis', anim: 'step' } },
        { name: 'The Triple Glittering Rim', beat: 'Around it he throws a shining triple border and suspends from it a silver baldric.', cam: 'orbit', target: [40, -35, 30], from: [160, -95, 180], to: [-140, -85, 200], sec: 4.5, act: { who: 'hephaestus', anim: 'turn' } }
      ]
    },
    {
      id: 'ACH-Z01-S02',
      name: 'Zone I · Scene 2: The Cosmic Boss — Earth, Sky, Sea & The Unbathing Bear',
      zone: 'Z01',
      zoneTitle: 'The Construction and Cosmic Design (478–490)',
      lines: '18.483–490',
      greek: 'Ἐν μὲν γαῖαν ἔτευξ᾽, ἐν δ᾽ οὐρανόν, ἐν δὲ θάλασσαν, Ἠέλιόν τ᾽ ἀκάμαντα Σελήνην τε πλήθουσαν, ἐν δὲ τὰ τείρεα πάντα, τά τ᾽ οὐρανὸς ἐστεφάνωται, Πληϊάδας θ᾽ Ὑάδας τε τό τε σθένος Ὠρίωνος Ἄρκτον θ᾽, ἣν καὶ Ἄμαξαν ἐπίκλησιν καλέουσιν, ἥ τ᾽ αὐτοῦ στρέφεται καί τ᾽ Ὠρίωνα δοκεύει, οἴη δ᾽ ἄμμορός ἐστι λοετρῶν Ὠκεανοῖο.',
      buckley: 'On it he wrought the earth, and the heaven, and the sea, the unwearied sun, and the full moon; on it also, all the constellations with which the heaven is crowned, the Pleiades, the Hyades, and the might of Orion, and the Bear, which they also call by the appellation of the Wain, which there revolves, and watches Orion; but it alone is without a share of the baths of the ocean.',
      locationId: 'location.cosmic-boss',
      cast: [
        ['divine_fx.unwearied-sun-and-moon', 'sun'],
        ['divine_fx.constellations-bear-orion', 'bear']
      ],
      worldModel: {
        vision: 'Central golden omphalos dome surrounded by kyanos sky (272), emerald earth (2), golden Sun (297/46), silver full Moon (179), and star-stud constellations (11609).',
        memory: 'Invariance law: The Bear/Wain (Ἄρκτος) revolves perpetually around the polar axis watching Orion, constrained never to dip below the horizon of Oceanus.',
        controller: 'Cosmological clockwork anchoring all mortal time and agricultural seasons in the outer rings.'
      },
      shots: [
        { name: 'Earth, Heaven, and Sea', beat: 'On the central boss Hephaestus fashions the earth, the overarching heaven, and the deep sea.', cam: 'crane', target: [0, -35, 0], from: [0, -240, 260], to: [0, -130, 200], sec: 4.5, act: { who: 'sun', anim: 'orbit' } },
        { name: 'Unwearied Sun & Full Moon', beat: 'The tireless golden Sun and the full silver Moon shine together across the vault.', cam: 'track', target: [0, -45, -120], from: [-160, -80, 120], to: [160, -80, 120], sec: 4.0, act: { who: 'sun', anim: 'pulse' } },
        { name: 'The Bear Revolves Watching Orion', beat: 'The Bear, called the Wain, revolves in place and watches Orion, alone having no share in the baths of Oceanus.', cam: 'orbit', target: [0, -40, 60], from: [180, -110, 180], to: [-180, -110, 180], sec: 5.0, act: { who: 'bear', anim: 'revolve' } }
      ]
    },
    {
      id: 'ACH-Z02-S01',
      name: 'Zone II · Scene 1: City at Peace — Torchlit Bridal Procession',
      zone: 'Z02',
      zoneTitle: 'The Two Cities: Peace and Law (491–508)',
      lines: '18.491–496',
      greek: 'Ἐν δὲ δύω ποίησε πόλεις μερόπων ἀνθρώπων καλάς. ἐν τῇ μέν ῥα γάμοι τ᾽ ἔσαν εἰλαπίναι τε, νύμφας δ᾽ ἐκ θαλάμων δαΐδων ὕπο λαμπομενάων ἠγίνεον ἀνὰ ἄστυ, πολὺς δ᾽ ὑμέναιος ὀρώρει· κοῦροι δ᾽ ὀρχηστῆρες ἐδίνεον, ἐν δ᾽ ἄρα τοῖσιν αὐλοὶ φόρμιγγές τε βοὴν ἔχον· αἱ δὲ γυναῖκες ἱστάμεναι θαύμαζον ἐπὶ προθύροισιν ἑκάστη.',
      buckley: 'On it also he fashioned two beautiful cities of articulate-speaking men. In the one, indeed, were marriages and feasts; and they were conducting the brides from their chambers through the city with brilliant torches, and many a bridal song was raised. The young men were dancing in a circle, and among them flutes and lyres gave forth their sounds; and the women standing, each at her portals, admired.',
      locationId: 'location.peace-bridal-street',
      cast: [
        ['character.bride', 'bride'],
        ['character.bridegroom', 'bridegroom'],
        ['ensemble.bridal-torchbearers-and-matrons', 'dancers']
      ],
      worldModel: {
        vision: 'White marble colonnades and golden-linteled portals illuminated by trans-orange torches (3959), festive white/gold/lilac chitons, and golden lyres.',
        memory: 'Processional state transition: brides advance from domestic chambers (θάλαμοι) through public avenues as youths whirl in circular dance.',
        controller: 'Civic kinship and celebration: acoustic synchronization of hymenaeus song, aulos flute, and phorminx lyre.'
      },
      shots: [
        { name: 'From the Bridal Chambers', beat: 'Under blazing torches they lead the brides from their chambers through the fair city as the hymenaeus rises.', cam: 'track', target: [0, -45, 20], from: [-220, -85, 200], to: [120, -75, 200], sec: 4.5, act: { who: 'bride', anim: 'procession' } },
        { name: 'Whirling Dancers, Flutes & Lyres', beat: 'Young men whirl in a circle while flutes and lyres sound in their midst.', cam: 'orbit', target: [0, -40, 90], from: [140, -75, 240], to: [-140, -75, 240], sec: 4.5, act: { who: 'dancers', anim: 'spin' } },
        { name: 'Women Admiring at the Portals', beat: 'The women stand, each at her doorway, marveling as the torchlit cortège passes.', cam: 'crane', target: [0, -55, -100], from: [0, -60, 180], to: [0, -120, 260], sec: 4.0, act: { who: 'bridegroom', anim: 'walk' } }
      ]
    },
    {
      id: 'ACH-Z02-S02',
      name: 'Zone II · Scene 2: City at Peace — The Sacred Circle & Blood-Price Trial',
      zone: 'Z02',
      zoneTitle: 'The Two Cities: Peace and Law (491–508)',
      lines: '18.497–508',
      greek: 'λαοὶ δ᾽ εἰν ἀγορῇ ἔσαν ἀθρόοι· ἔνθα δὲ νεῖκος ὠρώρει, δύο δ᾽ ἄνδρες ἐνείκεον εἵνεκα ποινῆς ἀνδρὸς ἀποφθιμένου... οἱ δὲ γέροντες εἵατ᾽ ἐπὶ ξεστοῖσι λίθοισ᾽ ἱερῷ ἐνὶ κύκλῳ, σκῆπτρα δὲ κηρύκων ἐν χέρσ᾽ ἔχον ἠεροφώνων· τοῖσιν ἔπειτ᾽ ἤϊσσον, ἀμοιβηδὶς δὲ δίκαζον. κεῖτο δ᾽ ἄρ᾽ ἐν μέσσοισι δύω χρυσοῖο τάλαντα, τῷ δόμεν ὃς μετὰ τοῖσι δίκην ἰθύντατα εἴποι.',
      buckley: 'But the people were assembled in the forum, for there a strife had arisen, and two men strove for the ransom-money of a slain man; the one affirmed that he had paid all, appealing to the people, but the other denied that he had received any thing; and both wished to find a termination before a judge. The people shouted to both, supporters on either side; and the heralds reined in the people; but the elders sat upon polished stones in a sacred circle, and held in their hands the staves of the loud-shouting heralds; with these then they arose, and adjudged in turn. But there lay in the midst two talents of gold, to give to him who should pronounce a judgment the most correctly.',
      locationId: 'location.peace-agora-circle',
      cast: [
        ['prop.two-talents-of-gold', 'talents'],
        ['character.litigant-payer', 'payer'],
        ['character.litigant-denier', 'denier'],
        ['character.speaker-elder', 'elder'],
        ['ensemble.sacred-circle-elders-and-heralds', 'elders']
      ],
      worldModel: {
        vision: 'Eight polished white stone seats arranged in a sacred circle around a kyanos pavement; two gleaming talents of gold on the central altar.',
        memory: 'Procedural legal algorithm: blood-vendetta is converted into deliberative speech; elders rise in turn (ἀμοιβηδὶς) holding the herald’s sceptre; the two talents reward the straightest judgment (δίκην ἰθύντατα).',
        controller: 'The polis replaces private vengeance with public arbitration.'
      },
      shots: [
        { name: 'The Dispute for the Blood-Price', beat: 'In the agora two men contend over the blood-price of a slain man: one claims he paid all, the other denies receiving anything.', cam: 'two-shot', target: [0, -40, 10], from: [0, -70, 210], to: [50, -60, 175], sec: 4.5, act: { who: 'payer', anim: 'gesture' } },
        { name: 'The Sacred Circle of Polished Stones', beat: 'Heralds hold back the shouting crowd while the elders sit on polished stones in a sacred circle and rise in turn with sceptres.', cam: 'orbit', target: [0, -45, -40], from: [-190, -110, 190], to: [190, -110, 190], sec: 5.0, act: { who: 'elder', anim: 'rise' } },
        { name: 'Two Talents of Gold in the Midst', beat: 'In the center lie two talents of gold, to give to him among them who speaks the straightest judgment.', cam: 'push-in', target: [0, -35, 0], from: [0, -120, 220], to: [0, -55, 115], sec: 4.0, act: { who: 'talents', anim: 'gleam' } }
      ]
    },
    {
      id: 'ACH-Z03-S01',
      name: 'Zone III · Scene 1: City at War — The Besieged Wall & Tall Golden Gods',
      zone: 'Z03',
      zoneTitle: 'The Two Cities: War and Ambush (509–540)',
      lines: '18.509–519',
      greek: 'Τὴν δ᾽ ἑτέρην πόλιν ἀμφὶ δύω στρατοὶ εἵατο λαῶν τεύχεσι λαμπόμενοι, δίχα δέ σφισιν ἥνδανε βουλή, ἠὲ διαπραθέειν ἢ ἄνδιχα πάντα δάσασθαι... ἦρχε δ᾽ ἄρα σφιν Ἄρης καὶ Παλλὰς Ἀθήνη ἄμφω χρυσείω, χρύσεια δὲ εἵματα ἕσθην, καλὼ καὶ μεγάλω σὺν τεύχεσιν, ὥς τε θεώ περ, ἀμφὶς ἀριζήλω· λαοὶ δ᾽ ὑπ᾽ ὀλίζονες ἦσαν.',
      buckley: 'But around the other city sat two armies of people, glittering in arms; and a plan was agreeable to them, either to destroy it entirely, or to divide all the wealth into two parts, which the pleasant city contained within it. But they did not yet obey, but were secretly arming for an ambush; their beloved wives and young children stood upon the wall guarding it, and together with them the men whom old age possessed. But they advanced; and Mars and Pallas Minerva led them, both golden, and clad in golden garments, beautiful and large with their arms, like gods, both very conspicuous; but the people were smaller.',
      locationId: 'location.war-city-walls',
      cast: [
        ['divine_fx.golden-ares', 'ares'],
        ['divine_fx.golden-athena', 'athena'],
        ['ensemble.besieging-and-besieged-armies', 'armies']
      ],
      worldModel: {
        vision: 'Hieratic scale contrast encoded in LDraw geometry: Ares and Pallas Athena are 11-brick-tall golden colossi while mortal warriors and rampart defenders are 4-brick minifigures.',
        memory: 'Binary strategic fork (sack vs. divide wealth in half) rejected by the besieged, triggering the covert ambush transition.',
        controller: 'Divine war-marshals propelling the mortal sortie out from the Scaean ramparts.'
      },
      shots: [
        { name: 'Two Glittering Armies Around the City', beat: 'Around the other city sit two armies glittering in bronze, divided in counsel whether to sack it or divide its wealth.', cam: 'crane', target: [0, -50, 0], from: [-220, -150, 260], to: [120, -110, 220], sec: 4.5, act: { who: 'armies', anim: 'march' } },
        { name: 'Wives, Children & Elders on the Wall', beat: 'Beloved wives, young children, and aged men stand upon the battlements guarding the wall.', cam: 'track', target: [0, -85, -90], from: [-160, -95, 150], to: [160, -95, 150], sec: 4.0, act: { who: 'armies', anim: 'guard' } },
        { name: 'Golden Ares & Pallas Athena Lead the Sortie', beat: 'Ares and Pallas Athena lead them, both golden and clad in golden garments, tall and conspicuous as gods, while the mortal host is smaller.', cam: 'push-in', target: [0, -80, 30], from: [0, -60, 280], to: [0, -75, 150], sec: 5.0, act: { who: 'ares', anim: 'advance' } }
      ]
    },
    {
      id: 'ACH-Z03-S02',
      name: 'Zone III · Scene 2: City at War — The River Ambush & Crimson Ker',
      zone: 'Z03',
      zoneTitle: 'The Two Cities: War and Ambush (509–540)',
      lines: '18.520–540',
      greek: 'οἱ δ᾽ ὅτε δή ῥ᾽ ἵκανον ὅθι σφίσιν εἶκε λοχῆσαι, ἐν ποταμῷ, ὅθι τ᾽ ἀρδμὸς ἔην πάντεσσι βοτοῖσιν, ἔνθ᾽ ἄρα τοί γ᾽ ἵζοντ᾽ εἰλυμένοι αἴθοπι χαλκῷ... ἐν δ᾽ Ἔρις ἐν δὲ Κυδοιμὸς ὁμίλεον, ἐν δ᾽ ὀλοὴ Κήρ, ἄλλον ζωὸν ἔχουσα νεούτατον, ἄλλον ἄουτον, ἄλλον τεθνηῶτα κατὰ μόθον ἕλκε ποδοῖϊν· εἷμα δ᾽ ἔχ᾽ ἀμφ᾽ ὤμοισι δαφοινεὸν αἵματι φωτῶν.',
      buckley: 'But when they now had reached a place where it appeared fit to lay an ambush, by a river, where was a watering-place for all cattle, there they settled, wrapped in shining brass... Then, having formed a line, they fought a battle on the banks of the river, and wounded one another with their brazen spears. Among them mingled Strife and Tumult, and destructive Fate, holding one freshly-wounded, and another unwounded, and by the feet she dragged another, dead, through the affray; and the garment around her shoulders was crimsoned with the blood of men.',
      locationId: 'location.war-river-ambush',
      cast: [
        ['ensemble.river-scouts-and-piping-shepherds', 'scouts'],
        ['creature.white-wooled-sheep-flock', 'herds'],
        ['divine_fx.ker-crimson-fate', 'ker'],
        ['divine_fx.eris-and-kydoimos', 'eris'],
        ['creature.nimble-cavalry-horses', 'cavalry']
      ],
      worldModel: {
        vision: 'Kyanos river watering-place (272/33), bronze scouts in olive reeds, white sheep, charging horses, and Ker in dark-red crimson cloak (320).',
        memory: 'Causal chain: scouts spot herds → ambushers slaughter flocks & piping shepherds → besiegers hear tumult and gallop up → river battle with Eris, Kydoimos, and Ker.',
        controller: 'Acoustic deception (syrinx pipes vs. battle tumult) and mortal vulnerability.'
      },
      shots: [
        { name: 'Two Scouts by the Watering-Place', beat: 'Wrapped in shining bronze by the river watering-place, two scouts watch for the sheep and crooked-horned oxen.', cam: 'track', target: [-120, -35, -40], from: [-220, -70, 160], to: [-60, -55, 140], sec: 4.0, act: { who: 'scouts', anim: 'crouch' } },
        { name: 'Shepherds Piping Unaware of the Fraud', beat: 'Two shepherds follow the flocks, delighting in their syrinx pipes, foreseeing nothing of the ambush.', cam: 'two-shot', target: [0, -35, 0], from: [140, -65, 180], to: [40, -55, 150], sec: 4.5, act: { who: 'herds', anim: 'graze' } },
        { name: 'Eris, Kydoimos & Crimson-Cloaked Ker', beat: 'Cavalry charge to the riverbank; among them mingle Strife, Tumult, and destructive Fate dragging a dead man by the feet in her blood-crimsoned cloak.', cam: 'orbit', target: [40, -40, 80], from: [190, -85, 220], to: [-160, -85, 220], sec: 5.0, act: { who: 'ker', anim: 'drag' } }
      ]
    },
    {
      id: 'ACH-Z04-S01',
      name: 'Zone IV · Scene 1: Labors of the Field — The Thrice-Ploughed Fallow',
      zone: 'Z04',
      zoneTitle: 'The Labors of the Field (541–572)',
      lines: '18.541–549',
      greek: 'Ἐν δ᾽ ἐτίθει νειὸν μαλακὴν, πίειραν ἄρουραν, εὐρεῖαν τρίπολον· πολλοὶ δ᾽ ἀροτῆρες ἐν αὐτῇ ζεύγεα δινεύοντες ἐλάστρεον ἔνθα καὶ ἔνθα... ἡ δὲ μελαίνετο ὄπισθεν, ἀρηρομένῃ δὲ ἐῴκει χρυσείη περ ἐοῦσα· τὸ δὴ περὶ θαῦμα τέτυκτο.',
      buckley: 'On it he also placed a soft fallow field, rich glebe, wide, thrice-ploughed; and in it many ploughmen drove hither and thither, turning round their teams. But when, returning, they reached the end of the field, then a man, advancing, gave into their hands a cup of very sweet wine; but they turned themselves in series, eager to reach the other end of the deep fallow. But it grew black behind, and was like unto ploughed land, though being golden; which was a very great marvel.',
      locationId: 'location.field-plough-fallow',
      cast: [
        ['ensemble.ploughmen-and-reapers', 'ploughmen'],
        ['creature.gold-and-tin-oxen', 'oxen'],
        ['character.headland-cupbearer', 'cupbearer']
      ],
      worldModel: {
        vision: 'Golden field plates (297) progressively flipping to black (0) and dark-brown (308) furrowed tiles behind the bronze ploughshare.',
        memory: 'Iterative loop with state mutation: drive furrow → reach headland → receive cup of sweet wine (δέπας μελιηδέος οἴνου) → turn team → golden metal turns black behind (μελαίνετο).',
        controller: 'Homer’s supreme neurosymbolic marvel (περὶ θαῦμα τέτυκτο): material gold executing the optical state-change of dark earth.'
      },
      shots: [
        { name: 'Driving the Teams Hither and Thither', beat: 'In the wide thrice-ploughed fallow, ploughmen drive their yoked oxen back and forth along the furrows.', cam: 'track', target: [0, -35, 0], from: [-220, -90, 210], to: [140, -80, 210], sec: 4.5, act: { who: 'ploughmen', anim: 'plough' } },
        { name: 'The Cup of Sweet Wine at the Headland', beat: 'Whenever they reach the headland, a man comes forward and puts into their hands a goblet of honey-sweet wine.', cam: 'two-shot', target: [180, -40, 0], from: [260, -65, 160], to: [190, -50, 120], sec: 4.0, act: { who: 'cupbearer', anim: 'toast' } },
        { name: 'The Golden Earth Turns Black Behind', beat: 'Behind them the field grows black and looks like ploughed earth, though wrought of gold — a great marvel of craft.', cam: 'crane', target: [-40, -25, 0], from: [0, -190, 220], to: [-80, -95, 160], sec: 4.5, act: { who: 'oxen', anim: 'furrow_flip' } }
      ]
    },
    {
      id: 'ACH-Z04-S02',
      name: 'Zone IV · Scene 2: Labors of the Field — The Silent King’s Harvest & Oak Feast',
      zone: 'Z04',
      zoneTitle: 'The Labors of the Field (541–572)',
      lines: '18.550–560',
      greek: 'Ἐν δ᾽ ἐτίθει τέμενος βαθύληϊον· ἔνθα δ᾽ ἔριθοι ἤμων ὀξείας δρεπάνας ἐν χερσὶν ἔχοντες... βασιλεὺς δ᾽ ἐν τοῖσι σιωπῇ σκῆπτρον ἔχων ἑστήκει ἐπ᾽ ὄγμου γηθόσυνος κῆρ. κήρυκες δ᾽ ἀπάνευθε ὑπὸ δρυῒ δαῖτα πένοντο, βοῦν δ᾽ ἱερεύσαντες μέγαν ἄμφεπον· αἱ δὲ γυναῖκες δεῖπνον ἐρίθοισιν λεύκ᾽ ἄλφιτα πολλὰ πάλυνον.',
      buckley: 'There he also placed a field of deep corn, where reapers were reaping, having sharp sickles in their hands. Some handfuls fell thick in series upon the ground along the furrow, and others the binders of sheaves were tying with straw ropes. Three binders followed the reapers, but behind them boys gathering the handfuls, and carrying them in their arms, continually supplied them; and among them the king in silence, over a furrow, was standing at the staff, rejoicing in his heart. But heralds apart, beneath an oak, were preparing a feast, and having sacrificed a huge ox, they were ministering; and women were strewing much white barley meal as a dinner for the reapers.',
      locationId: 'location.field-harvest-oak',
      cast: [
        ['character.rejoicing-king', 'king'],
        ['ensemble.ploughmen-and-reapers', 'reapers'],
        ['set_piece.oak-sacrifice-feast', 'feast']
      ],
      worldModel: {
        vision: 'Golden standing grain stalks, silver sickles (37341d), bound sheaves, the purple-and-gold King with his sceptre, and the spreading oak with white barley meal tiles.',
        memory: 'Assembly-line pipeline: reapers cut → handfuls fall → boys gather armfuls → three binders tie sheaves → heralds & women prepare the sacrificial ox and barley feast.',
        controller: 'Ordered reciprocity under the silent, rejoicing gaze of the Basileus.'
      },
      shots: [
        { name: 'Sharp Sickles & Three Sheaf-Binders', beat: 'Reapers reap the deep grain with sharp sickles; boys gather armfuls and supply the three sheaf-binders.', cam: 'track', target: [-100, -35, 0], from: [-240, -80, 190], to: [-40, -70, 180], sec: 4.5, act: { who: 'reapers', anim: 'reap' } },
        { name: 'The King Standing in Silence', beat: 'Among them the King stands in silence holding his staff over the furrow, rejoicing in his heart.', cam: 'push-in', target: [0, -45, 30], from: [0, -75, 220], to: [0, -50, 125], sec: 4.0, act: { who: 'king', anim: 'rejoice' } },
        { name: 'The Feast Beneath the Spreading Oak', beat: 'Apart beneath an oak heralds dress a sacrificed ox while women strew abundant white barley meal for the reapers.', cam: 'orbit', target: [140, -45, -60], from: [240, -90, 160], to: [60, -85, 190], sec: 4.5, act: { who: 'feast', anim: 'fire' } }
      ]
    },
    {
      id: 'ACH-Z04-S03',
      name: 'Zone IV · Scene 3: Labors of the Field — The Golden Vineyard & Linus Song',
      zone: 'Z04',
      zoneTitle: 'The Labors of the Field (541–572)',
      lines: '18.561–572',
      greek: 'Ἐν δ᾽ ἐτίθει σταφυλῇσι μέγα βρίθουσαν ἀλωὴν καλὴν χρυσείην· μέλανες δ᾽ ἀνὰ βότρυες ἦσαν, ἑστήκει δὲ κάμαξι διαμπερὲς ἀργυρέῃσιν. ἀμφὶ δὲ κυανέην κάπετον, περὶ δ᾽ ἕρκος ἔλασσε κασσιτέροιο· μία δ᾽ οἴη ἀταρπὸς ἐπ᾽ αὐτὴν... τοῖσιν δ᾽ ἐν μέσσοισι πάϊς φόρμιγγι λιγείῃ ἱμερόεν κιθάριζε, λίνον δ᾽ ὑπὸ καλὸν ἄειδε λεπταλέῃ φωνῇ· τοὶ δὲ ῥήσσοντες ἁμαρτῇ μολπῇ τ᾽ ἰυγμῷ τε ποσὶ σκαίροντες ἕποντο.',
      buckley: 'On it also he placed a vineyard heavily laden with grapes, beautiful, golden; but the clusters throughout were black; and it was supported throughout by silver poles. Around it he drew a dark-blue trench, and around a hedge of tin; and there was but one path to it, by which the gatherers went, when they collected the vintage. Young virgins and youths, of tender minds, carried the sweet fruit in woven baskets. In the midst of them a boy played pleasantly on a shrill lyre, and sung the beautiful Linus song with a slender voice; while they, beating the ground in accompaniment, with singing and shouting, followed, hopping with their feet.',
      locationId: 'location.field-golden-vineyard',
      cast: [
        ['character.linus-boy', 'linus_boy'],
        ['ensemble.vintage-maidens-and-youths', 'gatherers']
      ],
      worldModel: {
        vision: 'Five-metal polyphony in a single zone: golden vines (297), black clusters (0/22), silver poles (179), dark-blue kyanos trench (272/33), and tin fence (71) with a single path.',
        memory: 'Topological constraint (μία δ᾽ οἴη ἀταρπὸς — one single path in and out) channeling the rhythmic procession of basket-bearers.',
        controller: 'The boy’s shrill phorminx and slender Linus song synchronizing the stamping feet of the youths and maidens.'
      },
      shots: [
        { name: 'Golden Vines, Black Clusters & Silver Poles', beat: 'He places a golden vineyard heavy with black grape clusters, propped throughout on silver poles.', cam: 'crane', target: [0, -45, -60], from: [-190, -140, 220], to: [120, -90, 190], sec: 4.5, act: { who: 'gatherers', anim: 'carry' } },
        { name: 'The Kyanos Trench, Tin Fence & Single Path', beat: 'Around it runs a trench of dark-blue enamel and a fence of tin, with a single path for the vintage-gatherers.', cam: 'track', target: [0, -25, 90], from: [-200, -75, 230], to: [200, -75, 230], sec: 4.0, act: { who: 'gatherers', anim: 'walk' } },
        { name: 'The Linus Song in the Midst', beat: 'In their midst a boy plays sweetly on the shrill lyre and sings the Linus song while they beat the ground in rhythm.', cam: 'push-in', target: [0, -40, 20], from: [0, -85, 220], to: [0, -45, 115], sec: 4.5, act: { who: 'linus_boy', anim: 'lyre' } }
      ]
    },
    {
      id: 'ACH-Z05-S01',
      name: 'Zone V · Scene 1: Pastoral — Oxen of Gold & Tin and the Two Terrible Lions',
      zone: 'Z05',
      zoneTitle: 'Cattle, Lions, and Sheep (573–589)',
      lines: '18.573–586',
      greek: 'Ἐν δ᾽ ἀγέλην ποίησε βοῶν ὀρθοκραιράων· αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέρου τε... σμερδαλέω δὲ λέοντε δύ᾽ ἐν πρώτῃσι βόεσσιν ταῦρον ἐρύγμηλον ἐχέτην· ὁ δὲ μακρὰ μεμυκὼς ἕλκετο· τὸν δὲ κύνες μετεκίαθον ἠδ᾽ αἰζηοί... ἵσταντο δὲ μάλ᾽ ἐγγύς, ὑλάοντές τε καὶ ἐκτὸς ἀλυσκάζοντες.',
      buckley: 'On it he also fashioned a herd of lofty-horned oxen; but the oxen were made of gold and tin; and lowing, they rushed from the stall to the pasture, beside a murmuring river, along the waving reed. Four golden herdsmen accompanied the oxen, and nine dogs, swift of foot, followed them. But two terrible lions among the foremost oxen seized a bellowing bull, and he, dragging, roared loudly; but the dogs and the young men ran up to him. The lions indeed, having torn the hide of the huge ox, were devouring the entrails and the black blood; but the shepherds vainly pressed upon them, urging on the fleet dogs; for they refused to bite the lions, but stood very near, barking, and flying them.',
      locationId: 'location.pastoral-river-byre',
      cast: [
        ['creature.two-terrible-lions-and-bull', 'lions_bull'],
        ['creature.gold-and-tin-oxen', 'oxen'],
        ['ensemble.four-golden-herdsmen', 'herdsmen'],
        ['creature.nine-swift-dogs', 'dogs']
      ],
      worldModel: {
        vision: 'Gold (297) and tin (71) horned oxen beside a kyanos river and olive reeds; four golden herdsmen; nine hounds; two tawny lions tearing the bull.',
        memory: 'Repulsion/attraction boundary dynamics: the four herdsmen urge the nine dogs forward, but the dogs stop short of biting, oscillating between lunging to bark (ὑλάοντες) and darting back (ἀλυσκάζοντες).',
        controller: 'Wild nature erupting inside pastoral order — the limit of human and canine control.'
      },
      shots: [
        { name: 'Oxen of Gold and Tin by the Murmuring River', beat: 'Lowing oxen of gold and tin rush from the byre to pasture beside a murmuring river and waving reeds.', cam: 'track', target: [80, -35, -30], from: [240, -90, 200], to: [-60, -75, 200], sec: 4.5, act: { who: 'oxen', anim: 'rush' } },
        { name: 'Two Terrible Lions Seize the Bellowing Bull', beat: 'Among the foremost oxen two terrible lions seize a bellowing bull and drag him as he roars aloud.', cam: 'push-in', target: [-80, -35, 15], from: [-180, -85, 220], to: [-95, -45, 125], sec: 4.5, act: { who: 'lions_bull', anim: 'maul' } },
        { name: 'Four Golden Herdsmen & Nine Dogs Barking and Darting Back', beat: 'The four golden herdsmen urge on the nine swift dogs, who stand very near barking and darting back from the lions’ jaws.', cam: 'orbit', target: [-30, -35, 60], from: [-160, -80, 220], to: [160, -80, 220], sec: 4.5, act: { who: 'dogs', anim: 'dart_back' } }
      ]
    },
    {
      id: 'ACH-Z05-S02',
      name: 'Zone V · Scene 2: Pastoral — The White Sheep Glen & Roofed Steadings',
      zone: 'Z05',
      zoneTitle: 'Cattle, Lions, and Sheep (573–589)',
      lines: '18.587–589',
      greek: 'Ἐν δὲ νομὸν ποίησε περικλυτὸς Ἀμφιγυήεις ἐν καλῇ βήσσῃ μέγαν οἰῶν ἀργεννάων, σταθμούς τε κλισίας τε κατηρεφέας ἰδὲ σηκούς.',
      buckley: 'On it also the illustrious Vulcan formed a large pasture of white sheep, in a beautiful grove, and folds, and covered sheds and cottages.',
      locationId: 'location.pastoral-sheep-glen',
      cast: [
        ['creature.white-wooled-sheep-flock', 'flock'],
        ['ensemble.four-golden-herdsmen', 'herdsmen']
      ],
      worldModel: {
        vision: 'Quiet emerald and olive-green valley (330/378) dotted with white sheep (15), stone pens (71), and dark-tan thatched cottages (28/70).',
        memory: 'Stillness counterpoint: three compact Homeric hexameters of tranquil shelter immediately following the lion violence.',
        controller: 'Architectural containment (σταθμοί, κλισίαι, σηκοί) keeping the flock safe in the wooded glen.'
      },
      shots: [
        { name: 'In a Fair Wooded Glen', beat: 'The famous Lame God fashions a great pasture of white-fleeced sheep in a fair wooded valley.', cam: 'crane', target: [0, -35, 0], from: [-180, -130, 240], to: [120, -80, 200], sec: 4.5, act: { who: 'flock', anim: 'graze' } },
        { name: 'Folds, Roofed Steadings & Shepherd Cottages', beat: 'Stone folds, roofed steadings, and thatched shepherd huts shelter the quiet flock.', cam: 'orbit', target: [0, -45, -40], from: [160, -75, 200], to: [-160, -75, 200], sec: 4.5, act: { who: 'herdsmen', anim: 'watch' } }
      ]
    },
    {
      id: 'ACH-Z06-S01',
      name: 'Zone VI · Scene 1: The Daedalean Choros Dance & The River Oceanus Rim',
      zone: 'Z06',
      zoneTitle: 'The Dance and the Ocean Rim (590–608)',
      lines: '18.590–608',
      greek: 'Ἐν δὲ χορὸν ποίκιλλε περικλυτὸς Ἀμφιγυήεις, τῷ ἴκελον οἷόν ποτ᾽ ἐνὶ Κνωσῷ εὐρείῃ Δαίδαλος ἤσκησεν καλλιπλοκάμῳ Ἀριάδνῃ. ἔνθα μὲν ἠΐθεοι καὶ παρθένοι ἀλφεσίβοιαι ὠρχεῦντ᾽, ἀλλήλων ἐπὶ καρπῷ χεῖρας ἔχοντες... ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται, αἴ κε θέῃσιν· ἄλλοτε δ᾽ αὖ θρέξασκον ἐπὶ στίχας ἀλλήλοισι... ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο.',
      buckley: 'On it also the illustrious Vulcan embellished a dance, like unto that which in wide Gnossus Daedalus once composed for fair-haired Ariadne. There the youths and the alluring virgins danced, having their hands on each other’s wrists... At one time they would move very lightly with skilled feet, as when a potter sitting shall make trial of a wheel fitted to his hands, whether it will run; and at another time they would move in series towards each other. A large crowd stood around the enjoyable dance, delighted; and among them two tumblers, beginning their song, spun round in the midst. But in it he placed the vast strength of the river Oceanus, around the extreme border of the well-formed shield.',
      locationId: 'location.choros-oceanus-court',
      cast: [
        ['ensemble.daedalean-choros-dancers', 'dancers'],
        ['prop.potters-wheel-comparison', 'potter'],
        ['ensemble.bridal-torchbearers-and-matrons', 'crowd']
      ],
      worldModel: {
        vision: 'Labyrinthine Knossian mosaic pavement in white, gold, and kyanos; maidens in garlands and youths with golden daggers on silver belts; two central tumblers; and the outer ring of River Oceanus.',
        memory: 'Bimodal choreographic state machine: Mode A = circular rotation like a potter’s trial wheel (τροχός); Mode B = linear counter-marching rows (ἐπὶ στίχας); bounded externally by the continuous circular current of Oceanus.',
        controller: 'Artifice mirroring artifice: Daedalus’s Knossian choros and the potter’s wheel inside Hephaestus’s shield, closed by the cosmic river.'
      },
      shots: [
        { name: 'The Dancing Floor of Daedalus for Ariadne', beat: 'Youths with golden swords on silver belts and maidens with fair garlands dance holding each other’s wrists.', cam: 'crane', target: [0, -40, 0], from: [-200, -140, 250], to: [120, -85, 200], sec: 4.5, act: { who: 'dancers', anim: 'wheel_spin' } },
        { name: 'Like a Potter Testing His Wheel & Moving in Rows', beat: 'Now they whirl lightly like a potter testing his wheel, and now they run in intersecting rows while two tumblers spin in the midst.', cam: 'orbit', target: [0, -40, 0], from: [180, -75, 210], to: [-180, -75, 210], sec: 4.5, act: { who: 'dancers', anim: 'rows_and_tumblers' } },
        { name: 'The Mighty Strength of River Oceanus Around the Rim', beat: 'Around the uttermost rim of the strongly-wrought shield he sets the mighty strength of the river Oceanus, enclosing the whole world.', cam: 'crane', target: [0, -30, -160], from: [0, -80, 140], to: [0, -240, 320], sec: 5.0, act: { who: 'potter', anim: 'oceanus_flow' } }
      ]
    }
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. MASTER CONCENTRIC WORLD CARD: ACH-WORLD-SHIELD (88 × 88 STUDS)
   ═══════════════════════════════════════════════════════════════════════════ */

function buildMasterShieldWorld(chars, divs, ens, creas, props) {
  // Build the 5 concentric folds (πέντε πτύχες) as a circular disc of radius 42 studs (84x84 studs)
  // Using 4x4, 2x4, and 2x2 plates/bricks on the stud grid so every ring is 100% real LDraw parts!
  const discRows = [];
  const R_OUTER = 41;
  for (let x = -R_OUTER; x <= R_OUTER; x += 2) {
    for (let z = -R_OUTER; z <= R_OUTER; z += 2) {
      const r = Math.hypot(x, z);
      if (r > R_OUTER) continue;
      // Base structural bronze plate of the shield (Fold 1 foundation)
      let col = C.nougat;
      let y = 0;
      if (r >= 37.5) {
        // Fold 5 Rim: River Oceanus (kyanos & trans-dark-blue) + Triple Glittering Border (bronze, tin, gold)
        col = r >= 39.5 ? C.gold : C.dblue;
        y = r >= 39.5 ? -16 : -8;
      } else if (r >= 27.5) {
        // Fold 4 Outer Ring: Pastoral & Daedalean Choros (olive green, meadow green, Knossian mosaic)
        const ang = Math.atan2(z, x);
        col = ang > 0.8 ? C.white : (ang < -0.8 ? C.sgreen : C.green);
        y = -8;
      } else if (r >= 17.5) {
        // Fold 3 Middle Ring: Agricultural Labors (black/gold furrow, golden harvest, kyanos-ringed vineyard)
        const ang = Math.atan2(z, x);
        col = ang < -0.8 ? (x < 0 ? C.black : C.gold) : (ang < 1.2 ? C.tan : C.dbrown);
        y = -12;
      } else if (r >= 8.5) {
        // Fold 2 Inner Ring: Two Cities — Peace (white/tan marble North) & War (basalt/bronze South)
        col = z < 0 ? C.tan : C.lbg;
        y = -16;
      } else {
        // Fold 1 Center Boss: Cosmic Vault (kyanos heaven, emerald earth, golden omphalos)
        col = r < 4 ? C.gold : C.dblue;
        y = r < 4 ? -28 : -20;
      }
      discRows.push(R('3022', col, x, z, 0));
      if (y < 0) discRows.push(R('3022', col, x, z, y));
      // Add Oceanus wave crests & white foam around the outer water channel (37.5 <= r < 39.5)
      if (r >= 37.5 && r < 39.5 && ((Math.abs(x + z) % 4) === 0)) {
        discRows.push(R('3068b', C.tDBlue, x, z, -16));
        discRows.push(R('6141', C.white, x, z, -24));
      }
      // Add Triple Glittering Rim studs on the extreme border (r >= 39.5)
      if (r >= 39.5) {
        discRows.push(R('3022', C.lbg, x, z, -8));
        discRows.push(R('3068b', C.gold, x, z, -24));
      }
    }
  }
  // Central Golden Omphalos Dish & Stars
  discRows.push(R('50990a', C.gold, 0, 0, -36));
  discRows.push(R('3960', C.tYellow, 0, 0, -44));
  discRows.push(R('11609', C.gold, -3, -3, -36), R('11609', C.silver, 3, -3, -36), R('11609', C.tClear, 0, 4, -36));

  const shieldDisc = REAL('Five-Fold Shield Disc & Oceanus Rim', discRows, { how: 'world_disc' });

  // Populate all 6 Concentric Zones with sub-assemblies on the shield surface!
  const subs = [
    [shieldDisc, 0, 0, 0, 0],
    // Zone I (Center Boss, r = 0..8): Sun, Moon & Bear/Orion
    [KIT.sunAndMoon(), 0, -5, 0, -28],
    // Zone II North (Inner Ring, r = 10..16, z < 0): City at Peace (Agora Sacred Circle & Two Talents + Bride & Groom)
    [KIT.twoTalentsOfGold(), 0, -13, 0, -24],
    [chars['character.speaker-elder'].comp, -4, -13, 1, -24],
    [chars['character.litigant-payer'].comp, 4, -13, 3, -24],
    [chars['character.bride'].comp, -11, -7, 0, -24],
    [chars['character.bridegroom'].comp, -13, -5, 0, -24],
    // Zone III South (Inner Ring, r = 10..16, z > 0): City at War (Tall Golden Ares & Athena + Crimson Ker)
    [divs['divine_fx.golden-ares'].comp, -5, 13, 2, -24],
    [divs['divine_fx.golden-athena'].comp, 5, 13, 2, -24],
    [divs['divine_fx.ker-crimson-fate'].comp, 0, 14, 0, -24],
    // Zone IV (Middle Ring, r = 19..26):
    //   West: Thrice-Ploughed Fallow & Wine-Bearer
    [KIT.blackeningFurrow(10), -22, -4, 1, -20],
    [chars['character.headland-cupbearer'].comp, -22, -11, 0, -20],
    //   North-East: Silent King's Harvest & Sacrificial Oak
    [chars['character.rejoicing-king'].comp, 18, -14, 0, -20],
    [KIT.sacrificialOakAndFeast(), 22, -6, 0, -20],
    //   South-East: Golden Vineyard, Kyanos Trench & Linus Boy
    [KIT.goldenVineRow(8), 16, 15, 0, -20],
    [chars['character.linus-boy'].comp, 16, 19, 2, -20],
    // Zone V (Outer Ring, r = 28..35):
    //   South-West: Gold & Tin Oxen, Two Lions & Bull, Four Golden Herdsmen
    [creas['creature.two-terrible-lions-and-bull'].comp, -18, 26, 2, -16],
    [KIT.ox(C.gold, C.silver, 'Golden Ox'), -26, 18, 1, -16],
    [KIT.ox(C.lbg, C.gold, 'Tin Ox'), -29, 12, 1, -16],
    //   North-West: White Sheep Glen & Steading
    [KIT.shepherdSteading(), -18, -26, 0, -16],
    [KIT.sheep(C.white, 'Sheep Flock'), -10, -30, 0, -16],
    // Zone VI (Outer Ring East/North, r = 28..35): Daedalean Choros Dance, Potter's Wheel & Tumblers
    [ens['ensemble.daedalean-choros-dancers'].comp, 24, 6, 3, -16],
    [KIT.pottersWheel(), 31, 0, 3, -16]
  ];

  return {
    id: 'ACH-WORLD-SHIELD',
    name: 'The Shield of Achilles — Full 5-Fold Concentric Worldtext (Iliad 18.478–608)',
    type: 'world',
    zone: 'ALL',
    zoneTitle: 'Complete Five-Fold World Model (Iliad XVIII, 478–608)',
    lines: '18.478–608',
    greek: 'Πρῶτα μὲν σάκος ποίει μέγα τε στιβαρόν τε πάντοσε δαιδάλλων... ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο.',
    buckley: 'First of all he formed a shield, both large and solid, adorning it all over; and around it he threw a shining border, triple, glittering; and from it suspended a silver belt. Five were the folds of the shield itself... And in it he placed the vast strength of the river Oceanus, around the extreme border of the well-formed shield.',
    comp: at('The Shield of Achilles Worldtext', subs, { how: 'world' }),
    worldModel: {
      vision: '84×84 stud concentric 5-fold LEGO disk uniting all five Homeric metals (Gold 297, Silver 179, Bronze 28/84, Tin 71, Kyanos 272/33) from the Cosmic Omphalos to the Oceanus Rim.',
      memory: 'Simultaneous multi-ring state machine: polar rotation of the Bear, legal turn-taking in the Sacred Circle, river ambush escalation, golden glebe turning black behind the plough, dogs oscillating before the lions, and the Daedalean wheel/row dance.',
      controller: 'Operative Worldtext (Bolter & Hartsoe): the viewer/warrior navigates from macro-cosmos to micro-scene, probing the rules, memory, and consequences of mortal life.'
    },
    shots: [
      { name: 'Macro-Cosmos: The Five-Fold Shield', beat: 'Hephaestus forges a world out of bronze, tin, gold, silver, and dark-blue kyanos: Cosmos at center, Oceanus at rim, human society organized between.', cam: 'crane', target: [0, -35, 0], from: [0, -680, 620], to: [0, -420, 520], sec: 5.0, act: { who: 'world', anim: 'cosmic_pulse' } },
      { name: 'Fold 1 & 2: The Cosmic Boss & The Two Cities', beat: 'Around the tireless Sun, Full Moon, and unbathing Bear stand the Two Cities: the Torchlit Wedding & Sacred Circle of Law vs. the Siege of Golden Ares & Pallas Athena.', cam: 'orbit', target: [0, -40, 0], from: [-360, -240, 360], to: [360, -240, 360], sec: 5.0, act: { who: 'world', anim: 'cities_clash' } },
      { name: 'Fold 3: Ploughing, Silent King’s Harvest & Golden Vineyard', beat: 'In the middle ring the golden fallow turns marvelously black behind the plough, the King rejoices in silence over the harvest, and the Linus song rings through the kyanos-trenched vineyard.', cam: 'track', target: [0, -35, 60], from: [-440, -200, 320], to: [440, -200, 320], sec: 5.0, act: { who: 'world', anim: 'furrow_flip' } },
      { name: 'Fold 4 & 5: Cattle & Lions, Daedalean Choros & River Oceanus', beat: 'Two lions seize the bull while nine dogs dart back; Knossian youths and maidens whirl like a potter’s wheel; and the mighty River Oceanus encloses the uttermost rim.', cam: 'orbit', target: [0, -35, 0], from: [480, -260, 480], to: [-480, -320, 480], sec: 5.5, act: { who: 'world', anim: 'oceanus_wheel' } }
    ]
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. SCENE BLOCKING, MPD EMISSION, HAND BUTTER & SUBFILE PACK BUNDLER
   ═══════════════════════════════════════════════════════════════════════════ */

const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'build';

function onPlate(title, comps, baseCol = C.dtan) {
  const live = comps.filter(c => rowsOf(c).length);
  const top = live.length === 1 ? live[0] : group(title, live, { gap: 2, maxW: 24 });
  const f = foot(top);
  const w = Math.min(64, Math.max(6, f.w + 4));
  const d = Math.min(64, Math.max(6, f.d + 4));
  const base = REAL('display plinth', slabParts(-w / 2, -d / 2, w, d, baseCol, 0));
  return {
    top,
    card: make(title, 'card', { plate: `${w} x ${d}` }, [], [
      { c: base, M: I12 },
      { c: top, M: T(0, -8, 0) }
    ])
  };
}

function toMPD(id, title, card, sheet, notes, worldMeta = null) {
  const files = [];
  const names = new Map();
  const used = new Set();
  const nameOf = c => {
    if (names.has(c)) return names.get(c);
    let n = `${id} - ${slug(c.name)}`, k = 2;
    while (used.has(n)) n = `${id} - ${slug(c.name)}-${k++}`;
    used.add(n);
    names.set(c, n + '.ldr');
    return n + '.ldr';
  };
  const emit = (c, main) => {
    const fname = main ? id + '.ldr' : nameOf(c);
    const lines = [
      `0 FILE ${fname}`,
      `0 ${main ? title : c.name}`,
      `0 Name: ${fname}`,
      `0 Author: Operative Ekphrasis / tools/achilles-forage.js`,
      `0 !LDRAW_ORG Unofficial_Model`,
      `0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt`,
      `0 BFC CERTIFY CCW`,
      ''
    ];
    if (main) {
      for (const n of notes) lines.push(`0 // ${n}`);
      lines.push(`0 !FORAGE ${JSON.stringify(sheet)}`);
      if (worldMeta) lines.push(`0 !ACHILLES ${JSON.stringify(worldMeta)}`);
      lines.push('');
    }
    for (const r of c.local || []) {
      lines.push(lineOf({ ...r, m: mul(c.m || I12, r.m) }));
    }
    for (const s of c.subs || []) {
      const sub = emit(s.c, false);
      lines.push(`1 16 ${mul(c.m || I12, s.M).map(fmt).join(' ')} ${sub}`);
      if (main) lines.push('0 STEP');
    }
    files.push(lines.join('\n'));
    return fname;
  };
  emit(card, true);
  return files.reverse().join('\n\n') + '\n';
}

function treeOf(c) {
  const n = rowsOf(c).length;
  return {
    name: c.name,
    how: c.how || 'kit',
    pieces: n,
    source: (c.source && (c.source.figure || c.source.scale || c.source.parts || c.source.kit || c.source.plate)) || null,
    children: (c.subs || []).map(s => treeOf(s.c))
  };
}
const countSubs = t => t.children.reduce((s, k) => s + 1 + countSubs(k), 0);
const depthOf = t => t.children.length ? 1 + Math.max(...t.children.map(depthOf)) : 0;

function quatOf(R3) {
  const [a, b, c, d, e, f, g, h, i] = [R3[0], -R3[1], -R3[2], -R3[3], R3[4], R3[5], -R3[6], R3[7], R3[8]];
  const t = a + e + i;
  let q;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [(h - f) / s, (c - g) / s, (d - b) / s, 0.25 * s]; }
  else if (a > e && a > i) { const s = Math.sqrt(1 + a - e - i) * 2; q = [0.25 * s, (b + d) / s, (c + g) / s, (h - f) / s]; }
  else if (e > i) { const s = Math.sqrt(1 + e - a - i) * 2; q = [(b + d) / s, 0.25 * s, (f + h) / s, (c - g) / s]; }
  else { const s = Math.sqrt(1 + i - a - e) * 2; q = [(c + g) / s, (f + h) / s, 0.25 * s, (d - b) / s]; }
  return q.map(v => +v.toFixed(5));
}

function rotQ(q, v) {
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
  return [
    ix * w + iw * -x + iy * -z - iz * -y,
    iy * w + iw * -y + iz * -x - ix * -z,
    iz * w + iw * -z + ix * -y - iy * -x
  ];
}

function toButter(rows) {
  const b = bounds(rows);
  const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, floor = b[4];
  const out = [];
  for (const r of rows) {
    const inf = info(r.part);
    if (!inf.ok || !inf.box) continue;
    const m = r.m;
    const q = quatOf([m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]]);
    const bmax = inf.box[4];
    const off = rotQ(q, [0, bmax, 0]);
    const x = +(m[0] - cx - off[0]).toFixed(2);
    const y = +(floor - m[1] - off[1]).toFixed(2);
    const z = +(-(m[2] - cz) - off[2]).toFixed(2);
    const ident = Math.abs(q[3]) > 0.99999;
    out.push({ id: 's' + out.length, part: r.part, color: r.col, x, y, z, r: 0, ...(ident ? {} : { q }) });
  }
  out.sort((a, c) => a.y - c.y);
  return out.slice(0, 3500);
}

/**
 * Bundle a part and all its recursive LDraw subfiles (parts/s/*, p/48/*, p/*)
 * into achilles/packs/<part>.json so LDrawLoader.subobjectCache resolves everything in memory!
 */
function buildPartPack(partId) {
  const pack = {};
  const visited = new Set();

  function walk(rawRef) {
    const clean = rawRef.trim().replace(/\\/g, '/');
    const lower = clean.toLowerCase();
    if (visited.has(lower)) return;
    visited.add(lower);

    const f = fileFor(clean);
    if (!f) return;
    const text = fs.readFileSync(f, 'utf8');

    // Compute all possible cache keys LDrawLoader might look up for this file
    const keys = new Set([lower]);
    if (lower.startsWith('s/')) keys.add('parts/' + lower);
    if (lower.startsWith('parts/s/')) keys.add(lower.replace(/^parts\//, ''));
    if (lower.startsWith('48/') || lower.startsWith('8/')) keys.add('p/' + lower);
    if (lower.startsWith('p/48/') || lower.startsWith('p/8/')) keys.add(lower.replace(/^p\//, ''));
    if (!lower.includes('/')) {
      keys.add('parts/' + lower);
      keys.add('p/' + lower);
    }
    for (const k of keys) pack[k] = text;

    for (const line of text.split(/\r?\n/)) {
      const t = line.trim().split(/\s+/);
      if (t[0] === '1' && t.length >= 15) {
        const subRef = t.slice(14).join(' ');
        walk(subRef);
      }
    }
  }

  walk(partId.endsWith('.dat') ? partId : partId + '.dat');
  return pack;
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. MAIN EXECUTION: GENERATE ALL CARDS, PACKS, PREVIS & INDICES
   ═══════════════════════════════════════════════════════════════════════════ */

function main() {
  fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'butter'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'previs'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'packs'), { recursive: true });

  const chars = buildCharacterCards();
  const divs = buildDivineCards();
  const ens = buildEnsembleCards();
  const creas = buildCreatureCards();
  const props = buildPropAndEnvironmentCards();
  const locs = buildLocationSets();
  const allAssets = { ...locs, ...chars, ...divs, ...ens, ...creas, ...props };

  const scenes = buildScenes(locs, chars, divs, ens, creas, props);
  const masterWorld = buildMasterShieldWorld(chars, divs, ens, creas, props);

  const index = {
    title: 'The Shield of Achilles — LDraw Worldtext & Forage Atlas',
    subtitle: 'Iliad, Book XVIII, 478–608 · Operative Ekphrasis: From Imagetext to Worldtext (Bolter & Hartsoe)',
    generated: new Date().toISOString().slice(0, 10),
    zones: [
      { id: 'Z01', name: 'Zone I · Construction & Cosmic Design', lines: '18.478–490', fold: 'Fold 1 (Center Boss)', summary: 'Hephaestus’s forge, five folds, triple rim, Earth, Sky, Sea, Sun, Moon, Pleiades, Hyades, Orion, and the unbathing Bear.' },
      { id: 'Z02', name: 'Zone II · The Two Cities: Peace and Law', lines: '18.491–508', fold: 'Fold 2 (Inner Ring North)', summary: 'Torchlit bridal processions, whirling dancers, flutes & lyres; the Agora blood-price dispute, Sacred Circle of Elders, and Two Talents of Gold.' },
      { id: 'Z03', name: 'Zone III · The Two Cities: War and Ambush', lines: '18.509–540', fold: 'Fold 2 (Inner Ring South)', summary: 'Besieged walls guarded by wives, children, and elders; tall golden Ares & Athena; the river watering-place ambush; Eris, Kydoimos, and crimson Ker.' },
      { id: 'Z04', name: 'Zone IV · The Labors of the Field', lines: '18.541–572', fold: 'Fold 3 (Middle Ring)', summary: 'Thrice-ploughed fallow turning black behind the plough; the Silent King’s harvest & oak sacrifice; golden vineyard with kyanos trench, tin fence, and Linus song.' },
      { id: 'Z05', name: 'Zone V · Cattle, Lions, and Sheep', lines: '18.573–589', fold: 'Fold 4 (Outer Ring West)', summary: 'Lofty-horned oxen of gold and tin by the murmuring river; four golden herdsmen & nine dogs barking and darting back from two terrible lions; white sheep glen.' },
      { id: 'Z06', name: 'Zone VI · The Dance and the Ocean Rim', lines: '18.590–608', fold: 'Fold 4 & 5 (Outer Ring East & Extreme Rim)', summary: 'Daedalean dancing floor of Knossos for Ariadne, whirling like a potter’s wheel and in rows with two tumblers; the mighty River Oceanus enclosing the shield.' }
    ],
    totals: { cards: 0, scenes: 0, assets: 0, pieces: 0, subBuilds: 0, joints: 0, green: 0, yellow: 0, red: 0 },
    cards: []
  };

  const allPartsUsed = new Set();

  function registerCard(id, spec) {
    const type = spec.type || 'location';
    let cardComp = spec.comp;
    if (type !== 'world' && type !== 'scene' && type !== 'location') {
      cardComp = onPlate(spec.name, [spec.comp], C.dtan).card;
    }
    const rows = rowsOf(cardComp);
    for (const r of rows) allPartsUsed.add(r.part);

    const au = audit(rows);
    const b = bounds(rows);
    const tree = treeOf(cardComp);
    const W = Math.max(2, Math.round((b[3] - b[0]) / 20));
    const D = Math.max(2, Math.round((b[5] - b[2]) / 20));
    const H = Math.max(8, Math.round(b[4] - b[1]));
    const metals = countMetals(rows);
    const detached = au.floating.length;
    const status = !rows.length ? 'RED' : 'GREEN';

    const sheet = {
      id,
      type,
      zone: spec.zone || 'Z01',
      lines: spec.lines || '18.478–608',
      pieces: au.pieces,
      subBuilds: Math.max(1, countSubs(tree)),
      depth: Math.max(1, depthOf(tree)),
      joints: au.joints,
      anchored: au.anchored,
      held: au.held,
      detached,
      studs: [W, D],
      height: { ldu: H, bricks: +(H / 24).toFixed(1), plates: Math.round(H / 8) },
      cm: [+(W * 0.8).toFixed(1), +(D * 0.8).toFixed(1), +(H * 0.04).toFixed(1)],
      metals,
      status
    };

    const notes = [
      `${spec.name} (${type}, Iliad ${sheet.lines})`,
      `${sheet.pieces} pieces, ${sheet.subBuilds} sub-builds, ${sheet.joints} stud joints (${sheet.anchored} anchored, ${sheet.held} held by contact)`,
      `${W} x ${D} studs, ${sheet.height.bricks} bricks high (${sheet.cm.join(' x ')} cm)`,
      `Metallurgy: Gold ${metals.gold} · Silver ${metals.silver} · Bronze ${metals.bronze} · Tin ${metals.tin} · Kyanos ${metals.kyanos}`
    ];

    const worldMeta = {
      id,
      name: spec.name,
      zone: spec.zone,
      lines: spec.lines,
      greek: spec.greek || '',
      buckley: spec.buckley || '',
      worldModel: spec.worldModel || null
    };

    fs.writeFileSync(path.join(OUT, 'cards', id + '.mpd'), toMPD(id, spec.name, cardComp, sheet, notes, worldMeta));
    const bt = toButter(rows);
    fs.writeFileSync(path.join(OUT, 'butter', id + '.json'), JSON.stringify({
      version: 1,
      id,
      name: spec.name,
      zone: spec.zone,
      lines: spec.lines,
      description: `${spec.name} (Iliad ${sheet.lines}). ${sheet.pieces} pieces, ${sheet.joints} stud joints.`,
      parts: bt,
      actors: []
    }));

    if (spec.shots) {
      fs.writeFileSync(path.join(OUT, 'previs', id + '.json'), JSON.stringify({
        id,
        name: spec.name,
        zone: spec.zone,
        zoneTitle: spec.zoneTitle || '',
        lines: spec.lines,
        greek: spec.greek || '',
        buckley: spec.buckley || '',
        worldModel: spec.worldModel || null,
        shots: spec.shots
      }, null, 2));
    }

    index.cards.push({
      id,
      name: spec.name,
      type,
      zone: spec.zone || 'Z01',
      zoneTitle: spec.zoneTitle || '',
      lines: spec.lines || '18.478–608',
      greek: spec.greek || '',
      buckley: spec.buckley || '',
      role: spec.role || type,
      worldModel: spec.worldModel || null,
      hasPrevis: !!spec.shots,
      shotCount: spec.shots ? spec.shots.length : 0,
      castIds: spec.cast ? spec.cast.map(c => c[0]) : [],
      locationId: spec.locationId || null,
      sheet,
      tree
    });

    index.totals.cards++;
    if (type === 'scene' || type === 'world') index.totals.scenes++;
    else index.totals.assets++;
    index.totals.pieces += sheet.pieces;
    index.totals.subBuilds += sheet.subBuilds;
    index.totals.joints += sheet.joints;
    if (status === 'GREEN') index.totals.green++;
    else if (status === 'YELLOW') index.totals.yellow++;
    else index.totals.red++;
  }

  // 1. Register Master Concentric World Card first
  registerCard(masterWorld.id, masterWorld);

  // 2. Build and register the 12 Scene Cards
  for (const sc of scenes) {
    const loc = locs[sc.locationId];
    const items = [[loc.comp, 0, 0, 0, 0]];
    for (const [assetId, markName] of sc.cast) {
      const asset = allAssets[assetId];
      const mark = (loc.marks && loc.marks[markName]) || { x: 0, z: 0, face: 0 };
      if (asset) {
        items.push([asset.comp, mark.x, mark.z, mark.face || 0, -8]);
      }
    }
    const sceneComp = at(sc.name, items, { how: 'scene' });
    registerCard(sc.id, { ...sc, type: 'scene', comp: sceneComp });
  }

  // 3. Register all Location, Character, Divine, Ensemble, Creature, Prop, Set-Piece, Environment, and Sound cards
  for (const [id, spec] of Object.entries(allAssets)) {
    registerCard(id, { ...spec, type: spec.type || 'location' });
  }

  // 4. Write achilles/packs/<part>.json for every part used across all cards
  let packCount = 0;
  for (const partId of allPartsUsed) {
    const pk = buildPartPack(partId);
    const fname = partId.replace(/\//g, '_') + '.json';
    fs.writeFileSync(path.join(OUT, 'packs', fname), JSON.stringify(pk));
    packCount++;
  }

  // 5. Write achilles/forage.json & achilles/kit.json & achilles/FORAGE.md
  fs.writeFileSync(path.join(OUT, 'forage.json'), JSON.stringify(index, null, 2));

  const kitIndex = {
    title: 'Hephaestus’s Forge — The Shield of Achilles LDraw Kit & Metallurgy Catalog',
    generated: index.generated,
    metals: [
      { id: 'gold', name: 'Gold (χρυσός)', ldraw: [297, 14, 46], hex: '#d4af37', role: 'Gods (Ares & Athena), Sun, Constellations, Two Talents in the Agora, Royal Sceptres, Golden Vines, Golden Herdsmen, Unploughed Glebe, Oxen.' },
      { id: 'silver', name: 'Silver (ἄργυρος)', ldraw: [179, 47], hex: '#c0c5ce', role: 'Shield Baldric (τελαμών), Full Moon, Vineyard Props (κάμακες), Youths’ Sword-Belts, Herald Staves,Silver-Footed Thetis.' },
      { id: 'bronze', name: 'Bronze & Copper (χαλκός)', ldraw: [28, 70, 84, 19], hex: '#b87333', role: 'Five Structural Shield Folds, Armor of the Two Armies, Brazen Spears, Ploughshares, Cauldron Tripods.' },
      { id: 'tin', name: 'Tin (κασσίτερος)', ldraw: [71, 15], hex: '#d8dadf', role: 'Vineyard Fence (ἕρκος κασσιτέροιο), Tin Oxen, Polished Stone Circle of the Elders, Triple Glittering Rim.' },
      { id: 'kyanos', name: 'Kyanos Enamel (κύανος)', ldraw: [272, 33, 1], hex: '#1b3b6f', role: 'Dark-Blue Vineyard Trench (κυανέη κάπετος), Vault of Night Sky, Murmuring River, and the River Oceanus Rim.' },
      { id: 'niello', name: 'Blackened Glebe (μελαίνετο)', ldraw: [0, 308], hex: '#1e1b18', role: 'Thrice-Ploughed Furrow turning black behind the plough (though wrought of gold), Black Grape Clusters.' },
      { id: 'crimson', name: 'Blood-Crimson & Wine-Dark (δαφοινεός)', ldraw: [320, 4, 22], hex: '#7b1e1e', role: 'Blood-crimsoned garment of Destructive Fate (Κήρ), Sweet Wine at the Headland, Royal Chiton of the Harvest King.' }
    ],
    cards: index.cards.filter(c => c.type !== 'scene' && c.type !== 'world')
  };
  fs.writeFileSync(path.join(OUT, 'kit.json'), JSON.stringify(kitIndex, null, 2));

  const md = [
    `# The Shield of Achilles as LDraw: The Operative Worldtext Forage`,
    ``,
    `Generated ${index.generated} by \`tools/achilles-forage.js\` for *Iliad* XVIII, 478–608 (*Operative Ekphrasis: From Imagetext to Worldtext*, Jay David Bolter & Watson Hartsoe).`,
    `Browse in [achilles-forage.html](../achilles-forage.html), inspect the metallurgical kit in [achilles-kit.html](../achilles-kit.html), or mount in the studio shell [shield-of-achilles.html](../shield-of-achilles.html).`,
    ``,
    `**${index.totals.cards} cards** (1 master world, 12 directed scenes, ${index.totals.assets} assets) · **${index.totals.pieces.toLocaleString()} pieces** · **${index.totals.subBuilds.toLocaleString()} sub-builds** · **${index.totals.joints.toLocaleString()} stud joints** · **${packCount} pre-bundled LDraw part packs** · ${index.totals.green} GREEN, ${index.totals.yellow} YELLOW, ${index.totals.red} RED.`,
    ``,
    `## Zones of the Shield (Iliad XVIII, 478–608)`,
    ``,
    `| Zone | Fold | Lines | Title | Summary |`,
    `|---|---|---|---|---|`,
    ...index.zones.map(z => `| **${z.id}** | ${z.fold} | ${z.lines} | ${z.name} | ${z.summary} |`),
    ``,
    `## Master World & Directed Scene Cards (13)`,
    ``,
    `| ID | Zone | Lines | Name | Pieces | Sub-builds | Joints | Studs (W×D) | Shots | Status | MPD |`,
    `|---|---|---|---|---:|---:|---:|---|---:|---|---|`,
    ...index.cards.filter(c => c.type === 'world' || c.type === 'scene').map(c =>
      `| \`${c.id}\` | ${c.zone} | ${c.lines} | **${c.name}** | ${c.sheet.pieces} | ${c.sheet.subBuilds} | ${c.sheet.joints} | ${c.sheet.studs[0]}×${c.sheet.studs[1]} | ${c.shotCount} | ${c.sheet.status} | [MPD](cards/${c.id}.mpd) |`
    ),
    ``,
    `## Hephaestus’s Forge Kit & Asset Cards (${index.totals.assets})`,
    ``,
    `| ID | Type | Zone | Lines | Name | Pieces | Sub-builds | Joints | Studs (W×D) | Status | MPD |`,
    `|---|---|---|---|---|---:|---:|---:|---|---|---|`,
    ...index.cards.filter(c => c.type !== 'world' && c.type !== 'scene').map(c =>
      `| \`${c.id}\` | ${c.type} | ${c.zone} | ${c.lines} | ${c.name} | ${c.sheet.pieces} | ${c.sheet.subBuilds} | ${c.sheet.joints} | ${c.sheet.studs[0]}×${c.sheet.studs[1]} | ${c.sheet.status} | [MPD](cards/${c.id}.mpd) |`
    )
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'FORAGE.md'), md + '\n');

  console.log(JSON.stringify({
    cards: index.totals.cards,
    scenes: index.totals.scenes,
    assets: index.totals.assets,
    pieces: index.totals.pieces,
    subBuilds: index.totals.subBuilds,
    joints: index.totals.joints,
    packs: packCount,
    green: index.totals.green,
    yellow: index.totals.yellow,
    red: index.totals.red
  }, null, 2));
}

main();

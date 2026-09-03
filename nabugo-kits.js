/**
 * NABUGO KITS — the bar, at runtime.
 * ==================================
 * Seventeen real LEGO sets live in kits/. They were authored in LDraw by LDraw
 * contributors from the actual boxes and downloaded from the Official Model
 * Repository. They are the standard this engine is measured against, and they
 * are named and fetchable, never described.
 *
 * This module does four things and nothing else:
 *
 *   PARSE     a packed MPD into blocks, applying the four gotchas below
 *   FLATTEN   the block tree into one flat list of world-space Placements
 *   MEASURE   any flat Placement[] — the kit's or ours — through ONE code path
 *   BRIEF     turn a measured kit back into a buildable Nabugo.Brief entry
 *
 * It places nothing and mutates nothing. It owns the AXIS REGISTRY: twelve
 * axes, each with a band, each measured here and nowhere else. A second
 * implementation of any axis invalidates the comparison, so there is not one.
 *
 * ONE PARSER, TWO HOSTS
 * ---------------------
 * build-kit-index.js (phase 1, node) and this module (phase 2, browser) must
 * not disagree about what a kit contains, or the gauntlet is theatre. The
 * shared core — MPD block parsing, the "~Moved to" alias walk, the recursive
 * flattener, FAMILY_RULES, SHEARING_MAP, affordanceTags, the matrix and
 * lattice predicates — lives here, under `NabugoKits.Core`, ported verbatim
 * from build-kit-index.js. build-kit-index.js now requires this file and uses
 * Core for all of it; the only thing it still owns is the 80-metric index
 * record and the corpus norm, which are node-side reporting, not measurement.
 * Re-running it reproduces kit-index.json exactly.
 *
 * PACKED MPD ANATOMY (learned from the files, not assumed)
 *   line 0..~336  an inlined LDConfig.ldr colour table (no type-1 lines)
 *   then          the ROOT MODEL, headed by "0 Name: <kit>.ldr", NO "0 FILE"
 *   then          N blocks headed by "0 FILE <name>"
 *                   .ldr / .mpd -> a real submodel of the kit
 *                   .dat        -> an INLINED PART DEFINITION, not a submodel
 *
 * LDRAW FACTS: Y is DOWN. stud pitch 20 LDU, plate 8, brick 24, stud 4.
 * Type-1 line: 1 <colour> x y z a b c d e f g h i <file>, a..i row-major 3x3.
 * world = M*local + T. det(M) < 0 is illegal: real LEGO cannot be mirrored.
 */
(function (global) {
'use strict';

// ═════════════════════════════════════════════════════════════════ constants
const EPS      = 1e-4;    // "is this matrix element 0 or +/-1"
const LAT_EPS  = 1e-3;    // lattice tolerance used by the kit index
const AX_LAT   = 0.51;    // AX-LATTICE tolerance, per the contract
const IDENT    = [1,0,0, 0,1,0, 0,0,1];
const VOXEL    = [20, 8, 20];   // stud pitch x plate height x stud pitch
const VOXEL_CAP = 2e6;          // coarsen rather than allocate past this

// ══════════════════════════════════════════════════════════════════ numerics
const r6 = (v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v);
const r4 = (v) => (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : v);
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function onLattice(v, m, eps) { return Math.abs(v - Math.round(v / m) * m) < (eps === undefined ? LAT_EPS : eps); }
function countBy(arr) {
  const m = new Map();
  for (const k of arr) m.set(k, (m.get(k) || 0) + 1);
  return m;
}
function topN(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, n);
}
function shareOfTop(map, n, total) {
  if (!total) return 0;
  return topN(map, n).reduce((s, e) => s + e[1], 0) / total;
}

// ══════════════════════════════════════════════════════════════════ matrices
function mmul(A, B) {
  const O = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    O[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  }
  return O;
}
function mapply(M, T, v) {
  return [
    M[0]*v[0] + M[1]*v[1] + M[2]*v[2] + T[0],
    M[3]*v[0] + M[4]*v[1] + M[5]*v[2] + T[1],
    M[6]*v[0] + M[7]*v[1] + M[8]*v[2] + T[2],
  ];
}
function composeXf(Mp, Tp, Mc, Tc) { return { m: mmul(Mp, Mc), t: mapply(Mp, Tp, Tc) }; }
function det3(m) {
  return m[0]*(m[4]*m[8] - m[5]*m[7]) - m[1]*(m[3]*m[8] - m[5]*m[6]) + m[2]*(m[3]*m[7] - m[4]*m[6]);
}
/** General 3x3 inverse. Returns null on a singular matrix rather than NaNs. */
function inv3(m) {
  const d = det3(m);
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  const i = 1 / d;
  return [
    (m[4]*m[8] - m[5]*m[7]) * i, (m[2]*m[7] - m[1]*m[8]) * i, (m[1]*m[5] - m[2]*m[4]) * i,
    (m[5]*m[6] - m[3]*m[8]) * i, (m[0]*m[8] - m[2]*m[6]) * i, (m[2]*m[3] - m[0]*m[5]) * i,
    (m[3]*m[7] - m[4]*m[6]) * i, (m[1]*m[6] - m[0]*m[7]) * i, (m[0]*m[4] - m[1]*m[3]) * i,
  ];
}
function isIdentity(m) { for (let i = 0; i < 9; i++) if (Math.abs(m[i] - IDENT[i]) > EPS) return false; return true; }
/** Every element in {0,+1,-1} with exactly one non-zero per row and column. */
function isAxis90(m) {
  const rows = [0,0,0], cols = [0,0,0];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const v = m[r*3 + c], a = Math.abs(v);
    if (a < EPS) continue;
    if (Math.abs(a - 1) > EPS) return false;
    rows[r]++; cols[c]++;
  }
  return rows.every((x) => x === 1) && cols.every((x) => x === 1);
}
/** Local +Y maps to world column 1 = (b,e,h). Studs are vertical iff that is +-world Y. */
function studsVertical(m) {
  return Math.abs(m[1]) < 1e-3 && Math.abs(m[7]) < 1e-3 && Math.abs(Math.abs(m[4]) - 1) < 1e-3;
}
function matKey(m, q) {
  const s = q || 1e-3;
  return m.map((v) => {
    const r = Math.round(v / s) * s;
    return Object.is(r, -0) ? 0 : r6(r);
  }).join(',');
}

// ═══════════════════════════════════════════════════════════ block parsing
function normKey(name) { return String(name).trim().toLowerCase().replace(/\\/g, '/'); }
function baseName(name) {
  const k = normKey(name);
  const i = k.lastIndexOf('/');
  return i < 0 ? k : k.slice(i + 1);
}
function partNumberOf(name) { return baseName(name).replace(/\.dat$/, ''); }
function isModelName(name) { return /\.(ldr|mpd)$/i.test(normKey(name)); }

/**
 * Split a packed MPD into logical blocks.
 *
 * ROOT RULE: within the pre-first-`0 FILE` section, the LAST `0 Name:` that is
 * not LDConfig.ldr names the root. If there is none — which is the case for
 * every MPD this engine emits — the first model-named `0 FILE` block is root.
 */
function parseMpd(text) {
  const lines = String(text).split(/\r\n|\r|\n/);
  const blocks = new Map();
  const order = [];

  function addBlock(name, bodyLines) {
    const b = buildBlock(name, bodyLines);
    const k = normKey(b.name);
    if (!blocks.has(k)) { blocks.set(k, b); order.push(k); }
    return b;
  }

  let firstFile = lines.findIndex((l) => /^0\s+FILE\s+/i.test(l));
  if (firstFile < 0) firstFile = lines.length;
  const leading = lines.slice(0, firstFile);

  let rootName = null;
  const nameIdx = [];
  for (let i = 0; i < leading.length; i++) if (/^0\s+Name:\s*\S/i.test(leading[i])) nameIdx.push(i);
  if (nameIdx.length) {
    const last = nameIdx[nameIdx.length - 1];
    const nm = leading[last].replace(/^0\s+Name:\s*/i, '').trim();
    if (normKey(nm) !== 'ldconfig.ldr') {
      // walk back to the description line above "0 Name:" (skip blanks / bare "0")
      let start = last;
      for (let j = last - 1; j >= 0; j--) {
        const t = leading[j].trim();
        if (t === '' || t === '0') break;
        if (/^0\s+(?!Name:|!)/i.test(leading[j])) { start = j; break; }
        break;
      }
      rootName = nm;
      addBlock(nm, leading.slice(start));
    }
  }

  let cur = null, buf = [];
  for (let i = firstFile; i < lines.length; i++) {
    const l = lines[i];
    const m = /^0\s+FILE\s+(.+?)\s*$/i.exec(l);
    if (m) {
      if (cur !== null) addBlock(cur, buf);
      cur = m[1]; buf = [];
    } else if (cur !== null) buf.push(l);
  }
  if (cur !== null) addBlock(cur, buf);

  if (!rootName) {
    for (const k of order) if (isModelName(blocks.get(k).name)) { rootName = blocks.get(k).name; break; }
  }
  return { blocks, order, rootName };
}

function buildBlock(name, bodyLines) {
  const b = {
    name: String(name).trim(), desc: '', ldrawOrg: '',
    refs: [], verts: [], steps: 0, rotsteps: 0,
    isModel: false, pathSkin: false, donorPart: '', lines: bodyLines.slice(),
  };
  let sawGeom = false;
  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) continue;
    const t = line[0];
    if (t === '0') {
      const rest = line.slice(1).trim();
      if (!rest) continue;
      if (/^STEP\b/i.test(rest)) { b.steps++; continue; }
      if (/^ROTSTEP\b/i.test(rest)) { b.rotsteps++; continue; }
      if (/^!LDRAW_ORG\b/i.test(rest)) { b.ldrawOrg = rest.replace(/^!LDRAW_ORG\s*/i, '').trim(); continue; }
      if (/^!LDCAD\s+PATH_SKIN/i.test(rest)) {
        b.pathSkin = true;
        const dp = /\[donPart=([^\]]+)\]/i.exec(rest);
        if (dp && !b.donorPart) b.donorPart = dp[1].trim();
        continue;
      }
      if (/^Name:/i.test(rest)) continue;
      if (rest[0] === '!' || /^\/\//.test(rest) || /^(Author|Origin|BFC|Category|Keywords|History)\b/i.test(rest)) continue;
      if (!b.desc && !sawGeom) b.desc = rest;
      continue;
    }
    const f = line.split(/\s+/);
    if (t === '1') {
      if (f.length < 15) continue;
      sawGeom = true;
      b.refs.push({
        colour: parseInt(f[1], 10),
        t: [ +f[2], +f[3], +f[4] ],
        m: [ +f[5], +f[6], +f[7], +f[8], +f[9], +f[10], +f[11], +f[12], +f[13] ],
        name: f.slice(14).join(' '),
      });
    } else if (t === '2' || t === '3' || t === '4' || t === '5') {
      sawGeom = true;
      const nv = t === '2' ? 2 : t === '3' ? 3 : 4;   // type 5: the 2 real endpoints only
      for (let k = 0; k < nv; k++) {
        const o = 2 + k * 3;
        if (f.length <= o + 2) break;
        b.verts.push(+f[o], +f[o+1], +f[o+2]);
      }
    }
  }
  // FLEX RULE: an LDCAD flexible-part group is many donor segments rendering
  // ONE physical piece. 10174 has 1249 raw refs and 1060 pieces because of it.
  b.isFlexGroup = b.pathSkin || /flex|hose/i.test(b.name);
  b.isModel = isModelName(b.name) ||
    (!/\.dat$/i.test(b.name) && /^(Unofficial_)?Model/i.test(b.ldrawOrg));
  return b;
}

/** Flattened LOCAL vertex list of a definition, memoised. Used for the true bbox. */
function makeVertResolver(blocks) {
  const cache = new Map();
  const stack = new Set();
  function get(name) {
    const k = normKey(name);
    if (cache.has(k)) return cache.get(k);
    const b = blocks.get(k) || blocks.get(baseName(name));
    if (!b || stack.has(k)) { cache.set(k, new Float64Array(0)); return cache.get(k); }
    stack.add(k);
    const out = [];
    for (let i = 0; i < b.verts.length; i++) out.push(b.verts[i]);
    for (const r of b.refs) {
      const cv = get(r.name);
      for (let i = 0; i < cv.length; i += 3) {
        const x = cv[i], y = cv[i+1], z = cv[i+2];
        out.push(
          r.m[0]*x + r.m[1]*y + r.m[2]*z + r.t[0],
          r.m[3]*x + r.m[4]*y + r.m[5]*z + r.t[1],
          r.m[6]*x + r.m[7]*y + r.m[8]*z + r.t[2]);
      }
    }
    stack.delete(k);
    const fa = Float64Array.from(out);
    cache.set(k, fa);
    return fa;
  }
  return get;
}

/**
 * Resolve a reference to {number, desc, org, kind}, following "~Moved to X".
 *
 * PART/PRIM RULE lives here: LDraw models legally place primitives (p/*) and
 * subparts (parts/s/*) directly, and neither is a piece you would find in the
 * box. `kind` is what the flattener filters on.
 */
function makePartInfo(blocks) {
  const cache = new Map();
  function lookup(ref) {
    return blocks.get(normKey(ref)) || blocks.get(baseName(ref)) ||
           blocks.get('parts/' + baseName(ref)) || null;
  }
  return function info(ref) {
    const k0 = normKey(ref);
    if (cache.has(k0)) return cache.get(k0);
    let ref2 = ref, b = lookup(ref), hops = 0, alias = false;
    while (b && hops < 4) {
      const mv = /^~?Moved to\s+(\S+)/i.exec(b.desc || '');
      if (!mv) break;
      alias = true; hops++;
      ref2 = mv[1].endsWith('.dat') ? mv[1] : mv[1] + '.dat';
      const nb = lookup(ref2);
      if (!nb) break;
      b = nb;
    }
    const org = b ? b.ldrawOrg : '';
    let desc = b ? (b.desc || '') : '';
    if (desc.startsWith('=')) desc = desc.slice(1).trim();   // '=' prefix = official alias name
    let kind = 'part';
    if (/^p\//i.test(k0) || /Primitive/i.test(org)) kind = 'primitive';
    else if (/(^|\/)s\//i.test(k0) || /Subpart/i.test(org)) kind = 'subpart';
    else if (/^~/.test(b ? (b.desc || '') : '') && !alias) kind = 'subpart';
    const out = { number: partNumberOf(ref2), desc, org, kind, alias, aliasOf: alias ? partNumberOf(ref) : null };
    cache.set(k0, out);
    return out;
  };
}

/**
 * Recursive flatten to world coordinates. THE flattening rule; nobody writes
 * a second one. `lm`/`lt` are the matrix and translation as AUTHORED inside
 * the parent block — four axes are measured there, because a kit is tidy
 * inside its submodel and posed in the world.
 */
function flattenBlocks(parsed) {
  const { blocks, rootName } = parsed;
  const placements = [];
  const submodelInstances = new Map();
  const missing = new Map();
  const visited = new Set();
  const joints = [];
  const flexGroups = [];
  let maxDepth = 0;
  const guard = new Set();

  function lookup(name) { return blocks.get(normKey(name)) || blocks.get(baseName(name)) || null; }

  function walk(name, M, T, colour, depth, inFlex) {
    maxDepth = Math.max(maxDepth, depth);
    const b = lookup(name);
    if (!b) { missing.set(normKey(name), (missing.get(normKey(name)) || 0) + 1); return; }
    const k = normKey(b.name);
    visited.add(k);
    if (guard.has(k)) return;      // a cyclic MPD would otherwise never return
    guard.add(k);
    for (const r of b.refs) {
      const c = r.colour === 16 ? colour : r.colour;
      const { m, t } = composeXf(M, T, r.m, r.t);
      const child = lookup(r.name);
      const childIsModel = child ? child.isModel : isModelName(r.name);
      if (childIsModel) {
        const ck = normKey(child ? child.name : r.name);
        submodelInstances.set(ck, (submodelInstances.get(ck) || 0) + 1);
        joints.push({ parent: k, child: ck, m: r.m, t: r.t });
        if (child && child.isFlexGroup) {
          const donor = child.donorPart ||
            (child.refs.find((q) => /\.dat$/i.test(q.name)) || { name: 'hose.dat' }).name;
          flexGroups.push({ block: ck, donor: partNumberOf(donor), segments: child.refs.length });
          placements.push({
            part: partNumberOf(donor), ref: normKey(donor), colour: c,
            m, t, lm: r.m, lt: r.t, depth, parent: k, kind: 'flex-hose', synthetic: true,
          });
        }
        walk(r.name, m, t, c, depth + 1, inFlex || !!(child && child.isFlexGroup));
      } else {
        placements.push({
          part: partNumberOf(r.name), ref: normKey(r.name), colour: c,
          m, t, lm: r.m, lt: r.t, depth, parent: k,
          kind: inFlex ? 'flex-segment' : 'ref',
        });
      }
    }
    guard.delete(k);
  }
  walk(rootName, IDENT, [0,0,0], 16, 1, false);
  return { placements, submodelInstances, maxDepth, missing, visited, joints, flexGroups };
}

// ══════════════════════════════════════════════════════════════════ families
// Ported VERBATIM from build-kit-index.js. Order matters: the first rule that
// matches wins, so "Brick 1x1 Round" lands in round+cone, not brick.
const FAMILY_RULES = [
  [/^(minifig|figure)\b/, 'minifig'],
  [/^(tyre|tire|wheel|hub)\b/, 'wheel+tyre'],
  [/^technic\b/, 'technic'],
  [/^(plant|animal|tree|flower|leaves|grass|horse|dog|cat|bird|fish|dinosaur|shark|crocodile)\b/, 'plant+animal'],
  [/^(flag|cloth|cape|sail|banner|string|rubber)\b/, 'flag+cloth'],
  [/^(bar|antenna|ladder|arrow|hose|flexible)\b/, 'bar+antenna'],
  [/^(window|door|gate|shutter|glass for)\b/, 'window+door'],
  [/^(panel|windscreen|windshield|cockpit|canopy)\b/, 'panel+windscreen'],
  [/^(hinge|turntable|swivel)\b/, 'hinge+turntable'],
  [/^(bracket|clip)\b/, 'bracket+clip'],
  [/^(cone|cylinder|dish|dome|ring|round)\b/, 'round+cone'],
  [/^(brick|plate|tile)\b.*\bround\b/, 'round+cone'],
  [/^(slope|wedge|wing)\b/, 'slope'],
  [/^brick\b/, 'brick'],
  [/^(plate|baseplate)\b/, 'plate'],
  [/^tile\b/, 'tile'],
];
const FAMILIES = ['brick','plate','tile','slope','round+cone','bracket+clip','hinge+turntable',
  'panel+windscreen','window+door','wheel+tyre','technic','minifig','bar+antenna',
  'plant+animal','flag+cloth','other'];

/** Stewart Brand's shearing layers, mapped from part family. */
const SHEARING_MAP = {
  STRUCTURE: ['brick', 'plate', 'technic'],
  SKIN:      ['tile', 'slope', 'panel+windscreen', 'round+cone'],
  SERVICES:  ['hinge+turntable', 'bracket+clip', 'window+door', 'bar+antenna'],
  STUFF:     ['minifig', 'wheel+tyre', 'plant+animal', 'flag+cloth'],
  UNASSIGNED:['other'],
};
const LAYER_OF_FAMILY = (() => {
  const m = {};
  for (const [layer, fams] of Object.entries(SHEARING_MAP)) for (const f of fams) m[f] = layer;
  return m;
})();

function familyOfDesc(desc) {
  const d = (desc || '').trim().toLowerCase();
  for (const [re, fam] of FAMILY_RULES) if (re.test(d)) return fam;
  return 'other';
}
/** Finer bucket so nothing is lost inside "slope" / "other": the leading noun. */
function familyDetail(desc) {
  const d = (desc || '').trim().toLowerCase();
  const first = (d.split(/\s+/)[0] || 'unknown').replace(/[^a-z-]/g, '');
  return first || 'unknown';
}
/** Connection affordances = Brand's SERVICES tells, read off the description. */
function affordanceTags(desc) {
  const d = (desc || '').toLowerCase();
  const t = [];
  if (/\bclip\b/.test(d)) t.push('clip');
  if (/\bhinge\b/.test(d)) t.push('hinge');
  if (/\bhandle\b/.test(d)) t.push('handle');
  if (/\bstud on side|studs on side|with stud on|headlight/.test(d)) t.push('stud-on-side');
  if (/\bbar\b|\bpin\b/.test(d)) t.push('bar-or-pin');
  if (/\bgroove\b/.test(d)) t.push('groove');
  if (/\bball\b|\btowball\b/.test(d)) t.push('ball');
  if (/\bhollow\b|\bhole\b/.test(d)) t.push('hole');
  return t;
}

const Core = {
  EPS, LAT_EPS, IDENT, FAMILY_RULES, FAMILIES, SHEARING_MAP, LAYER_OF_FAMILY,
  r4, r6, median, mean, onLattice, countBy, topN, shareOfTop,
  mmul, mapply, composeXf, det3, inv3, isIdentity, isAxis90, studsVertical, matKey,
  normKey, baseName, partNumberOf, isModelName, parseMpd, buildBlock,
  makeVertResolver, makePartInfo, flattenBlocks,
  familyOfDesc, familyDetail, affordanceTags,
};

// ═══════════════════════════════════════════════════════ catalogue bridge
/**
 * Every measured piece must resolve in Nabugo.Catalog, because the catalogue
 * is where its AABB comes from and AX-DENSITY, G-BUFFER and G-CLASH all need
 * one. The kits reference parts by their LDraw number, and the catalogue was
 * built from the vendored ldraw/ tree, so a handful of numbers differ by an
 * LDraw variant suffix: the hopper says `3023.dat` where the catalogue holds
 * `3023b`, and `3660` where it holds `3660b`. Resolving the suffix recovers
 * them — with this ladder every one of the 2,371 pieces in the seventeen kits
 * resolves, and the PRIM RULE's "absent from the catalogue" clause drops zero
 * real pieces instead of ten from the island hopper alone.
 */
const catCache = { byDesc: null, size: -1, resolved: new Map() };
function catalog() {
  const N = global.Nabugo;
  return (N && N.Catalog) || null;
}
function catGet(id) {
  const C = catalog();
  return C ? C.get(id) : null;
}
function descIndex() {
  const C = catalog();
  if (!C) return null;
  if (catCache.byDesc && catCache.size === C.size()) return catCache.byDesc;
  const m = new Map();
  for (const p of C.all()) {
    const k = String(p.d || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (k && !m.has(k)) m.set(k, p.id);
  }
  catCache.byDesc = m; catCache.size = C.size(); catCache.resolved.clear();
  return m;
}
/** Canonical catalogue id for an LDraw part number, or null when unknown. */
function resolveId(id, desc) {
  const raw = String(id).replace(/\.dat$/i, '');
  if (catCache.resolved.has(raw)) return catCache.resolved.get(raw);
  let out = null;
  if (catGet(raw)) out = raw;
  if (!out) for (const s of ['a','b','c','d']) if (catGet(raw + s)) { out = raw + s; break; }
  if (!out && /[a-d]$/.test(raw) && catGet(raw.slice(0, -1))) out = raw.slice(0, -1);
  if (!out && desc) {
    const idx = descIndex();
    const k = String(desc).trim().toLowerCase().replace(/\s+/g, ' ');
    if (idx && idx.has(k)) out = idx.get(k);
  }
  catCache.resolved.set(raw, out);
  return out;
}
function descOfPart(id) {
  const p = catGet(id) || catGet(resolveId(id) || '');
  return p ? p.d : '';
}
/** World AABB of a placement from its catalogue AABB. Mirrors Nabugo.Geom.worldBox. */
function worldBox(place) {
  const G = global.Nabugo && global.Nabugo.Geom;
  if (G && G.worldBox) return G.worldBox(place);
  const part = catGet(place.part);
  if (!part) return null;
  const [x0,y0,z0,x1,y1,z1] = part.b;
  const m = place.mat || IDENT, px = place.pos[0], py = place.pos[1], pz = place.pos[2];
  const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
  for (let i = 0; i < 8; i++) {
    const lx = (i & 1) ? x1 : x0, ly = (i & 2) ? y1 : y0, lz = (i & 4) ? z1 : z0;
    const wx = m[0]*lx + m[1]*ly + m[2]*lz + px;
    const wy = m[3]*lx + m[4]*ly + m[5]*lz + py;
    const wz = m[6]*lx + m[7]*ly + m[8]*lz + pz;
    if (wx < min[0]) min[0] = wx; if (wx > max[0]) max[0] = wx;
    if (wy < min[1]) min[1] = wy; if (wy > max[1]) max[1] = wy;
    if (wz < min[2]) min[2] = wz; if (wz > max[2]) max[2] = wz;
  }
  return { min, max };
}

// ═══════════════════════════════════════════════════════════════ chirality
/**
 * Ten pairs verified against the kits themselves, not against a regex. A
 * mirror is only legal when it swaps a left part for its right twin, so this
 * table is what stops NabugoBrand from negating a matrix column, and it is
 * what lets AX-SYMMETRY see a mirrored wing as symmetric rather than as two
 * unrelated parts.
 */
const CHIRALITY_PAIRS = [
  ['30355','30356'],   // Wing 6 x 12 Left / Right
  ['6564','6565'],     // Wedge 3 x 2 Right / Left
  ['3818','3819'],     // Minifig Arm Right / Left
  ['41770','41769'],   // Wing 2 x 4 Left / Right
  ['41748','41747'],   // Wedge 2 x 6 Double Left / Right
  ['43720','43721'],   // Wedge 4 x 2 Sloped Left / Right
  ['41750','41749'],   // Slope Brick Curved 3 x 8 x 2 Left / Right
  ['43722','43723'],   // Wing 2 x 3 Right / Left
  ['47397','47398'],   // Wing 3 x 12 Left / Right
  ['43710','43711'],   // Wedge 4 x 2 Double Left / Right
];
let twinTable = null;
/**
 * The hand-verified pairs plus everything the catalogue itself declares: a
 * description ending " Left" whose " Right" sibling exists is a pair. Built
 * once, lazily, because it costs a pass over 16,910 descriptions.
 */
function buildTwins() {
  const t = new Map();
  const add = (a, b) => { if (a && b) { t.set(a, b); t.set(b, a); } };
  for (const [a, b] of CHIRALITY_PAIRS) add(a, b);
  const C = catalog();
  if (C) {
    const byDesc = new Map();
    for (const p of C.all()) byDesc.set(String(p.d || '').trim().toLowerCase().replace(/\s+/g,' '), p.id);
    for (const p of C.all()) {
      const d = String(p.d || '').trim().toLowerCase().replace(/\s+/g,' ');
      if (!/ left$/.test(d)) continue;
      const r = byDesc.get(d.replace(/ left$/, ' right'));
      if (r && !t.has(p.id)) add(p.id, r);
    }
  }
  return t;
}
function chiralityTwin(partId) {
  if (!twinTable) twinTable = buildTwins();
  return twinTable.get(String(partId).replace(/\.dat$/i, '')) || null;
}

// ═══════════════════════════════════════════════════════════════ the corpus
/**
 * The seventeen files as shipped. `bar:true` marks the four the contract
 * names. 6156 is a single LDraw PART file, not a set: it has zero pieces, it
 * enters no norm, and `bar:false, degenerate:true` keeps it out of the loop.
 * `pieces` is the flat count this module produces; it is here so list() works
 * before anything is fetched, and load()+measure() overwrite it with the live
 * number.
 */
const KITS = [
  { kit:'5935-island-hopper', file:'kits/5935-island-hopper.mpd', set:'5935', name:'Island Hopper',
    bar:true, role:'DEFAULT', pieces:203, blocks:5,
    brief:'A shore, a seaplane, a jetty and a minifig. Every one of the twelve axes lands inside its band, ' +
          'so it is the one kit that can judge all twelve — and it beats every build this engine has made on all of them.' },
  { kit:'7140-xwing-fighter', file:'kits/7140-xwing-fighter.mpd', set:'7140', name:'X-wing Fighter',
    bar:true, role:'ANATOMY', pieces:287, blocks:19,
    brief:'Nineteen named body blocks four deep — nose, wings, engines, cockpit, Luke. The anatomy bar.' },
  { kit:'10174-imperial-atst-ucs', file:'kits/10174-imperial-atst-ucs.mpd', set:'10174', name:'Imperial AT-ST (UCS)',
    bar:true, role:'STRETCH', pieces:1060, blocks:84,
    brief:'Eighty-four authoring blocks, depth six, 200 distinct matrices, 87% studs off vertical. The stretch bar.' },
  { kit:'4838-mini-vehicles', file:'kits/4838-mini-vehicles.mpd', set:'4838', name:'Mini Vehicles',
    bar:true, role:'LOW-ROAD', pieces:79, blocks:3,
    brief:'Carrier and car, 30 pieces per million LDU cubed. Cheap, dense, symmetric — the Building 20 comparison.' },
  { kit:'1621-lunar-mpv', file:'kits/1621-lunar-mpv.mpd', set:'1621', name:'Lunar MPV Vehicle',
    pieces:104, blocks:10, brief:'Thirteen blocks and the corpus record for posed joints: 54% of placements are off-axis.' },
  { kit:'30023-lighthouse', file:'kits/30023-lighthouse.mpd', set:'30023', name:'Lighthouse',
    pieces:25, blocks:1, brief:'One block, eleven distinct parts, a red band made by substituting corner-rounds, not by recolouring.' },
  { kit:'30051-xwing-mini', file:'kits/30051-xwing-mini.mpd', set:'30051', name:'X-wing Fighter (mini)',
    pieces:61, blocks:7, brief:'Eight blocks in 61 pieces: the smallest kit that still cuts real anatomy.' },
  { kit:'30054-atst-mini', file:'kits/30054-atst-mini.mpd', set:'30054', name:'AT-ST (mini)',
    pieces:47, blocks:7, brief:'A walker in 47 pieces, 57% of them distinct — vocabulary carried by a tiny part count.' },
  { kit:'4489-atat-mini', file:'kits/4489-atat-mini.mpd', set:'4489', name:'AT-AT (mini)',
    pieces:82, blocks:2, brief:'Corpus maximum for the fast layer: 32% of its pieces are hinges, clips, bars and brackets.' },
  { kit:'4494-imperial-shuttle-mini', file:'kits/4494-imperial-shuttle-mini.mpd', set:'4494', name:'Imperial Shuttle (mini)',
    pieces:84, blocks:5, brief:'Three folding wings; almost every placement sits on the local grid and almost none in the world one.' },
  { kit:'4915-mini-construction', file:'kits/4915-mini-construction.mpd', set:'4915', name:'Mini Construction (Excavator)',
    pieces:67, blocks:6, brief:'An excavator whose arm is a posed hinge chain — SERVICES doing structural work on purpose.' },
  { kit:'4918-mini-flyers', file:'kits/4918-mini-flyers.mpd', set:'4918', name:'Mini Flyers (Helicopter)',
    pieces:75, blocks:4, brief:'Rotor, tail boom, skids. Low SNOT, high symmetry — the plain reading of a machine.' },
  { kit:'6965-tie-interceptor', file:'kits/6965-tie-interceptor.mpd', set:'6965', name:'TIE Interceptor (mini)',
    pieces:32, blocks:2, brief:'94% of its pieces are studs off vertical, and 78% of them are SKIN. All face, no frame.' },
  { kit:'6966-jedi-starfighter-mini', file:'kits/6966-jedi-starfighter-mini.mpd', set:'6966', name:'Jedi Starfighter (mini)',
    pieces:39, blocks:4, brief:'Thirty-nine pieces, five blocks, 77% off vertical: how a small kit buys shape.' },
  { kit:'889-radar-truck', file:'kits/889-radar-truck.mpd', set:'889', name:'Radar Truck',
    pieces:35, blocks:3, brief:'Corpus maximum for inhabitants: 49% wheels, tyres and figures. A vehicle that is mostly vehicle.' },
  { kit:'car', file:'kits/car.mpd', set:'—', name:'Example Car',
    pieces:61, blocks:1, brief:"The LDraw library's own demonstration car: one flat block, 25 pieces per million LDU cubed." },
  { kit:'6156-window-brick', file:'kits/6156-window-brick.mpd', set:'6156', name:'Panel 1x4x3 with Glass',
    pieces:0, blocks:0, degenerate:true,
    brief:'NOT A KIT. A single LDraw part file with six primitive blocks and zero pieces. Never a bar.' },
];
const KIT_BY_NAME = new Map(KITS.map((k) => [k.kit, k]));

// ═════════════════════════════════════════════════════════ measurement ctx
/**
 * Everything the twelve axes share, computed once. Each axis then reads a
 * field or two; no axis re-walks the placement list from scratch, and no axis
 * can quietly disagree with another about what "pieces" means.
 */
function buildCtx(places, opts) {
  const o = opts || {};
  const n = places.length;
  const partCounts = countBy(places.map((p) => p.part));
  const colourCounts = countBy(places.map((p) => p.color));

  // rotation vocabulary
  const rotKeys = new Map();
  let ident = 0;
  for (const p of places) {
    const k = matKey(p.mat);
    rotKeys.set(k, (rotKeys.get(k) || 0) + 1);
    if (isIdentity(p.mat)) ident++;
  }

  // envelope, from catalogue AABBs. The same box feeds AX-DENSITY and the
  // buffer occupancy, so a build cannot be dense and unoccupied at once.
  let bmin = [Infinity,Infinity,Infinity], bmax = [-Infinity,-Infinity,-Infinity];
  const boxes = new Array(n);
  let boxed = 0;
  for (let i = 0; i < n; i++) {
    const b = worldBox(places[i]);
    boxes[i] = b;
    if (!b) continue;
    boxed++;
    for (let a = 0; a < 3; a++) {
      if (b.min[a] < bmin[a]) bmin[a] = b.min[a];
      if (b.max[a] > bmax[a]) bmax[a] = b.max[a];
    }
  }
  if (!Number.isFinite(bmin[0])) {           // no catalogue: fall back to origins
    bmin = [Infinity,Infinity,Infinity]; bmax = [-Infinity,-Infinity,-Infinity];
    for (const p of places) for (let a = 0; a < 3; a++) {
      if (p.pos[a] < bmin[a]) bmin[a] = p.pos[a];
      if (p.pos[a] > bmax[a]) bmax[a] = p.pos[a];
    }
  }
  if (!Number.isFinite(bmin[0])) { bmin = [0,0,0]; bmax = [0,0,0]; }
  const bbox = [r4(bmax[0]-bmin[0]), r4(bmax[1]-bmin[1]), r4(bmax[2]-bmin[2])];
  const volume = r4(bbox[0] * bbox[1] * bbox[2]);

  // families, layers, affordances
  const famCounts = new Map(FAMILIES.map((f) => [f, 0]));
  const layerCounts = { SITE:0, STRUCTURE:0, SKIN:0, SERVICES:0, SPACE:0, STUFF:0, UNASSIGNED:0 };
  const affCounts = new Map();
  const fam = new Array(n);
  const lay = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = places[i];
    const d = p.desc || descOfPart(p.part);
    const f = familyOfDesc(d);
    fam[i] = f;
    famCounts.set(f, (famCounts.get(f) || 0) + 1);
    // A placement stamped by NabugoBrand carries its own layer; a kit
    // placement does not, so the family mapping stands in. Both are honest:
    // one is what the builder intended, the other what the part is.
    const stamped = p.layer && p.layer !== 'UNASSIGNED' && (p.layer in layerCounts) ? p.layer : null;
    const l = stamped || LAYER_OF_FAMILY[f] || 'UNASSIGNED';
    lay[i] = l;
    layerCounts[l]++;
    for (const t of affordanceTags(d)) affCounts.set(t, (affCounts.get(t) || 0) + 1);
  }

  // parent-block instancing, recovered from the flat list alone.
  // world = P * local, so P = mat * inv(lmat) and Tp = pos - P*lpos. Two
  // placements share a parent INSTANCE when they share both the block name and
  // that recovered transform; the number of distinct transforms per block is
  // how many times the block was instantiated. Recovering it from the flat
  // list rather than from the parse means AX-REUSE measures our builds and the
  // kits through the same code.
  const instKeys = new Map();      // parent -> Set(transform key)
  const pKeyOf = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = places[i];
    const li = inv3(p.lmat);
    let key;
    if (!li) key = 'singular';
    else {
      const P = mmul(p.mat, li);
      const T = [p.pos[0] - (P[0]*p.lpos[0] + P[1]*p.lpos[1] + P[2]*p.lpos[2]),
                 p.pos[1] - (P[3]*p.lpos[0] + P[4]*p.lpos[1] + P[5]*p.lpos[2]),
                 p.pos[2] - (P[6]*p.lpos[0] + P[7]*p.lpos[1] + P[8]*p.lpos[2])];
      key = matKey(P) + '|' + T.map((v) => r6(Math.round(v * 1e3) / 1e3)).join(',');
    }
    pKeyOf[i] = key;
    let s = instKeys.get(p.parent);
    if (!s) { s = new Set(); instKeys.set(p.parent, s); }
    s.add(key);
  }
  const instanceCount = new Map();
  for (const [blk, s] of instKeys) instanceCount.set(blk, s.size);

  return {
    n, places, opts: o,
    partCounts, colourCounts, rotKeys, identity: ident,
    boxes, boxed, bboxMin: bmin.map(r4), bboxMax: bmax.map(r4), bbox, volume,
    fam, lay, famCounts, layerCounts, affCounts,
    instanceCount, parentKey: pKeyOf,
    modelBlocks: instKeys.size,
    maxDepth: places.reduce((m, p) => Math.max(m, p.depth || 1), 0),
    bar: o.bar || null, text: o.text || '',
  };
}

// ══════════════════════════════════════════════════════════ AX-SYMMETRY
/**
 * Best sagittal plane x=c over three candidates: the bbox midpoint, the mean
 * x, and 0. A piece counts as mirrored when ANOTHER piece with the same part
 * id, or with its chirality twin, sits within 4 LDU of 2c-x with y and z
 * within 4.
 *
 * "Another" is load-bearing. Let a piece pair with itself and every piece
 * within 4 LDU of the plane scores, which took the island hopper — a seaplane
 * beside a jetty — to 0.985 and the demonstration car to 1.000. A spine piece
 * therefore does not score, and that is the right answer: a spine is evidence
 * of a plane, not evidence of a mirrored pair across it.
 */
function symmetryShare(ctx) {
  const places = ctx.places, n = ctx.n;
  if (!n) return 0;
  const CELL = 4;
  const grid = new Map();
  const key = (x, y, z) => x + ',' + y + ',' + z;
  for (let i = 0; i < n; i++) {
    const p = places[i];
    const k = key(Math.floor(p.pos[0]/CELL), Math.floor(p.pos[1]/CELL), Math.floor(p.pos[2]/CELL));
    let a = grid.get(k); if (!a) { a = []; grid.set(k, a); }
    a.push(i);
  }
  const mids = [ (ctx.bboxMin[0] + ctx.bboxMax[0]) / 2,
                 mean(places.map((p) => p.pos[0])),
                 0 ];
  let best = 0;
  for (const c of mids) {
    if (!Number.isFinite(c)) continue;
    let hit = 0;
    for (let i = 0; i < n; i++) {
      const p = places[i];
      const tx = 2 * c - p.pos[0], ty = p.pos[1], tz = p.pos[2];
      const twin = chiralityTwin(p.part);
      const gx = Math.floor(tx/CELL), gy = Math.floor(ty/CELL), gz = Math.floor(tz/CELL);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx++)
      for (let dy = -1; dy <= 1 && !found; dy++)
      for (let dz = -1; dz <= 1 && !found; dz++) {
        const a = grid.get(key(gx+dx, gy+dy, gz+dz));
        if (!a) continue;
        for (const j of a) {
          if (j === i) continue;
          const q = places[j];
          if (q.part !== p.part && (!twin || q.part !== twin)) continue;
          if (Math.abs(q.pos[0] - tx) > CELL) continue;
          if (Math.abs(q.pos[1] - ty) > CELL) continue;
          if (Math.abs(q.pos[2] - tz) > CELL) continue;
          found = true; break;
        }
      }
      if (found) hit++;
    }
    if (hit / n > best) best = hit / n;
  }
  return best;
}

// ═══════════════════════════════════════════════════════════════ occupancy
/**
 * Scenario buffering, measured. Voxelise the build's OWN envelope at
 * 20 x 8 x 20 LDU — one stud by one plate by one stud — and report the
 * occupied share for STRUCTURE alone, STRUCTURE+SKIN, and everything. The
 * denominator is the whole envelope, so the ceiling cannot be satisfied by
 * spreading out; spreading out is punished separately by AX-DENSITY.
 */
function occupancy(ctx) {
  const zero = { STRUCTURE: 0, STRUCTURE_SKIN: 0, ALL: 0, voxel: VOXEL.slice(), voxels: 0 };
  if (!ctx.n || !ctx.volume) return zero;
  let step = VOXEL.slice();
  let dims = step.map((s, a) => Math.max(1, Math.ceil((ctx.bboxMax[a] - ctx.bboxMin[a]) / s)));
  let total = dims[0] * dims[1] * dims[2];
  // A 165 x 156 stud sprawl would otherwise allocate hundreds of millions of
  // voxels; coarsening keeps the share meaningful and the memory bounded.
  while (total > VOXEL_CAP) {
    step = step.map((s) => s * 2);
    dims = step.map((s, a) => Math.max(1, Math.ceil((ctx.bboxMax[a] - ctx.bboxMin[a]) / s)));
    total = dims[0] * dims[1] * dims[2];
  }
  const sets = { STRUCTURE: new Set(), STRUCTURE_SKIN: new Set(), ALL: new Set() };
  for (let i = 0; i < ctx.n; i++) {
    const b = ctx.boxes[i];
    if (!b) continue;
    const l = ctx.lay[i];
    const i0 = [], i1 = [];
    for (let a = 0; a < 3; a++) {
      i0[a] = Math.max(0, Math.floor((b.min[a] - ctx.bboxMin[a]) / step[a]));
      i1[a] = Math.min(dims[a] - 1, Math.floor((b.max[a] - ctx.bboxMin[a] - 1e-6) / step[a]));
    }
    for (let x = i0[0]; x <= i1[0]; x++)
    for (let y = i0[1]; y <= i1[1]; y++)
    for (let z = i0[2]; z <= i1[2]; z++) {
      const v = (x * dims[1] + y) * dims[2] + z;
      sets.ALL.add(v);
      if (l === 'STRUCTURE' || l === 'SITE') { sets.STRUCTURE.add(v); sets.STRUCTURE_SKIN.add(v); }
      else if (l === 'SKIN') sets.STRUCTURE_SKIN.add(v);
    }
  }
  return {
    STRUCTURE: r6(sets.STRUCTURE.size / total),
    STRUCTURE_SKIN: r6(sets.STRUCTURE_SKIN.size / total),
    ALL: r6(sets.ALL.size / total),
    voxel: step, voxels: total,
  };
}

// ═══════════════════════════════════════════════════════════ THE AXES
/**
 * Twelve axes. The one home. NabugoGauntlet reads this registry and must not
 * redefine an axis; NabugoBrand reads the band and must not score itself.
 * They are never summed, averaged or weighted — a weighted sum is a supreme
 * judge in disguise, and it would let a build trade a SNOT rate of 0.000
 * against a good colour count and call itself improved.
 *
 * `median` on each axis is the corpus median over the sixteen real kits,
 * measured through this exact code; `dist()` in the gauntlet uses the band,
 * and the median is what a tie-break and a brief target read.
 */
const AXES = [
  {
    id: 'AX-VOCAB', label: 'vocabulary', layer: 'SKIN',
    direction: 'band', band: [0.25, 0.60], median: 0.430,
    unit: 'distinct parts / piece',
    note: 'A band, not a ceiling: 63 distinct parts in 66 pieces is not vocabulary, it is a bag of curiosities.',
    measure(places, ctx) { return ctx.n ? ctx.partCounts.size / ctx.n : 0; },
  },
  {
    id: 'AX-COLOUR', label: 'effective colours', layer: 'SKIN',
    direction: 'band', band: [3.5, 9.0], median: 4.496,
    unit: 'exp(H) over colour shares',
    note: 'Entropy-effective count, not raw distinct: one red tile in 200 grey bricks is not two colours.',
    measure(places, ctx) {
      if (!ctx.n) return 0;
      let H = 0;
      for (const c of ctx.colourCounts.values()) { const s = c / ctx.n; H -= s * Math.log(s); }
      return Math.exp(H);
    },
  },
  {
    id: 'AX-SNOT', label: 'studs off vertical', layer: 'SKIN',
    direction: 'band', band: [0.10, 0.70], median: 0.374,
    unit: 'share of placements',
    note: "World matrix column 1 is (m[1],m[4],m[7]); studs are vertical only when |m[4]| is 1.",
    measure(places, ctx) {
      let k = 0;
      for (const p of places) if (Math.abs(Math.abs(p.mat[4]) - 1) > 0.01) k++;
      return ctx.n ? k / ctx.n : 0;
    },
  },
  {
    id: 'AX-ROT', label: 'rotation vocabulary', layer: 'STRUCTURE',
    direction: 'band', band: [4, 40], median: 20.743,
    unit: 'distinct matrices per 100 pieces',
    note: 'Rounded to 1e-3 so a float-noise difference is not a new orientation.',
    measure(places, ctx) { return ctx.n ? (ctx.rotKeys.size / ctx.n) * 100 : 0; },
  },
  {
    id: 'AX-POSE', label: 'off-axis pose', layer: 'SERVICES',
    direction: 'band', band: [0.02, 0.55], median: 0.121,
    unit: 'share of placements',
    note: 'A matrix element that is neither ~0 nor ~+/-1 is a posed hinge, not an axis rotation.',
    measure(places, ctx) {
      let k = 0;
      for (const p of places) {
        let posed = false;
        for (let i = 0; i < 9; i++) {
          const a = Math.abs(p.mat[i]);
          if (a > EPS && Math.abs(a - 1) > EPS) { posed = true; break; }
        }
        if (posed) k++;
      }
      return ctx.n ? k / ctx.n : 0;
    },
  },
  {
    id: 'AX-LATTICE', label: 'lattice discipline', layer: 'STRUCTURE',
    direction: 'band', band: [0.55, 1.00], median: 0.703,
    unit: 'share of placements',
    note: 'LOCAL coordinates, and JOINT: x on 10 AND z on 10 AND y on 4, tolerance 0.51 LDU. ' +
          'Three separate shares would let a build be tidy in x, tidy in y and tidy nowhere at once.',
    measure(places, ctx) {
      let k = 0;
      for (const p of places) {
        if (onLattice(p.lpos[0], 10, AX_LAT) &&
            onLattice(p.lpos[2], 10, AX_LAT) &&
            onLattice(p.lpos[1], 4,  AX_LAT)) k++;
      }
      return ctx.n ? k / ctx.n : 0;
    },
  },
  {
    id: 'AX-ANATOMY', label: 'body parts', layer: 'STRUCTURE',
    direction: 'band', band: [1.5, 15], median: 6.435,
    unit: 'model blocks per 100 pieces',
    note: 'Scores 0 by definition below 2 blocks: one flat block is not anatomy however many pieces it holds.',
    measure(places, ctx) {
      if (!ctx.n || ctx.modelBlocks < 2) return 0;
      return (ctx.modelBlocks / ctx.n) * 100;
    },
  },
  {
    id: 'AX-REUSE', label: 'instanced assemblies', layer: 'STRUCTURE',
    direction: 'band', band: [0.05, 0.60], median: 0.000,
    unit: 'share of pieces',
    note: 'A piece counts when the block that authored it is instantiated two or more times.',
    measure(places, ctx) {
      let k = 0;
      for (const p of places) if ((ctx.instanceCount.get(p.parent) || 1) >= 2) k++;
      return ctx.n ? k / ctx.n : 0;
    },
  },
  {
    id: 'AX-SYMMETRY', label: 'bilateral symmetry', layer: 'SKIN',
    direction: 'band', band: [0.30, 0.95], median: 0.588,
    unit: 'share of placements with a mirror partner',
    note: 'Chirality-aware: a left wing pairs with its right twin, which is the only legal mirror.',
    measure(places, ctx) {
      if (ctx._sym === undefined) ctx._sym = symmetryShare(ctx);
      return ctx._sym;
    },
  },
  {
    id: 'AX-DENSITY', label: 'inhabited volume', layer: 'SITE',
    direction: 'band', band: [1.0, 32], median: 9.571,
    unit: 'pieces per 1e6 LDU cubed',
    note: 'Envelope from catalogue AABBs, so a colonnade over a baseplate reads as the empty box it is.',
    measure(places, ctx) { return ctx.volume > 0 ? ctx.n / (ctx.volume / 1e6) : 0; },
  },
  {
    id: 'AX-SERVICES', label: 'fast layer present', layer: 'SERVICES',
    direction: 'band', band: [0.04, 0.35], median: 0.098,
    unit: 'share of pieces',
    note: 'SHEARING_MAP.SERVICES: hinge+turntable, bracket+clip, window+door, bar+antenna. ' +
          'Brand\'s fast layer is the one that wears out; a building with none of it cannot be maintained.',
    measure(places, ctx) {
      let k = 0;
      for (const f of SHEARING_MAP.SERVICES) k += ctx.famCounts.get(f) || 0;
      return ctx.n ? k / ctx.n : 0;
    },
  },
  {
    id: 'AX-STUFF', label: 'inhabitants', layer: 'STUFF',
    direction: 'band', band: [0.02, 0.50], median: 0.046,
    unit: 'share of pieces',
    note: 'minifig, wheel+tyre, flag+cloth. plant+animal is deliberately EXCLUDED: with it in, ' +
          'a reef of corals scores 0.118 and beats the island hopper while containing no inhabitant at all.',
    measure(places, ctx) {
      let k = 0;
      for (const f of ['minifig', 'wheel+tyre', 'flag+cloth']) k += ctx.famCounts.get(f) || 0;
      return ctx.n ? k / ctx.n : 0;
    },
  },
];
const AX_BY_ID = new Map(AXES.map((a) => [a.id, a]));

/** 0 inside the band; the distance to the nearer edge outside it. */
function dist(axis, v) {
  const [lo, hi] = axis.band;
  if (!Number.isFinite(v)) return Infinity;
  if (v >= lo && v <= hi) return 0;
  return Math.min(Math.abs(v - lo), Math.abs(v - hi));
}
function inBand(axis, v) { return dist(axis, v) === 0; }

// ═══════════════════════════════════════════════════════════════════ GATES
/**
 * Binary and cheap. A gate failure voids the round: no axis scoring, no
 * partial credit. Gates measure facts, never taste.
 */
const GATES = [
  {
    id: 'G-DET', label: 'no mirrored matrices',
    check(places) {
      const bad = [];
      for (const p of places) if (det3(p.mat) <= 1e-6) bad.push(p.part);
      return bad.length
        ? { ok: false, why: bad.length + ' placements have det(mat) <= 0; real LEGO cannot be mirrored (' + [...new Set(bad)].slice(0,4).join(', ') + ')' }
        : { ok: true, why: 'all ' + places.length + ' matrices are proper rotations' };
    },
  },
  {
    id: 'G-KNOWN', label: 'every part in the catalogue',
    check(places) {
      if (!catalog()) return { ok: true, why: 'no catalogue loaded; not checked' };
      const bad = new Set();
      for (const p of places) if (!catGet(p.part)) bad.add(p.part);
      return bad.size
        ? { ok: false, why: bad.size + ' unknown parts: ' + [...bad].slice(0, 6).join(', ') }
        : { ok: true, why: 'all ' + new Set(places.map((p) => p.part)).size + ' distinct parts resolve' };
    },
  },
  {
    id: 'G-CLASH', label: 'no interpenetration',
    check(places, ctx) {
      const G = global.Nabugo && global.Nabugo.Geom;
      if (!G || !G.penetration) return { ok: true, why: 'Nabugo.Geom unavailable; not checked' };
      // Broad phase on a 40 LDU grid: the corpus maximum part is a baseplate,
      // and brute force over 1,060 placements is a million pointless pairs.
      const CELL = 40, grid = new Map();
      const key = (x,y,z) => x + ',' + y + ',' + z;
      const hits = [];
      for (let i = 0; i < ctx.n; i++) {
        const b = ctx.boxes[i];
        if (!b) continue;
        const i0 = b.min.map((v) => Math.floor(v / CELL)), i1 = b.max.map((v) => Math.floor(v / CELL));
        for (let x = i0[0]; x <= i1[0]; x++)
        for (let y = i0[1]; y <= i1[1]; y++)
        for (let z = i0[2]; z <= i1[2]; z++) {
          const k = key(x,y,z);
          let a = grid.get(k); if (!a) { a = []; grid.set(k, a); }
          a.push(i);
        }
      }
      const seen = new Set();
      for (const bucket of grid.values()) {
        for (let a = 0; a < bucket.length; a++) for (let b2 = a + 1; b2 < bucket.length; b2++) {
          const i = bucket[a], j = bucket[b2];
          const pk = i < j ? i + ':' + j : j + ':' + i;
          if (seen.has(pk)) continue;
          seen.add(pk);
          const A = places[i], B = places[j];
          if (A.asm && B.asm && A.asm === B.asm) continue;   // one object may interlock with itself
          if (G.penetration(ctx.boxes[i], ctx.boxes[j]) > 0) hits.push(A.part + '/' + B.part);
        }
      }
      return hits.length
        ? { ok: false, why: hits.length + ' interpenetrating pairs (' + [...new Set(hits)].slice(0,4).join(', ') + ')' }
        : { ok: true, why: 'no interpenetrating pairs' };
    },
  },
  {
    id: 'G-FLOAT', label: 'nothing floats',
    // Traceable to the model's OWN footing, not to y=0: the X-wing is in
    // flight and the AT-ST stands on nothing, and neither is a floating build.
    // The footing is every placement whose underside is within one plate of
    // the model's lowest surface; everything else must reach it by vertical
    // adjacency (Y is DOWN, so max[1] is the underside).
    check(places, ctx) {
      const G = global.Nabugo && global.Nabugo.Geom;
      if (!G || !G.stacked || !ctx.n) return { ok: true, why: 'Nabugo.Geom unavailable; not checked' };
      const floor = ctx.bboxMax[1];
      const CELL = 40, grid = new Map();
      const key = (x,z) => x + ',' + z;
      for (let i = 0; i < ctx.n; i++) {
        const b = ctx.boxes[i]; if (!b) continue;
        for (let x = Math.floor(b.min[0]/CELL); x <= Math.floor(b.max[0]/CELL); x++)
        for (let z = Math.floor(b.min[2]/CELL); z <= Math.floor(b.max[2]/CELL); z++) {
          const k = key(x,z); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); }
          a.push(i);
        }
      }
      const reached = new Uint8Array(ctx.n);
      const queue = [];
      for (let i = 0; i < ctx.n; i++) {
        const b = ctx.boxes[i];
        if (b && Math.abs(b.max[1] - floor) <= 8) { reached[i] = 1; queue.push(i); }
      }
      while (queue.length) {
        const i = queue.pop();
        const b = ctx.boxes[i]; if (!b) continue;
        for (let x = Math.floor(b.min[0]/CELL); x <= Math.floor(b.max[0]/CELL); x++)
        for (let z = Math.floor(b.min[2]/CELL); z <= Math.floor(b.max[2]/CELL); z++) {
          const a = grid.get(key(x,z)); if (!a) continue;
          for (const j of a) {
            if (reached[j]) continue;
            const bj = ctx.boxes[j]; if (!bj) continue;
            if (G.stacked(b, bj) || (places[i].asm && places[i].asm === places[j].asm)) {
              reached[j] = 1; queue.push(j);
            }
          }
        }
      }
      let floating = 0;
      for (let i = 0; i < ctx.n; i++) if (!reached[i] && ctx.boxes[i]) floating++;
      return floating
        ? { ok: false, why: floating + ' of ' + ctx.n + ' placements do not reach the footing' }
        : { ok: true, why: 'every placement traces to the footing' };
    },
  },
  {
    id: 'G-SCALE', label: 'scale parity with the bar',
    // A 1782-piece platform is not blind-comparable to a 184-piece hopper; the
    // critic would be judging size. Building smaller is a builder's job.
    check(places, ctx) {
      const bar = ctx.bar;
      if (!bar || !bar.pieces) return { ok: true, why: 'no bar in context; not checked' };
      const lo = 0.5 * bar.pieces, hi = 2.0 * bar.pieces;
      return (ctx.n >= lo && ctx.n <= hi)
        ? { ok: true, why: ctx.n + ' pieces, inside ' + Math.round(lo) + '-' + Math.round(hi) }
        : { ok: false, why: ctx.n + ' pieces is outside ' + Math.round(lo) + '-' + Math.round(hi) + ' against ' + bar.kit };
    },
  },
  {
    id: 'G-BUFFER', label: 'uncommitted volume preserved',
    check(places, ctx) {
      const o = ctx._occ || (ctx._occ = occupancy(ctx));
      const fails = [];
      if (o.STRUCTURE > 0.45) fails.push('STRUCTURE ' + o.STRUCTURE.toFixed(3) + ' > 0.45');
      if (o.STRUCTURE_SKIN > 0.60) fails.push('STRUCTURE+SKIN ' + o.STRUCTURE_SKIN.toFixed(3) + ' > 0.60');
      if (o.ALL > 0.75) fails.push('ALL ' + o.ALL.toFixed(3) + ' > 0.75');
      return fails.length
        ? { ok: false, why: fails.join('; ') + ' — over-specified, the future is locked out' }
        : { ok: true, why: 'occupancy ' + o.STRUCTURE.toFixed(3) + '/' + o.STRUCTURE_SKIN.toFixed(3) + '/' + o.ALL.toFixed(3) };
    },
  },
  {
    id: 'G-BLIND', label: 'no authorship tell in the text',
    // Only meaningful when a text was handed in; measurePlacements sees
    // numbers, and the gauntlet is what strips the file.
    check(places, ctx) {
      const t = ctx.text;
      if (!t) return { ok: true, why: 'no text in context; not checked' };
      const tells = [];
      if (/^0\s+Author:/im.test(t)) tells.push('0 Author');
      if (/^0\s+\/\/\s*NABUGO/im.test(t)) tells.push('0 // NABUGO');
      if (/^0\s+!LDRAW_ORG/im.test(t)) tells.push('0 !LDRAW_ORG');
      if (/^0\s+Name:/im.test(t)) tells.push('0 Name');
      return tells.length
        ? { ok: false, why: 'authorship tells present: ' + tells.join(', ') }
        : { ok: true, why: 'no authorship tells' };
    },
  },
];

// ══════════════════════════════════════════════════════════════ text loading
const docCache = new Map();     // kit name -> KitDoc
const vecCache = new Map();     // kit name -> AxisVector
const barCache = new Map();     // kit name -> Bar
let indexCache = null;

async function readText(url) {
  if (typeof fetch === 'function' && typeof window !== 'undefined') {
    const res = await fetch(url);
    if (!res.ok) throw new Error('cannot read ' + url + ': HTTP ' + res.status);
    return res.text();
  }
  // Node: the same module measures in the harness that verifies it.
  if (typeof require === 'function') return require('fs').promises.readFile(url, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error('cannot read ' + url + ': HTTP ' + res.status);
  return res.text();
}

async function loadIndex(url) {
  if (indexCache) return indexCache;
  const t = await readText(url || './kit-index.json');
  indexCache = JSON.parse(t);
  return indexCache;
}

/** Fetch + parse one kit. Cached by name. Applies the four parsing gotchas. */
async function load(kitName) {
  const key = String(kitName).replace(/\.mpd$/i, '');
  if (docCache.has(key)) return docCache.get(key);
  const rec = KIT_BY_NAME.get(key);
  const file = rec ? rec.file : ('kits/' + key + '.mpd');
  const text = await readText(file);
  const parsed = parseMpd(text);
  const doc = {
    kit: key, file, text,
    blocks: parsed.blocks, order: parsed.order,
    root: parsed.blocks.get(normKey(parsed.rootName)) || null,
    rootName: parsed.rootName,
    descriptor: rec || null,
  };
  docCache.set(key, doc);
  return doc;
}

/** Parse a raw MPD string that never came from kits/ — our own output. */
function parse(text, label) {
  const parsed = parseMpd(text);
  return {
    kit: label || 'anonymous', file: '', text,
    blocks: parsed.blocks, order: parsed.order,
    root: parsed.blocks.get(normKey(parsed.rootName)) || null,
    rootName: parsed.rootName, descriptor: null,
  };
}

// ═══════════════════════════════════════════════════════════════ flatten
/**
 * KitDoc -> Placement[] in the one canonical shape. This is the only place a
 * block tree becomes a flat list, for kits and for us alike.
 *
 * A leaf is kept when makePartInfo calls it a real part (so p/* primitives and
 * parts/s/* subparts are dropped, because neither is in the box) or when it is
 * the single synthetic piece standing in for an LDCAD flex group. Its id is
 * then canonicalised against the catalogue.
 */
function flatten(doc) {
  const parsed = { blocks: doc.blocks, order: doc.order, rootName: doc.rootName };
  const raw = flattenBlocks(parsed);
  const info = makePartInfo(doc.blocks);
  const out = [];
  for (const p of raw.placements) {
    let id, desc;
    if (p.kind === 'flex-hose') { id = p.part; desc = 'Hose Flexible'; }
    else {
      if (p.kind === 'flex-segment') continue;    // FLEX RULE: one piece, not forty
      const i = info(p.ref);
      if (i.kind !== 'part') continue;            // PRIM RULE: no primitives, no subparts
      id = i.number; desc = i.desc;
    }
    const resolved = resolveId(id, desc);
    if (catalog() && !resolved) continue;         // PRIM RULE: nothing the catalogue cannot measure
    out.push({
      part: resolved || String(id).replace(/\.dat$/i, ''),
      color: p.colour,
      pos: [r6(p.t[0]), r6(p.t[1]), r6(p.t[2])],
      mat: p.m.map(r6),
      lpos: [r6(p.lt[0]), r6(p.lt[1]), r6(p.lt[2])],
      lmat: p.lm.map(r6),
      parent: p.parent,
      depth: p.depth,
      layer: 'UNASSIGNED',
      asm: p.parent === normKey(doc.rootName) ? null : p.parent,
      desc,                       // carried so measurement works with no catalogue
    });
  }
  return out;
}

/**
 * Reconstruct, from raw Scene placements, the submodel cut that Scene.toMPD
 * would make: assemblies are grouped by `asm`, localised against the first
 * placement in the group, and two groups with the same signature become ONE
 * block referenced twice.
 *
 * Without this the same build measures differently depending on whether it
 * arrives as a Scene or as compiled MPD text — two identical minifigs read as
 * two blocks used once each (AX-REUSE 0.000) instead of one block used twice
 * (AX-REUSE 0.333). The signature below is Scene.toMPD's own, so this is a
 * reading of the compiler's decision, not a second one.
 */
function asmFrames(places) {
  const groups = new Map();
  for (const p of places) {
    if (!p.asm || p.lpos || p.parent) continue;
    let g = groups.get(p.asm); if (!g) { g = []; groups.set(p.asm, g); }
    g.push(p);
  }
  const bySig = new Map(), out = new Map();
  for (const [id, ps] of groups) {
    const o = ps[0].pos;
    const sig = ps.map((p) => p.part + '/' + p.color + '/' +
      [p.pos[0]-o[0], p.pos[1]-o[1], p.pos[2]-o[2]].map((v) => r6(Math.round(v*1e3)/1e3)).join(',') +
      '/' + matKey(p.mat || IDENT)).join('|');
    let block = bySig.get(sig);
    if (!block) {
      block = String(ps[0].vignette || id).replace(/\W+/g, '-').toLowerCase() + '-' + (bySig.size + 1) + '.ldr';
      bySig.set(sig, block);
    }
    out.set(id, { block, o });
  }
  return out;
}

/**
 * Coerce anything that looks like a placement into the canonical shape. Our
 * own Scene emits {part,color,pos,mat,asm} with no local frame and no parent,
 * and four of the twelve axes are measured in the local frame, so the
 * fallbacks are stated once, here, rather than guessed per axis.
 */
function normalise(places) {
  const asmFrame = asmFrames(places);
  const out = new Array(places.length);
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const fr = (!p.lpos && !p.parent && p.asm) ? asmFrame.get(p.asm) : null;
    const mat = (p.mat || IDENT).slice();
    const pos = (p.pos || [0,0,0]).slice();
    const id = String(p.part).replace(/\.dat$/i, '');
    out[i] = {
      part: resolveId(id, p.desc) || id,
      color: (p.color !== undefined ? p.color : (p.colour !== undefined ? p.colour : 16)),
      pos, mat,
      // No submodel means the local frame IS the world frame: a flat build is
      // measured as one block placed once, which is exactly what it is.
      lpos: p.lpos ? p.lpos.slice()
          : fr ? [r6(pos[0] - fr.o[0]), r6(pos[1] - fr.o[1]), r6(pos[2] - fr.o[2])]
          : pos.slice(),
      lmat: (p.lmat || mat).slice(),
      parent: p.parent || (fr ? fr.block : (p.asm || 'root')),
      depth: p.depth || (p.asm ? 2 : 1),
      layer: p.layer || 'UNASSIGNED',
      asm: p.asm || null,
      desc: p.desc || '',
    };
  }
  return out;
}

// ══════════════════════════════════════════════════════════════ measurement
/**
 * Measure ANY flat placement list — the kit's or ours — through one code path.
 * A second implementation invalidates the comparison, so there is not one.
 */
function measurePlacements(places, opts) {
  const o = opts || {};
  const P = normalise(places);
  const ctx = buildCtx(P, o);
  const axes = {};
  for (const a of AXES) axes[a.id] = r6(a.measure(P, ctx));
  const gates = {};
  for (const g of GATES) {
    if (o.gates === false) { gates[g.id] = { ok: true, why: 'skipped' }; continue; }
    if (o.skipGates && o.skipGates.indexOf(g.id) >= 0) { gates[g.id] = { ok: true, why: 'skipped' }; continue; }
    gates[g.id] = g.check(P, ctx);
  }
  const occ = ctx._occ || (ctx._occ = occupancy(ctx));
  const familyShare = {};
  for (const f of FAMILIES) familyShare[f] = r6((ctx.famCounts.get(f) || 0) / (ctx.n || 1));
  const layerShare = {};
  for (const k of Object.keys(ctx.layerCounts)) layerShare[k] = r6(ctx.layerCounts[k] / (ctx.n || 1));
  const affordances = {};
  for (const [k, v] of ctx.affCounts) affordances[k] = v;

  return {
    label: o.label || 'unlabelled',
    pieces: ctx.n,
    axes, gates,
    raw: {
      distinct: ctx.partCounts.size,
      top1Share: r6(shareOfTop(ctx.partCounts, 1, ctx.n)),
      top5Share: r6(shareOfTop(ctx.partCounts, 5, ctx.n)),
      identityShare: r6(ctx.identity / (ctx.n || 1)),
      distinctMatrices: ctx.rotKeys.size,
      colours: ctx.colourCounts.size,
      bbox: ctx.bbox, bboxMin: ctx.bboxMin, bboxMax: ctx.bboxMax, volume: ctx.volume,
      bboxStuds: [r4(ctx.bbox[0]/20), r4(ctx.bbox[1]/8), r4(ctx.bbox[2]/20)],
      modelBlocks: ctx.modelBlocks,
      maxDepth: ctx.maxDepth,
      familyShare, layerShare,
      occupancy: { STRUCTURE: occ.STRUCTURE, STRUCTURE_SKIN: occ.STRUCTURE_SKIN, ALL: occ.ALL },
      affordances,
      topParts: topN(ctx.partCounts, 8).map(([part, count]) => ({ part, count, desc: descOfPart(part) })),
      topColours: topN(ctx.colourCounts, 8).map(([code, count]) => ({ code, count, share: r6(count/(ctx.n||1)) })),
    },
  };
}

/** load + flatten + measure, cached by kit name. */
async function measure(kitName) {
  const key = String(kitName).replace(/\.mpd$/i, '');
  if (vecCache.has(key)) return vecCache.get(key);
  const doc = await load(key);
  const v = measurePlacements(flatten(doc), { label: key, text: doc.text, skipGates: ['G-BLIND'] });
  v.kit = key; v.file = doc.file;
  vecCache.set(key, v);
  return v;
}

/** The bar object the critic and the builders both use. */
async function bar(kitName) {
  const key = String(kitName || '5935-island-hopper').replace(/\.mpd$/i, '');
  if (barCache.has(key)) return barCache.get(key);
  const rec = KIT_BY_NAME.get(key);
  if (rec && rec.degenerate) throw new Error(key + ' is a single LDraw part file, not a kit; it may never be a bar');
  const v = await measure(key);
  const applicable = [], targets = {};
  for (const a of AXES) {
    const bv = v.axes[a.id];
    targets[a.id] = { barValue: bv, band: a.band.slice(), direction: a.direction, median: a.median, layer: a.layer };
    // §3.1: a bar that does not exercise an axis cannot judge it.
    if (inBand(a, bv)) applicable.push(a.id);
  }
  const b = {
    kit: key, file: rec ? rec.file : 'kits/' + key + '.mpd',
    role: rec ? (rec.role || null) : null,
    vector: v, pieces: v.pieces,
    scaleBand: [Math.round(0.5 * v.pieces), Math.round(2.0 * v.pieces)],
    applicable, targets,
  };
  barCache.set(key, b);
  return b;
}

/** The next harder bar, per §6: 5935 -> 7140 -> 10174, and then stay. */
function nextBar(kitName) {
  const ladder = ['5935-island-hopper', '7140-xwing-fighter', '10174-imperial-atst-ucs'];
  const i = ladder.indexOf(String(kitName));
  return i < 0 ? ladder[0] : ladder[Math.min(i + 1, ladder.length - 1)];
}

// ════════════════════════════════════════════════════════════════════ norms
/** kitNorm from kit-index.json: min/p25/median/p75/max/mean/argmin/argmax. */
function norm(metricPath) {
  if (!indexCache) return null;
  const m = indexCache.kitNorm && indexCache.kitNorm.metrics;
  return (m && m[metricPath]) || null;
}
/**
 * The same shape for an AXIS across every kit measured so far. Unlike norm()
 * this needs no index — it is computed from vectors this module produced — so
 * the axis bands can be re-derived from the corpus at any time.
 */
async function axisNorm(axisId, kitNames) {
  const axis = AX_BY_ID.get(axisId);
  if (!axis) return null;
  const names = kitNames || KITS.filter((k) => !k.degenerate).map((k) => k.kit);
  const rows = [];
  for (const k of names) rows.push({ kit: k, v: (await measure(k)).axes[axisId] });
  const s = rows.slice().sort((a, b) => a.v - b.v);
  const q = (p) => { const i = (s.length-1)*p, l = Math.floor(i), h = Math.ceil(i);
    return l === h ? s[l].v : s[l].v + (s[h].v - s[l].v) * (i - l); };
  return {
    axis: axisId, band: axis.band.slice(), kits: rows.length,
    min: r6(s[0].v), p25: r6(q(0.25)), median: r6(median(s.map((x) => x.v))),
    p75: r6(q(0.75)), max: r6(s[s.length-1].v), mean: r6(mean(s.map((x) => x.v))),
    argmin: s[0].kit, argmax: s[s.length-1].kit,
    inBand: rows.filter((x) => inBand(axis, x.v)).length,
    rows,
  };
}

// ════════════════════════════════════════════════════════════════════ list
/** The seventeen kits as cards: set number, name, pieces, one-line brief. */
function list() {
  return KITS.map((k) => {
    const v = vecCache.get(k.kit);
    return {
      kit: k.kit, set: k.set, name: k.name, file: k.file,
      pieces: v ? v.pieces : k.pieces,
      blocks: v ? v.raw.modelBlocks : k.blocks,
      bar: !!k.bar, role: k.role || null, degenerate: !!k.degenerate,
      brief: k.brief,
      measured: !!v,
    };
  });
}

// ═════════════════════════════════════════════════════════════════ compare
/**
 * Per axis, which side wins and by how much. NEVER summed — the return value
 * is a list, deliberately, and there is no total field to read by accident.
 * `a` and `b` are AxisVectors; the caller knows which is which, and the
 * gauntlet is what hides that from the critic.
 *
 * This function is direction-neutral: equal distances return 'TIE'. The
 * contract's "ties go to the kit" is a JUDGEMENT, and it belongs to
 * NabugoGauntlet.judgeAxis, which knows which side is ours. Baking it in here
 * would make a symmetric comparison quietly asymmetric.
 */
function compare(a, b) {
  const va = a && a.axes ? a : (a && a.vector) || {};
  const vb = b && b.axes ? b : (b && b.vector) || {};
  return AXES.map((ax) => {
    const av = va.axes ? va.axes[ax.id] : NaN;
    const bv = vb.axes ? vb.axes[ax.id] : NaN;
    const da = dist(ax, av), db = dist(ax, bv);
    let winner, why;
    if (!Number.isFinite(av) || !Number.isFinite(bv)) { winner = 'N/A'; why = 'not measured on both sides'; }
    else if (da === db) {
      winner = 'TIE';
      why = da === 0 ? 'both inside [' + ax.band[0] + ', ' + ax.band[1] + ']'
                     : 'both miss the band by ' + r4(da);
    } else if (da < db) { winner = 'A'; why = 'A misses by ' + r4(da) + ', B by ' + r4(db); }
    else { winner = 'B'; why = 'B misses by ' + r4(db) + ', A by ' + r4(da); }
    return {
      id: ax.id, label: ax.label, layer: ax.layer, band: ax.band.slice(), unit: ax.unit,
      a: av, b: bv, distA: r6(da), distB: r6(db),
      inBandA: da === 0, inBandB: db === 0,
      winner, margin: r6(Math.abs(da - db)),
      shortfall: r6(Math.abs(da - db) / Math.max(ax.band[1] - ax.band[0], 1e-6)),
      why,
    };
  });
}

// ══════════════════════════════════════════════════════════════════ brief
/**
 * A kit is only a bar if you can build against it, so a measured kit becomes a
 * Nabugo.Brief.BRIEFS entry. Every field is derived from the kit's own
 * geometry — nothing here is written by hand for a particular set.
 *
 *   title        the set number and the root block's own description
 *   description  the kit's own anatomy, stated: blocks, depth, footprint
 *   extent       the kit bbox in LDU, rounded UP to the 80 LDU tray cell, so
 *                the nine-by-nine semantic grid covers exactly the kit's plot
 *   massTarget   the kit's flat piece count: build the same mass, not more
 *   zones        Brand's layers laid on the concentric tray. Zone 1 is the
 *                centre cell and holds the STRUCTURE the thing is built
 *                around; zone 2 the SKIN that wraps it; zone 3 the SERVICES
 *                that must stay reachable; zone 4 the edge, where STUFF and
 *                the SITE live. Each zone's `lex` is the leading nouns the
 *                kit itself uses in that layer, most common first, so the
 *                retrieval terms come from the box and not from a thesaurus.
 *   zoneTargets  vignettes per zone, apportioned by that layer's share of the
 *                kit's pieces over the nine the tray expects, clamped to 1..4
 *                so no layer disappears and none takes the whole build.
 *   voids        one per TIER A block (>= 5 flat pieces), named after the
 *                block, with its assembly_roles read off the layer mix of the
 *                pieces that block actually contains.
 *   axisTargets  the twelve measured values, so a builder can read the target
 *                without re-measuring the kit.
 */
async function brief(kitId) {
  const key = String(kitId || '5935-island-hopper').replace(/\.mpd$/i, '');
  const doc = await load(key);
  const places = flatten(doc);
  const vec = await measure(key);
  const rec = KIT_BY_NAME.get(key);

  // ---- per-block anatomy, from the flatten's own parent stamps
  const perBlock = new Map();
  for (const p of places) {
    let b = perBlock.get(p.parent);
    if (!b) { b = { name: p.parent, pieces: 0, layers: {}, parts: new Map() }; perBlock.set(p.parent, b); }
    b.pieces++;
    const d = p.desc || descOfPart(p.part);
    const l = LAYER_OF_FAMILY[familyOfDesc(d)] || 'UNASSIGNED';
    b.layers[l] = (b.layers[l] || 0) + 1;
    b.parts.set(p.part, (b.parts.get(p.part) || 0) + 1);
  }

  // ---- zone lexicons: the kit's own leading nouns, per Brand layer
  const ZONE_LAYER = { 1: 'STRUCTURE', 2: 'SKIN', 3: 'SERVICES', 4: 'STUFF' };
  const nounsByLayer = { STRUCTURE: new Map(), SKIN: new Map(), SERVICES: new Map(), STUFF: new Map(), UNASSIGNED: new Map() };
  const layerCount = { STRUCTURE: 0, SKIN: 0, SERVICES: 0, STUFF: 0, UNASSIGNED: 0 };
  for (const p of places) {
    const d = p.desc || descOfPart(p.part);
    const l = LAYER_OF_FAMILY[familyOfDesc(d)] || 'UNASSIGNED';
    layerCount[l]++;
    const m = nounsByLayer[l];
    for (const w of String(d).toLowerCase().split(/[\s,]+/)) {
      const t = w.replace(/[^a-z-]/g, '');
      if (t.length < 3 || /^(with|and|the|for|x|of)$/.test(t)) continue;
      m.set(t, (m.get(t) || 0) + 1);
    }
    for (const tag of affordanceTags(d)) m.set(tag, (m.get(tag) || 0) + 2);
  }

  const n = places.length || 1;
  const zones = {}, zoneTargets = {};
  // Each zone is named after a DIFFERENT block, claimed greedily by how much
  // of that layer the block holds. Without the no-repeat rule the island
  // hopper names three of its four zones "Plane", because one 157-piece block
  // is the plurality of structure, skin and services at once — which is true
  // and useless. Greedy claiming recovers Plane / Jet / Skie / Minifig, the
  // cut the kit actually made.
  const claimed = new Set();
  for (const z of [1,2,3,4]) {
    const layer = ZONE_LAYER[z];
    // Zone 4 is the edge and carries the ground as well as the inhabitants.
    const share = layer === 'STUFF'
      ? (layerCount.STUFF + layerCount.UNASSIGNED) / n
      : layerCount[layer] / n;
    const lex = topN(nounsByLayer[layer], 10).map(([w]) => w);
    if (layer === 'STUFF') for (const [w] of topN(nounsByLayer.UNASSIGNED, 4)) if (lex.indexOf(w) < 0) lex.push(w);
    let bestBlock = null, bestScore = 0;
    for (const b of perBlock.values()) {
      if (claimed.has(b.name)) continue;
      const s = (b.layers[layer] || 0);
      if (s > bestScore) { bestScore = s; bestBlock = b; }
    }
    if (bestBlock) claimed.add(bestBlock.name);
    zones[z] = {
      name: prettyBlock(bestBlock ? bestBlock.name : layer) + ' — ' + layer.toLowerCase(),
      layer,
      lex: lex.length ? lex : [layer.toLowerCase()],
      share: r6(share),
    };
    zoneTargets[z] = Math.max(1, Math.min(4, Math.round(share * 9)));
  }

  // ---- voids: one per TIER A block
  const tierA = [...perBlock.values()].filter((b) => b.pieces >= 5)
    .sort((a, b) => b.pieces - a.pieces).slice(0, 8);
  const voids = tierA.map((b, i) => {
    const layers = Object.entries(b.layers).sort((x, y) => y[1] - x[1]).map(([l]) => l);
    const dom = layers[0] || 'STRUCTURE';
    const zone = dom === 'STRUCTURE' ? 1 : dom === 'SKIN' ? 2 : dom === 'SERVICES' ? 3 : 4;
    return {
      id: 'v_' + prettyBlock(b.name).toLowerCase().replace(/\W+/g, '_').replace(/^_|_$/g, '') || ('v_' + i),
      zone,
      narrative_need: 'The ' + prettyBlock(b.name) + ': ' + b.pieces + ' pieces the kit cut into one block, ' +
        layers.slice(0, 2).join(' over ').toLowerCase(),
      pieces: b.pieces,
      layers: b.layers,
      assembly_roles: rolesFor(b.layers),
      staples: topN(b.parts, 4).map(([p, c]) => ({ part: p, count: c, desc: descOfPart(p) })),
    };
  });

  const studs = vec.raw.bboxStuds;
  const CELLU = 80;   // Nabugo's semantic tray cell, in LDU
  const extent = [
    Math.ceil(vec.raw.bbox[0] / CELLU) * CELLU,
    Math.ceil(vec.raw.bbox[1] / CELLU) * CELLU,
    Math.ceil(vec.raw.bbox[2] / CELLU) * CELLU,
  ];

  // palette targets: the kit's own family mix, the shape the build should land in
  const paletteTargets = {};
  for (const f of FAMILIES) if (vec.raw.familyShare[f] > 0) paletteTargets[f] = vec.raw.familyShare[f];

  return {
    key: 'kit-' + key,
    kit: key,
    title: (rec && rec.set && rec.set !== '—' ? rec.set + ' — ' : '') +
           ((doc.root && doc.root.desc) || (rec && rec.name) || key),
    description:
      vec.pieces + ' pieces, ' + vec.raw.distinct + ' distinct, ' + vec.raw.modelBlocks +
      ' block' + (vec.raw.modelBlocks === 1 ? '' : 's') + ' ' + vec.raw.maxDepth + ' deep, ' +
      Math.round(studs[0]) + ' x ' + Math.round(studs[2]) + ' studs by ' + Math.round(studs[1]) +
      ' plates. ' + (rec ? rec.brief : ''),
    massTarget: vec.pieces,
    extent, extentStuds: [r4(extent[0]/20), r4(extent[1]/8), r4(extent[2]/20)],
    bbox: vec.raw.bbox.slice(), bboxMin: vec.raw.bboxMin.slice(), bboxMax: vec.raw.bboxMax.slice(),
    zones, zoneTargets, voids,
    ecologies: ecologiesFor(places),
    churnZone: 0,
    paletteTargets,
    layerTargets: vec.raw.layerShare,
    axisTargets: Object.assign({}, vec.axes),
    scaleBand: [Math.round(0.5 * vec.pieces), Math.round(2.0 * vec.pieces)],
    note: 'Derived from ' + doc.file + ' by NabugoKits.brief(). Zones are Brand\'s layers laid on the ' +
          'concentric tray; every lexicon word is a noun the kit itself uses; every void is a block ' +
          'the kit actually cut. Nothing here was written for this set by hand.',
  };
}
/**
 * `BRIEFS.atlantis` carries an `ecologies` list, so a kit brief carries one
 * too — scored, not chosen: each ecology's own guild regexes and lexicons are
 * run against the descriptions of the parts THIS KIT contains, and the three
 * that match most of them are named. Read-only, and absent without NabugoEvo,
 * so nothing here depends on the evolutionary layer being loaded.
 */
let ecoPrior = null;
/** What share of the WHOLE catalogue each ecology-guild matches. Computed once. */
function ecologyPriors(E) {
  if (ecoPrior) return ecoPrior;
  const C = catalog();
  const all = C ? C.all().map((p) => String(p.d || '').toLowerCase()) : [];
  ecoPrior = new Map();
  for (const id of E.ids()) {
    const eco = E.get(id), per = {};
    for (const g of Object.keys(eco.guilds)) per[g] = guildShare(eco.guilds[g], all);
    ecoPrior.set(id, per);
  }
  return ecoPrior;
}
/** A guild hits a description only when BOTH its category regex and one lexicon word do. */
function guildShare(spec, descs) {
  if (!descs.length) return 0;
  let hit = 0;
  for (const d of descs) {
    if (spec.cat && !spec.cat.test(d)) continue;
    for (const w of spec.lex) if (d.includes(w)) { hit++; break; }
  }
  return hit / descs.length;
}
function ecologiesFor(places) {
  const E = global.NabugoEvo && global.NabugoEvo.Ecology;
  if (!E || !E.ECOLOGIES) return [];
  const descs = places.map((p) => String(p.desc || descOfPart(p.part)).toLowerCase());
  if (!descs.length) return [];
  const prior = ecologyPriors(E);
  const score = [];
  for (const id of E.ids()) {
    const eco = E.get(id), pri = prior.get(id) || {};
    // LIFT, not share. eco_monumental_architecture's lexicon is 'brick',
    // 'plate', 'base' — words most of the catalogue contains — so on raw
    // share it wins for the radar truck and the TIE interceptor alike.
    // Dividing by the ecology's catalogue-wide prior asks the only useful
    // question: is THIS kit unusually full of that ecology's material?
    // Summed as sqrt over guilds so breadth beats one saturated guild, which
    // is what a viable bag needs.
    let s = 0;
    for (const g of Object.keys(eco.guilds)) {
      const share = guildShare(eco.guilds[g], descs);
      if (!share) continue;
      s += Math.sqrt(share / Math.max(pri[g] || 0, 1 / Math.max(descs.length, 1000)));
    }
    score.push([id, r6(s)]);
  }
  score.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return score.filter((x) => x[1] > 0).slice(0, 3).map((x) => x[0]);
}

/** 'parts/5935 - plane.ldr' -> 'Plane'. Block names are the kit's own anatomy words. */
function prettyBlock(name) {
  let s = String(name || '').replace(/^.*\//, '').replace(/\.(ldr|mpd|dat)$/i, '');
  s = s.replace(/^\d+\s*-\s*/, '').replace(/\bsub-?model\b/ig, 'Part')
       .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return 'Root';
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
/** Brand layers -> the assembly roles Nabugo's void ledger speaks. */
function rolesFor(layers) {
  const r = [];
  if (layers.STRUCTURE) r.push('foundation', 'vertical_support');
  if (layers.SKIN) r.push('enclosure');
  if (layers.SERVICES) r.push('ornament');
  if (layers.STUFF) r.push('inhabited_scale');
  return r.length ? [...new Set(r)] : ['foundation'];
}

// ══════════════════════════════════════════════════ public classifiers
/** 16 families. Takes a part id; FAMILY_RULES read the catalogue description. */
function familyOf(partId) { return familyOfDesc(descOfPart(partId)); }
/** SHEARING_MAP: STRUCTURE | SKIN | SERVICES | STUFF | UNASSIGNED. */
function layerOf(partId) { return LAYER_OF_FAMILY[familyOf(partId)] || 'UNASSIGNED'; }
function affordancesOf(partId) { return affordanceTags(descOfPart(partId)); }

function clearCache() {
  docCache.clear(); vecCache.clear(); barCache.clear();
  indexCache = null; twinTable = null;
  catCache.byDesc = null; catCache.size = -1; catCache.resolved.clear();
}

// ═════════════════════════════════════════════════════════════════ exports
const NabugoKits = {
  KITS, AXES, GATES, SHEARING_MAP, FAMILIES, CHIRALITY_PAIRS, Core,
  loadIndex, load, parse, flatten, normalise,
  measurePlacements, measure, bar, nextBar,
  norm, axisNorm, list, compare, brief,
  familyOf, layerOf, affordancesOf, chiralityTwin,
  dist, inBand, axis: (id) => AX_BY_ID.get(id) || null,
  worldBox, occupancy, resolveId, descOfPart,
  clearCache,
};

global.NabugoKits = NabugoKits;
// build-kit-index.js runs this same core under node so the index and the
// browser cannot disagree about what a kit contains.
if (typeof module !== 'undefined' && module.exports) module.exports = NabugoKits;

})(typeof window !== 'undefined' ? window : globalThis);

#!/usr/bin/env node
/*
 * build-kit-index.js — measure THE BAR.
 *
 * Parses every kits/*.mpd (three.js "Packed" LDraw MPDs from the LDraw Official
 * Model Repository) and emits kit-index.json: one record per kit plus a corpus-wide
 * KIT NORM (min / median / max per metric).
 *
 * Plain node. No deps. Deterministic. Offline.
 *
 * PACKED MPD ANATOMY (learned from the files, not assumed):
 *   line 0..~336  an inlined LDConfig.ldr colour table (no type-1 lines)
 *   then          the ROOT MODEL, headed by "0 Name: <kit>.ldr", with NO "0 FILE" line
 *   then          N blocks headed by "0 FILE <name>"
 *                   name ends .ldr / .mpd  -> a real submodel of the kit
 *                   name ends .dat         -> an INLINED PART/PRIMITIVE DEFINITION, not a submodel
 *
 * LDRAW FACTS: Y is DOWN. Stud pitch 20 LDU. Plate 8 LDU. Brick 24 LDU. Stud 4 LDU.
 * Type-1 line: 1 <colour> x y z a b c d e f g h i <file>
 *   world = M*local + T with M = [[a,b,c],[d,e,f],[g,h,i]] (row-major 3x3).
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const KITS_DIR = path.join(ROOT, 'kits');
const OUT = path.join(ROOT, 'kit-index.json');

const EPS = 1e-4;        // matrix element "is it 0 / +-1"
const LAT_EPS = 1e-3;    // lattice tolerance in LDU

// ---------------------------------------------------------------- utilities
const r6 = (v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v);
const r4 = (v) => (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : v);
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function onLattice(v, m) { return Math.abs(v - Math.round(v / m) * m) < LAT_EPS; }
function countBy(arr) {
  const m = new Map();
  for (const k of arr) m.set(k, (m.get(k) || 0) + 1);
  return m;
}
function topN(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n);
}
function shareOfTop(map, n, total) {
  if (!total) return 0;
  return topN(map, n).reduce((s, e) => s + e[1], 0) / total;
}

// matrix helpers: m = [a,b,c,d,e,f,g,h,i] row-major, t = [x,y,z]
const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function mmul(A, B) {
  const O = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    O[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  }
  return O;
}
function mapply(M, T, v) {
  return [
    M[0] * v[0] + M[1] * v[1] + M[2] * v[2] + T[0],
    M[3] * v[0] + M[4] * v[1] + M[5] * v[2] + T[1],
    M[6] * v[0] + M[7] * v[1] + M[8] * v[2] + T[2],
  ];
}
function compose(Mp, Tp, Mc, Tc) { return { m: mmul(Mp, Mc), t: mapply(Mp, Tp, Tc) }; }

// ------------------------------------------------------------- block parsing
function normKey(name) {
  return name.trim().toLowerCase().replace(/\\/g, '/');
}
function baseName(name) {
  const k = normKey(name);
  const i = k.lastIndexOf('/');
  return i < 0 ? k : k.slice(i + 1);
}
function partNumberOf(name) { return baseName(name).replace(/\.dat$/, ''); }
function isModelName(name) { return /\.(ldr|mpd)$/i.test(normKey(name)); }

/** Split a packed MPD into logical blocks. */
function parseMpd(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const blocks = new Map();   // normKey -> block
  const order = [];

  function addBlock(name, bodyLines) {
    const b = buildBlock(name, bodyLines);
    const k = normKey(b.name);
    if (!blocks.has(k)) { blocks.set(k, b); order.push(k); }
    return b;
  }

  // find first "0 FILE"
  let firstFile = lines.findIndex((l) => /^0\s+FILE\s+/i.test(l));
  if (firstFile < 0) firstFile = lines.length;
  const leading = lines.slice(0, firstFile);

  // The leading section is LDConfig.ldr followed (usually) by the root block.
  // Both carry "0 Name:". The LAST one in the leading section is the root.
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

  // remaining "0 FILE" blocks
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

  // fallback: no root in the leading section -> first model-named block
  if (!rootName) {
    for (const k of order) if (isModelName(blocks.get(k).name)) { rootName = blocks.get(k).name; break; }
  }
  return { blocks, order, rootName };
}

function buildBlock(name, bodyLines) {
  const b = {
    name: name.trim(),
    desc: '',
    ldrawOrg: '',
    refs: [],        // {colour, m, t, name}
    verts: [],       // flat local vertices from type 2/3/4/5
    steps: 0,
    rotsteps: 0,
    isModel: false,
    pathSkin: false,
    donorPart: '',
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
      const colour = parseInt(f[1], 10);
      const tv = [ +f[2], +f[3], +f[4] ];
      const m = [ +f[5], +f[6], +f[7], +f[8], +f[9], +f[10], +f[11], +f[12], +f[13] ];
      const nm = f.slice(14).join(' ');
      b.refs.push({ colour, m, t: tv, name: nm });
    } else if (t === '2' || t === '3' || t === '4' || t === '5') {
      sawGeom = true;
      const nv = t === '2' ? 2 : t === '3' ? 3 : 4;      // type 5: use the 2 real endpoints only
      for (let k = 0; k < nv; k++) {
        const o = 2 + k * 3;
        if (f.length <= o + 2) break;
        b.verts.push(+f[o], +f[o + 1], +f[o + 2]);
      }
    }
  }
  // an LDCAD flexible-part group: many donor segments that are ONE physical piece
  b.isFlexGroup = b.pathSkin || /flex|hose/i.test(b.name);
  b.isModel = isModelName(b.name) ||
    (!/\.dat$/i.test(b.name) && /^(Unofficial_)?Model/i.test(b.ldrawOrg));
  return b;
}

// -------------------------------------------------------- geometry (exact-ish)
/** Flattened LOCAL vertex list of a definition, memoised. */
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
        const x = cv[i], y = cv[i + 1], z = cv[i + 2];
        out.push(
          r.m[0] * x + r.m[1] * y + r.m[2] * z + r.t[0],
          r.m[3] * x + r.m[4] * y + r.m[5] * z + r.t[1],
          r.m[6] * x + r.m[7] * y + r.m[8] * z + r.t[2],
        );
      }
    }
    stack.delete(k);
    const fa = Float64Array.from(out);
    cache.set(k, fa);
    return fa;
  }
  return get;
}

// ------------------------------------------------------------------ families
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
// Stewart Brand's shearing layers, mapped from part family. Emitted so the mapping is auditable.
const SHEARING_MAP = {
  STRUCTURE: ['brick', 'plate', 'technic'],
  SKIN:      ['tile', 'slope', 'panel+windscreen', 'round+cone'],
  SERVICES:  ['hinge+turntable', 'bracket+clip', 'window+door', 'bar+antenna'],
  STUFF:     ['minifig', 'wheel+tyre', 'plant+animal', 'flag+cloth'],
  UNASSIGNED:['other'],
};

function familyOf(desc) {
  const d = (desc || '').trim().toLowerCase();
  for (const [re, fam] of FAMILY_RULES) if (re.test(d)) return fam;
  return 'other';
}
/** finer bucket so nothing is lost inside "slope" / "other" */
function familyDetail(desc) {
  const d = (desc || '').trim().toLowerCase();
  const first = (d.split(/\s+/)[0] || 'unknown').replace(/[^a-z-]/g, '');
  return first || 'unknown';
}
/** connection affordances = Brand's SERVICES tells */
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

// --------------------------------------------------- part identity + alias hops
/** Resolve a reference to {number, desc, org, kind}, following "~Moved to X" aliases. */
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

// -------------------------------------------------------------- rotation kind
function isIdentity(m) { for (let i = 0; i < 9; i++) if (Math.abs(m[i] - IDENT[i]) > EPS) return false; return true; }
function isAxis90(m) {
  // every element in {0,+1,-1} AND exactly one non-zero per row and per column
  const rows = [0, 0, 0], cols = [0, 0, 0];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const v = m[r * 3 + c], a = Math.abs(v);
    if (a < EPS) continue;
    if (Math.abs(a - 1) > EPS) return false;
    rows[r]++; cols[c]++;
  }
  return rows.every((x) => x === 1) && cols.every((x) => x === 1);
}
function det3(m) {
  return m[0]*(m[4]*m[8]-m[5]*m[7]) - m[1]*(m[3]*m[8]-m[5]*m[6]) + m[2]*(m[3]*m[7]-m[4]*m[6]);
}
/** local +Y maps to world column 1 = (b,e,h). studs vertical iff that is +-world Y */
function studsVertical(m) {
  return Math.abs(m[1]) < 1e-3 && Math.abs(m[7]) < 1e-3 && Math.abs(Math.abs(m[4]) - 1) < 1e-3;
}

// ------------------------------------------------------------------- flatten
function flattenKit(parsed) {
  const { blocks, rootName } = parsed;
  const placements = [];
  const submodelInstances = new Map();   // normKey -> instance count (flattened)
  const missing = new Map();
  const visited = new Set();
  const joints = [];
  const flexGroups = [];
  let maxDepth = 0;
  const guard = new Set();

  function lookup(name) {
    return blocks.get(normKey(name)) || blocks.get(baseName(name)) || null;
  }
  function walk(name, M, T, colour, depth, chain, inFlex) {
    maxDepth = Math.max(maxDepth, depth);
    const b = lookup(name);
    if (!b) { missing.set(normKey(name), (missing.get(normKey(name)) || 0) + 1); return; }
    const k = normKey(b.name);
    visited.add(k);
    if (guard.has(k)) return;
    guard.add(k);
    for (const r of b.refs) {
      const c = r.colour === 16 ? colour : r.colour;
      const { m, t } = compose(M, T, r.m, r.t);
      const child = lookup(r.name);
      const childIsModel = child ? child.isModel : isModelName(r.name);
      if (childIsModel) {
        const ck = normKey(child ? child.name : r.name);
        submodelInstances.set(ck, (submodelInstances.get(ck) || 0) + 1);
        joints.push({ parent: k, child: ck, m: r.m, t: r.t });
        if (child && child.isFlexGroup) {
          // ONE physical flexible piece, however many donor segments render it
          const donor = child.donorPart ||
            (child.refs.find((q) => /\.dat$/i.test(q.name)) || { name: 'hose.dat' }).name;
          flexGroups.push({ block: ck, donor: partNumberOf(donor), segments: child.refs.length });
          placements.push({
            part: partNumberOf(donor), ref: normKey(donor), colour: c,
            m, t, lm: r.m, lt: r.t, depth, parent: k, kind: 'flex-hose', synthetic: true,
          });
        }
        walk(r.name, m, t, c, depth + 1, chain + '/' + ck, inFlex || !!(child && child.isFlexGroup));
      } else {
        placements.push({
          part: partNumberOf(r.name),
          ref: normKey(r.name),
          colour: c,
          m, t,               // composed / world
          lm: r.m, lt: r.t,   // as authored inside its parent block
          depth,
          parent: k,
          kind: inFlex ? 'flex-segment' : 'ref',   // refined to part/subpart/primitive by partInfo
        });
      }
    }
    guard.delete(k);
  }
  walk(rootName, IDENT, [0, 0, 0], 16, 1, normKey(rootName), false);
  return { placements, submodelInstances, maxDepth, missing, visited, joints, flexGroups };
}

// -------------------------------------------------------------------- measure
function measureKit(file) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = parseMpd(text);
  const { blocks, order, rootName } = parsed;

  const modelBlocks = [...blocks.values()].filter((b) => b.isModel);
  const partDefs = [...blocks.values()].filter((b) => !b.isModel);

  const { placements: allPlacements, submodelInstances, maxDepth, missing, visited, joints, flexGroups } = flattenKit(parsed);

  // Resolve every leaf reference to a real part identity, following "~Moved to" aliases, and
  // classify it. LDraw models legally place PRIMITIVES (p/*) and SUBPARTS (parts/s/*) directly;
  // an LDCAD flex group is many donor segments that are ONE physical piece. None of those are
  // pieces a builder buys. `pieces` counts what you would find in the box.
  const info = makePartInfo(blocks);
  for (const p of allPlacements) {
    if (p.kind === 'flex-hose') { p.info = { number: p.part, desc: 'Hose Flexible', kind: 'flex-hose' }; continue; }
    const i = info(p.ref);
    p.info = i;
    p.part = i.number;
    if (p.kind !== 'flex-segment') p.kind = i.kind;
  }
  const placements = allPlacements.filter((p) => p.kind === 'part' || p.kind === 'flex-hose');
  const n = placements.length;
  const pieceKindCounts = Object.fromEntries([...countBy(allPlacements.map((p) => p.kind)).entries()]
    .sort((a, b) => b[1] - a[1]));
  const rootIsPartFile = !(blocks.get(normKey(rootName)) || {}).isModel;

  // ---- part description lookup (from the inlined .dat blocks)
  const descOf = (ref) => {
    const b = blocks.get(normKey(ref)) || blocks.get(baseName(ref));
    return b ? b.desc : '';
  };

  // ---- repetition
  const partCounts = countBy(placements.map((p) => p.part));
  const distinct = partCounts.size;
  const descByPart = new Map(placements.map((p) => [p.part, p.info.desc]));
  const top12 = topN(partCounts, 12).map(([part, count]) => ({
    part, count, share: r6(count / (n || 1)), desc: descByPart.get(part) || '',
  }));

  // ---- families
  const famCounts = new Map(FAMILIES.map((f) => [f, 0]));
  const famDetail = new Map();
  const affCounts = new Map();
  const unclassified = new Map();
  for (const p of placements) {
    const d = p.info.desc;
    const f = familyOf(d);
    famCounts.set(f, (famCounts.get(f) || 0) + 1);
    if (f === 'other') unclassified.set(p.part + ' | ' + d, (unclassified.get(p.part + ' | ' + d) || 0) + 1);
    const fd = familyDetail(d);
    famDetail.set(fd, (famDetail.get(fd) || 0) + 1);
    for (const tg of affordanceTags(d)) affCounts.set(tg, (affCounts.get(tg) || 0) + 1);
  }
  const familyShare = {};
  for (const f of FAMILIES) familyShare[f] = r6((famCounts.get(f) || 0) / (n || 1));
  const familyCount = {};
  for (const f of FAMILIES) familyCount[f] = famCounts.get(f) || 0;

  // ---- colour
  const colourCounts = countBy(placements.map((p) => p.colour));
  const colours = colourCounts.size;
  const top5ColourShare = r6(shareOfTop(colourCounts, 5, n));
  const colourTable = [...colourCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([code, count]) => ({ code, count, share: r6(count / (n || 1)) }));

  // ---- geometry bbox (true, from inlined part geometry)
  const vertsOf = makeVertResolver(blocks);
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  let oLo = [Infinity, Infinity, Infinity], oHi = [-Infinity, -Infinity, -Infinity];
  let geomParts = 0;
  for (const p of allPlacements) {
    if (p.synthetic) continue;
    for (let a = 0; a < 3; a++) { oLo[a] = Math.min(oLo[a], p.t[a]); oHi[a] = Math.max(oHi[a], p.t[a]); }
    const v = vertsOf(p.ref);
    if (!v.length) continue;
    geomParts++;
    const m = p.m, t = p.t;
    for (let i = 0; i < v.length; i += 3) {
      const x = v[i], y = v[i + 1], z = v[i + 2];
      const wx = m[0]*x + m[1]*y + m[2]*z + t[0];
      const wy = m[3]*x + m[4]*y + m[5]*z + t[1];
      const wz = m[6]*x + m[7]*y + m[8]*z + t[2];
      if (wx < lo[0]) lo[0] = wx; if (wx > hi[0]) hi[0] = wx;
      if (wy < lo[1]) lo[1] = wy; if (wy > hi[1]) hi[1] = wy;
      if (wz < lo[2]) lo[2] = wz; if (wz > hi[2]) hi[2] = wz;
    }
  }
  const fin = lo.every(Number.isFinite);
  const bbox = fin ? [r4(hi[0]-lo[0]), r4(hi[1]-lo[1]), r4(hi[2]-lo[2])] : [0,0,0];
  const bboxMin = fin ? lo.map(r4) : [0,0,0];
  const bboxMax = fin ? hi.map(r4) : [0,0,0];
  const dims = bbox.slice().sort((a, b) => b - a);
  const aspectRatio = dims[2] > 0 ? r4(dims[0] / dims[2]) : 0;
  const volume = r4(bbox[0] * bbox[1] * bbox[2]);
  const density = volume > 0 ? r6(n / (volume / 1e6)) : 0;
  const bboxStuds = [r4(bbox[0] / 20), r4(bbox[1] / 8), r4(bbox[2] / 20)];  // x/z in studs, y in plates
  const originBbox = oLo.every(Number.isFinite)
    ? [r4(oHi[0]-oLo[0]), r4(oHi[1]-oLo[1]), r4(oHi[2]-oLo[2])] : [0,0,0];

  // ---- rotation vocabulary
  let ident = 0, axis90 = 0, mirrored = 0, snot = 0;
  const rotKeys = new Map();
  for (const p of placements) {
    const id = isIdentity(p.m), a90 = isAxis90(p.m);
    if (id) ident++;
    if (a90) { axis90++; if (det3(p.m) < 0) mirrored++; }
    if (!studsVertical(p.m)) snot++;
    const key = p.m.map((v) => (Math.abs(v) < EPS ? 0 : r4(v))).join(',');
    rotKeys.set(key, (rotKeys.get(key) || 0) + 1);
  }
  const rotation = {
    identityShare: r6(ident / (n || 1)),
    axis90Share: r6(axis90 / (n || 1)),          // includes identity
    axis90NonIdentityShare: r6((axis90 - ident) / (n || 1)),
    otherShare: r6((n - axis90) / (n || 1)),
    mirroredShare: r6(mirrored / (n || 1)),
    distinctMatrices: rotKeys.size,
    topMatrices: topN(rotKeys, 6).map(([m, count]) => ({ m, count, share: r6(count / (n || 1)) })),
  };
  const snotRate = r6(snot / (n || 1));

  // ---- the SAME vocabulary measured in the AUTHORED frame (matrix as written inside its
  // parent block). World-frame numbers inherit every posing rotation above the part; local-frame
  // numbers are the author's actual placement vocabulary. Both matter; they are not the same.
  let lIdent = 0, lAxis90 = 0, lSnot = 0, lMirror = 0;
  const lRotKeys = new Map();
  for (const p of placements) {
    if (isIdentity(p.lm)) lIdent++;
    if (isAxis90(p.lm)) { lAxis90++; if (det3(p.lm) < 0) lMirror++; }
    if (!studsVertical(p.lm)) lSnot++;
    const key = p.lm.map((v) => (Math.abs(v) < EPS ? 0 : r4(v))).join(',');
    lRotKeys.set(key, (lRotKeys.get(key) || 0) + 1);
  }
  const rotationLocal = {
    identityShare: r6(lIdent / (n || 1)),
    axis90Share: r6(lAxis90 / (n || 1)),
    axis90NonIdentityShare: r6((lAxis90 - lIdent) / (n || 1)),
    otherShare: r6((n - lAxis90) / (n || 1)),
    mirroredShare: r6(lMirror / (n || 1)),
    distinctMatrices: lRotKeys.size,
    topMatrices: topN(lRotKeys, 6).map(([m, count]) => ({ m, count, share: r6(count / (n || 1)) })),
  };
  const snotRateLocal = r6(lSnot / (n || 1));

  let lgxz = 0, lgy8 = 0, lgxz10 = 0, lgy4 = 0;
  for (const p of placements) {
    if (onLattice(p.lt[0], 20) && onLattice(p.lt[2], 20)) lgxz++;
    if (onLattice(p.lt[0], 10) && onLattice(p.lt[2], 10)) lgxz10++;
    if (onLattice(p.lt[1], 8)) lgy8++;
    if (onLattice(p.lt[1], 4)) lgy4++;
  }
  const gridLocal = {
    xzOn20Share: r6(lgxz / (n || 1)),
    xzOn10Share: r6(lgxz10 / (n || 1)),
    yOn8Share: r6(lgy8 / (n || 1)),
    yOn4Share: r6(lgy4 / (n || 1)),
  };
  const gridAlignLocal = r6(((lgxz / (n || 1)) + (lgy8 / (n || 1))) / 2);

  // ---- joints: a submodel reference whose authored matrix is NOT a signed permutation is a POSE
  const jointsPosed = joints.filter((jt) => !isAxis90(jt.m));
  const jointsOffLattice = joints.filter((jt) => !(onLattice(jt.t[0], 20) && onLattice(jt.t[2], 20) && onLattice(jt.t[1], 8)));
  const jointStats = {
    submodelInstantiations: joints.length,
    posedJoints: jointsPosed.length,
    posedJointShare: joints.length ? r6(jointsPosed.length / joints.length) : 0,
    offLatticeJoints: jointsOffLattice.length,
    offLatticeJointShare: joints.length ? r6(jointsOffLattice.length / joints.length) : 0,
    posedAngles: [...new Set(jointsPosed.map((jt) => {
      const c = Math.max(-1, Math.min(1, (jt.m[0] + jt.m[4] + jt.m[8] - 1) / 2));
      return r4(Math.acos(c) * 180 / Math.PI);
    }))].sort((a, b) => a - b),
  };

  // ---- grid discipline
  let gx = 0, gz = 0, gxz = 0, gy8 = 0, gxzHalf = 0, gy4 = 0, gy24 = 0;
  for (const p of placements) {
    const x = onLattice(p.t[0], 20), z = onLattice(p.t[2], 20);
    if (x) gx++; if (z) gz++; if (x && z) gxz++;
    if (onLattice(p.t[0], 10) && onLattice(p.t[2], 10)) gxzHalf++;
    if (onLattice(p.t[1], 8)) gy8++;
    if (onLattice(p.t[1], 4)) gy4++;
    if (onLattice(p.t[1], 24)) gy24++;
  }
  const grid = {
    xzOn20Share: r6(gxz / (n || 1)),
    xOn20Share: r6(gx / (n || 1)),
    zOn20Share: r6(gz / (n || 1)),
    xzOn10Share: r6(gxzHalf / (n || 1)),
    yOn8Share: r6(gy8 / (n || 1)),
    yOn4Share: r6(gy4 / (n || 1)),
    yOn24Share: r6(gy24 / (n || 1)),
  };
  const gridAlign = r6(((gxz / (n || 1)) + (gy8 / (n || 1))) / 2);   // one scalar for the headline

  // ---- submodel structure
  const modelKeys = new Set(modelBlocks.map((b) => normKey(b.name)));
  const staticRefCount = new Map();
  let stepsMain = 0, stepsAll = 0, rotstepsAll = 0;
  const directPartsPer = [], directRefsPer = [];
  for (const b of modelBlocks) {
    let dp = 0;
    for (const r of b.refs) {
      const child = blocks.get(normKey(r.name)) || blocks.get(baseName(r.name));
      const childIsModel = child ? child.isModel : isModelName(r.name);
      if (childIsModel) {
        const ck = normKey(child ? child.name : r.name);
        staticRefCount.set(ck, (staticRefCount.get(ck) || 0) + 1);
        if (child && child.isFlexGroup) dp++;   // the hose itself is one piece
      } else if (info(r.name).kind === 'part' && !b.isFlexGroup) dp++;
    }
    directPartsPer.push(dp);
    directRefsPer.push(b.refs.length);
    stepsAll += b.steps; rotstepsAll += b.rotsteps;
  }
  const rootBlock = blocks.get(normKey(rootName));
  stepsMain = rootBlock ? rootBlock.steps : 0;

  // flattened parts per submodel (each submodel expanded once, in isolation)
  const flatPerSub = {};
  for (const b of modelBlocks) {
    const sub = flattenKit({ blocks, order, rootName: b.name });
    flatPerSub[b.name] = sub.placements.filter((q) => {
      if (q.kind === 'flex-hose') return true;
      if (q.kind === 'flex-segment') return false;
      return info(q.ref).kind === 'part';
    }).length;
  }
  const subOnly = modelBlocks.filter((b) => normKey(b.name) !== normKey(rootName));
  const staticPartRefs = directPartsPer.reduce((a, b) => a + b, 0);
  const unreachable = modelBlocks.filter((b) => !visited.has(normKey(b.name))).map((b) => b.name);
  const reusedSubmodels = [...staticRefCount.entries()].filter(([, c]) => c > 1);

  const submodel = {
    modelBlocks: modelBlocks.length,
    submodelsExcludingRoot: subOnly.length,
    unreachableModelBlocks: unreachable.length,
    unreachableNames: unreachable,
    staticPartRefs,
    reuseInflation: staticPartRefs ? r6(n / staticPartRefs) : 0,
    inlinedPartDefs: partDefs.length,
    maxDepth,                                   // root = 1
    meanDirectPartsPerModelBlock: r4(mean(directPartsPer)),
    medianDirectPartsPerModelBlock: r4(median(directPartsPer)),
    minDirectPartsPerModelBlock: directPartsPer.length ? Math.min(...directPartsPer) : 0,
    maxDirectPartsPerModelBlock: directPartsPer.length ? Math.max(...directPartsPer) : 0,
    // null (not 0) when the kit has no submodels at all — 0 would poison the corpus norm
    meanFlatPartsPerSubmodel: subOnly.length ? r4(mean(subOnly.map((b) => flatPerSub[b.name]))) : null,
    medianFlatPartsPerSubmodel: subOnly.length ? r4(median(subOnly.map((b) => flatPerSub[b.name]))) : null,
    reusedSubmodelCount: reusedSubmodels.length,
    reusedSubmodelShare: subOnly.length ? r6(reusedSubmodels.length / subOnly.length) : 0,
    reusedSubmodels: reusedSubmodels.sort((a, b) => b[1] - a[1]).map(([name, refs]) => ({
      name, staticRefs: refs, instances: submodelInstances.get(name) || 0, flatParts: flatPerSub[
        (modelBlocks.find((b) => normKey(b.name) === name) || {}).name] || 0,
    })),
    partsInRootDirect: rootBlock ? rootBlock.refs.filter((r) => {
      const c = blocks.get(normKey(r.name)) || blocks.get(baseName(r.name));
      return !(c ? c.isModel : isModelName(r.name));
    }).length : 0,
    depthHistogram: (() => {
      const h = countBy(placements.map((p) => p.depth));
      const o = {};
      for (const [d, c] of [...h.entries()].sort((a, b) => a[0] - b[0])) o[d] = c;
      return o;
    })(),
  };

  const steps = {
    stepsInMainModel: stepsMain,
    stepsAllModelBlocks: stepsAll,
    rotstepsAllModelBlocks: rotstepsAll,
    piecesPerStepMain: stepsMain ? r4(n / stepsMain) : 0,
    piecesPerStepAll: stepsAll ? r4(n / stepsAll) : 0,
  };

  const kit = path.basename(file, '.mpd');
  // 6156 is a single LDraw PART file (its root block is 6156.dat), not a set.
  const degenerate = rootIsPartFile || n < 5;

  return {
    kit,
    file: 'kits/' + path.basename(file),
    rootModel: rootName,
    rootDescription: rootBlock ? rootBlock.desc : '',
    rootIsPartFile,
    degenerate,
    kind: degenerate ? 'single-part-file' : 'model',
    pieces: n,
    piecesRaw: allPlacements.filter((p) => !p.synthetic).length,
    pieceKindCounts,
    flexGroups: flexGroups.length,
    flexSegments: allPlacements.filter((p) => p.kind === 'flex-segment').length,
    distinct,
    distinctRatio: r6(distinct / (n || 1)),
    top1Share: r6(shareOfTop(partCounts, 1, n)),
    top5Share: r6(shareOfTop(partCounts, 5, n)),
    top10Share: r6(shareOfTop(partCounts, 10, n)),
    top12Parts: top12,
    familyShare,
    familyCount,
    shearingLayerShare: (() => {
      const o = {};
      for (const [layer, fams] of Object.entries(SHEARING_MAP)) {
        o[layer] = r6(fams.reduce((s2, f) => s2 + (famCounts.get(f) || 0), 0) / (n || 1));
      }
      return o;
    })(),
    familyDetailTop: topN(famDetail, 14).map(([k, c]) => ({ noun: k, count: c, share: r6(c / (n || 1)) })),
    affordanceCounts: Object.fromEntries([...affCounts.entries()].sort((a, b) => b[1] - a[1])),
    unclassifiedTop: topN(unclassified, 8).map(([k, c]) => ({ part: k, count: c })),
    colours,
    top5ColourShare,
    inheritColourCount: colourCounts.get(16) || 0,
    colourTable,
    bbox, bboxMin, bboxMax, bboxStuds, aspectRatio, volume, density,
    originBbox,
    partsWithGeometry: geomParts,
    rotation,
    snotRate,
    rotationLocal,
    snotRateLocal,
    grid,
    gridAlign,
    gridLocal,
    gridAlignLocal,
    joints: jointStats,
    submodel,
    steps,
    missingRefs: Object.fromEntries(missing),
  };
}

// ------------------------------------------------------------------ kit norm
const NORM_METRICS = [
  'pieces', 'distinct', 'distinctRatio', 'top1Share', 'top5Share', 'top10Share',
  'colours', 'top5ColourShare', 'aspectRatio', 'volume', 'density', 'snotRate', 'gridAlign',
  'rotation.identityShare', 'rotation.axis90Share', 'rotation.otherShare',
  'rotation.mirroredShare', 'rotation.distinctMatrices',
  'grid.xzOn20Share', 'grid.xzOn10Share', 'grid.yOn8Share', 'grid.yOn4Share',
  'snotRateLocal', 'gridAlignLocal',
  'rotationLocal.identityShare', 'rotationLocal.axis90Share', 'rotationLocal.otherShare',
  'rotationLocal.mirroredShare', 'rotationLocal.distinctMatrices',
  'gridLocal.xzOn20Share', 'gridLocal.xzOn10Share', 'gridLocal.yOn8Share', 'gridLocal.yOn4Share',
  'joints.submodelInstantiations', 'joints.posedJoints', 'joints.posedJointShare',
  'joints.offLatticeJointShare',
  'submodel.modelBlocks', 'submodel.submodelsExcludingRoot', 'submodel.maxDepth',
  'submodel.meanDirectPartsPerModelBlock', 'submodel.medianDirectPartsPerModelBlock',
  'submodel.meanFlatPartsPerSubmodel', 'submodel.medianFlatPartsPerSubmodel',
  'submodel.reusedSubmodelCount', 'submodel.reusedSubmodelShare',
  'steps.stepsInMainModel', 'steps.stepsAllModelBlocks', 'steps.piecesPerStepAll',
  'bbox.0', 'bbox.1', 'bbox.2',
  'submodel.staticPartRefs', 'submodel.reuseInflation', 'submodel.unreachableModelBlocks',
  'piecesRaw', 'flexGroups', 'flexSegments',
  'inheritColourCount',
].concat(FAMILIES.map((f) => 'familyShare.' + f))
 .concat(Object.keys(SHEARING_MAP).map((l) => 'shearingLayerShare.' + l));

function dig(o, p) {
  return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
}
function buildNorm(records, label) {
  const norm = { label, kits: records.length, kitNames: records.map((r) => r.kit), metrics: {} };
  for (const m of NORM_METRICS) {
    const vals = records.map((r) => dig(r, m)).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) continue;
    const s = vals.slice().sort((a, b) => a - b);
    const q = (p) => { const i = (s.length - 1) * p; const l = Math.floor(i), h = Math.ceil(i);
      return l === h ? s[l] : s[l] + (s[h] - s[l]) * (i - l); };
    norm.metrics[m] = {
      min: r6(s[0]), p25: r6(q(0.25)), median: r6(median(s)), p75: r6(q(0.75)), max: r6(s[s.length - 1]),
      mean: r6(mean(s)),
      argmin: (records[records.findIndex((r) => dig(r, m) === s[0])] || {}).kit || null,
      argmax: (records[records.findIndex((r) => dig(r, m) === s[s.length - 1])] || {}).kit || null,
    };
  }
  return norm;
}

// ---------------------------------------------------------------------- main
function main() {
  const files = fs.readdirSync(KITS_DIR).filter((f) => /\.mpd$/i.test(f)).sort()
    .map((f) => path.join(KITS_DIR, f));
  const t0 = Date.now();
  const records = files.map((f) => {
    const t = Date.now();
    const r = measureKit(f);
    r.parseMs = Date.now() - t;
    process.stderr.write(`  ${r.kit}: ${r.pieces} pieces, ${r.distinct} distinct, ${r.submodel.modelBlocks} model blocks (${r.parseMs}ms)\n`);
    return r;
  });

  const real = records.filter((r) => !r.degenerate);
  const out = {
    generatedBy: 'build-kit-index.js',
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'LDraw Official Model Repository via three.js (CC BY 2.0), packed MPD',
    units: 'LDU. Y is DOWN. stud pitch 20, plate 8, brick 24, stud protrusion 4.',
    kitCount: records.length,
    kits: records,
    kitNorm: buildNorm(real, 'kit norm over the ' + real.length + ' real model kits (6156 excluded: single part file)'),
    kitNormAll: buildNorm(records, 'kit norm over all ' + records.length + ' files'),
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB) in ${Date.now() - t0}ms\n`);
}
main();

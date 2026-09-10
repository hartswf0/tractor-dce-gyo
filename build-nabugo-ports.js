#!/usr/bin/env node
/**
 * NABUGO PORT REGISTRY
 *
 * "The LLM chooses relationships. The compiler chooses legal coordinates."
 *
 * A compiler cannot choose legal coordinates from a bounding box alone — it has
 * to know where a part can actually be joined. This extracts that from the
 * vendored library rather than guessing it from stud pitch, which is wrong the
 * moment a slope, a curve or a Technic beam is involved.
 *
 * Every LDraw stud primitive occupies y in [-4, 0] and protrudes along local
 * -Y (up, in LDraw's Y-down world). The variants differ by radius and name:
 *
 *   stud, stud2, stud6, stud15 …   r=6   male stud
 *   stud3  "Stud Tube Solid"       r=4   female, the underside tube
 *   stud4  "Stud Tube Open"        r=8   female
 *
 * Walking a part with the same recursive matrix pass used for its AABB, every
 * stud reference yields a transformed origin and a transformed up-axis. That
 * pair is a port.
 *
 * Outputs: nabugo-ports.json
 */

const fs = require('fs');
const path = require('path');

const ROOT  = __dirname;
const LDRAW = path.join(ROOT, 'ldraw');
const PARTS = path.join(ROOT, 'nabugo-parts.json');
const OUT   = path.join(ROOT, 'nabugo-ports.json');

// A part with a thousand studs is a baseplate; its ports are a regular lattice
// the compiler can synthesise from the footprint, and storing them all would
// dwarf the rest of the registry.
const MAX_PORTS = 48;

const SEARCH = ['p', 'p/48', 'p/8', 'parts', 'parts/s'];
const resolveCache = new Map();
function resolveRef(ref) {
  const key = ref.replace(/\\/g, '/').toLowerCase();
  if (resolveCache.has(key)) return resolveCache.get(key);
  let found = null;
  for (const d of SEARCH) {
    const c = path.join(LDRAW, d, key);
    if (fs.existsSync(c)) { found = c; break; }
  }
  resolveCache.set(key, found);
  return found;
}

const IDENTITY = [1,0,0, 0,1,0, 0,0,1, 0,0,0];
function mulMatrix(a, b) {
  const r = new Array(12);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++)
      r[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j];
    r[9+i] = a[i*3]*b[9] + a[i*3+1]*b[10] + a[i*3+2]*b[11] + a[9+i];
  }
  return r;
}
const applyPoint = (m, x, y, z) => [
  m[0]*x + m[1]*y + m[2]*z + m[9],
  m[3]*x + m[4]*y + m[5]*z + m[10],
  m[6]*x + m[7]*y + m[8]*z + m[11]
];
// Direction ignores translation.
const applyDir = (m, x, y, z) => [
  m[0]*x + m[1]*y + m[2]*z,
  m[3]*x + m[4]*y + m[5]*z,
  m[6]*x + m[7]*y + m[8]*z
];

const STUD_RE = /^stud[0-9a-z-]*\.dat$/i;
/** Tube variants are the female side; everything else with a stud name is male. */
function studKind(name) {
  const n = name.toLowerCase();
  if (!STUD_RE.test(n)) return null;
  if (/^stud(3|4|4a|4h|4o|4s|10|15|16|17|18|21|22)\b/.test(n.replace('.dat',''))) {
    // Names alone are unreliable across the set; the description is the
    // authority and is checked by the caller. This is only a fast pre-filter.
  }
  return 'stud';
}

const tubeCache = new Map();
function isTube(file) {
  if (tubeCache.has(file)) return tubeCache.get(file);
  let tube = false;
  try {
    const first = fs.readFileSync(file, 'latin1').split(/\r?\n/, 1)[0] || '';
    tube = /tube/i.test(first);          // "Stud Tube Solid" / "Stud Tube Open"
  } catch { /* leave false */ }
  tubeCache.set(file, tube);
  return tube;
}

/** Recursive walk collecting every stud reference, transformed into part space. */
function collect(file, matrix, ports, depth, seen) {
  if (depth > 8 || ports.length > MAX_PORTS * 4) return;
  let text;
  try { text = fs.readFileSync(file, 'latin1'); } catch { return; }

  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t.charCodeAt(0) !== 49 /* '1' */ || t[1] !== ' ') continue;
    const k = t.split(/\s+/);
    if (k.length < 15) continue;
    const n = k.slice(2, 14).map(Number);
    if (n.some(v => !Number.isFinite(v))) continue;
    const child = [n[3],n[4],n[5], n[6],n[7],n[8], n[9],n[10],n[11], n[0],n[1],n[2]];
    const world = mulMatrix(matrix, child);
    const ref = k.slice(14).join(' ');
    const base = ref.replace(/\\/g, '/').split('/').pop().toLowerCase();

    if (studKind(base)) {
      const sub = resolveRef(ref);
      if (sub) {
        // Origin of the primitive is the port's seat; local -Y is where it
        // points. A stud seated on a part's top face points up (-Y); the same
        // primitive under a flipped matrix is an underside tube pointing down.
        const p = applyPoint(world, 0, 0, 0);
        const d = applyDir(world, 0, -1, 0);
        ports.push({ t: isTube(sub) ? 1 : 0, p, d });
      }
      continue;                                  // studs have no useful interior
    }

    const sub = resolveRef(ref);
    if (!sub) continue;
    const guard = sub + '@' + depth;
    if (seen.has(guard)) continue;
    seen.add(guard);
    collect(sub, world, ports, depth + 1, seen);
    seen.delete(guard);
  }
}

/** Snap a direction to a cardinal axis index, or -1 when it is oblique. */
const AXES = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
function axisIndex(d) {
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const u = [d[0]/len, d[1]/len, d[2]/len];
  for (let i = 0; i < 6; i++) {
    const a = AXES[i];
    if (u[0]*a[0] + u[1]*a[1] + u[2]*a[2] > 0.985) return i;
  }
  return -1;
}

function main() {
  const cat = JSON.parse(fs.readFileSync(PARTS, 'utf8'));
  console.log('parts in catalogue:', cat.parts.length);

  const out = {};
  let done = 0, withPorts = 0, capped = 0, oblique = 0, total = 0;

  for (const part of cat.parts) {
    done++;
    if (done % 2000 === 0) console.log('  …', done, '/', cat.parts.length, '· with ports', withPorts);

    const file = path.join(LDRAW, 'parts', part.id + '.dat');
    if (!fs.existsSync(file)) continue;

    const raw = [];
    collect(file, IDENTITY, raw, 0, new Set());
    if (!raw.length) continue;

    if (raw.length > MAX_PORTS) { capped++; continue; }

    // [type, x, y, z, axis] — integers, rounded to the nearest LDU.
    const ports = [];
    const seen = new Set();
    for (const r of raw) {
      const a = axisIndex(r.d);
      if (a < 0) { oblique++; continue; }
      const rec = [r.t, Math.round(r.p[0]), Math.round(r.p[1]), Math.round(r.p[2]), a];
      // A tube primitive begins inside the underside cavity (normally y=4).
      // Its clutch plane is the part's underside face (normally y=8 for a
      // plate or y=24 for a brick). Store the semantic receiver plane rather
      // than the primitive's internal origin. Lateral sockets require a
      // separate cavity-depth pass and remain at their primitive origins.
      if (r.t === 1 && a === 2) rec[2] = Math.round(part.b[4]);
      const key = rec.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      ports.push(rec);
    }
    if (!ports.length) continue;
    out[part.id] = ports;
    withPorts++; total += ports.length;
  }

  fs.writeFileSync(OUT, JSON.stringify({
    generated: new Date().toISOString(),
    note: 'ports: [type, x, y, z, axis]. type 0 = stud (male), 1 = tube (female). ' +
          'axis indexes [+X,-X,+Y,-Y,+Z,-Z]; LDraw Y is down so -Y (index 3) points up. ' +
          'Coordinates are LDU in part space. Parts with more than ' + MAX_PORTS +
          ' ports are omitted: their lattice is synthesisable from the footprint.',
    axes: AXES,
    parts: withPorts,
    ports: total,
    map: out
  }), 'utf8');

  console.log('---');
  console.log('parts with ports :', withPorts);
  console.log('total ports      :', total);
  console.log('capped (lattice) :', capped);
  console.log('oblique dropped  :', oblique);
  console.log('written          :', path.relative(process.cwd(), OUT),
              '(' + (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB)');
}

main();

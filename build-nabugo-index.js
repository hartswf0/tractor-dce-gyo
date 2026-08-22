#!/usr/bin/env node
/**
 * NABUGO PART INDEX BUILDER
 *
 * The dueling builders need to reason about parts they have never seen, so the
 * engine needs more than a description string. This resolves each candidate
 * part's real geometry out of the vendored library and records:
 *
 *   - axis-aligned bounding box in LDU (recursively resolved, matrices applied)
 *   - stud footprint and height in brick units
 *   - connectivity signature (from ldraw-connectivity-lookup.json when present)
 *   - category / keywords / description from the .dat header
 *
 * The AABB is the important one: it is what lets the feedback engine decide
 * locally whether a build collides, floats, or actually encloses anything —
 * no API call involved.
 *
 * Outputs: nabugo-parts.json
 */

const fs = require('fs');
const path = require('path');

const ROOT      = __dirname;
const LDRAW     = path.join(ROOT, 'ldraw');
const OUT       = path.join(ROOT, 'nabugo-parts.json');
const CONN_PATH = path.join(ROOT, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-connectivity-lookup.json');

const LDU_STUD  = 20;   // horizontal stud pitch
const LDU_PLATE = 8;    // plate height
const LDU_BRICK = 24;   // brick height

// ---------------------------------------------------------------- resolution
const SEARCH = ['parts', 'p', 'parts/s', 'p/48', 'p/8', 'models'];
const resolveCache = new Map();

function resolveRef(ref) {
  const key = ref.replace(/\\/g, '/').toLowerCase();
  if (resolveCache.has(key)) return resolveCache.get(key);
  let found = null;
  for (const dir of SEARCH) {
    const cand = path.join(LDRAW, dir, key);
    if (fs.existsSync(cand)) { found = cand; break; }
  }
  resolveCache.set(key, found);
  return found;
}

// ------------------------------------------------------------------ geometry
// Walk a .dat, applying each type-1 matrix down the tree, and grow an AABB
// from every type-2..5 vertex encountered.
const boxCache = new Map();

function mulPoint(m, x, y, z) {
  return [
    m[0]*x + m[1]*y + m[2]*z  + m[9],
    m[3]*x + m[4]*y + m[5]*z  + m[10],
    m[6]*x + m[7]*y + m[8]*z  + m[11]
  ];
}
function mulMatrix(a, b) {
  // a then b applied outward: returns a ∘ b (b is the child transform)
  const r = new Array(12);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j];
    }
    r[9+i] = a[i*3]*b[9] + a[i*3+1]*b[10] + a[i*3+2]*b[11] + a[9+i];
  }
  return r;
}
const IDENTITY = [1,0,0, 0,1,0, 0,0,1, 0,0,0];

function accumulate(file, matrix, box, depth, seen, colours) {
  if (depth > 10) return;
  let text;
  try { text = fs.readFileSync(file, 'latin1'); } catch { return; }

  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const code = t[0];

    if (code === '1') {
      const k = t.split(/\s+/);
      if (k.length < 15) continue;
      const n = k.slice(2, 14).map(Number);
      if (n.some(v => !Number.isFinite(v))) continue;
      // LDraw order: x y z a b c d e f g h i  ->  [a b c d e f g h i | x y z]
      const child = [n[3],n[4],n[5], n[6],n[7],n[8], n[9],n[10],n[11], n[0],n[1],n[2]];
      const ref = k.slice(14).join(' ');
      const sub = resolveRef(ref);
      if (!sub) continue;
      const guard = sub + '@' + depth;
      if (seen.has(guard)) continue;
      seen.add(guard);
      if (colours) colours.add(k[1]);
      accumulate(sub, mulMatrix(matrix, child), box, depth + 1, seen, colours);
      seen.delete(guard);

    } else if (code >= '2' && code <= '5') {
      const k = t.split(/\s+/);
      if (colours) colours.add(k[1]);
      const nv = code === '2' ? 2 : code === '3' ? 3 : 4;
      if (k.length < 2 + nv*3) continue;
      for (let v = 0; v < nv; v++) {
        const x = +k[2 + v*3], y = +k[3 + v*3], z = +k[4 + v*3];
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
        const p = mulPoint(matrix, x, y, z);
        for (let a = 0; a < 3; a++) {
          if (p[a] < box.min[a]) box.min[a] = p[a];
          if (p[a] > box.max[a]) box.max[a] = p[a];
        }
        box.n++;
      }
    }
  }
}

function boundingBox(file, colours) {
  const box = { min:[Infinity,Infinity,Infinity], max:[-Infinity,-Infinity,-Infinity], n:0 };
  accumulate(file, IDENTITY, box, 0, new Set(), colours);
  const ok = box.n > 0 && box.min.every(Number.isFinite) && box.max.every(Number.isFinite);
  return ok ? box : null;
}

/**
 * Colours a part reaches are recorded but no longer screened. An earlier pass
 * excluded anything touching a METAL colour, on the theory that those broke the
 * renderer; the real fault was LDrawLoader resolving edge colour 24 to a
 * dangling code, which nabugo-ui repairs on the loader itself. Screening here
 * cost 2,553 perfectly buildable parts for nothing, so the catalogue keeps them
 * and the colour set is emitted for anything downstream that wants it.
 */

// -------------------------------------------------------------------- header
function header(file) {
  let text;
  try { text = fs.readFileSync(file, 'latin1').slice(0, 4096); } catch { return null; }
  const lines = text.split(/\r?\n/);
  const desc = (lines[0] || '').replace(/^0\s*/, '').trim();
  let cat = '', kw = '';
  for (const l of lines.slice(0, 40)) {
    const mc = l.match(/^0\s+!CATEGORY\s+(.+)$/i); if (mc) cat = mc[1].trim();
    const mk = l.match(/^0\s+!KEYWORDS\s+(.+)$/i); if (mk) kw += (kw ? ', ' : '') + mk[1].trim();
  }
  if (!cat) cat = desc.replace(/^~/, '').split(/\s+/)[0] || '';
  return { desc, cat, kw };
}

// ------------------------------------------------------------------ build set
// Sticker/pattern/obsolete variants explode the catalogue without adding
// construction options, so the index keeps buildable geometry only.
const SKIP_DESC = /^(~|_)|sticker|obsolete|moved to|\(needs work\)|~moved/i;

function isCandidate(name, h) {
  if (!h || !h.desc) return false;
  if (SKIP_DESC.test(h.desc)) return false;
  if (/^u9\d/i.test(name)) return false;          // internal sub-assemblies
  return true;
}

// ---------------------------------------------------------------------- main
function main() {
  let conn = {};
  try { conn = JSON.parse(fs.readFileSync(CONN_PATH, 'utf8')); }
  catch { console.warn('! connectivity lookup unavailable; sig fields will be empty'); }

  const dir = path.join(LDRAW, 'parts');
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.dat'));
  console.log('candidates on disk:', files.length);

  const out = [];
  let done = 0, skipped = 0, nobox = 0;

  for (const f of files) {
    done++;
    if (done % 2000 === 0) console.log('  …', done, '/', files.length, '· kept', out.length);

    const full = path.join(dir, f);
    const h = header(full);
    const id = f.replace(/\.dat$/i, '');
    if (!isCandidate(id, h)) { skipped++; continue; }

    const colours = new Set();
    const box = boundingBox(full, colours);
    if (!box) { nobox++; continue; }


    const w = box.max[0] - box.min[0];
    const ht = box.max[1] - box.min[1];
    const d = box.max[2] - box.min[2];

    const c = conn[f] || conn[f.toLowerCase()] || null;

    out.push({
      id,
      d: h.desc,
      c: h.cat,
      k: h.kw || undefined,
      // AABB in LDU, rounded to 0.1 — enough for collision, a third the bytes
      b: [box.min, box.max].flat().map(v => Math.round(v * 10) / 10),
      // footprint in studs and height in plates, the units a builder thinks in
      s: [Math.max(1, Math.round(w / LDU_STUD)), Math.max(1, Math.round(d / LDU_STUD))],
      h: Math.round(ht / LDU_PLATE * 10) / 10,
      sig: c ? c.sig : undefined,
      ct: c ? c.types : undefined,
      col: colours.size <= 6 ? [...colours] : undefined
    });
  }

  const payload = {
    generated: new Date().toISOString(),
    ldu: { stud: LDU_STUD, plate: LDU_PLATE, brick: LDU_BRICK },
    note: 'AABBs are recursively resolved from the vendored ldraw/ tree, in LDU, Y-down.',
    count: out.length,
    parts: out
  };
  fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');

  console.log('---');
  console.log('kept      :', out.length);
  console.log('skipped   :', skipped, '(sticker / obsolete / sub-assembly)');
  console.log('no geometry:', nobox);
  console.log('written   :', path.relative(process.cwd(), OUT),
              '(' + (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB)');
}

main();

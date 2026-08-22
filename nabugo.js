/**
 * NABUGO ENGINE
 * =============
 * A shared build engine for dueling LDraw doctrines.
 *
 * Ball-jar's idea was right and its mechanism was a kludge: two iframes shouting
 * `mpd_content` at each other over a BroadcastChannel, with no shared notion of
 * what a scene *is*. Nabugo keeps the idea — two builders, one arena, one bus —
 * and throws away the iframes. Both doctrines run in one page against one
 * catalogue, one geometry kernel, and one scoring function, so a duel compares
 * two builds rather than two documents.
 *
 * The engine is deterministic and offline. Every judgement it makes — collides,
 * floats, fragments, compiles, resembles — is computed from real part geometry
 * resolved out of the vendored ldraw/ tree. An LLM can be attached as a lens
 * (see NabugoLens) but is never required, and nothing here calls out to one.
 *
 * Coordinates are LDraw: LDU, Y-DOWN. Up is negative Y. Ground is y = 0.
 *
 *   NabugoCatalog     15k parts with AABBs, footprints, connectivity sigs
 *   NabugoGeom        world-space AABB, collision, grounding, connectivity
 *   NabugoScene       placements -> MPD text, and back
 *   NabugoAudit       the feedback engine: the deterministic critic
 *   NabugoStrategy    BRICKWORK / READYMADE / KITBASH part retrieval
 *   NabugoVignette    cluster geometry generators
 *   NabugoBrief       LEGOS narrative graph + 9x9 zone topology
 *   NabugoDoctrine    an autonomous builder; OPERATOR and CORRESPONDENCE
 *   NabugoBus         wag-frank wiring, done once, for everyone
 */
(function (global) {
'use strict';

// ═══════════════════════════════════════════════════════════════════ constants
const LDU   = { STUD: 20, PLATE: 8, BRICK: 24 };
const CELL  = 80;            // LDU per semantic-tray cell
const GRID  = 9;
const ROWS  = ['A','B','C','D','E','F','G','H','I'];
const TOL   = 1.5;           // LDU slack for "touching"

const COLORS = [
  [0,'Black'],[1,'Blue'],[2,'Green'],[4,'Red'],[6,'Brown'],[7,'Light Grey'],
  [14,'Yellow'],[15,'White'],[19,'Tan'],[25,'Orange'],[27,'Lime'],[70,'Reddish Brown'],
  [71,'Light Bluish Grey'],[72,'Dark Bluish Grey'],[36,'Trans Red'],[46,'Trans Yellow'],
  [47,'Trans Clear'],[57,'Trans Orange']
];

// ═══════════════════════════════════════════════════════════════════ catalogue
const NabugoCatalog = (() => {
  let parts = [], byId = new Map(), loaded = false, meta = null;

  async function load(url = './nabugo-parts.json') {
    if (loaded) return meta;
    const res = await fetch(url);
    if (!res.ok) throw new Error('catalogue unavailable: HTTP ' + res.status);
    const j = await res.json();
    parts = j.parts;
    byId = new Map(parts.map(p => [p.id, p]));
    // Pre-lower the searchable text once; retrieval hits this on every round.
    for (const p of parts) p._t = (p.d + ' ' + p.c + ' ' + (p.k || '')).toLowerCase();
    meta = { count: parts.length, generated: j.generated, ldu: j.ldu };
    loaded = true;
    return meta;
  }

  const get  = id => byId.get(String(id).replace(/\.dat$/i, ''));
  const all  = () => parts;
  const size = () => parts.length;

  /** Substring search over description + category + keywords. */
  function search(query, limit = 60) {
    const terms = String(query || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (!terms.length) return [];
    const hits = [];
    for (const p of parts) {
      let n = 0;
      for (const t of terms) if (p._t.includes(t)) n++;
      if (n) hits.push({ p, n });
    }
    hits.sort((a, b) => b.n - a.n || a.p.id.length - b.p.id.length);
    return hits.slice(0, limit).map(h => h.p);
  }

  return { load, get, all, size, search, get meta(){ return meta; } };
})();

// ═══════════════════════════════════════════════════════════════════ geometry
const NabugoGeom = (() => {
  const IDENT = [1,0,0, 0,1,0, 0,0,1];

  function rotY(deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [c,0,s, 0,1,0, -s,0,c];
  }

  /**
   * World AABB of a placement: transform the part's eight local corners by the
   * placement matrix, then translate. Cheaper and tighter than re-walking the
   * .dat, and exact for axis-aligned and 90-degree rotations, which is what the
   * doctrines emit.
   */
  function worldBox(place) {
    const part = NabugoCatalog.get(place.part);
    if (!part) return null;
    const [x0,y0,z0,x1,y1,z1] = part.b;
    const m = place.mat || IDENT, [px,py,pz] = place.pos;
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

  const overlap1 = (a0,a1,b0,b1) => Math.min(a1,b1) - Math.max(a0,b0);

  /** Signed interpenetration volume; <= 0 means the boxes only touch or miss. */
  function penetration(A, B) {
    const dx = overlap1(A.min[0],A.max[0],B.min[0],B.max[0]) - TOL;
    const dy = overlap1(A.min[1],A.max[1],B.min[1],B.max[1]) - TOL;
    const dz = overlap1(A.min[2],A.max[2],B.min[2],B.max[2]) - TOL;
    if (dx <= 0 || dy <= 0 || dz <= 0) return 0;
    return dx * dy * dz;
  }

  /** Do the two boxes share footprint in XZ? */
  function shareXZ(A, B) {
    return overlap1(A.min[0],A.max[0],B.min[0],B.max[0]) > TOL &&
           overlap1(A.min[2],A.max[2],B.min[2],B.max[2]) > TOL;
  }

  /**
   * Vertically adjacent: one box's underside meets the other's topside.
   * Y is DOWN, so A sits on B when A.max[1] ≈ B.min[1].
   */
  function stacked(A, B) {
    if (!shareXZ(A, B)) return false;
    return Math.abs(A.max[1] - B.min[1]) <= TOL * 2 ||
           Math.abs(B.max[1] - A.min[1]) <= TOL * 2;
  }

  return { IDENT, rotY, worldBox, penetration, shareXZ, stacked, overlap1 };
})();

// ═══════════════════════════════════════════════════════════════════════ scene
class NabugoScene {
  constructor(name = 'untitled') {
    this.name = name;
    this.places = [];
    this.seq = 0;
    this.version = 0;
  }
  clone() {
    const s = new NabugoScene(this.name);
    s.places = this.places.map(p => ({ ...p, pos:[...p.pos], mat:[...p.mat] }));
    s.seq = this.seq; s.version = this.version;
    return s;
  }
  add(place) {
    const p = {
      pid: 'p' + (++this.seq),
      part: String(place.part).replace(/\.dat$/i, ''),
      color: place.color ?? 71,
      pos: place.pos.slice(),
      mat: (place.mat || NabugoGeom.IDENT).slice(),
      cell: place.cell || null,
      zone: place.zone || 0,
      vignette: place.vignette || null,
      strategy: place.strategy || null,
      round: place.round || 0,
      locked: !!place.locked
    };
    this.places.push(p);
    this.version++;
    return p;
  }
  remove(pids) {
    const kill = new Set(pids);
    const before = this.places.length;
    this.places = this.places.filter(p => kill.has(p.pid) ? !!p.locked : true);
    this.version++;
    return before - this.places.length;
  }
  byVignette(name) { return this.places.filter(p => p.vignette === name); }
  get count() { return this.places.length; }

  /** Compile to MPD text. This is the artifact; everything else is scaffolding. */
  toMPD(opts = {}) {
    const L = [];
    const n = v => {
      const r = Math.round(v * 1000) / 1000;
      return Object.is(r, -0) ? '0' : String(r);
    };
    L.push('0 FILE ' + (opts.filename || (this.name.replace(/\W+/g,'-').toLowerCase() + '.mpd')));
    L.push('0 Name: ' + this.name);
    L.push('0 Author: ' + (opts.author || 'Nabugo Engine'));
    L.push('0 !LDRAW_ORG Model');
    L.push('0 BFC CERTIFY CCW');
    if (opts.brief) L.push('0 // BRIEF: ' + opts.brief);
    if (opts.meta)  L.push('0 // NABUGO ' + JSON.stringify(opts.meta));

    // One STEP per vignette keeps the build readable in any LDraw editor.
    const groups = new Map();
    for (const p of this.places) {
      const key = p.vignette || '(loose)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    for (const [name, ps] of groups) {
      L.push('');
      L.push('0 STEP');
      const z = ps[0].zone, st = ps[0].strategy;
      L.push('0 // ' + name + (z ? '  ·  Zone ' + z : '') + (st ? '  ·  ' + st : ''));
      for (const p of ps) {
        L.push('1 ' + p.color + ' ' + p.pos.map(n).join(' ') + ' ' +
               p.mat.map(n).join(' ') + ' parts/' + p.part + '.dat');
      }
    }
    return L.join('\n') + '\n';
  }

  /** Parse type-1 lines back into placements. Used to import a rival's build. */
  static fromMPD(text, name = 'imported') {
    const s = new NabugoScene(name);
    for (const line of String(text).split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith('1 ')) continue;
      const k = t.split(/\s+/);
      if (k.length < 15) continue;
      const v = k.slice(1, 14).map(Number);
      if (v.some(x => !Number.isFinite(x))) continue;
      const ref = k.slice(14).join(' ')
        .replace(/\\/g,'/').replace(/^\.?\//,'')
        .replace(/^ldraw\//i,'').replace(/^parts\//i,'').replace(/\.dat$/i,'');
      s.add({ part: ref, color: v[0], pos: [v[1],v[2],v[3]], mat: v.slice(4,13) });
    }
    return s;
  }
}

// ═══════════════════════════════════════════════════════════════════════ audit
/**
 * The feedback engine. This is the part that makes the loop drivable without a
 * model in it: every finding below is a measurement, not an opinion.
 */
const NabugoAudit = (() => {

  function run(scene, brief) {
    const places = scene.places;
    const boxes = places.map(p => NabugoGeom.worldBox(p));

    // -- compile: does every reference exist in the real library? -------------
    const unknown = [];
    places.forEach((p, i) => { if (!boxes[i]) unknown.push(p.part); });
    const compiles = unknown.length === 0;

    // -- collision: interpenetrating solids -----------------------------------
    const collisions = [];
    let worstPen = 0;
    for (let i = 0; i < places.length; i++) {
      if (!boxes[i]) continue;
      for (let j = i + 1; j < places.length; j++) {
        if (!boxes[j]) continue;
        const v = NabugoGeom.penetration(boxes[i], boxes[j]);
        if (v > 0) {
          collisions.push({ a: places[i].pid, b: places[j].pid, vol: Math.round(v),
                            parts: [places[i].part, places[j].part] });
          if (v > worstPen) worstPen = v;
        }
      }
    }

    // -- support: propagate grounding upward from y = 0 -----------------------
    // Y is down, so a part rests on the ground when its max[1] is near zero.
    const grounded = new Set();
    places.forEach((p, i) => {
      if (boxes[i] && Math.abs(boxes[i].max[1]) <= TOL * 3) grounded.add(i);
    });
    let growing = true;
    while (growing) {
      growing = false;
      for (let i = 0; i < places.length; i++) {
        if (grounded.has(i) || !boxes[i]) continue;
        for (const g of grounded) {
          if (boxes[g] && NabugoGeom.stacked(boxes[i], boxes[g])) {
            grounded.add(i); growing = true; break;
          }
        }
      }
    }
    const floating = places.filter((_, i) => boxes[i] && !grounded.has(i)).map(p => p.pid);

    // -- connectivity: components over touching parts -------------------------
    const parent = places.map((_, i) => i);
    const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
    for (let i = 0; i < places.length; i++) {
      if (!boxes[i]) continue;
      for (let j = i + 1; j < places.length; j++) {
        if (!boxes[j]) continue;
        if (NabugoGeom.stacked(boxes[i], boxes[j]) ||
            NabugoGeom.penetration(boxes[i], boxes[j]) > 0) union(i, j);
      }
    }
    const comps = new Map();
    places.forEach((p, i) => {
      if (!boxes[i]) return;
      const r = find(i);
      if (!comps.has(r)) comps.set(r, []);
      comps.get(r).push(p.pid);
    });
    const components = [...comps.values()].sort((a, b) => b.length - a.length);

    // A tray scene is *meant* to be several separated clusters — that is the
    // whole Vignette Protocol, cardinal anchoring and negative space. So global
    // component count is reported but not judged. What IS a defect is a cluster
    // that fails to cohere: parts nominally in one vignette that touch nothing
    // else in it, which is confetti pretending to be a construction.
    const vign = new Map();
    places.forEach((p, i) => {
      if (!boxes[i] || !p.vignette) return;
      if (!vign.has(p.vignette)) vign.set(p.vignette, []);
      vign.get(p.vignette).push(i);
    });
    const loose = [];
    for (const [name, idx] of vign) {
      if (idx.length < 2) continue;
      const roots = new Set(idx.map(find));
      if (roots.size > 1) {
        loose.push({ vignette: name, pieces: roots.size, parts: idx.length,
                     ids: idx.map(i => places[i].pid) });
      }
    }
    loose.sort((a, b) => (b.pieces / b.parts) - (a.pieces / a.parts));
    const cohesion = vign.size
      ? 1 - loose.reduce((a, l) => a + l.pieces / l.parts, 0) / vign.size
      : 1;

    // -- extent ---------------------------------------------------------------
    const ext = { min:[Infinity,Infinity,Infinity], max:[-Infinity,-Infinity,-Infinity] };
    for (const b of boxes) {
      if (!b) continue;
      for (let a = 0; a < 3; a++) {
        if (b.min[a] < ext.min[a]) ext.min[a] = b.min[a];
        if (b.max[a] > ext.max[a]) ext.max[a] = b.max[a];
      }
    }
    const finite = Number.isFinite(ext.min[0]);
    const span = finite ? [0,1,2].map(a => Math.round(ext.max[a] - ext.min[a])) : [0,0,0];

    // -- narrative coverage ---------------------------------------------------
    const zoneCounts = {1:0,2:0,3:0,4:0};
    for (const p of places) if (zoneCounts[p.zone] !== undefined) zoneCounts[p.zone]++;
    const zonesHit = [1,2,3,4].filter(z => zoneCounts[z] > 0).length;
    const cells = new Set(places.map(p => p.cell).filter(Boolean)).size;
    const strategies = new Set(places.map(p => p.strategy).filter(Boolean));

    const m = {
      parts: places.length,
      unique: new Set(places.map(p => p.part)).size,
      compiles, unknown,
      collisions: collisions.length, worstPen: Math.round(worstPen), collisionList: collisions,
      floating: floating.length, floatingList: floating,
      components: components.length, largestComponent: components[0] ? components[0].length : 0,
      vignettes: vign.size, loose: loose.length, looseList: loose,
      cohesion: Math.round(cohesion * 100) / 100,
      span, zoneCounts, zonesHit, cells,
      strategies: [...strategies]
    };
    m.fidelity = fidelity(m, brief);
    m.defect = worstDefect(m, brief, scene);
    return m;
  }

  /**
   * Fidelity is deliberately not just "does it look right" — an unbuildable
   * scene cannot be faithful. Soundness gates resemblance.
   */
  function fidelity(m, brief) {
    if (!m.parts) return 0;
    const targets = (brief && brief.zoneTargets) || {1:1,2:3,3:3,4:2};
    let zc = 0;
    for (const z of [1,2,3,4]) zc += Math.min(m.zoneCounts[z], targets[z]) / targets[z];
    const zoneCov = zc / 4;
    const spread  = Math.min(1, m.cells / 9);
    const mass    = Math.min(1, m.parts / ((brief && brief.massTarget) || 60));
    const variety = Math.min(1, m.strategies.length / 3);

    const narrative = zoneCov * 0.45 + spread * 0.20 + mass * 0.20 + variety * 0.15;

    // Soundness multiplier: real defects cost real fidelity.
    let sound = 1;
    if (!m.compiles)   sound *= 0.35;
    sound *= Math.max(0.4, 1 - m.collisions / Math.max(8, m.parts * 0.4));
    sound *= Math.max(0.5, 1 - m.floating  / Math.max(4, m.parts * 0.3));
    sound *= Math.max(0.55, m.cohesion);

    return Math.round(100 * narrative * sound);
  }

  /**
   * Name ONE defect, in the priority order both source doctrines insist on:
   * structure before relation, relation before finish, finish before detail.
   */
  function worstDefect(m, brief, scene) {
    const mk = (kind, killer, ids, zone) => ({ kind, killer, ids: ids || [], zone: zone || 0 });

    if (!m.parts)      return mk('EMPTY', 'Nothing exists yet. No photograph would be informative.');
    if (!m.compiles)   return mk('COMPILE', 'Does not compile: ' + m.unknown.slice(0,3).join(', ') + ' resolve to nothing.', []);
    if (m.collisions)  {
      const w = m.collisionList.slice().sort((a,b)=>b.vol-a.vol)[0];
      return mk('COLLISION', 'Solids interpenetrate: ' + w.parts[0] + ' occupies ' + w.parts[1] + '.', [w.a, w.b]);
    }
    if (m.floating > m.parts * 0.15)
      return mk('FLOAT', m.floating + ' parts rest on nothing.', m.floatingList.slice(0, 6));
    if (m.loose) {
      const w = m.looseList[0];
      return mk('LOOSE', w.vignette + ' does not cohere: ' + w.parts +
                ' parts in ' + w.pieces + ' pieces that touch nothing.', w.ids);
    }

    const targets = (brief && brief.zoneTargets) || {1:1,2:3,3:3,4:2};
    const thin = [1,2,3,4].filter(z => m.zoneCounts[z] < targets[z]);
    if (thin.length) {
      const z = thin[0];
      const zn = brief && brief.zones && brief.zones[z] ? brief.zones[z].name : 'Zone ' + z;
      return mk('VOID', zn + ' is unbuilt; the brief is not yet told there.', [], z);
    }
    if (m.strategies.length < 2)
      return mk('MONOTONE', 'One strategy only (' + (m.strategies[0] || 'none') +
                '); the catalogue has not been challenged.');
    if (m.cells < 5)
      return mk('CROWDED', 'Everything sits in ' + m.cells + ' cells; the tray is unused.');
    if (m.parts < ((brief && brief.massTarget) || 60) * 0.6)
      return mk('THIN', 'Too little mass to read as ' + (brief ? brief.title : 'the subject') + '.');
    return mk('SETTLED', 'No structural defect found. Refinement only.');
  }

  return { run, fidelity, worstDefect };
})();

// ═══════════════════════════════════════════════════════════════════ strategy
/**
 * The variety the brief is actually testing. Given the same void, these three
 * reach into the same 15k-part catalogue and come back with different answers.
 */
const NabugoStrategy = (() => {

  const STRUCTURAL = /^(Brick|Plate|Tile|Slope|Panel|Baseplate|Wedge|Bracket|Support|Arch)$/i;
  const FIGURE     = /minifig|figure|animal|plant|accessor/i;

  // A vignette occupies a tray cell (80 LDU). A 48-stud boat hull is a perfectly
  // good readymade but it is nearly a metre of tray on its own: placed into a
  // cell it swallows its neighbours, and every later gesture collides with it.
  // Cell-scale work is capped at three cells; anything larger is scene furniture
  // and belongs to a different move than the one this engine makes.
  const MAX_EXTENT = 240;
  const extentOf = p => Math.max(p.b[3] - p.b[0], p.b[5] - p.b[2]);
  const cellScale = p => extentOf(p) <= MAX_EXTENT;

  function footprintArea(p) { return Math.max(1, p.s[0] * p.s[1]); }

  /** Geometric Prior: structural utility. */
  function G(p) {
    let g = 0.45;
    if (STRUCTURAL.test(p.c)) g = 0.85;
    else if (/technic|hinge|turntable|train|vehicle/i.test(p.c)) g = 0.70;
    else if (/window|door|fence|wheel|dish|cone|cylinder|container|boat/i.test(p.c)) g = 0.62;
    else if (FIGURE.test(p.c)) g = 0.35;
    const a = footprintArea(p);
    if (a >= 8)  g += 0.08;
    if (a >= 64) g += 0.05;
    if (p.sig)   g += 0.05;              // known connectors are worth something
    return Math.max(0, Math.min(1, g));
  }

  /** Mythic Likelihood: does it carry the signifier of this void? */
  function M(p, lexicon) {
    let hits = 0;
    for (const w of lexicon) if (p._t.includes(w)) hits++;
    let m = 0.10 + hits * 0.26;
    if (/pattern|print/i.test(p.d)) m += 0.06;
    return Math.max(0, Math.min(1, m));
  }

  /** Visual Weight: gravity to anchor a cell. */
  function W(p) {
    const w = Math.log2(footprintArea(p) + 1) / Math.log2(1025);
    const bulk = /baseplate|hull|panel|fairing|container|large/i.test(p.d) ? 0.12 : 0;
    return Math.max(0, Math.min(1, w + bulk));
  }

  function microPlot(p, lexicon) {
    const g = G(p), m = M(p, lexicon), w = W(p);
    return { G: g, M: m, W: w, score: g * 0.3 + m * 0.4 + w * 0.3 };
  }

  // -- the three doctrines of retrieval --------------------------------------
  //
  // The pools are fixed properties of the catalogue, not of the round, so they
  // are built once. Re-filtering 15k parts on every gesture (twice per arena
  // step) put ~30s of regex on the main thread and froze the page.

  const POOLS = {};
  function pool(name, predicate) {
    if (!POOLS[name] || POOLS[name].n !== NabugoCatalog.size()) {
      POOLS[name] = { n: NabugoCatalog.size(), list: NabugoCatalog.all().filter(predicate) };
      // G and W depend only on the part, so cache them alongside the pool.
      for (const p of POOLS[name].list) {
        if (p._G === undefined) { p._G = G(p); p._W = W(p); }
      }
    }
    return POOLS[name].list;
  }

  /** Masonry. Many small standard parts; build the thing literally. */
  function brickwork(lexicon, n, rng) {
    const list = pool('brickwork', p =>
      STRUCTURAL.test(p.c) && cellScale(p) && footprintArea(p) <= 8 && p.h <= 4 && p.s[0] <= 4 && p.s[1] <= 4);
    return rank(list, lexicon, n, rng, r => r.G * 0.55 + r.M * 0.25 + r.W * 0.20);
  }

  /** The part that already IS the thing. Few parts, high semantic hit. */
  function readymade(lexicon, n, rng) {
    const list = pool('readymade', p =>
      cellScale(p) && (footprintArea(p) >= 6 || /hull|deck|container|panel|wedge|curved/i.test(p.d)));
    return rank(list, lexicon, n, rng, r => r.M * 0.70 + r.W * 0.25 + r.G * 0.05);
  }

  /**
   * Use a part against its nature. Deliberately inverts M: reward parts whose
   * category has nothing to do with the brief but whose form carries weight.
   * This is the move that put a baby space-helmet head in Plato's cave.
   */
  function kitbash(lexicon, n, rng) {
    const list = pool('kitbash', p =>
      cellScale(p) && !STRUCTURAL.test(p.c) && footprintArea(p) >= 2);
    return rank(list, lexicon, n, rng, r => (1 - r.M) * 0.45 + r.W * 0.35 + r.G * 0.20);
  }

  function rank(list, lexicon, n, rng, weigh) {
    // Only M depends on the lexicon; G and W were cached when the pool was built.
    const scored = list.map(p => {
      const m = M(p, lexicon);
      const r = { G: p._G, M: m, W: p._W, score: p._G * 0.3 + m * 0.4 + p._W * 0.3 };
      return { p, ...r, pick: weigh(r) };
    });
    scored.sort((a, b) => b.pick - a.pick);
    // Sample from the head rather than taking the top-n, so repeated rounds on
    // the same void do not return an identical bag.
    const head = scored.slice(0, Math.max(n * 6, 40));
    const out = [];
    const taken = new Set();
    while (out.length < n && taken.size < head.length) {
      const i = Math.floor(rng() * head.length);
      if (taken.has(i)) continue;
      taken.add(i);
      out.push(head[i]);
    }
    return out;
  }

  const ALL = { BRICKWORK: brickwork, READYMADE: readymade, KITBASH: kitbash };

  function draw(strategy, lexicon, n, rng) {
    const fn = ALL[strategy] || brickwork;
    return fn(lexicon, n, rng);
  }

  return { draw, microPlot, G, M, W, extentOf, cellScale, MAX_EXTENT, names: Object.keys(ALL) };
})();

// ═══════════════════════════════════════════════════════════════════ vignettes
/**
 * "Imply, don't saturate." Each generator turns a handful of parts into a
 * cluster that reads as a larger structure. Placement is grid-snapped and
 * stacked from the ground so the audit has a chance of passing.
 */
const NabugoVignette = (() => {

  const snap = (v, q) => Math.round(v / q) * q;

  // A vignette belongs to a tray cell. Left unbounded, one 48-stud boat hull
  // drawn into a masonry course throws the course a thousand LDU wide, the
  // collision guard rejects most of it, and the survivors end up stranded far
  // from the cell they were claimed for. Courses wrap instead.
  const MAXSPAN = 200;

  // Real dimensions, straight off the indexed AABB. Laying out by these instead
  // of a fixed spacing is what makes a cluster actually touch itself: a stack of
  // 1x1 plates and a rank of 6x48 boat hulls need very different pitches, and
  // guessing one number for both produced either overlap or confetti.
  const wOf = p => p.b[3] - p.b[0];
  const hOf = p => p.b[4] - p.b[1];
  const dOf = p => p.b[5] - p.b[2];
  const cxOf = p => (p.b[0] + p.b[3]) / 2;    // local XZ centre, rarely 0 for
  const czOf = p => (p.b[2] + p.b[5]) / 2;    // decorated or asymmetric parts

  /**
   * Position a part so its bounding box sits centred on (x, z) with its
   * underside at y. Y is down, so the underside is b[4].
   */
  function put(part, x, y, z, mat) {
    return {
      part: part.id,
      pos: [snap(x - cxOf(part), 2), y - part.b[4], snap(z - czOf(part), 2)],
      mat: mat || NabugoGeom.IDENT
    };
  }

  const GEOMS = {
    /** A rank along X. Parts abut, so the row reads as one continuous thing. */
    row(cands, ax, az) {
      return courses(cands, ax, az, () => MAXSPAN);
    },

    /** A ring in XZ, sized so the circumference actually fits the parts. */
    ring(cands, ax, az) {
      cands = fit(cands, MAXSPAN * 2.4);
      const ws = cands.map(c => wOf(c.p));
      const circumference = ws.reduce((a, b) => a + b, 0) * 1.15;
      const r = Math.max(40, circumference / (2 * Math.PI));
      let travelled = 0;
      return cands.map((c, i) => {
        const a = (travelled + ws[i] / 2) / circumference * Math.PI * 2;
        travelled += ws[i];
        return put(c.p, ax + Math.cos(a) * r, 0, az + Math.sin(a) * r,
                   NabugoGeom.rotY(-a * 180 / Math.PI));
      });
    },

    /** Courses of masonry. Each course advances by its own tallest part. */
    wall(cands, ax, az) {
      return courses(cands, ax, az, () => MAXSPAN, true);
    },

    /** One cell, straight up. Each part lands on the one below it. */
    stack(cands, ax, az) {
      const out = [];
      let y = 0;
      for (const c of cands) { out.push(put(c.p, ax, y, az)); y -= hOf(c.p); }
      return out;
    },

    /** Courses that lose a part as they rise. */
    pyramid(cands, ax, az) {
      let limit = MAXSPAN;
      return courses(cands, ax, az, () => (limit = Math.max(40, limit * 0.65)));
    },

    /** Two flanks meeting over a gap — a gate, a prow, a threshold. */
    pair(cands, ax, az) {
      const out = [];
      const lefts = cands.filter((_, i) => i % 2 === 0);
      const rights = cands.filter((_, i) => i % 2 === 1);
      [[lefts, -1], [rights, 1]].forEach(([side, dir]) => {
        let y = 0;
        for (const c of side) {
          out.push(put(c.p, ax + dir * (wOf(c.p) / 2 + 4), y, az,
                       dir < 0 ? NabugoGeom.IDENT : NabugoGeom.rotY(180)));
          y -= hOf(c.p);
        }
      });
      return out;
    },

    /** Spokes from a hub, each turned to face outward. */
    radial(cands, ax, az) {
      cands = fit(cands, MAXSPAN * 2.4);
      const n = cands.length;
      const maxW = Math.max(...cands.map(c => wOf(c.p)));
      const r = Math.max(30, (maxW * n) / (2 * Math.PI) + maxW / 2);
      return cands.map((c, i) => {
        const deg = (i / n) * 360, a = deg * Math.PI / 180;
        return put(c.p, ax + Math.cos(a) * r, 0, az + Math.sin(a) * r,
                   NabugoGeom.rotY(-deg));
      });
    },

    /**
     * A line that wanders. Ingold's wayfaring, and the natural way to lay a
     * hull spine. Steps in Z stay under half a part depth so the line holds
     * together as one run.
     */
    path(cands, ax, az) {
      const keep = fit(cands, MAXSPAN * 1.5);
      const ws = keep.map(c => wOf(c.p));
      const total = ws.reduce((a, b) => a + b, 0);
      let x = ax - total / 2, z = az;
      return keep.map((c, i) => {
        const p = put(c.p, x + ws[i] / 2, 0, z);
        x += ws[i];
        z += (i % 2 ? 1 : -1) * Math.min(dOf(c.p) * 0.35, 12);
        return p;
      });
    }
  };

  /** Keep candidates while their combined width fits the allowance. */
  function fit(cands, allowance) {
    const out = [];
    let used = 0;
    for (const c of cands) {
      const w = wOf(c.p);
      if (out.length && used + w > allowance) continue;
      out.push(c); used += w;
    }
    return out.length ? out : cands.slice(0, 1);
  }

  /**
   * Lay parts into stacked horizontal courses, wrapping when the next part
   * would push the course past its width allowance. `bond` offsets alternate
   * courses by half a part, which is what makes masonry interlock.
   */
  function courses(cands, ax, az, allowanceFor, bond) {
    const out = [];
    let y = 0, i = 0, n = 0;
    while (i < cands.length) {
      const allowance = allowanceFor(n);
      const slice = [];
      let used = 0;
      while (i < cands.length) {
        const w = wOf(cands[i].p);
        if (slice.length && used + w > allowance) break;
        slice.push(cands[i]); used += w; i++;
      }
      if (!slice.length) break;
      const ws = slice.map(c => wOf(c.p));
      const total = ws.reduce((a, b) => a + b, 0);
      let x = ax - total / 2 + (bond && n % 2 ? ws[0] / 2 : 0);
      let rowH = 0;
      slice.forEach((c, k) => {
        out.push(put(c.p, x + ws[k] / 2, y, az));
        x += ws[k];
        rowH = Math.max(rowH, hOf(c.p));
      });
      y -= rowH; n++;
    }
    return out;
  }

  const names = Object.keys(GEOMS);

  function build(geom, cands, anchor) {
    const fn = GEOMS[geom] || GEOMS.row;
    return fn(cands, anchor.x, anchor.z);
  }

  return { build, names, wOf, hOf, dOf };
})();

// ═══════════════════════════════════════════════════════════════════════ brief
const NabugoBrief = (() => {

  function cellLabel(r, c) { return ROWS[r] + (c + 1); }
  function cellToWorld(r, c) {
    return { x: (c - (GRID-1)/2) * CELL, z: (r - (GRID-1)/2) * CELL };
  }
  function cellZone(r, c) {
    const d = Math.max(Math.abs(r - 4), Math.abs(c - 4));
    return d === 0 ? 1 : d === 1 ? 2 : d <= 3 ? 3 : 4;
  }
  function cellsOfZone(z) {
    const out = [];
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++)
      if (cellZone(r, c) === z) out.push({ r, c, label: cellLabel(r, c) });
    return out;
  }

  const BRIEFS = {

    theseus: {
      key: 'theseus',
      title: 'Ship of Theseus',
      description: 'Every plank is replaced. The ship sails on. Is it the same ship?',
      massTarget: 70,
      zoneTargets: {1:1, 2:3, 3:3, 4:2},
      zones: {
        1: { name: 'The Plank Being Replaced',
             lex: ['plank','tile','plate','slope','panel','beam','bar','wedge','board','smooth'] },
        2: { name: 'The Hull / The Vessel',
             lex: ['boat','hull','ship','keel','deck','mast','sail','bow','stern','prow','wedge','curved'] },
        3: { name: 'The Shipwrights & The Harbour',
             lex: ['minifig','torso','tool','crane','dock','ladder','stair','barrel','crate','container','rope','winch'] },
        4: { name: 'Time & The Discarded Originals',
             lex: ['brick','plate','round','worn','broken','stack','pile','wheel','clock','ring','arch'] }
      },
      /** Replacement is the mechanic: the doctrines are told to churn Zone 1. */
      churnZone: 1,
      note: 'Replacement is the mechanic. Parts claimed in Zone 1 are provisional by design, ' +
            'and each round swaps some of them out — so the build accumulates a history of ' +
            'discards in Zone 4 while the hull in Zone 2 is meant to stay recognisable.'
    },

    ingold: {
      key: 'ingold',
      title: 'Ingold — Lines / Meshwork',
      description: 'Not a network of points but a meshwork of lines. Wayfaring, not transport.',
      massTarget: 55,
      zoneTargets: {1:1, 2:3, 3:3, 4:2},
      zones: {
        1: { name: 'The Knot Where Lines Cross',
             lex: ['hinge','joint','clip','bar','connector','turntable','ball','socket','knot','cross'] },
        2: { name: 'Wayfarers / The Walking',
             lex: ['minifig','leg','foot','torso','walk','figure','animal','track','trail','path'] },
        3: { name: 'The Taskscape / The Ground',
             lex: ['baseplate','plate','ground','grass','earth','rock','tile','field','road','terrain'] },
        4: { name: 'Horizon / Weather-World',
             lex: ['arch','sky','cloud','wing','flag','sail','antenna','curved','dish','windscreen'] }
      },
      churnZone: 0,
      note: 'Lines, not nodes. The path and ring generators do most of the work here; ' +
            'a knot in Zone 1 should physically connect things that arrive from different cells.'
    },

    cave: {
      key: 'cave',
      title: "Plato's Cave",
      description: 'Prisoners take shadows for reality; one is dragged out and sees the sun.',
      massTarget: 60,
      zoneTargets: {1:1, 2:3, 3:3, 4:2},
      zones: {
        1: { name: 'The Shadow Screen',
             lex: ['window','glass','pane','panel','sheet','flag','screen','door','tile','trans'] },
        2: { name: 'Captives & Mechanism',
             lex: ['minifig','torso','head','leg','arm','train','base','track','chain','statue','wing','figure'] },
        3: { name: 'Cave & Fire',
             lex: ['rock','panel','fairing','hull','slope','wedge','cone','flame','torch','canyon','baseplate','brick'] },
        4: { name: 'Ascent & Sun',
             lex: ['wheel','dish','radar','round','sun','stair','staircase','ladder','ramp','disc','ring','arch'] }
      },
      churnZone: 0,
      note: 'Carried over from platos-cave-builder.html so the engine can be checked ' +
            'against a build that already exists.'
    }
  };

  return { BRIEFS, cellLabel, cellToWorld, cellZone, cellsOfZone, GRID, ROWS, CELL };
})();

// ═══════════════════════════════════════════════════════════════════ doctrine
/**
 * An autonomous builder. Give it a brief and call step() until it settles.
 * No API is involved: it reads the audit, targets the named defect, and makes
 * one construction gesture per round.
 *
 * The two doctrines differ in temperament, not machinery:
 *
 *   OPERATOR       pessimistic, structure-first, verifies by measurement,
 *                  reverts gestures that make the audit worse, favours
 *                  BRICKWORK, records blast radius for every move.
 *
 *   CORRESPONDENCE one telling gesture per round, "imply don't saturate",
 *                  favours READYMADE then KITBASH, escalates to a stated
 *                  commitment when the same accusation survives twice.
 */
class NabugoDoctrine {
  constructor(kind, brief, opts = {}) {
    this.kind = kind;                       // 'OPERATOR' | 'CORRESPONDENCE'
    this.brief = brief;
    this.scene = new NabugoScene(brief.title + ' · ' + kind);
    this.round = 0;
    this.maxRounds = opts.maxRounds || 20;
    this.trace = [];                        // one record per gesture
    this.lastAudit = null;
    this.lastDefect = null;
    this.repeatCount = 0;
    this.commitment = null;
    this.settled = false;
    this.usedCells = new Set();
    this.rng = mulberry32(opts.seed ?? (kind === 'OPERATOR' ? 0x0FE2A7 : 0xC02E5E));
  }

  get doctrine() {
    return this.kind === 'OPERATOR'
      ? { strategies: ['BRICKWORK','BRICKWORK','KITBASH','READYMADE'],
          geoms: ['wall','row','stack','pyramid','pair'],
          bagSize: 9, revert: true,
          creed: 'FUCKED UNTIL PROVEN OTHERWISE' }
      : { strategies: ['READYMADE','KITBASH','READYMADE','BRICKWORK'],
          geoms: ['ring','path','radial','pair','row'],
          bagSize: 5, revert: false,
          creed: 'ONE TELLING GESTURE' };
  }

  /** Pick the cell this round's gesture goes into, given the named defect. */
  /**
   * A cell for this round's gesture. Zone 1 is a single cell by construction
   * (Chebyshev ring 0), so once something is standing in it the zone is closed
   * unless we are willing to look outward — otherwise the doctrine re-earns
   * "Zone 1 is unbuilt" forever while every placement collides.
   */
  pickCell(zone) {
    const clear = c => {
      const w = NabugoBrief.cellToWorld(c.r, c.c);
      const probe = { min: [w.x - 30, -400, w.z - 30], max: [w.x + 30, 4, w.z + 30] };
      return !this.scene.places.some(p => {
        const b = NabugoGeom.worldBox(p);
        return b && NabugoGeom.penetration(probe, b) > 0;
      });
    };
    const order = this.kind === 'OPERATOR'
      ? cs => cs.slice().sort((a, b) =>
          (Math.abs(a.r-4) + Math.abs(a.c-4)) - (Math.abs(b.r-4) + Math.abs(b.c-4)))
      : cs => { const o = cs.slice(); for (let i = o.length - 1; i > 0; i--) {
          const j = Math.floor(this.rng() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };

    const own = NabugoBrief.cellsOfZone(zone);
    for (const c of order(own)) if (!this.usedCells.has(c.label) && clear(c)) return c;
    for (const c of order(own)) if (clear(c)) return c;

    // The zone is full. Spill into the neighbouring ring rather than deadlock;
    // the placement still counts toward this zone's narrative coverage.
    for (const z of [zone - 1, zone + 1, zone - 2, zone + 2]) {
      if (z < 1 || z > 4) continue;
      for (const c of order(NabugoBrief.cellsOfZone(z)))
        if (!this.usedCells.has(c.label) && clear(c)) return c;
    }
    return order(own)[0];
  }

  /**
   * One construction gesture. Returns a trace record describing what actually
   * changed — not what was intended.
   */
  step() {
    if (this.settled || this.round >= this.maxRounds) { this.settled = true; return null; }
    this.round++;

    const before = NabugoAudit.run(this.scene, this.brief);
    const defect = before.defect;
    const snapshot = this.doctrine.revert ? this.scene.clone() : null;

    // Track resistance: the same accusation surviving is what earns escalation.
    if (this.lastDefect && this.lastDefect.kind === defect.kind) this.repeatCount++;
    else this.repeatCount = 0;
    this.lastDefect = defect;

    const rec = {
      round: this.round, doctrine: this.kind, defect,
      before: { fidelity: before.fidelity, parts: before.parts,
                collisions: before.collisions, floating: before.floating,
                components: before.components },
      commitment: null, added: [], removed: [], reverted: false, note: ''
    };

    // Escalation. Stating a commitment and then building exactly as before is
    // how the first version deadlocked: the Operator kept proposing wide
    // courses, kept reverting them, and kept re-earning the same accusation.
    // A commitment now actually narrows the next gesture.
    const escalated = this.repeatCount >= 2;
    if (escalated && !this.commitment) {
      this.commitment = this.stateCommitment(defect);
      rec.commitment = this.commitment;
    }

    // ---- repair gestures: the audit named a physical fault -------------------
    if (defect.kind === 'COLLISION') {
      const n = this.scene.remove(defect.ids.slice(1));
      rec.removed = defect.ids.slice(1);
      rec.note = 'Removed ' + n + ' interpenetrating part(s) rather than nudging them.';

    } else if (defect.kind === 'FLOAT') {
      const n = this.scene.remove(defect.ids);
      rec.removed = defect.ids;
      rec.note = 'Dropped ' + n + ' unsupported part(s); nothing may rest on nothing.';

    } else if (defect.kind === 'LOOSE') {
      // Tighten by subtraction: keep the part of the cluster that touches
      // something, discard the strays. Rebuilding the cluster elsewhere just
      // moves the problem, which is what the first version of this did.
      const keep = this.largestTouchingSubset(defect.ids);
      const strays = defect.ids.filter(id => !keep.has(id));
      const n = this.scene.remove(strays);
      rec.removed = strays;
      rec.note = 'Cluster did not cohere; dropped ' + n + ' stray part(s) instead of adding more.';

    // ---- construction gestures: the audit named an absence -------------------
    } else {
      const zone = defect.zone ||
        this.thinnestZone(before) ||
        (1 + Math.floor(this.rng() * 4));
      const cell = this.pickCell(zone);
      // Under escalation, fall back to the two geometries that cannot fail to
      // cohere — every part lands on the one beneath it — and take an empty
      // cell so nothing already standing can reject the placement.
      const geom = escalated
        ? (this.kind === 'OPERATOR' ? 'stack' : 'pair')
        : this.doctrine.geoms[(this.round - 1) % this.doctrine.geoms.length];
      // THIN is a complaint about mass, so answer it with mass. Replying to it
      // with the same small bag used for an empty zone is why the doctrines
      // used to sit at "too little mass" for the last third of a run.
      rec.added = this.gesture(zone, geom, cell, escalated,
                               defect.kind === 'THIN' ? 2.5 : 1);
      rec.note = this.kind === 'OPERATOR'
        ? 'Deployed a ' + geom + ' into ' + cell.label + '; measurement follows.'
        : 'One ' + geom + ' at ' + cell.label + ' — enough to imply the rest.';
    }

    // ---- the Ship of Theseus mechanic ---------------------------------------
    if (this.brief.churnZone && this.round > 2) {
      const swapped = this.churn(this.brief.churnZone);
      if (swapped) rec.note += '  Replaced ' + swapped + ' plank(s); the discards move to Zone 4.';
    }

    const after = NabugoAudit.run(this.scene, this.brief);

    // Operator reverts a gesture that measurably worsened the build — but only
    // a *construction* gesture. Reverting a repair is self-defeating: dropping
    // a stray part costs mass before it buys cohesion, so guarding removals
    // this way made the doctrine undo its own fix and re-earn the same
    // accusation every round until it ran out of rounds.
    const wasConstruction = rec.added.length > 0 && rec.removed.length === 0;
    if (snapshot && wasConstruction && after.fidelity < before.fidelity - 1) {
      this.scene = snapshot;
      rec.reverted = true;
      rec.note += '  REVERTED: fidelity fell ' + before.fidelity + ' -> ' + after.fidelity + '.';
      rec.after = { ...before };
    } else {
      rec.after = { fidelity: after.fidelity, parts: after.parts,
                    collisions: after.collisions, floating: after.floating,
                    components: after.components };
      this.lastAudit = after;
    }

    rec.blast = rec.added.length + rec.removed.length;
    rec.delta = rec.after.fidelity - rec.before.fidelity;
    this.trace.push(rec);

    const a = this.lastAudit || after;
    if (a.fidelity >= 80 || this.round >= this.maxRounds) this.settled = true;
    return rec;
  }

  /** Place one vignette; returns the placement ids actually added. */
  gesture(zone, geom, cell, escalated, appetite = 1) {
    const z = this.brief.zones[zone] || this.brief.zones[3];
    const strategy = escalated
      ? 'BRICKWORK'                       // small, stackable, predictable
      : this.doctrine.strategies[(this.round - 1) % this.doctrine.strategies.length];
    const bag = Math.round((escalated ? 4 : this.doctrine.bagSize) * appetite);
    const cands = NabugoStrategy.draw(strategy, z.lex, bag, this.rng);
    if (!cands.length) return [];

    const anchor = NabugoBrief.cellToWorld(cell.r, cell.c);
    const raw = NabugoVignette.build(geom, cands, anchor);
    const vname = geom.toUpperCase() + ' @ ' + cell.label;
    const color = this.colorFor(zone, strategy);

    // Stage the whole vignette before committing any of it. A cluster that
    // mostly fails the collision guard is not a cluster, and admitting its
    // handful of survivors is what produced stranded parts.
    const staged = [];
    const boxes = [];
    for (const r of raw) {
      const trial = { part: r.part, color, pos: r.pos, mat: r.mat,
                      cell: cell.label, zone, vignette: vname,
                      strategy, round: this.round };
      const box = NabugoGeom.worldBox(trial);
      if (!box) continue;
      if (this.collidesWithScene(trial)) continue;
      if (boxes.some(b => NabugoGeom.penetration(box, b) > 0)) continue;
      staged.push(trial); boxes.push(box);
    }
    if (!staged.length) return [];
    // A partial vignette is fine — the LOOSE audit will judge whether what
    // landed actually coheres. Only a near-total rejection is worth discarding.
    if (raw.length > 2 && staged.length < 2) return [];

    const added = staged.map(t => this.scene.add(t).pid);
    this.usedCells.add(cell.label);
    return added;
  }

  collidesWithScene(trial) {
    const box = NabugoGeom.worldBox(trial);
    if (!box) return true;
    for (const p of this.scene.places) {
      const b = NabugoGeom.worldBox(p);
      if (b && NabugoGeom.penetration(box, b) > 0) return true;
    }
    return false;
  }

  /** Swap out planks: the paradox, mechanised. */
  churn(zone) {
    const victims = this.scene.places.filter(p => p.zone === zone && !p.locked);
    if (victims.length < 2) return 0;
    const n = Math.min(2, Math.floor(victims.length / 2));
    const going = [];
    for (let i = 0; i < n; i++) {
      const v = victims[Math.floor(this.rng() * victims.length)];
      if (v && !going.includes(v)) going.push(v);
    }
    if (!going.length) return 0;

    // The discarded originals accumulate in Zone 4 — the pile that proves the
    // replacement happened.
    const pile = NabugoBrief.cellsOfZone(4)[Math.floor(this.rng() * 8)];
    const anchor = NabugoBrief.cellToWorld(pile.r, pile.c);
    let stackY = 0;
    for (const v of going) {
      const part = NabugoCatalog.get(v.part);
      if (!part) continue;
      const cx = (part.b[0] + part.b[3]) / 2, cz = (part.b[2] + part.b[5]) / 2;
      const discard = {
        part: v.part, color: 70, mat: NabugoGeom.IDENT,
        pos: [anchor.x - cx, stackY - part.b[4], anchor.z - cz],
        cell: pile.label, zone: 4, vignette: 'DISCARDED ORIGINALS @ ' + pile.label,
        strategy: 'CHURN', round: this.round
      };
      if (!this.collidesWithScene(discard)) {
        this.scene.add(discard);
        stackY -= (part.b[4] - part.b[1]);
      }
    }
    this.scene.remove(going.map(v => v.pid));
    this.usedCells.add(pile.label);
    return going.length;
  }

  /** Of a set of placement ids, the largest group that actually touches. */
  largestTouchingSubset(pids) {
    const set = new Set(pids);
    const ps = this.scene.places.filter(p => set.has(p.pid));
    const boxes = ps.map(p => NabugoGeom.worldBox(p));
    const parent = ps.map((_, i) => i);
    const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      if (boxes[i] && boxes[j] && NabugoGeom.stacked(boxes[i], boxes[j])) {
        const ra = find(i), rb = find(j); if (ra !== rb) parent[ra] = rb;
      }
    }
    const groups = new Map();
    ps.forEach((p, i) => {
      const r = find(i);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r).push(p.pid);
    });
    const best = [...groups.values()].sort((a, b) => b.length - a.length)[0] || [];
    return new Set(best);
  }

  bridgeCell() {
    const occupied = [...this.usedCells];
    if (!occupied.length) return { r: 4, c: 4, label: 'E5' };
    const lab = occupied[0];
    const r = ROWS.indexOf(lab[0]), c = parseInt(lab.slice(1), 10) - 1;
    const nr = Math.max(0, Math.min(8, r + (this.rng() < 0.5 ? 1 : -1)));
    return { r: nr, c, label: NabugoBrief.cellLabel(nr, c) };
  }

  thinnestZone(audit) {
    const t = this.brief.zoneTargets;
    let worst = 0, gap = 0;
    for (const z of [1,2,3,4]) {
      const g = t[z] - audit.zoneCounts[z];
      if (g > gap) { gap = g; worst = +z; }
    }
    return worst;
  }

  colorFor(zone, strategy) {
    if (strategy === 'KITBASH')   return [4, 25, 27][zone % 3];
    if (strategy === 'READYMADE') return [72, 70, 19][zone % 3];
    return [71, 7, 15][zone % 3];
  }

  stateCommitment(defect) {
    const z = defect.zone && this.brief.zones[defect.zone];
    const where = z ? z.name : 'the accused region';
    return this.kind === 'OPERATOR'
      ? 'The same accusation has survived twice. Stop adding: build the supporting condition under ' +
        where + ' before anything else is placed on top of it.'
      : 'The same accusation has survived twice. One readymade that already means ' +
        where + ' will do more than another handful of bricks.';
  }

  audit() { return NabugoAudit.run(this.scene, this.brief); }

  toMPD() {
    const a = this.audit();
    return this.scene.toMPD({
      filename: 'nabugo-' + this.brief.key + '-' + this.kind.toLowerCase() + '.mpd',
      author: 'Nabugo · ' + this.kind,
      brief: this.brief.title + ' — ' + this.brief.description,
      meta: { doctrine: this.kind, creed: this.doctrine.creed, round: this.round,
              fidelity: a.fidelity, parts: a.parts, strategies: a.strategies,
              collisions: a.collisions, floating: a.floating, components: a.components }
    });
  }
}

// Deterministic RNG so a duel can be replayed exactly.
function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════════════ arena
/** Two doctrines, one brief, one bag of rules. The bake-off. */
class NabugoArena {
  constructor(briefKey = 'theseus', opts = {}) {
    this.brief = NabugoBrief.BRIEFS[briefKey] || NabugoBrief.BRIEFS.theseus;
    this.a = new NabugoDoctrine('OPERATOR', this.brief, opts);
    this.b = new NabugoDoctrine('CORRESPONDENCE', this.brief, opts);
    this.round = 0;
  }
  step() {
    this.round++;
    return { round: this.round, operator: this.a.step(), correspondence: this.b.step() };
  }
  run(n = 20) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (this.a.settled && this.b.settled) break;
      out.push(this.step());
    }
    return out;
  }
  scoreboard() {
    const A = this.a.audit(), B = this.b.audit();
    const lead = (k, hi) => A[k] === B[k] ? 'TIE' :
      (hi ? (A[k] > B[k]) : (A[k] < B[k])) ? 'OPERATOR' : 'CORRESPONDENCE';
    return {
      brief: this.brief.title,
      operator: A, correspondence: B,
      leads: {
        fidelity: lead('fidelity', true),
        economy:  lead('parts', false),
        variety:  A.strategies.length === B.strategies.length ? 'TIE'
                  : A.strategies.length > B.strategies.length ? 'OPERATOR' : 'CORRESPONDENCE',
        soundness: (A.collisions + A.floating) === (B.collisions + B.floating) ? 'TIE'
                  : (A.collisions + A.floating) < (B.collisions + B.floating) ? 'OPERATOR' : 'CORRESPONDENCE'
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════ bus
/**
 * Ball-jar's contribution, kept and de-kludged. One channel, both payload
 * shapes, no iframes. Anything on wag-frank carrying an MPD becomes a bag of
 * bricks; anything we finish goes back out the same way.
 */
const NabugoBus = (() => {
  let ch = null, handlers = [];

  function connect(source = 'nabugo') {
    if (typeof BroadcastChannel === 'undefined') return null;
    if (ch) return ch;
    ch = new BroadcastChannel('wag-frank');
    ch.addEventListener('message', ev => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object' || !msg.kind) return;
      if (msg.source === source) return;
      const p = msg.payload || {};
      let text = null;
      if (typeof p.mpd_content === 'string') text = p.mpd_content;
      else if (Array.isArray(p.mpdLines))    text = p.mpdLines.join('\n');
      else if (typeof msg.mpd_content === 'string') text = msg.mpd_content;
      else if (Array.isArray(p.parts))       text = p.parts.join('\n');
      handlers.forEach(h => h({ msg, text }));
    });
    return ch;
  }

  const onInbound = fn => { handlers.push(fn); };

  function emit(scene, meta, source = 'nabugo') {
    if (!ch) return false;
    const text = typeof scene === 'string' ? scene : scene.toMPD();
    ch.postMessage({
      kind: 'scene-mpd', source, ts: Date.now(),
      payload: {
        name: (meta && meta.name) || 'Nabugo build',
        filename: (meta && meta.filename) || 'nabugo.mpd',
        mode: 'replace',
        mpdLines: text.split('\n'),
        mpd_content: text,
        scene: meta || {}
      }
    });
    return true;
  }

  return { connect, onInbound, emit, get channel() { return ch; } };
})();

// ═══════════════════════════════════════════════════════════════════════ lens
/**
 * Optional. The engine never needs a model; this is where one attaches if you
 * want narration rather than measurement. Left unwired on purpose — nothing in
 * nabugo calls out to a network beyond fetching its own catalogue.
 */
const NabugoLens = {
  available: false,
  describe(record) {
    if (!record) return '';
    const d = record.defect;
    const verdict = record.delta > 0 ? 'BETTER' : record.delta < 0 ? 'WORSE' : 'SAME';
    const prefix = verdict === 'SAME' ? 'STILL FUCKED: ' : verdict === 'WORSE' ? 'WORSE: ' : '';
    return prefix + d.killer;
  }
};

global.Nabugo = {
  LDU, CELL, GRID, ROWS, COLORS,
  Catalog: NabugoCatalog, Geom: NabugoGeom, Scene: NabugoScene, Audit: NabugoAudit,
  Strategy: NabugoStrategy, Vignette: NabugoVignette, Brief: NabugoBrief,
  Doctrine: NabugoDoctrine, Arena: NabugoArena, Bus: NabugoBus, Lens: NabugoLens,
  mulberry32
};
})(typeof window !== 'undefined' ? window : globalThis);

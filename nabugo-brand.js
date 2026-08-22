/**
 * NABUGO BRAND — Stewart Brand's shearing layers as a build engine
 * =================================================================
 * The complaint this answers: our builds are not real things. They read as a
 * platform with a colonnade on it because every part was placed by one pass
 * with one clock. A real building has six clocks running at once, and How
 * Buildings Learn names them:
 *
 *   SITE       permanent      the plot, the ground, the water line
 *   STRUCTURE  30-300 years   the load-bearing frame; expensive to change
 *   SKIN       20-30 years    cladding, roofing, the weather face
 *   SERVICES   7-15 years     doors, hinges, ladders — the layer that wears out
 *   SPACE PLAN 3-30 years     partitions, decks, circulation
 *   STUFF      daily          minifigs, vehicles, props
 *
 * The engine's whole discipline is that a fast layer is never trapped inside a
 * slow one. That is not a slogan here: `openLayer` refuses to reopen a slower
 * layer once a faster one has closed, `place` refuses a part whose family
 * belongs to another layer, and `audit` flood-fills the voxel envelope to find
 * a SERVICES part with no path out to the air.
 *
 * SCENARIO BUFFERING is the second discipline. Over-specifying every cubic LDU
 * locks out the future, so the envelope is voxelised at 20x8x20 and a placement
 * that would push the open layer past its ceiling is refused — 0.45 for
 * STRUCTURE (0.30 on the LOW ROAD), 0.60 for STRUCTURE+SKIN, 0.75 for
 * everything. At least a quarter of the envelope stays uncommitted, forever.
 *
 * Everything that reaches the site goes through NabugoCrew.commit. There is no
 * second placement path, and nothing here pushes into site.places directly.
 */
(function (global) {
'use strict';

const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules, CREW = global.NabugoCrew;
if (!N || !E || !M || !CREW) {
  throw new Error('nabugo-brand.js requires nabugo.js, -evo.js, -modules.js and -crew.js');
}
const { Catalog, Geom } = N;

const STUD = 20, PLATE = 8, BRICK = 24, PROT = 4;
/** The scenario-buffer voxel: one stud in plan, one plate in section. §5.7. */
const VOX = [20, 8, 20];

// ════════════════════════════════════════════════════════════ classification
/**
 * Family rules mirrored from build-kit-index.js. NabugoKits owns the canonical
 * copy and is preferred whenever it is loaded; this fallback exists because the
 * layer policy has to hold even when only the build engine is on the page, and
 * a layer that cannot classify a part cannot refuse it. Order matters: the
 * first rule that matches the description's opening word wins.
 */
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
  [/^tile\b/, 'tile']
];

function familyOf(partId) {
  const K = global.NabugoKits;
  if (K && typeof K.familyOf === 'function') return K.familyOf(partId);
  const p = Catalog.get(partId);
  if (!p) return 'other';
  const d = String(p.d || '').replace(/^=/, '').trim().toLowerCase();
  for (const [re, fam] of FAMILY_RULES) if (re.test(d)) return fam;
  return 'other';
}

// ═══════════════════════════════════════════════════════════════════ layers
/**
 * The six, in build order. `generates` is an allow-list, not a hint: place()
 * refuses any part whose family is absent from it. `mayNotTouch` is the subset
 * we name explicitly in the refusal, because "SKIN may not touch hinges" is a
 * sentence a builder can act on and "family not in allow-list" is not.
 *
 * `alsoAllows` carries the contract's named exceptions. SKIN's is the SNOT
 * anchor vocabulary of §5.3 — 47905, 30414 and 4070 are family `brick` and
 * would otherwise be locked out of the one layer that needs them.
 * `alsoAllowsInAsm` lets a STUFF vehicle be made of plates, which every real
 * kit's vehicle is, without opening plates to loose STUFF placement.
 */
const LAYERS = [
  {
    id: 'SITE', order: 0, clock: 'permanent', shareBand: [0.02, 0.15],
    owns: 'the plot boundary, the ground plane, the water line, the legal extent',
    generates: ['plate'], alsoAllows: [], alsoAllowsInAsm: {},
    mayNotTouch: ['brick', 'tile', 'slope', 'hinge+turntable', 'window+door', 'minifig'],
    colours: [2, 19, 71, 1],
    colourPolicy: 'ground green/tan/grey, water blue; one colour per surface, never a gradient',
    ceiling: null,
    // A baseplate laid on y=0 reaches y=-8 including its studs, and one plate
    // course on top of it reaches -16. A brick course reaches -32, and that is
    // STRUCTURE's job. This is the line, and place() refuses anything past it.
    floorY: -16
  },
  {
    id: 'STRUCTURE', order: 1, clock: '30-300 yr', shareBand: [0.25, 0.50],
    owns: 'the load-bearing frame; everything else hangs off it',
    generates: ['brick', 'plate', 'technic'], alsoAllows: [], alsoAllowsInAsm: {},
    mayNotTouch: ['tile', 'slope', 'hinge+turntable', 'bracket+clip', 'window+door', 'minifig'],
    colours: [71, 72, 70, 0],
    colourPolicy: '1-3 muted colours; the frame is not where colour lives',
    ceiling: 'STRUCTURE'
  },
  {
    id: 'SKIN', order: 2, clock: '20-30 yr', shareBand: [0.20, 0.45],
    owns: 'the weather face: cladding, roofing, nose, wing surfaces, the colour band',
    generates: ['tile', 'slope', 'panel+windscreen', 'round+cone'],
    // §5.3, verbatim: the SNOT anchor vocabulary, and nothing else.
    alsoAllows: ['47905', '30414', '4070', '2555', '3794a', '47457'], alsoAllowsInAsm: {},
    mayNotTouch: ['hinge+turntable', 'bracket+clip', 'window+door', 'minifig', 'wheel+tyre'],
    colours: [15, 4, 14, 19, 71, 0],
    colourPolicy: 'a band is made by SUBSTITUTING the part at that course, never by recolouring in place',
    ceiling: 'STRUCTURE_SKIN'
  },
  {
    id: 'SERVICES', order: 3, clock: '7-15 yr', shareBand: [0.04, 0.35],
    owns: 'everything that wears out and must stay reachable',
    generates: ['hinge+turntable', 'bracket+clip', 'window+door', 'bar+antenna'],
    alsoAllows: [], alsoAllowsInAsm: {},
    mayNotTouch: ['brick', 'plate', 'technic'],
    colours: [0, 71, 47, 7],
    colourPolicy: 'trans-clear for glazing, black or grey for ironmongery',
    ceiling: 'ALL'
  },
  {
    id: 'SPACE', order: 4, clock: '3-30 yr', shareBand: [0.00, 0.15],
    owns: 'interior partitions, decks, circulation',
    generates: ['plate', 'tile', 'panel+windscreen'], alsoAllows: [], alsoAllowsInAsm: {},
    mayNotTouch: ['brick', 'slope', 'minifig', 'wheel+tyre'],
    colours: [71, 19, 15],
    colourPolicy: 'interior neutral; the space plan is not seen from outside',
    ceiling: 'ALL'
  },
  {
    id: 'STUFF', order: 5, clock: 'daily', shareBand: [0.02, 0.50],
    owns: 'the inhabitants: minifigs, vehicles, furniture, props',
    generates: ['minifig', 'wheel+tyre', 'flag+cloth', 'plant+animal'],
    alsoAllows: [],
    // A vehicle is plates and tiles in every kit in the corpus. It is STUFF
    // because it drives away, not because of what it is made of — so the
    // exception is scoped to an assembly declared as a vehicle, not to the layer.
    alsoAllowsInAsm: { vehicle: ['plate', 'tile', 'slope', 'round+cone', 'bracket+clip'] },
    mayNotTouch: ['brick', 'technic', 'window+door'],
    colours: [14, 4, 1, 0, 15],
    colourPolicy: 'inhabitants are the brightest thing on the model',
    ceiling: 'ALL'
  }
];
const LAYER_BY_ID = new Map(LAYERS.map(l => [l.id, l]));
for (const l of LAYERS) Object.freeze(l);
Object.freeze(LAYERS);

// ══════════════════════════════════════════════════════════════ temperament
/**
 * LOW ROAD vs HIGH ROAD, §5.8. Six named parameters, every one of them read by
 * a generator or a gate. A temperament that only changed a label would be a
 * mood; this one changes the buffer ceiling, the course height, the palette
 * width and how many times a block is instanced.
 */
const TEMPERAMENT = {
  LOW: Object.freeze({
    id: 'LOW', paletteNovelty: 0.0, colourTarget: [3.5, 5.0], snotTarget: 0.12,
    reuseTarget: 0.35, blocksPer100Target: [2.0, 4.0], structureCeiling: 0.30,
    tileCapRate: 0.10, courseUnit: BRICK, bar: '4838-mini-vehicles',
    /** Building 20: the same bay again. Staples only, and repeat them. */
    stapleOnly: true, instanceRepeat: 2, detailAtoms: false
  }),
  HIGH: Object.freeze({
    id: 'HIGH', paletteNovelty: 0.6, colourTarget: [6.0, 9.0], snotTarget: 0.35,
    reuseTarget: 0.15, blocksPer100Target: [6.0, 12.0], structureCeiling: 0.45,
    tileCapRate: 0.60, courseUnit: PLATE, bar: '7140-xwing-fighter',
    stapleOnly: false, instanceRepeat: 2, detailAtoms: true
  })
};

/**
 * The corrected minifig skeleton, §5.6. The shipped minifigurator table puts the
 * left leg at x=-20 with an identity matrix; the kits put BOTH legs at x=0 with
 * this matrix (verified against 1621-lunar-mpv and 5935-island-hopper), and the
 * leg parts are authored offset to their own side so they do not collide.
 */
const MINIFIG_SKELETON = Object.freeze({
  head:  Object.freeze({ part: '3626b', dy: -84, x: 0, mat: null }),
  torso: Object.freeze({ part: '973',   dy: -60, x: 0, mat: null }),
  armL:  Object.freeze({ part: '3819',  dy: -51, x: -15.552, mat: null }),
  armR:  Object.freeze({ part: '3818',  dy: -51, x: 15.552,  mat: null }),
  hips:  Object.freeze({ part: '3815',  dy: -28, x: 0, mat: null }),
  legL:  Object.freeze({ part: '3817',  dy: 0, x: 0, mat: [1,0,0, 0,0,1, 0,-1,0] }),
  legR:  Object.freeze({ part: '3816',  dy: 0, x: 0, mat: [1,0,0, 0,0,1, 0,-1,0] })
});

/**
 * Vocabulary, taken from the kits rather than from a regex over 15k parts. Every
 * id below appears in kits/5935-island-hopper.mpd, kits/7140-xwing-fighter.mpd
 * or kits/4838-mini-vehicles.mpd and resolves in Nabugo.Catalog.
 */
const VOCAB = Object.freeze({
  ground:   ['3867', '3811', '3865'],
  water:    ['3032', '3035'],
  brick:    { '1x2': '3004', '1x3': '3622', '1x4': '3010', '1x6': '3009', '1x8': '3008',
              '2x2': '3003', '2x4': '3001', '1x1': '3005', 'corner': '2357' },
  plate:    { '1x2': '3023b', '1x4': '3710', '1x6': '3666', '2x2': '3022', '2x3': '3021',
              '1x3': '3623', '2x4': '3020', '2x6': '3795', '2x8': '3034', '4x4': '3031', '4x6': '3032',
              '4x8': '3035', '6x6': '3958', '1x1r': '6141' },
  tile:     { '1x2': '3069b', '1x4': '2431', '1x6': '6636', '2x2': '3068b', '1x1': '3070b',
              'grille': '2412b' },
  slope:    { '45_2x4': '3037', '45_2x2': '3039', '45_2x1': '3040b', '33_3x1': '4286',
              '33_3x2': '3298', '31_1x1': '54200' },
  wedge:    { right: '6564', left: '6565' },
  round:    { '1x1cone': '4589', '2x2': '3941', '4x4': '87081', 'corner': '3063b',
              'dish2x2': '4740', '1x1brick': '3062b' },
  snot:     { side1x4: '30414', two1x1: '47905', headlight: '4070', clipTile: '2555' },
  services: { hingeBase: '3937', hingeTop: '6134', hingeTile: '4625',
              hingeBrickDual: '30365', hingeBrickSingle: '30364', hingePlate: '30383',
              window: '2377', bracket: '2436a', antenna: '3957a', bar: '30359a',
              turntable: '27448' },
  stuff:    { flag: '2335', plant: '3741a', wheelRim: '4624', tyre: '3641',
              wheelPlate: '4600', chassis: '3020', hand: '3820' }
});

// ═══════════════════════════════════════════════════════════════════ helpers
const num = v => { const r = Math.round(v * 1000) / 1000; return Object.is(r, -0) ? '0' : String(r); };
const det = m => m[0]*(m[4]*m[8]-m[5]*m[7]) - m[1]*(m[3]*m[8]-m[5]*m[6]) + m[2]*(m[3]*m[7]-m[4]*m[6]);
const snap = (v, g) => Math.round(v / g) * g;
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Nominal course height: the AABB less the 4 LDU of stud that lands inside the part above. */
function advance(part) { return (part.b[4] - part.b[1]) - (part.b[1] < -0.5 ? PROT : 0); }

/** World AABB of a part under a matrix, before translation. */
function rotBox(part, m) {
  const [x0, y0, z0, x1, y1, z1] = part.b;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < 8; i++) {
    const lx = (i & 1) ? x1 : x0, ly = (i & 2) ? y1 : y0, lz = (i & 4) ? z1 : z0;
    const v = [m[0]*lx + m[1]*ly + m[2]*lz, m[3]*lx + m[4]*ly + m[5]*lz, m[6]*lx + m[7]*ly + m[8]*lz];
    for (let k = 0; k < 3; k++) { if (v[k] < min[k]) min[k] = v[k]; if (v[k] > max[k]) max[k] = v[k]; }
  }
  return { min, max };
}

/**
 * Place a part with its footprint centred on (x,z) and its underside at `y`.
 * Y is down, so "underside" is the box's max. Rotations are handled by
 * measuring the rotated box rather than the authored one, which is what makes
 * a slope rotated 90 degrees land where the caller meant it to.
 */
function at(id, x, z, y, o = {}) {
  const part = Catalog.get(id);
  if (!part) return null;
  const mat = (o.mat || Geom.IDENT).slice();
  const rb = rotBox(part, mat);
  const py = o.centreY != null ? o.centreY - (rb.min[1] + rb.max[1]) / 2
           : o.top != null     ? o.top - rb.min[1]
           :                     y - rb.max[1];
  return {
    part: id, color: o.color != null ? o.color : 71,
    pos: [x - (rb.min[0] + rb.max[0]) / 2, py, z - (rb.min[2] + rb.max[2]) / 2],
    mat, lpos: null, lmat: null, parent: null, depth: 1, layer: 'UNASSIGNED', asm: null,
    role: o.role || null, module: o.module || null
  };
}

/** Slide a placement along one axis until the named face of its box sits on `plane`. */
function alignFace(pl, axis, sign, plane) {
  const b = Geom.worldBox(pl);
  if (!b) return pl;
  pl.pos[axis] += plane - (sign > 0 ? b.max[axis] : b.min[axis]);
  return pl;
}

/** Ports in world coordinates: [type, [x,y,z], axisIndex]. */
function worldPorts(pl) {
  const raw = E.Ports.of(pl.part);
  if (!raw || !raw.length) return [];
  const m = pl.mat || Geom.IDENT, p = pl.pos, out = [];
  for (const r of raw) {
    const lx = r[1], ly = r[2], lz = r[3];
    out.push([r[0], [m[0]*lx + m[1]*ly + m[2]*lz + p[0],
                     m[3]*lx + m[4]*ly + m[5]*lz + p[1],
                     m[6]*lx + m[7]*ly + m[8]*lz + p[2]], r[4]]);
  }
  return out;
}

/**
 * Is this placement clutched sideways to one of `hosts`? groundSettle can only
 * see vertical stacking, so every studs-sideways part it is handed looks like
 * it is floating — which is exactly why our SNOT rate has been 0.000. A side
 * stud whose world position lies inside the candidate's own volume is a real
 * mechanical join, and this is the only thing that counts as one.
 */
const HORIZONTAL_AXES = new Set([0, 1, 4, 5]);
function clutched(pl, box, hosts) {
  const pad = 2;
  for (const h of hosts) {
    const hb = h.box || Geom.worldBox(h.p || h);
    if (!hb) continue;
    if (hb.max[0] < box.min[0] - 24 || hb.min[0] > box.max[0] + 24) continue;
    if (hb.max[2] < box.min[2] - 24 || hb.min[2] > box.max[2] + 24) continue;
    const hp = h.p || h;
    for (const [type, w, axis] of worldPorts(hp)) {
      if (type !== 0 || !HORIZONTAL_AXES.has(axis)) continue;
      if (w[0] >= box.min[0] - pad && w[0] <= box.max[0] + pad &&
          w[1] >= box.min[1] - pad && w[1] <= box.max[1] + pad &&
          w[2] >= box.min[2] - pad && w[2] <= box.max[2] + pad) return true;
    }
  }
  return false;
}

/** Voxel index range a span covers, half a LDU in from each face so touching does not count. */
function voxRange(lo, hi, size) {
  const a = Math.floor((lo + 0.5) / size);
  const b = Math.ceil((hi - 0.5) / size) - 1;
  return [a, b < a ? a : b];
}
function boxVoxels(box, out) {
  const [ax, bx] = voxRange(box.min[0], box.max[0], VOX[0]);
  const [ay, by] = voxRange(box.min[1], box.max[1], VOX[1]);
  const [az, bz] = voxRange(box.min[2], box.max[2], VOX[2]);
  for (let i = ax; i <= bx; i++) for (let j = ay; j <= by; j++) for (let k = az; k <= bz; k++) {
    out.add(i + ',' + j + ',' + k);
  }
  return out;
}

/**
 * The highest surface under (x,z), or null. NabugoCrew keeps this private, and
 * STUFF cannot be placed on a deck it cannot find; this is the same rule, eight
 * lines of it, and it places nothing.
 */
function surfaceAt(places, x, z) {
  let best = null;
  for (const p of places) {
    const b = Geom.worldBox(p);
    if (!b) continue;
    if (x < b.min[0] - 4 || x > b.max[0] + 4) continue;
    if (z < b.min[2] - 4 || z > b.max[2] + 4) continue;
    if (best == null || b.min[1] < best) best = b.min[1];
  }
  return best;
}

/**
 * Two-fold symmetric about Y: the test that decides whether a part can be
 * mirrored by turning it round. A centred AABB is necessary but nowhere near
 * sufficient — Brick 2x2 Corner is perfectly centred and utterly chiral — so
 * the description has to be free of every word that names a handed feature.
 */
const NOT_TWO_FOLD = /corner|left|right|wedge|slope|wing|clip|handle|headlight|hinge|bracket|door|window|arch|offset|end\b|angle|1\/4|inverted|studs on (one|side)|curved/i;
function twoFoldY(partId) {
  const p = Catalog.get(partId);
  if (!p) return false;
  if (NOT_TWO_FOLD.test(p.d)) return false;
  return Math.abs(p.b[0] + p.b[3]) < 0.51 && Math.abs(p.b[2] + p.b[5]) < 0.51;
}

function chiralityTwin(partId) {
  const K = global.NabugoKits;
  if (K && typeof K.chiralityTwin === 'function') return K.chiralityTwin(partId);
  const local = { '6564': '6565', '6565': '6564', '30355': '30356', '30356': '30355',
                  '3818': '3819', '3819': '3818', '41770': '41769', '41769': '41770',
                  '43722': '43723', '43723': '43722', '3816': '3817', '3817': '3816' };
  return local[String(partId)] || null;
}

// ════════════════════════════════════════════════════════════════════ build
/**
 * A build in progress. The fields `site`, `rng` are exactly the shape
 * NabugoCrew.commit duck-types on, so commit works here unmodified and there is
 * still only one placement path in the repo.
 *
 * A `def` is a submodel definition — a named block of local placements, cut
 * once and referenced one or more times. A `ref` is one occurrence of a def in
 * the world. Real kits are built this way (10174 has 90 defs and 33 of them are
 * referenced more than once, delivering 27% of its pieces); every generator
 * output we have ever shipped was one flat block, which is the whole of our
 * AX-ANATOMY and AX-REUSE gap.
 */
class Build {
  constructor(opts = {}) {
    const seed = opts.seed == null ? 0xB2A4D : opts.seed;
    this.name = opts.name || 'brand';
    this.seed = seed;
    this.rng = N.mulberry32(seed);
    this.temperament = TEMPERAMENT[opts.temperament === 'HIGH' ? 'HIGH' : 'LOW'];
    this.bar = opts.bar || null;
    this.site = { places: [], claims: [], extent: opts.extent || 640, log: [] };
    this.palette = opts.palette || new M.Palette([], [], this.rng);
    this.layer = '';
    this.ledger = [];
    this.closed = [];                      // layer ids, in the order they closed
    this.reserves = [];                    // {min,max,why}
    this.defs = new Map();                 // defId -> definition
    this.refs = new Map();                 // refId -> occurrence
    this.defStack = [];                    // open asm defs, innermost last
    this.counters = { def: 0, ref: 0 };
    this.vox = { SITE: new Set(), STRUCTURE: new Set(), SKIN: new Set(),
                 SERVICES: new Set(), SPACE: new Set(), STUFF: new Set() };
    this.envelope = null;                  // {min,max} over everything placed or reserved
    this.plan = opts.plan || {};
    this.focusAxis = opts.focusAxis || null;
  }

  // ───────────────────────────────────────────────────────────────── layers
  /** Open a layer. A slower layer may never reopen once a faster one has closed. */
  openLayer(id) {
    const spec = LAYER_BY_ID.get(id);
    if (!spec) throw new Error('no such layer: ' + id);
    if (this.layer) throw new Error('layer ' + this.layer + ' is still open');
    for (const done of this.closed) {
      const d = LAYER_BY_ID.get(done);
      if (d.order > spec.order) {
        throw new Error('cannot reopen ' + id + ' (clock ' + spec.clock + ') after ' + done +
                        ' closed: a fast layer would be trapped inside a slow one');
      }
    }
    this.layer = id;
    this.ledger.push({ layer: id, op: 'open', parts: 0, refused: 0, why: spec.clock });
    return spec;
  }

  /** Close the open layer and report its share and its buffer occupancy. */
  closeLayer() {
    const id = this.layer;
    if (!id) throw new Error('no layer is open');
    const spec = LAYER_BY_ID.get(id);
    const parts = this.site.places.filter(p => p.layer === id).length;
    const total = this.site.places.length || 1;
    const buf = this.buffer();
    const occ = spec.ceiling ? buf[spec.ceiling] : buf.ALL;
    const ok = spec.ceiling ? buf.ok : true;
    const report = { layer: id, parts, share: parts / total, occupancy: occ,
                     ceiling: spec.ceiling, ok,
                     why: ok ? 'closed at ' + (Math.round(occ * 1000) / 10) + '% occupancy'
                             : buf.why };
    this.closed.push(id);
    this.layer = '';
    this.ledger.push({ layer: id, op: 'close', parts, refused: 0, why: report.why });
    this.site.log.push(report);
    return report;
  }

  // ───────────────────────────────────────────────────────── the way in
  /**
   * THE ONLY WAY IN. Stamps layer and assembly, runs G-DET, the layer's
   * allow-list, the reserved volumes and the scenario-buffer ceiling, screens
   * support, and then hands what survives to NabugoCrew.commit — which is the
   * thing that actually checks collision and pushes to site.places.
   */
  place(places, opts = {}) {
    const layerId = this.layer;
    if (!layerId) return { ok: false, parts: 0, clashed: 0, unsupported: 0, refused: [],
                           reason: 'no layer is open' };
    const spec = LAYER_BY_ID.get(layerId);
    const def = this.defStack[this.defStack.length - 1] || null;
    const asmId = opts.asm || (def ? def.id : null);
    const kind = opts.kind || (def ? def.kind : null);
    const refused = [];
    const candidates = [];

    for (const raw of places) {
      if (!raw) { refused.push('null placement'); continue; }
      const p = raw;
      p.layer = layerId;
      p.asm = asmId;
      p.mat = p.mat || Geom.IDENT.slice();
      if (!Catalog.get(p.part)) { refused.push(p.part + ': G-KNOWN, not in catalogue'); continue; }
      if (det(p.mat) <= 0) { refused.push(p.part + ': G-DET, det(mat) <= 0'); continue; }
      const fam = familyOf(p.part);
      if (!this._familyAllowed(spec, fam, p.part, kind)) {
        refused.push(p.part + ' (' + fam + '): ' + layerId + ' may not touch ' + fam);
        continue;
      }
      const box = Geom.worldBox(p);
      if (!box) { refused.push(p.part + ': no box'); continue; }
      if (layerId === 'SITE' && spec.floorY != null && box.min[1] < spec.floorY - 0.51) {
        refused.push(p.part + ': SITE may not touch anything above y=' + spec.floorY);
        continue;
      }
      const hit = this.reserves.find(r => overlaps(box, r));
      if (hit) { refused.push(p.part + ': reserved volume — ' + hit.why); continue; }
      candidates.push({ p, box });
    }

    // Scenario buffering. Greedy, in the order the generator emitted: the first
    // placements of a layer get the volume and the last ones are refused, which
    // is the honest reading of a ceiling.
    const kept = [];
    for (const c of candidates) {
      const gate = this._bufferAdmits(spec, c.box);
      if (!gate.ok) { refused.push(c.p.part + ': G-BUFFER, ' + gate.why); continue; }
      this._commitVox(layerId, c.box);
      kept.push(c);
    }

    if (!kept.length) {
      this.ledger.push({ layer: layerId, op: 'place', parts: 0, refused: refused.length,
                         why: refused[0] || 'nothing offered' });
      return { ok: false, parts: 0, clashed: 0, unsupported: 0, refused,
               reason: refused[0] || 'nothing offered' };
    }

    // Support. groundSettle is the rule; a verified side-stud clutch is the only
    // addition, and it is a physical join the settle pass cannot express.
    let rescued = 0;
    let batch = kept;
    if (opts.requireSupport !== false) {
      const screen = this._screenSupport(kept, !!opts.atomic);
      rescued = screen.rescued;
      for (const bad of screen.dropped) refused.push(bad.p.part + ': unsupported, nothing to stand on');
      if (opts.atomic && screen.dropped.length) {
        for (const c of kept) this._releaseVox(layerId, c.box);
        this.ledger.push({ layer: layerId, op: 'place', parts: 0, refused: refused.length,
                           why: 'atomic assembly has nothing to stand on' });
        return { ok: false, parts: 0, clashed: 0, unsupported: screen.dropped.length,
                 refused, reason: 'atomic assembly has nothing to stand on' };
      }
      batch = screen.held;
    }
    if (!batch.length) {
      return { ok: false, parts: 0, clashed: 0, unsupported: kept.length, refused,
               reason: 'nothing could stand' };
    }

    const before = this.site.places.length;
    const res = CREW.commit(this, batch.map(c => c.p), {
      atomic: !!opts.atomic,
      selfClash: opts.selfClash !== false,
      // Support has already been decided above, by a rule at least as strict as
      // commit's own; asking commit to settle again would throw away every part
      // rescued by a verified side-stud clutch.
      requireSupport: rescued ? false : (opts.requireSupport !== false)
    });
    const added = this.site.places.slice(before);
    for (const c of batch) {
      if (added.indexOf(c.p) === -1) {
        this._releaseVox(layerId, c.box);
        // Name what it hit. A refusal that says only "clash" costs an hour of
        // bisecting a plot plan; one that names the part and where it sits is
        // the difference between a gate and a wall.
        const hit = this._firstHit(c.box, c.p);
        refused.push(c.p.part + ': ' + (res.reason || 'clash') +
                     (hit ? ' with ' + hit.part + '@' + hit.pos.map(Math.round).join(',') +
                            ' (' + hit.layer + (hit.role ? '/' + hit.role : '') + ')' : ''));
      }
    }
    for (const p of added) this._adopt(p, def);
    this._growEnvelope(added);

    this.ledger.push({ layer: layerId, op: 'place', parts: added.length,
                       refused: refused.length, why: res.reason || (def ? def.name : 'loose') });
    return { ok: added.length > 0, parts: added.length, clashed: res.clashed || 0,
             unsupported: res.unsupported || 0, refused, reason: res.reason };
  }

  /** The first world part a box interpenetrates, for a refusal worth reading. */
  _firstHit(box, self) {
    for (const q of this.site.places) {
      if (q === self) continue;
      const b = Geom.worldBox(q);
      if (b && Geom.penetration(box, b) > 0) return q;
    }
    return null;
  }

  _familyAllowed(spec, fam, partId, kind) {
    if (spec.generates.indexOf(fam) !== -1) return true;
    if (spec.alsoAllows.indexOf(String(partId)) !== -1) return true;
    const inAsm = kind && spec.alsoAllowsInAsm[kind];
    if (inAsm && inAsm.indexOf(fam) !== -1) return true;
    return false;
  }

  /** Held = settled on the world, or clutched to something held. Iterated to fixpoint. */
  _screenSupport(cands, atomic) {
    const held = new Set(M.groundSettle(cands, this.site.places));
    let growing = true;
    let rescued = 0;
    while (growing) {
      growing = false;
      for (const c of cands) {
        if (held.has(c)) continue;
        const hosts = this.site.places.map(p => ({ p })).concat([...held]);
        if (clutched(c.p, c.box, hosts)) { held.add(c); rescued++; growing = true; }
      }
    }
    // A rigid assembly stands or falls as one object: if any member is held, the
    // whole of it is held, because it is glued to that member.
    if (atomic && held.size) return { held: cands.slice(), dropped: [], rescued };
    return { held: cands.filter(c => held.has(c)), dropped: cands.filter(c => !held.has(c)), rescued };
  }

  // ────────────────────────────────────────────────────── assemblies
  /**
   * Cut a submodel. Everything `fn` places lands inside it. Nesting is legal and
   * is how a kit gets to depth 4-6; the two-tier policy of §5.9 wants Tier A
   * anatomy blocks of 10-80 parts holding Tier B detail atoms of 2-5.
   */
  asm(name, fn, opts = {}) {
    const parent = this.defStack[this.defStack.length - 1] || null;
    const id = 'def' + (++this.counters.def);
    const def = { id, name, kind: opts.kind || null, layer: this.layer, parent,
                  file: slug(name) + '-' + this.counters.def + '.ldr',
                  places: [], children: [], origin: null, refs: 0,
                  depth: parent ? parent.depth + 1 : 2 };
    this.defs.set(id, def);
    this.defStack.push(def);
    try { fn(this); } finally { this.defStack.pop(); }
    this._finalise(def);
    if (parent) parent.children.push({ def, pos: null, mat: Geom.IDENT.slice() });
    else this._addRef(def, def.origin.slice(), Geom.IDENT.slice());
    return id;
  }

  /** Where a placement goes when its def closes. */
  _adopt(p, def) {
    if (def) { def.places.push(p); return; }
    // An instance copy already carries the local frame of the block it came
    // from; re-parenting it to the layer would lose the reference and with it
    // every piece that arrives through an instanced block.
    if (p.parent && p.lpos) return;
    {
      p.parent = 's' + (LAYER_BY_ID.get(p.layer).order + 1) + '-' + slug(p.layer) + '.ldr';
      p.depth = 2;
      p.lpos = p.pos.slice();
      p.lmat = p.mat.slice();
    }
  }

  /** Fix a def's origin and rewrite its members into local coordinates. */
  _finalise(def) {
    let mnx = Infinity, mnz = Infinity;
    for (const p of def.places) {
      const b = Geom.worldBox(p);
      if (!b) continue;
      if (b.min[0] < mnx) mnx = b.min[0];
      if (b.min[2] < mnz) mnz = b.min[2];
    }
    for (const c of def.children) {
      if (c.def.origin[0] < mnx) mnx = c.def.origin[0];
      if (c.def.origin[2] < mnz) mnz = c.def.origin[2];
    }
    // Y stays absolute: the lattice axis the kits keep tidiest is y on 4 LDU,
    // and shifting a def's origin off a plate boundary would break it for free.
    const origin = [Number.isFinite(mnx) ? snap(mnx, 10) : 0, 0,
                    Number.isFinite(mnz) ? snap(mnz, 10) : 0];
    def.origin = origin;
    for (const p of def.places) {
      p.parent = def.file;
      p.depth = def.depth;
      p.lpos = [p.pos[0] - origin[0], p.pos[1] - origin[1], p.pos[2] - origin[2]];
      p.lmat = p.mat.slice();
    }
    for (const c of def.children) {
      c.pos = [c.def.origin[0] - origin[0], c.def.origin[1] - origin[1], c.def.origin[2] - origin[2]];
    }
  }

  _addRef(def, pos, mat) {
    const id = 'ref' + (++this.counters.ref);
    const ref = { id, def, pos: pos.slice(), mat: mat.slice(), layer: def.layer };
    this.refs.set(id, ref);
    def.refs++;
    return ref;
  }

  /**
   * Re-instance a def already cut. The MPD emits one more reference line to the
   * same file, so the pieces arrive through an instanced block — which is the
   * whole of AX-REUSE, stuck at 0.000 in every build we have ever shipped.
   */
  instance(defId, pos, mat) {
    const def = this.defs.get(defId);
    if (!def) return { ok: false, parts: 0, refused: ['no such assembly: ' + defId], reason: 'unknown asm' };
    const m = (mat || Geom.IDENT).slice();
    if (det(m) <= 0) return { ok: false, parts: 0, refused: ['G-DET, det(mat) <= 0'], reason: 'mirrored instance' };
    const ref = this._addRef(def, pos.slice(), m);
    const copies = [];
    for (const src of this._defLeaves(def, [0, 0, 0], Geom.IDENT.slice())) {
      const lp = src.lpos, lm = src.lmat;
      copies.push({
        part: src.part, color: src.color,
        pos: [m[0]*lp[0] + m[1]*lp[1] + m[2]*lp[2] + pos[0],
              m[3]*lp[0] + m[4]*lp[1] + m[5]*lp[2] + pos[1],
              m[6]*lp[0] + m[7]*lp[1] + m[8]*lp[2] + pos[2]],
        mat: Geom.mul(m, lm), lpos: lp.slice(), lmat: lm.slice(),
        parent: src.parent, depth: src.depth, layer: src.layer, asm: ref.id,
        role: src.role, module: src.module
      });
    }
    const r = this.place(copies, { asm: ref.id, selfClash: false, kind: def.kind,
                                   requireSupport: false, atomic: false });
    if (!r.parts) { def.refs--; this.refs.delete(ref.id); }
    return r;
  }

  /** Every leaf placement of a def, in the def's own local frame. */
  _defLeaves(def, off, mat) {
    const out = [];
    for (const p of def.places) {
      out.push({ ...p,
        lpos: [mat[0]*p.lpos[0] + mat[1]*p.lpos[1] + mat[2]*p.lpos[2] + off[0],
               mat[3]*p.lpos[0] + mat[4]*p.lpos[1] + mat[5]*p.lpos[2] + off[1],
               mat[6]*p.lpos[0] + mat[7]*p.lpos[1] + mat[8]*p.lpos[2] + off[2]],
        lmat: Geom.mul(mat, p.lmat) });
    }
    for (const c of def.children) {
      const o = [mat[0]*c.pos[0] + mat[1]*c.pos[1] + mat[2]*c.pos[2] + off[0],
                 mat[3]*c.pos[0] + mat[4]*c.pos[1] + mat[5]*c.pos[2] + off[1],
                 mat[6]*c.pos[0] + mat[7]*c.pos[1] + mat[8]*c.pos[2] + off[2]];
      out.push(...this._defLeaves(c.def, o, Geom.mul(mat, c.mat)));
    }
    return out;
  }

  /**
   * MIRROR. Three legal implementations, tried in order, and never a negated
   * matrix column: det < 0 is illegal LDraw and zero of 1242 kit placements do it.
   */
  mirror(places, plane, about) {
    const axis = plane === 'z' ? 2 : 0;
    const out = [], refused = [];
    for (const p of places) {
      const twin = chiralityTwin(p.part);
      const pos = p.pos.slice();
      pos[axis] = 2 * about - pos[axis];
      if (twin) {
        // (i) the mould's own mirror image, same matrix, reflected position.
        const src = Catalog.get(p.part), dst = Catalog.get(twin);
        if (src && dst) {
          const d = axis === 0 ? (src.b[0] + src.b[3]) + (dst.b[0] + dst.b[3])
                               : (src.b[2] + src.b[5]) + (dst.b[2] + dst.b[5]);
          pos[axis] -= d / 2;
          out.push({ ...p, part: twin, pos, mat: p.mat.slice(), lpos: null, lmat: null, asm: null });
          continue;
        }
      }
      if (twoFoldY(p.part)) {
        // (ii) turn it round. Legal for anything with two-fold symmetry about Y.
        out.push({ ...p, pos, mat: Geom.mul(Geom.rotY(180), p.mat), lpos: null, lmat: null, asm: null });
        continue;
      }
      refused.push(p.part);
    }
    return { places: out, refused };
  }

  /** n copies around a hub, yawed. Square footprints take 4; round takes 4, 6 or 8. */
  ring(hub, radius, n, part, opts = {}) {
    const p = Catalog.get(part);
    if (!p) return [];
    const round = /round|cone|dish|cylinder/i.test(p.d);
    const legal = round ? [4, 6, 8] : [4];
    if (legal.indexOf(n) === -1) {
      this.ledger.push({ layer: this.layer, op: 'ring', parts: 0, refused: n,
                         why: part + ' takes n in ' + legal.join('/') + ', not ' + n });
      return [];
    }
    const phase = opts.phase || 0, out = [];
    for (let i = 0; i < n; i++) {
      const deg = 360 * i / n + phase, a = deg * Math.PI / 180;
      out.push(at(part, hub.x + radius * Math.sin(a), hub.z + radius * Math.cos(a),
                  opts.y == null ? 0 : opts.y,
                  { mat: Geom.rotY(deg), color: opts.color, role: opts.role || 'ring' }));
    }
    return out.filter(Boolean);
  }

  // ────────────────────────────────────────────── scenario buffering
  reserve(box, why) {
    const r = { min: box.min.slice(), max: box.max.slice(), why: why || 'reserved' };
    this.reserves.push(r);
    this._growEnvelopeBox(r);
    return r;
  }

  _envelopeVoxels() {
    if (!this.envelope) return 1;
    const [ax, bx] = voxRange(this.envelope.min[0], this.envelope.max[0], VOX[0]);
    const [ay, by] = voxRange(this.envelope.min[1], this.envelope.max[1], VOX[1]);
    const [az, bz] = voxRange(this.envelope.min[2], this.envelope.max[2], VOX[2]);
    return Math.max(1, (bx - ax + 1) * (by - ay + 1) * (bz - az + 1));
  }

  _groupVox(group) {
    const s = new Set();
    const ids = group === 'STRUCTURE' ? ['STRUCTURE']
              : group === 'STRUCTURE_SKIN' ? ['STRUCTURE', 'SKIN']
              : ['SITE', 'STRUCTURE', 'SKIN', 'SERVICES', 'SPACE', 'STUFF'];
    for (const id of ids) for (const k of this.vox[id]) s.add(k);
    return s;
  }

  ceilingFor(group) {
    if (group === 'STRUCTURE') return this.temperament.structureCeiling;
    if (group === 'STRUCTURE_SKIN') return 0.60;
    return 0.75;
  }

  buffer() {
    const env = this._envelopeVoxels();
    const s = this._groupVox('STRUCTURE').size / env;
    const ss = this._groupVox('STRUCTURE_SKIN').size / env;
    const all = this._groupVox('ALL').size / env;
    const spec = this.layer ? LAYER_BY_ID.get(this.layer) : null;
    const group = spec && spec.ceiling ? spec.ceiling : 'ALL';
    const v = group === 'STRUCTURE' ? s : group === 'STRUCTURE_SKIN' ? ss : all;
    const ceiling = this.ceilingFor(group);
    return { STRUCTURE: s, STRUCTURE_SKIN: ss, ALL: all, uncommitted: 1 - all,
             ok: v <= ceiling, ceiling: group,
             why: v <= ceiling ? '' : group + ' occupancy ' + (Math.round(v * 1000) / 10) +
                  '% over the ' + (ceiling * 100) + '% ceiling' };
  }

  /** Would this box push the open layer's group past its ceiling? */
  _bufferAdmits(spec, box) {
    if (!spec.ceiling) return { ok: true, why: '' };
    const group = this._groupVox(spec.ceiling);
    const add = boxVoxels(box, new Set());
    for (const k of add) group.add(k);
    // The envelope grows with the candidate: a part that sticks out enlarges the
    // denominator too, so the gate cannot be gamed by placing the next brick
    // further away — AX-DENSITY punishes that separately.
    const env = this._envelopeWith(box);
    const share = group.size / env;
    const ceiling = this.ceilingFor(spec.ceiling);
    return share <= ceiling ? { ok: true, why: '' }
      : { ok: false, why: spec.ceiling + ' would reach ' + (Math.round(share * 1000) / 10) +
                          '%, ceiling ' + (ceiling * 100) + '%' };
  }

  _envelopeWith(box) {
    const e = this.envelope ? { min: this.envelope.min.slice(), max: this.envelope.max.slice() }
                            : { min: box.min.slice(), max: box.max.slice() };
    for (let i = 0; i < 3; i++) {
      if (box.min[i] < e.min[i]) e.min[i] = box.min[i];
      if (box.max[i] > e.max[i]) e.max[i] = box.max[i];
    }
    const [ax, bx] = voxRange(e.min[0], e.max[0], VOX[0]);
    const [ay, by] = voxRange(e.min[1], e.max[1], VOX[1]);
    const [az, bz] = voxRange(e.min[2], e.max[2], VOX[2]);
    return Math.max(1, (bx - ax + 1) * (by - ay + 1) * (bz - az + 1));
  }

  _commitVox(layerId, box) { boxVoxels(box, this.vox[layerId]); }

  /** A refusal must give the volume back, or the ceiling ratchets on failed tries. */
  _releaseVox(layerId, box) {
    const mine = boxVoxels(box, new Set());
    const others = new Set();
    for (const p of this.site.places) {
      if (p.layer !== layerId) continue;
      const b = Geom.worldBox(p);
      if (b) boxVoxels(b, others);
    }
    for (const k of mine) if (!others.has(k)) this.vox[layerId].delete(k);
  }

  _growEnvelope(places) {
    for (const p of places) {
      const b = Geom.worldBox(p);
      if (b) this._growEnvelopeBox(b);
    }
  }
  _growEnvelopeBox(b) {
    if (!this.envelope) { this.envelope = { min: b.min.slice(), max: b.max.slice() }; return; }
    for (let i = 0; i < 3; i++) {
      if (b.min[i] < this.envelope.min[i]) this.envelope.min[i] = b.min[i];
      if (b.max[i] > this.envelope.max[i]) this.envelope.max[i] = b.max[i];
    }
  }

  // ─────────────────────────────────────────────────────────── output
  surface(x, z) { return surfaceAt(this.site.places, x, z); }

  toScene() {
    const s = new N.Scene(this.name);
    for (const p of this.site.places) {
      s.add({ part: p.part, color: p.color, pos: p.pos, mat: p.mat,
              vignette: p.layer, strategy: p.role, zone: LAYER_BY_ID.get(p.layer).order + 1,
              asm: p.asm });
    }
    return s;
  }

  toMPD(opts) { return toMPD(this, opts); }
  audit() { return audit(this); }

  /**
   * Measurement lives in NabugoKits and nowhere else: the kit and we are
   * measured by one function or the comparison is a lie.
   */
  measure() {
    const K = global.NabugoKits;
    if (!K || typeof K.measurePlacements !== 'function') {
      return { label: this.name, pieces: this.site.places.length, axes: null, gates: null,
               raw: null, note: 'NabugoKits not loaded — no axis vector' };
    }
    return K.measurePlacements(this.site.places, { label: this.name });
  }
}

function overlaps(a, b) {
  return a.min[0] < b.max[0] && a.max[0] > b.min[0] &&
         a.min[1] < b.max[1] && a.max[1] > b.min[1] &&
         a.min[2] < b.max[2] && a.max[2] > b.min[2];
}

// ═══════════════════════════════════════════════════════════════ generators
/**
 * Every generator takes (build, opts) and returns Placement[] around
 * opts.at — default {x:0,z:0}, so a generator called bare returns a block in
 * local coordinates and the caller positions it. None of them place anything:
 * the caller hands the result to Build.place, which is the only way in.
 */
const GROUND_TOP = -4;          // top surface of a baseplate laid on y = 0

const SITE = {
  /** The plot. One baseplate; the legal extent of everything that follows. */
  plate(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const id = o.part || VOCAB.ground[0];
    const p = at(id, at0.x, at0.z, 0, { color: o.color == null ? 2 : o.color, role: 'plot' });
    if (p) b.site.claims.push({ x: at0.x, z: at0.z, w: 320, d: 320, label: 'plot' });
    return p ? [p] : [];
  },
  /** The water line. Blue plates at the ground plane, never above one course. */
  shoreline(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const id = o.part || VOCAB.water[0];
    const out = [];
    for (let i = 0; i < (o.n || 1); i++) {
      out.push(at(id, at0.x, at0.z + i * (o.pitch || 80), GROUND_TOP, { color: 1, role: 'water' }));
    }
    return out.filter(Boolean);
  },
  /** Made ground: the tan apron between the water and the frame. */
  plot(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const kit = o.parts || [VOCAB.plate['2x3'], VOCAB.plate['1x3'], VOCAB.plate['2x3']];
    const out = [];
    for (let i = 0; i < (o.n || 1); i++) {
      out.push(at(kit[i % kit.length], at0.x, at0.z + i * (o.pitch || 60), GROUND_TOP,
                  { color: 19, role: 'apron' }));
    }
    return out.filter(Boolean);
  }
};

const STRUCTURE = {
  /**
   * A frame: a ring of walls `studs` across and `courses` high, with an opening
   * left in two named sides. The openings are the whole point — SERVICES cuts a
   * door into a hole STRUCTURE already left, and never into the frame itself.
   */
  frame(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const studs = o.studs || 6, courses = o.courses || 3, col = o.color == null ? 71 : o.color;
    const half = studs * STUD / 2;
    const x0 = at0.x - half, x1 = at0.x + half, z0 = at0.z - half, z1 = at0.z + half;
    const yaw = Geom.rotY(90);
    const long = VOCAB.brick['1x' + studs] || VOCAB.brick['1x6'];
    const short = VOCAB.brick['1x' + (studs - 2)] || VOCAB.brick['1x4'];
    const base = o.y == null ? GROUND_TOP : o.y;
    const out = [];
    for (let c = 0; c < courses; c++) {
      const y = base - c * BRICK;
      // north: always solid, it is the wall everything else is measured from
      out.push(at(long, at0.x, z0 + 10, y, { color: col, role: 'wall-n' }));
      // south: a door-height gap in the lower courses
      if (c < courses - 1 && o.door !== false) {
        out.push(at(VOCAB.brick['1x2'], x0 + 20, z1 - 10, y, { color: col, role: 'wall-s' }));
        out.push(at(VOCAB.brick['1x2'], x1 - 20, z1 - 10, y, { color: col, role: 'wall-s' }));
      } else {
        out.push(at(long, at0.x, z1 - 10, y, { color: col, role: 'lintel' }));
      }
      // west: solid; east: a window gap in the upper courses
      out.push(at(short, x0 + 10, at0.z, y, { mat: yaw, color: col, role: 'wall-w' }));
      if (c > 0 && o.window !== false) {
        // The east run is studs-2 long because the north and south walls own the
        // corners; a 2-stud window in a 4-stud run leaves exactly one stud a side.
        out.push(at(VOCAB.brick['1x1'], x1 - 10, at0.z - 30, y, { mat: yaw, color: col, role: 'wall-e' }));
        out.push(at(VOCAB.brick['1x1'], x1 - 10, at0.z + 30, y, { mat: yaw, color: col, role: 'wall-e' }));
      } else {
        out.push(at(short, x1 - 10, at0.z, y, { mat: yaw, color: col, role: 'wall-e' }));
      }
    }
    // The ceiling is STRUCTURE, not SKIN: it is the floor of whatever comes next.
    const lid = VOCAB.plate[studs + 'x' + studs] || VOCAB.plate['6x6'];
    out.push(at(lid, at0.x, at0.z, (o.y == null ? GROUND_TOP : o.y) - courses * BRICK,
                { color: o.deckColor == null ? 72 : o.deckColor, role: 'ceiling' }));
    return out.filter(Boolean);
  },

  /** A bay: one repeated structural cell. The low road builds the same bay again. */
  bay(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const col = o.color == null ? 71 : o.color;
    const courses = o.courses || 3;
    // Three courses, three different bricks: a wall built of one part repeated
    // is the shape our vocabulary ratio of 0.038 actually had.
    const stack = o.stack || [VOCAB.brick['1x6'], VOCAB.brick['1x3'], VOCAB.brick['1x6']];
    const out = [];
    for (let c = 0; c < courses; c++) {
      out.push(at(stack[c % stack.length], at0.x, at0.z, GROUND_TOP - c * BRICK,
                  { color: col, role: 'bay' }));
    }
    return out.filter(Boolean);
  },

  /** A spine: a run of frame along one axis, the thing a quay is built against. */
  spine(b, o = {}) { return STRUCTURE.bay(b, o); },

  /**
   * A quay: the structural apron a deck steps down to. Four different plate
   * staples rather than one repeated, because a frame made of a single part is
   * where our vocabulary ratio of 0.038 came from.
   */
  quay(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? GROUND_TOP : o.y;
    const col = o.color == null ? 72 : o.color;
    const kit = [[VOCAB.plate['2x8'], 0, 0, 0], [VOCAB.plate['2x6'], 0, 60, 0],
                 [VOCAB.plate['6x6'], 140, 20, 0], [VOCAB.plate['2x3'], -40, 120, 90],
                 [VOCAB.plate['4x4'], 40, 120, 0], [VOCAB.plate['1x6'], -120, 60, 90],
                 [VOCAB.plate['2x2'], -120, -60, 180]];
    return kit.map(([id, dx, dz, yaw]) => at(id, at0.x + dx, at0.z + dz, y,
                                             { mat: yaw ? Geom.rotY(yaw) : Geom.IDENT.slice(),
                                               color: col, role: 'quay' }))
              .filter(Boolean);
  },

  /** A leg: a two-brick pier stack. Tier B — 2 parts, and it earns its block by
   *  being used four times under one deck. */
  leg(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const out = [];
    for (let c = 0; c < (o.courses || 2); c++) {
      out.push(at(VOCAB.brick['1x1'], at0.x, at0.z, GROUND_TOP - c * BRICK,
                  { color: o.color == null ? 72 : o.color, role: 'leg' }));
    }
    return out.filter(Boolean);
  }
};

/**
 * Mount a part on a host's side stud. This is the whole of SNOT: the offsets are
 * exact half-widths (10 LDU out to the side-stud face, then the 8 LDU of plate
 * body), and the matrix is one of the four that turn a plate's underside to face
 * a wall. `1 0 0  0 0 -1  0 1 0` is the commonest SNOT matrix in the corpus.
 */
const SIDE_MOUNT = {
  '5': { axis: 2, sign: 1,  mat: [1,0,0, 0,0,-1, 0,1,0] },   // stud faces -Z
  '4': { axis: 2, sign: -1, mat: [1,0,0, 0,0,1, 0,-1,0] },   // stud faces +Z
  '1': { axis: 0, sign: 1,  mat: [0,1,0, -1,0,0, 0,0,1] },   // stud faces -X
  '0': { axis: 0, sign: -1, mat: [0,-1,0, 1,0,0, 0,0,1] }    // stud faces +X
};
function mountOnSideStuds(host, parts, color, limit) {
  const ids = Array.isArray(parts) ? parts : [parts];
  const out = [];
  for (const [type, w, axis] of worldPorts(host)) {
    if (type !== 0 || !HORIZONTAL_AXES.has(axis)) continue;
    const rule = SIDE_MOUNT[String(axis)];
    if (!rule) continue;
    const id = ids[out.length % ids.length];
    const part = Catalog.get(id);
    if (!part) continue;
    const pl = at(id, w[0], w[2], 0, { mat: rule.mat, color, role: 'snot' });
    if (!pl) continue;
    const rb = rotBox(part, rule.mat);
    pl.pos[1] = w[1] - (rb.min[1] + rb.max[1]) / 2;
    alignFace(pl, rule.axis, rule.sign, w[rule.axis]);
    out.push(pl);
    if (limit && out.length >= limit) break;
  }
  return out;
}

const SKIN = {
  /**
   * The banded course: side-stud anchors all round the frame's head, with the
   * cladding mounted on their side studs. Studs-off-vertical lives here and
   * nowhere else.
   */
  cladding(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const studs = o.studs || 6, y = o.y == null ? -84 : o.y;
    const half = studs * STUD / 2;
    const col = o.color == null ? 15 : o.color, clad = o.cladColor == null ? 4 : o.cladColor;
    const hosts = [];
    // north and south: a 4-stud side-stud brick flanked by two 1x1 two-siders
    hosts.push(at(VOCAB.snot.side1x4, at0.x, at0.z - half + 10, y, { color: col, role: 'anchor' }));
    hosts.push(at(VOCAB.snot.side1x4, at0.x, at0.z + half - 10, y,
                  { mat: Geom.rotY(180), color: col, role: 'anchor' }));
    for (const sx of [-1, 1]) {
      hosts.push(at(VOCAB.snot.two1x1, at0.x + sx * (half - 10), at0.z - half + 10, y,
                    { color: col, role: 'anchor' }));
      hosts.push(at(VOCAB.snot.two1x1, at0.x + sx * (half - 10), at0.z + half - 10, y,
                    { color: col, role: 'anchor' }));
    }
    hosts.push(at(VOCAB.snot.side1x4, at0.x - half + 10, at0.z, y,
                  { mat: Geom.rotY(90), color: col, role: 'anchor' }));
    hosts.push(at(VOCAB.snot.side1x4, at0.x + half - 10, at0.z, y,
                  { mat: Geom.rotY(270), color: col, role: 'anchor' }));
    const out = [];
    for (const h of hosts.filter(Boolean)) {
      out.push(h);
      out.push(...mountOnSideStuds(h, o.clad || [VOCAB.plate['1x1r'], VOCAB.tile['1x1'],
                                                 VOCAB.snot.headlight],
                                   clad, o.perHost || 2));
    }
    return out;
  },

  /** Two rows of slope facing out; the middle strip stays open. A skylight is
   *  uncommitted volume, which is the cheapest scenario buffer there is. */
  roof(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const studs = o.studs || 6, y = o.y == null ? -108 : o.y;
    const half = studs * STUD / 2, col = o.color == null ? 4 : o.color;
    const out = [];
    for (const [sz, mat] of [[-1, Geom.IDENT.slice()], [1, Geom.rotY(180)]]) {
      out.push(at(VOCAB.slope['45_2x4'], at0.x, at0.z + sz * (half - 20), y,
                  { mat, color: col, role: 'roof' }));
      if (o.ends === false) continue;
      for (const sx of [-1, 1]) {
        out.push(at(VOCAB.slope['45_2x1'], at0.x + sx * (half - 10), at0.z + sz * (half - 20), y,
                    { mat, color: col, role: 'roof' }));
      }
    }
    return out.filter(Boolean);
  },

  /**
   * A nose: round stock stacked. `cap:false` stops before the cone ring so the
   * substituted colour band can take the course in between — the cap has to be
   * placed after the band, or it has nothing under it and the settle drops it.
   */
  nose(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const out = [];
    let y = o.y == null ? GROUND_TOP : o.y;
    const drum = Catalog.get(VOCAB.round['4x4']);
    for (let c = 0; c < (o.courses == null ? 2 : o.courses); c++) {
      out.push(at(VOCAB.round['4x4'], at0.x, at0.z, y, { color: o.color == null ? 15 : o.color, role: 'drum' }));
      y -= advance(drum);
    }
    if (o.cap === false) return out.filter(Boolean);
    const capY = o.capY == null ? y : o.capY;
    out.push(...b.ring({ x: at0.x, z: at0.z }, 30, 4, VOCAB.round['1x1cone'],
                       { y: capY, color: o.tipColor == null ? 14 : o.tipColor }));
    out.push(at(VOCAB.round['dish2x2'], at0.x, at0.z, capY,
                { color: o.tipColor == null ? 14 : o.tipColor, role: 'tip' }));
    return out.filter(Boolean);
  },

  /**
   * A colour band, made by SUBSTITUTING the part at that course — four corner
   * rounds in place of a drum, outer diameter unchanged. Recolouring in place
   * would be a lie about how a real model gets a stripe.
   */
  band(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? -52 : o.y, col = o.color == null ? 4 : o.color;
    const out = [];
    let i = 0;
    for (const [dx, dz] of [[-10, -10], [10, -10], [10, 10], [-10, 10]]) {
      out.push(at(VOCAB.round.corner, at0.x + dx, at0.z + dz, y,
                  { mat: Geom.rotY(90 * i++), color: col, role: 'band' }));
    }
    return out.filter(Boolean);
  },

  /**
   * Paving: a tile field laid from a plan of [part, dx, dz, yaw]. Courses are
   * left bare on purpose where SERVICES has to land — a deck tiled edge to edge
   * is a deck the fast layer cannot be bolted to.
   */
  paving(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? -60 : o.y;
    const plan = o.plan || SKIN.DECK_FIELD;
    return plan.map(([id, dx, dz, yaw, col]) =>
      at(id, at0.x + dx, at0.z + dz, y,
         { mat: yaw ? Geom.rotY(yaw) : Geom.IDENT.slice(),
           color: col == null ? (o.color == null ? 72 : o.color) : col, role: 'paving' }))
      .filter(Boolean);
  },

  /** The 6x6 deck field: two of five courses left bare for SERVICES. */
  DECK_FIELD: [
    [VOCAB.tile.grille, -40, -50, 0, 72], [VOCAB.tile.grille, 0, -50, 0, 72],
    [VOCAB.tile.grille, 40, -50, 0, 72],
    [VOCAB.tile['1x6'], 0, -30, 0, 15],
    [VOCAB.tile['1x1'], -50, 50, 0, 4], [VOCAB.slope['31_1x1'], -30, 50, 0, 4],
    [VOCAB.tile['1x2'], 0, 50, 0, 15], ['3068a', 50, 50, 0, 19]
  ],

  /** The apron strip: three plates, three different tiles, three yaws. */
  APRON_FIELD: [
    [VOCAB.tile['1x4'], 0, 0, 90, 15], [VOCAB.tile['1x1'], 0, 60, 0, 4],
    [VOCAB.round['1x1brick'], -20, 60, 0, 4], [VOCAB.round['1x1brick'], 20, 60, 0, 15],
    [VOCAB.tile.grille, 0, 120, 90, 72]
  ]
};

const SERVICES = {
  /** A window or a door, dropped into a hole the frame already left. */
  opening(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const pl = at(o.part || VOCAB.services.window, at0.x, at0.z, o.y == null ? GROUND_TOP : o.y,
                  { mat: o.mat, color: o.color == null ? 47 : o.color, role: 'opening' });
    return pl ? [pl] : [];
  },

  /**
   * A posed joint. 10174 poses its hinges at 63.0 degrees and 45; an axis-
   * aligned hinge is a hinge nobody has moved, and AX-POSE measures exactly the
   * difference.
   */
  hingeJoint(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? -60 : o.y;
    const POSE63 = [1,0,0, 0,0.454,-0.891, 0,0.891,0.454];
    const POSE45 = [1,0,0, 0,0.707,0.707, 0,-0.707,0.707];
    const base = at(VOCAB.services.hingeBase, at0.x, at0.z, y, { color: 71, role: 'hinge-base' });
    const out = [base];
    const top = at(VOCAB.services.hingeTop, at0.x, at0.z + 20, 0,
                   { mat: o.angle === 45 ? POSE45 : POSE63, color: 0, role: 'hinge-top' });
    if (top) { top.pos[1] = y - 22; out.push(top); }
    // A second joint at 45, so the block carries two angles rather than one.
    out.push(at(VOCAB.services.hingePlate, at0.x, at0.z, y,
                { mat: POSE45, color: 72, role: 'hinge-plate' }));
    return out.filter(Boolean);
  },

  /** A clip rail: brackets along an edge, the layer a fitting bolts onto. */
  clipRail(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? -60 : o.y, out = [];
    for (let i = 0; i < (o.n || 2); i++) {
      out.push(at(VOCAB.services.bracket, at0.x + i * (o.pitch || 80), at0.z, y,
                  { mat: i % 2 ? Geom.rotY(180) : Geom.IDENT.slice(), color: 71, role: 'rail' }));
    }
    // A turntable and a hinge brick: two more fittings that wear out and must
    // stay reachable, and two more parts in the vocabulary. `fittings` names a
    // clear anchor because a 4-stud bracket leaves no room beside itself.
    if (o.fittings) {
      out.push(at(VOCAB.services.turntable, o.fittings.x, o.fittings.z, o.fittingY == null ? y : o.fittingY,
                  { color: 0, role: 'fitting' }));
      out.push(at(VOCAB.services.hingeBrickDual, o.fittings.x + 60, o.fittings.z,
                  o.fittingY == null ? y : o.fittingY, { mat: Geom.rotY(90), color: 71, role: 'fitting' }));
      out.push(at(VOCAB.services.hingeBrickSingle, o.fittings.x - 60, o.fittings.z,
                  o.fittingY == null ? y : o.fittingY, { mat: Geom.rotY(270), color: 71, role: 'fitting' }));
      out.push(at(VOCAB.services.hingeTile, o.fittings.x, o.fittings.z + 40,
                  o.fittingY == null ? y : o.fittingY, { color: 0, role: 'fitting' }));
    }
    return out.filter(Boolean);
  },

  /** A leaning mast: bar stock posed off-axis, the way a ladder rests on a wall. */
  ladder(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const POSE = [1,0,0, 0,0.866,-0.5, 0,0.5,0.866];
    const pl = at(o.part || VOCAB.services.antenna, at0.x, at0.z, o.y == null ? GROUND_TOP : o.y,
                  { mat: POSE, color: 0, role: 'ladder' });
    const out = pl ? [pl] : [];
    for (let i = 0; i < (o.masts || 1); i++) {
      out.push(at(VOCAB.services.antenna, at0.x + 40 + i * 40, at0.z, o.y == null ? GROUND_TOP : o.y,
                  { color: 0, role: 'mast' }));
    }
    // A handrail: bar stock, the fourth SERVICES family and the one that says
    // somebody climbs this.
    out.push(at('2486', at0.x - 40, at0.z + 40, o.y == null ? GROUND_TOP : o.y,
                { mat: Geom.rotY(90), color: 72, role: 'handrail' }));
    return out.filter(Boolean);
  }
};

const SPACE = {
  /** An interior partition: one plate course inside the envelope, nothing structural. */
  partition(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? -12 : o.y, out = [];
    const run = o.run || [VOCAB.plate['1x2'], VOCAB.plate['1x4']];
    for (let i = 0; i < (o.n || 3); i++) {
      out.push(at(run[i % run.length], at0.x, at0.z + i * (o.pitch || 20), y,
                  { color: 71, role: 'partition' }));
    }
    return out.filter(Boolean);
  },
  /** A floor inside a room the frame already enclosed. */
  deck(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const pl = at(o.part || VOCAB.plate['4x4'], at0.x, at0.z, o.y == null ? GROUND_TOP : o.y,
                  { color: 19, role: 'floor' });
    return pl ? [pl] : [];
  },
  /** Circulation: the route between the door and the quay, read as tile. */
  circulation(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const out = [];
    const step = o.step || [VOCAB.tile['1x1'], '3024'];
    for (let i = 0; i < (o.n || 4); i++) {
      out.push(at(step[i % step.length], at0.x, at0.z + i * (o.pitch || 30),
                  o.y == null ? GROUND_TOP : o.y, { color: 19, role: 'path' }));
    }
    return out.filter(Boolean);
  }
};

const STUFF = {
  /** A figure, from the corrected skeleton. One assembly, so it can walk away. */
  minifig(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const anchor = o.y == null ? GROUND_TOP : o.y;
    const S = MINIFIG_SKELETON;
    const cols = { head: 14, torso: o.torso == null ? 4 : o.torso, armL: o.torso == null ? 4 : o.torso,
                   armR: o.torso == null ? 4 : o.torso, hips: 1, legL: 1, legR: 1 };
    const out = [];
    if (o.hands !== false) {
      for (const sx of [-1, 1]) {
        out.push({ part: VOCAB.stuff.hand, color: 14,
                   pos: [at0.x + sx * 19, anchor - 34, at0.z + 6],
                   mat: (sx < 0 ? Geom.rotY(20) : Geom.rotY(-20)),
                   lpos: null, lmat: null, parent: null, depth: 1, layer: 'UNASSIGNED',
                   asm: null, role: 'figure', module: 'minifig' });
      }
    }
    for (const key of ['head', 'torso', 'armL', 'armR', 'hips', 'legL', 'legR']) {
      const bone = S[key];
      const part = Catalog.get(bone.part);
      if (!part) continue;
      const mat = (bone.mat || Geom.IDENT).slice();
      out.push({ part: bone.part, color: cols[key],
                 pos: [at0.x + bone.x, anchor + bone.dy, at0.z], mat,
                 lpos: null, lmat: null, parent: null, depth: 1, layer: 'UNASSIGNED',
                 asm: null, role: 'figure', module: 'minifig' });
    }
    return settleGroup(out, anchor);
  },

  /** A vehicle: chassis, wheel plates, rims and tyres, resting on its own tyres. */
  vehicle(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const col = o.color == null ? 1 : o.color;
    const out = [];
    out.push(at(VOCAB.stuff.chassis, at0.x, at0.z, -36, { color: col, role: 'chassis' }));
    for (const dx of [-20, 20]) {
      out.push(at(VOCAB.stuff.wheelPlate, at0.x + dx, at0.z, -36,
                  { mat: Geom.rotY(90), color: 72, role: 'axle' }));
      for (const dz of [-34, 34]) {
        out.push(at(VOCAB.stuff.wheelRim, at0.x + dx, at0.z + dz, 0, { centreY: -22, color: 7, role: 'rim' }));
        out.push(at(VOCAB.stuff.tyre, at0.x + dx, at0.z + dz, 0, { centreY: -22, color: 0, role: 'tyre' }));
      }
    }
    out.push(at(VOCAB.tile['1x2'], at0.x, at0.z, -44, { color: 15, role: 'seat' }));
    out.push(at('48336', at0.x - 30, at0.z, -44, { mat: Geom.rotY(90), color: 72, role: 'grab' }));
    out.push(at('4623', at0.x + 30, at0.z, -44, { mat: Geom.rotY(270), color: 72, role: 'grab' }));
    return settleGroup(out.filter(Boolean), GROUND_TOP);
  },

  /** Props: the things a place has because someone lives there. */
  prop(b, o = {}) {
    const at0 = o.at || { x: 0, z: 0 };
    const y = o.y == null ? GROUND_TOP : o.y;
    return [at(VOCAB.stuff.flag, at0.x, at0.z, y, { color: 4, role: 'flag' }),
            at(VOCAB.stuff.plant, at0.x + 40, at0.z, y, { color: 2, role: 'plant' }),
            at('11055', at0.x - 40, at0.z, y, { mat: Geom.rotY(180), color: 14, role: 'flag' })].filter(Boolean);
  }
};

/** Drop a rigid group until its lowest point rests on `surfaceY`, on the 4 LDU grid. */
function settleGroup(places, surfaceY) {
  let low = -Infinity;
  for (const p of places) {
    const bx = Geom.worldBox(p);
    if (bx && bx.max[1] > low) low = bx.max[1];
  }
  if (!Number.isFinite(low)) return places;
  const dy = snap(surfaceY - low, 4);
  for (const p of places) p.pos[1] += dy;
  return places;
}

// ══════════════════════════════════════════════════════════════════ the pass
/** Local bbox of a definition, in its own frame. */
function defExtent(def) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of def.places) {
    const b = Geom.worldBox(p);
    if (!b) continue;
    for (let i = 0; i < 3; i++) {
      if (b.min[i] - def.origin[i] < min[i]) min[i] = b.min[i] - def.origin[i];
      if (b.max[i] - def.origin[i] > max[i]) max[i] = b.max[i] - def.origin[i];
    }
  }
  for (let i = 0; i < 3; i++) { if (!Number.isFinite(min[i])) min[i] = 0; if (!Number.isFinite(max[i])) max[i] = 0; }
  return { min, max };
}

/**
 * Re-instance a def shifted by (dx,dz) from where its prototype stands.
 * `instance` takes the world position of the definition's origin, which is the
 * LDraw semantic and the wrong thing to hand a bare delta to — doing that once
 * put a second minifig inside the beacon.
 */
function shiftInstance(b, defId, dx, dz, mat) {
  const def = b.defs.get(defId);
  if (!def) return { ok: false, parts: 0, refused: ['no such assembly'] };
  return b.instance(defId, [def.origin[0] + dx, def.origin[1], def.origin[2] + dz],
                    mat || Geom.IDENT.slice());
}

/** Re-instance a def turned through 180 degrees, centred on a new spot. */
function turnInstance(b, defId, centre) {
  const def = b.defs.get(defId);
  if (!def) return { ok: false, parts: 0, refused: ['no such assembly'] };
  const e = defExtent(def);
  const c = [(e.min[0] + e.max[0]) / 2, 0, (e.min[2] + e.max[2]) / 2];
  return b.instance(defId, [centre.x + c[0], 0, centre.z + c[2]], Geom.rotY(180));
}

/**
 * Run one layer's generation pass. Opens the layer, generates, closes it, and
 * reports what was placed, what was refused and which constraint refused it.
 */
function pass(building, layerId, rng) {
  const b = building;
  const r = rng || b.rng;
  const spec = b.openLayer(layerId);
  const before = b.site.places.length;
  const refused = [];
  const byGen = {};
  const run = (name, places, opts) => {
    const res = b.place(places, opts || {});
    byGen[name] = (byGen[name] || 0) + res.parts;
    for (const why of res.refused) refused.push({ gen: name, why });
    return res;
  };
  const P = b.plan;

  if (layerId === 'SITE') {
    run('plate', SITE.plate(b, { at: P.origin, part: P.ground }));
    run('shoreline', SITE.shoreline(b, { at: P.water, part: VOCAB.water[1], n: 1 }));
    run('plot', SITE.plot(b, { at: P.apron, n: 3, pitch: 60 }));

  } else if (layerId === 'STRUCTURE') {
    const shell = b.asm('hut shell', bb => {
      run('frame', STRUCTURE.frame(bb, { at: P.huts[0], studs: P.hutStuds, courses: P.courses }));
    });
    const turned = turnInstance(b, shell, P.huts[1]);
    byGen.frame = (byGen.frame || 0) + turned.parts;
    for (const why of turned.refused || []) refused.push({ gen: 'frame-instance', why });
    // Tier B: a two-brick pier, cut once and used at all four deck corners.
    const legPitch = (P.deckStuds - 1) * STUD / 2;
    const legDef = b.asm('pier leg', bb => {
      run('leg', STRUCTURE.leg(bb, { at: { x: P.deck.x - legPitch, z: P.deck.z - legPitch } }));
    });
    for (const [sx, sz] of [[1, -1], [-1, 1], [1, 1]]) {
      const res = shiftInstance(b, legDef, (sx + 1) * legPitch, (sz + 1) * legPitch);
      byGen.leg = (byGen.leg || 0) + res.parts;
      for (const why of res.refused || []) refused.push({ gen: 'leg-instance', why });
    }
    run('deck', [at(VOCAB.plate['6x6'], P.deck.x, P.deck.z, GROUND_TOP - 2 * BRICK,
                    { color: 72, role: 'deck' })]);
    run('spine', STRUCTURE.spine(b, { at: P.spine, courses: 3 }));
    run('quay', STRUCTURE.quay(b, { at: P.quay, y: GROUND_TOP }));
    run('boathouse', STRUCTURE.frame(b, { at: P.boathouse, studs: 6, courses: 3,
                                          y: P.quayTop, color: 70, deckColor: 72 }));

  } else if (layerId === 'SKIN') {
    const crown = b.asm('hut crown', bb => {
      run('cladding', SKIN.cladding(bb, { at: P.huts[0], studs: P.hutStuds,
                                          y: GROUND_TOP - P.courses * BRICK - PLATE }),
          { selfClash: false });
      run('roof', SKIN.roof(bb, { at: P.huts[0], studs: P.hutStuds,
                                  y: GROUND_TOP - P.courses * BRICK - PLATE - BRICK }));
    });
    // The open middle of each roof is not a gap, it is a reservation: a future
    // storey goes there, and no layer may fill it in the meantime.
    for (const h of P.huts) {
      b.reserve({ min: [h.x - 60, GROUND_TOP - 8 * BRICK, h.z - 19],
                  max: [h.x + 60, GROUND_TOP - 5 * BRICK - 12, h.z + 19] }, 'future storey over ' +
                Math.round(h.x) + ',' + Math.round(h.z));
    }
    const turned = turnInstance(b, crown, P.huts[1]);
    byGen.cladding = (byGen.cladding || 0) + turned.parts;
    for (const why of turned.refused || []) refused.push({ gen: 'crown-instance', why });
    b.asm('beacon', bb => {
      // The drum, then a course of corner rounds SUBSTITUTED for a drum at the
      // banded height — same outer diameter, different part — then the cap.
      run('nose', SKIN.nose(bb, { at: P.beacon, courses: 2, y: GROUND_TOP, cap: false }),
          { selfClash: false });
      run('band', SKIN.band(bb, { at: P.beacon, y: GROUND_TOP - 2 * BRICK }), { selfClash: false });
      run('cap', SKIN.nose(bb, { at: P.beacon, courses: 0, capY: GROUND_TOP - 3 * BRICK }),
          { selfClash: false });
    });
    run('paving', SKIN.paving(b, { at: P.deck, y: GROUND_TOP - 2 * BRICK - PLATE,
                                   plan: SKIN.DECK_FIELD }));
    run('paving', SKIN.paving(b, { at: P.apron, y: GROUND_TOP - PLATE, plan: SKIN.APRON_FIELD }));
    run('boathouseRoof', SKIN.roof(b, { at: P.boathouse, studs: 6,
                                        y: P.quayTop - 3 * BRICK - PLATE, color: 0 }));

  } else if (layerId === 'SERVICES') {
    for (const o of P.openings) {
      run('opening', SERVICES.opening(b, { at: o, y: o.y, mat: o.mat }));
    }
    const hinge = b.asm('hinge joint', bb => {
      run('hingeJoint', SERVICES.hingeJoint(bb, { at: P.hinge, y: P.deckTop }), { selfClash: false });
    });
    for (let i = 1; i <= 2; i++) {
      const res = shiftInstance(b, hinge, i * 40, 0);
      byGen.hingeJoint = (byGen.hingeJoint || 0) + res.parts;
      for (const why of res.refused || []) refused.push({ gen: 'hinge-instance', why });
    }
    run('clipRail', SERVICES.clipRail(b, { at: P.rail, y: P.spineTop, n: 2, pitch: 80,
                                           fittings: P.fittings, fittingY: GROUND_TOP - PLATE }));
    run('ladder', SERVICES.ladder(b, { at: P.ladder, y: P.ladderY, masts: 1 }));

  } else if (layerId === 'SPACE') {
    for (const h of P.huts) run('deck', SPACE.deck(b, { at: h, y: GROUND_TOP }));
    run('deck', SPACE.deck(b, { at: P.boathouse, y: P.quayTop }));
    run('partition', SPACE.partition(b, { at: { x: P.huts[0].x, z: P.huts[0].z - 30 },
                                          y: GROUND_TOP - PLATE, n: 4, pitch: 20 }));
    run('circulation', SPACE.circulation(b, { at: P.path, y: GROUND_TOP, n: 6, pitch: 30 }));

  } else if (layerId === 'STUFF') {
    const deckSurface = b.surface(P.figures[0].x, P.figures[0].z);
    const fig = b.asm('figure', bb => {
      run('minifig', STUFF.minifig(bb, { at: P.figures[0],
                                         y: deckSurface == null ? GROUND_TOP : deckSurface, torso: 4 }),
          { atomic: true, selfClash: false, requireSupport: false });
    }, { kind: 'figure' });
    const res = shiftInstance(b, fig, P.figures[1].x - P.figures[0].x, P.figures[1].z - P.figures[0].z);
    byGen.minifig = (byGen.minifig || 0) + res.parts;
    for (const why of res.refused || []) refused.push({ gen: 'figure-instance', why });
    b.asm('runabout', bb => {
      run('vehicle', STUFF.vehicle(bb, { at: P.yard }),
          { atomic: true, selfClash: false, requireSupport: false });
    }, { kind: 'vehicle' });
    const propSurface = b.surface(P.prop.x, P.prop.z);
    run('prop', STUFF.prop(b, { at: P.prop, y: propSurface == null ? GROUND_TOP : propSurface }));
  }

  const placed = b.site.places.length - before;
  const close = b.closeLayer();
  return { layer: layerId, clock: spec.clock, placed, byGenerator: byGen,
           refused, refusedCount: refused.length, share: close.share,
           occupancy: close.occupancy, ceiling: close.ceiling, ok: close.ok, why: close.why };
}

// ═══════════════════════════════════════════════════════════════════ audit
/**
 * The trapped-layer test, run for real. Voxelise the envelope, mark the slow
 * layers (SITE, STRUCTURE, SKIN) as wall, flood-fill the air in from outside the
 * padded boundary, and then ask of every fast-layer part whether any voxel it
 * occupies or touches was reached. A hinge nobody can get at is a hinge that
 * fails at 7-15 years inside a frame that lasts 300, which is the exact failure
 * How Buildings Learn is about.
 */
function trappedFast(building) {
  const places = building.site.places;
  if (!places.length || !building.envelope) return [];
  const env = building.envelope;
  const pad = 2;
  const lo = [Math.floor(env.min[0] / VOX[0]) - pad, Math.floor(env.min[1] / VOX[1]) - pad,
              Math.floor(env.min[2] / VOX[2]) - pad];
  const hi = [Math.ceil(env.max[0] / VOX[0]) + pad, Math.ceil(env.max[1] / VOX[1]) + pad,
              Math.ceil(env.max[2] / VOX[2]) + pad];
  const dim = [hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1];
  const n = dim[0] * dim[1] * dim[2];
  if (n <= 0 || n > 4e6) return [];
  const idx = (i, j, k) => ((i - lo[0]) * dim[1] + (j - lo[1])) * dim[2] + (k - lo[2]);
  const wall = new Uint8Array(n), seen = new Uint8Array(n);

  const slow = new Set(['SITE', 'STRUCTURE', 'SKIN']);
  const cells = [];
  for (const p of places) {
    const box = Geom.worldBox(p);
    if (!box) { cells.push(null); continue; }
    const [ax, bx] = voxRange(box.min[0], box.max[0], VOX[0]);
    const [ay, by] = voxRange(box.min[1], box.max[1], VOX[1]);
    const [az, bz] = voxRange(box.min[2], box.max[2], VOX[2]);
    const own = [];
    for (let i = ax; i <= bx; i++) for (let j = ay; j <= by; j++) for (let k = az; k <= bz; k++) {
      if (i < lo[0] || i > hi[0] || j < lo[1] || j > hi[1] || k < lo[2] || k > hi[2]) continue;
      own.push([i, j, k]);
      if (slow.has(p.layer)) wall[idx(i, j, k)] = 1;
    }
    cells.push(own);
  }

  // flood the air, six-connected, from the padded boundary inwards
  const queue = [];
  for (let i = lo[0]; i <= hi[0]; i++) for (let j = lo[1]; j <= hi[1]; j++) for (let k = lo[2]; k <= hi[2]; k++) {
    if (i !== lo[0] && i !== hi[0] && j !== lo[1] && j !== hi[1] && k !== lo[2] && k !== hi[2]) continue;
    const q = idx(i, j, k);
    if (wall[q] || seen[q]) continue;
    seen[q] = 1; queue.push([i, j, k]);
  }
  const NB = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
  for (let h = 0; h < queue.length; h++) {
    const [i, j, k] = queue[h];
    for (const [di, dj, dk] of NB) {
      const a = i + di, c = j + dj, e = k + dk;
      if (a < lo[0] || a > hi[0] || c < lo[1] || c > hi[1] || e < lo[2] || e > hi[2]) continue;
      const q = idx(a, c, e);
      if (wall[q] || seen[q]) continue;
      seen[q] = 1; queue.push([a, c, e]);
    }
  }

  const out = [];
  places.forEach((p, n2) => {
    if (slow.has(p.layer) || p.layer === 'UNASSIGNED') return;
    const own = cells[n2];
    if (!own || !own.length) return;
    let reachable = false;
    for (const [i, j, k] of own) {
      if (seen[idx(i, j, k)]) { reachable = true; break; }
      for (const [di, dj, dk] of NB) {
        const a = i + di, c = j + dj, e = k + dk;
        if (a < lo[0] || a > hi[0] || c < lo[1] || c > hi[1] || e < lo[2] || e > hi[2]) continue;
        if (seen[idx(a, c, e)]) { reachable = true; break; }
      }
      if (reachable) break;
    }
    if (!reachable) {
      out.push({ part: p.part, layer: p.layer, pos: p.pos.slice(), parent: p.parent,
                 why: p.layer + ' part sealed inside SITE/STRUCTURE/SKIN with no path to the air' });
    }
  });
  return out;
}

/** Per layer: share, buffer, and whether a fast layer is trapped in a slow one. */
function audit(building) {
  const places = building.site.places;
  const total = places.length || 1;
  const byLayer = new Map();
  for (const p of places) byLayer.set(p.layer, (byLayer.get(p.layer) || 0) + 1);

  const layers = LAYERS.map(spec => {
    const parts = byLayer.get(spec.id) || 0;
    const share = parts / total;
    return { layer: spec.id, clock: spec.clock, parts, share,
             shareBand: spec.shareBand.slice(),
             inBand: share >= spec.shareBand[0] && share <= spec.shareBand[1],
             ceiling: spec.ceiling };
  });

  const buf = building.buffer();
  const trapped = trappedFast(building);

  // §5.9 two-tier submodel policy, checked rather than hoped
  const defs = [...building.defs.values()];
  const defParts = defs.map(d => building._defLeaves(d, [0, 0, 0], Geom.IDENT.slice()).length);
  const instancedPieces = places.filter(p => {
    const d = defs.find(x => x.file === p.parent);
    return d && d.refs >= 2;
  }).length;
  const largest = defParts.length ? Math.max(...defParts) : 0;
  const blocks = {
    count: defs.length,
    files: 1 + LAYERS.filter(l => byLayer.get(l.id)).length + defs.length,
    instanced: defs.filter(d => d.refs >= 2).length,
    instancedShare: instancedPieces / total,
    largestShare: largest / total,
    tinyShare: defParts.length ? defParts.filter(k => k > 0 && k <= 5).length / defParts.length : 0,
    perHundred: defs.length / total * 100,
    maxDepth: defs.length ? Math.max(...defs.map(d => d.depth)) : 1
  };
  const rules = [];
  if (blocks.largestShare > 0.35) rules.push('largest block holds ' + Math.round(blocks.largestShare * 100) + '% of pieces, ceiling 35%');
  if (blocks.count >= 2 && blocks.tinyShare < 0.20) rules.push('only ' + Math.round(blocks.tinyShare * 100) + '% of blocks are 5 parts or fewer, floor 20%');
  const reuseFloor = building.temperament.id === 'HIGH' ? 0.15 : 0.25;
  if (blocks.instancedShare < reuseFloor) rules.push('instanced blocks deliver ' + Math.round(blocks.instancedShare * 100) + '% of pieces, floor ' + (reuseFloor * 100) + '%');

  const order = { ok: true, why: 'layers closed on their clocks, slowest first' };
  for (let i = 1; i < building.closed.length; i++) {
    const a = LAYER_BY_ID.get(building.closed[i - 1]), c = LAYER_BY_ID.get(building.closed[i]);
    if (c.order < a.order) { order.ok = false; order.why = c.id + ' closed after ' + a.id; }
  }

  return {
    pieces: places.length, temperament: building.temperament.id,
    layers, buffer: buf, uncommitted: buf.uncommitted,
    trapped, trappedCount: trapped.length,
    blocks, blockRuleFailures: rules, order,
    reserves: building.reserves.map(r => r.why),
    refusals: building.ledger.filter(l => l.refused).map(l => ({ layer: l.layer, n: l.refused, why: l.why })),
    ok: buf.ok && !trapped.length && order.ok && layers.every(l => l.inBand || l.parts === 0)
  };
}

// ════════════════════════════════════════════════════════════════════ MPD
/**
 * A submodelled MPD. One 0 FILE per layer, one per assembly definition, and a
 * top-level model that references the layers — so pulling the STUFF block out of
 * the file removes every inhabitant and leaves a legal building, which is the
 * whole argument for shearing layers written as a file format.
 */
function toMPD(building, opts = {}) {
  const L = [];
  const filename = opts.filename || slug(building.name) + '.mpd';
  const author = opts.author || 'Nabugo Brand';
  const head = (file, name, org) => {
    L.push('0 FILE ' + file);
    L.push('0 Name: ' + name);
    L.push('0 Author: ' + author);
    L.push('0 !LDRAW_ORG ' + (org || 'Unofficial_Model'));
    L.push('0 BFC CERTIFY CCW');
  };
  const line = (color, pos, mat, file) =>
    '1 ' + color + ' ' + pos.map(num).join(' ') + ' ' + mat.map(num).join(' ') + ' ' + file;

  const used = LAYERS.filter(l => building.site.places.some(p => p.layer === l.id));
  const layerFile = l => 's' + (l.order + 1) + '-' + slug(l.id) + '.ldr';

  head(filename, building.name, 'Model');
  if (opts.brief) L.push('0 // BRIEF: ' + opts.brief);
  for (const l of used) {
    L.push('');
    L.push('0 STEP');
    L.push('0 // ' + l.id + ' — clock ' + l.clock);
    L.push(line(16, [0, 0, 0], Geom.IDENT, layerFile(l)));
  }

  for (const l of used) {
    L.push('');
    head(layerFile(l), l.id + ' (' + l.clock + ')');
    for (const p of building.site.places) {
      if (p.layer !== l.id || p.asm) continue;
      L.push(line(p.color, p.pos, p.mat, 'parts/' + p.part + '.dat'));
    }
    for (const ref of building.refs.values()) {
      if (ref.layer !== l.id || ref.def.parent) continue;
      const colour = ref.def.places.length ? ref.def.places[0].color : 16;
      L.push(line(colour, ref.pos, ref.mat, ref.def.file));
    }
  }

  for (const def of building.defs.values()) {
    L.push('');
    head(def.file, def.name);
    if (def.refs > 1) L.push('0 // instanced ' + def.refs + ' times');
    for (const p of def.places) L.push(line(p.color, p.lpos, p.lmat, 'parts/' + p.part + '.dat'));
    for (const c of def.children) {
      const colour = c.def.places.length ? c.def.places[0].color : 16;
      L.push(line(colour, c.pos, c.mat, c.def.file));
    }
  }
  return L.join('\n') + '\n';
}

// ════════════════════════════════════════════════════════════════ compose
/**
 * The plot, laid out once so every layer reads the same numbers. The cells are
 * disjoint by construction — a 16x16 baseplate is 16 studs across and this is
 * six studs of hut, six of deck and two of edge, which is the only reason the
 * clash gate has nothing to refuse.
 */
function planFor(temperament, seed) {
  const studs = 6, courses = 3;
  const crownY = GROUND_TOP - courses * BRICK - PLATE;   // on top of the frame's ceiling
  // A crown is 12 LDU wider than its hut on every face — that is what a side
  // stud plus a plate body measures — so two 6-stud huts need 160 between
  // centres, not 140, or the second crown lands in the first one.
  const huts = [{ x: -100, z: -100 }, { x: -100, z: 60 }];
  const deck = { x: 40, z: -100 }, deckStuds = 6;
  const deckTop = GROUND_TOP - 2 * BRICK - PLATE;
  const yaw = Geom.rotY(90);
  return {
    origin: { x: 0, z: 0 }, ground: VOCAB.ground[0],
    huts, hutStuds: studs, courses, crownY,
    deck, deckStuds, deckTop,
    spine: { x: 40, z: 130 }, spineTop: GROUND_TOP - 3 * BRICK,
    quay: { x: -110, z: 270 }, quayTop: GROUND_TOP - PLATE,
    // A boathouse, built loose on the quay. Not every block may be a repeat of
    // another block: instanced pieces above 60% of the model is its own failure.
    boathouse: { x: 30, z: 290 },
    beacon: { x: 40, z: 40 },
    water: { x: -100, z: 180 }, apron: { x: 130, z: -140 },
    // One opening per hole the frame left. Hut B is the same block turned 180
    // degrees about its centre, so its holes are hut A's holes reflected.
    openings: [
      { x: -50,  z: -100, y: GROUND_TOP - BRICK, mat: yaw },
      { x: -100, z: -50,  y: GROUND_TOP },
      { x: -150, z: 60,   y: GROUND_TOP - BRICK, mat: yaw },
      { x: -100, z: 10,   y: GROUND_TOP },
      { x: 80,   z: 290,  y: GROUND_TOP - PLATE - BRICK, mat: yaw },
      { x: 30,   z: 340,  y: GROUND_TOP - PLATE }
    ],
    hinge: { x: 0, z: -100 }, rail: { x: 0, z: 130 },
    fittings: { x: -110, z: 330 },
    ladder: { x: -150, z: 270 }, ladderY: GROUND_TOP - PLATE,
    path: { x: -30, z: -30 },
    figures: [{ x: 0, z: -140 }, { x: 60, z: -140 }],
    yard: { x: 140, z: 80 }, prop: { x: -140, z: 190 },
    seed
  };
}

/**
 * Compose a whole build: six layers, six clocks, in order. The brief may name
 * one focus axis; it changes the generator parameters, never the gates.
 */
async function compose(opts = {}) {
  if (!Catalog.meta) await Catalog.load();
  if (!E.Ports.meta) await E.Ports.load();
  try { await CREW.Stores.load(); } catch (e) { /* the -ator libraries are optional offline */ }

  const temper = opts.temperament === 'HIGH' ? 'HIGH' : 'LOW';
  const seed = opts.seed == null ? 0xB2A4D : opts.seed;
  const build = new Build({
    seed, temperament: temper, bar: opts.bar || null,
    name: opts.subject || 'shore-station', focusAxis: opts.focusAxis || null,
    plan: planFor(TEMPERAMENT[temper], seed)
  });
  build.reports = [];
  for (const spec of LAYERS) build.reports.push(pass(build, spec.id, build.rng));
  return build;
}

global.NabugoBrand = { LAYERS, TEMPERAMENT, MINIFIG_SKELETON, VOCAB, Build, familyOf, twoFoldY,
                       SITE, STRUCTURE, SKIN, SERVICES, SPACE, STUFF,
                       pass, audit, toMPD, compose, planFor, trappedFast, defExtent,
                       turnInstance, shiftInstance };

})(typeof window !== 'undefined' ? window : globalThis);

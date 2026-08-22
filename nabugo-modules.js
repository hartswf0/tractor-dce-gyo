/**
 * NABUGO MODULES — compound assemblies
 * ====================================
 * The honest criticism of everything before this file: it placed parts, it did
 * not build. A vignette of six loose bricks on a stud lattice is not a temple.
 * A temple is a COLUMN — base, shaft, shaft, shaft, capital — repeated six
 * times along an entablature, standing on a plinth, under a pediment, reached
 * by stairs. Roughly a hundred and seventy pieces for one building, and every
 * one of them placed because the piece under it is a known height.
 *
 * So: a module is a parametric recipe that emits many parts and knows its own
 * footprint and height, so other modules can sit on it, beside it, or under it.
 *
 *   Palette   resolves a ROLE ("shaft", "tread", "frond") to a part, from the
 *             active ecologies. The recipe never names a part id.
 *   Cursor    a build head. Tracks real heights so courses actually stack.
 *   MODULES   the recipe library.
 *   Site      lays modules out with footprint awareness and returns placements.
 *
 * The same COLONNADE recipe builds a marble colonnade or a coral one depending
 * on which ecologies are active. That is the point of keeping roles and parts
 * separate.
 */
(function (global) {
'use strict';
const N = global.Nabugo, E = global.NabugoEvo;
if (!N || !E) throw new Error('nabugo-modules.js requires nabugo.js and nabugo-evo.js');
const { Catalog, Geom } = N;

const LDU = 20, PLATE = 8, BRICK = 24;

// ═════════════════════════════════════════════════════════════════ palette
/**
 * A role is a job in a building; a part is what happens to be doing it today.
 * Roles are resolved once per palette so a colonnade's six columns are the
 * same column, not six different ones — repetition is what reads as
 * architecture.
 */
const ROLES = {
  //  re      what the description must look like
  //  no      what disqualifies it — the first pass picked a crane hook as a
  //          capital and a droid-patterned brick as a column shaft, because a
  //          loose regex over 15k parts finds the novelty before the staple
  //  max     stud footprint ceiling
  slab:    { re: /^Plate +\d+ +x +\d+$/i,                    max: [6,6], min: [2,4], cat: /plate/i },
  tile:    { re: /^Tile +\d+ +x +\d+( with Groove)?$/i,      max: [2,2], min: [2,2], cat: /tile/i },
  block:   { re: /^Brick +\d+ +x +\d+$/i,                    max: [2,4], min: [2,3], cat: /brick/i },
  shaft:   { re: /^Brick +\d+ +x +\d+ +Round/i,              max: [2,2], min: [2,2], cat: /brick/i },
  capital: { re: /^(Plate +\d+ +x +\d+ +Round|Dish +\d+ +x +\d+|Cone +\d+ +x +\d+ +x +\d+)/i,
             max: [4,4], min: [2,2], cat: /plate|dish|cone/i },
  base:    { re: /^Plate +\d+ +x +\d+ +Round/i,              max: [4,4], min: [2,2], cat: /plate/i },
  beam:    { re: /^Plate +\d+ +x +\d+$/i,                    max: [2,8], min: [2,6], cat: /plate/i },
  rake:    { re: /^Slope Brick +\d+ +\d+ +x +\d+$/i,        max: [3,4], min: [2,2], cat: /slope/i },
  arch:    { re: /^Arch +\d+ +x +\d+( +x +\d+)?$/i,         max: [2,8], cat: /arch/i },
  tread:   { re: /^Plate +\d+ +x +\d+$/i,                    max: [4,8], min: [2,4], cat: /plate/i },
  cone:    { re: /^Cone +\d+ +x +\d+ +x +\d+$/i,            max: [4,4], cat: /cone/i },
  dome:    { re: /^Dish +\d+ +x +\d+( +Inverted)?$/i,        max: [6,6], cat: /dish/i },
  frond:   { re: /^Plant /i,                                  max: [4,4], cat: /plant/i },
  coral:   { re: /^(Plant |Cone +\d)/i,                       max: [3,3], cat: /plant|cone/i },
  rubble:  { re: /^(Rock|Slope Brick +\d+ +\d+ +x +\d+|Brick +\d+ +x +\d+)$/i, max: [4,4], cat: /rock|slope|brick/i },
  hull:    { re: /^(Wedge +\d+ +x +\d+|Slope Brick +\d+ +\d+ +x +\d+|Brick +\d+ +x +\d+)$/i,
             max: [4,6], cat: /wedge|slope|brick/i },
  spar:    { re: /^(Bar +\d|Brick +\d+ +x +\d+ +Round)/i,    max: [1,1], cat: /bar|brick/i },
  glazing: { re: /^Panel +\d+ +x +\d+ +x +\d+$/i,           max: [4,6], cat: /panel/i },
  figure:  { re: /^Minifig Torso$/i,                          max: [2,2], cat: /minifig/i },
  relic:   { re: /^(Minifig Utensil|Cone +\d+ +x +\d+ +x +\d+)/i, max: [2,2], cat: /minifig|cone/i }
};

// Disqualifiers applied to every structural role. A decorated, hinged, clipped
// or wheeled variant of a brick is a different object with a different job.
const NOT_STRUCTURAL = new RegExp([
  'pattern', 'print', 'sticker', 'grille', 'hinge', 'technic', 'electric',
  'obsolete', 'duplo', 'fabuland', 'znap', '~',
  // "with 2 Wheel Clips" slipped past an earlier `with (Clip|…)` because of the
  // count in the middle, so the qualifier is allowed a few words of slack.
  'with (\\w+ ){0,2}(clip|hook|handle|hole|pin|axle|wheel|magnet|ball|socket|teeth|arm|holder|cutout|notch)',
  '\\bfor \\b'
].join('|'), 'i');

class Palette {
  /**
   * @param ecologies  ecology ids whose guild members are preferred
   * @param lexicon    brief words that bias the choice
   */
  constructor(ecologies, lexicon, rng) {
    this.ecologies = ecologies || [];
    this.lexicon = lexicon || [];
    this.rng = rng || Math.random;
    this.fixed = new Map();     // role -> part, decided once
    this.log = [];
  }

  /** Candidate pool for a role, biased by ecology membership and brief words. */
  pool(role) {
    const spec = ROLES[role];
    if (!spec) return [];
    const eco = new Set();
    for (const id of this.ecologies) {
      for (const g of E.Ecology.GUILDS) {
        for (const p of E.Ecology.members(id, g)) eco.add(p.id);
      }
    }
    const out = [];
    for (const p of Catalog.all()) {
      if (!spec.re.test(p.d)) continue;
      if (spec.cat && !spec.cat.test(p.c)) continue;
      if (NOT_STRUCTURAL.test(p.d)) continue;
      // Footprints are stored as [width, depth] in whichever orientation the
      // part was authored, so the gates compare sorted extents. Comparing them
      // positionally rejected every Plate 6x2 from a role that wanted 2x6.
      const lo = Math.min(p.s[0], p.s[1]), hi = Math.max(p.s[0], p.s[1]);
      const mxLo = Math.min(spec.max[0], spec.max[1]), mxHi = Math.max(spec.max[0], spec.max[1]);
      if (lo > mxLo || hi > mxHi) continue;
      // A minimum matters as much as a maximum: paving a plinth with 1x2
      // plates burns two hundred pieces on ground nobody looks at, and a 1x1
      // round is a bollard, not a column.
      if (spec.min) {
        const mnLo = Math.min(spec.min[0], spec.min[1]), mnHi = Math.max(spec.min[0], spec.min[1]);
        if (lo < mnLo || hi < mnHi) continue;
      }
      if (!E.Ports.of(p.id).length) continue;         // must be joinable
      let s = 1;
      if (eco.has(p.id)) s += 2;
      for (const w of this.lexicon) if (p._t.includes(w)) { s += 1.5; break; }
      // Staples over novelties: a short id is almost always the plain part.
      if (p.id.length <= 4) s += 1.2;
      s += Math.min(1.5, (p.s[0] * p.s[1]) / 12);   // do the work in fewer, bigger pieces
      out.push({ p, s });
    }
    out.sort((a, b) => b.s - a.s || a.p.id.length - b.p.id.length);
    return out.map(x => x.p);
  }

  /**
   * Resolve a role. Sticky by default: architecture reads as architecture
   * because the same column repeats, so a role keeps its part unless the
   * caller asks for a fresh draw.
   */
  get(role, fresh) {
    if (!fresh && this.fixed.has(role)) return this.fixed.get(role);
    const list = this.pool(role);
    if (!list.length) return null;
    const i = Math.floor(Math.pow(this.rng(), 2.2) * Math.min(list.length, 24));
    const p = list[i] || list[0];
    if (!fresh) { this.fixed.set(role, p); this.log.push(role + ' → ' + p.id + ' (' + p.d.slice(0, 34) + ')'); }
    return p;
  }

  /** A part that fits a target stud span for this role, if one exists. */
  spanning(role, studs) {
    const list = this.pool(role);
    let best = null, bestErr = Infinity;
    for (const p of list.slice(0, 120)) {
      const err = Math.abs(Math.max(p.s[0], p.s[1]) - studs);
      if (err < bestErr) { bestErr = err; best = p; }
      if (!err) break;
    }
    return best;
  }
}

// ══════════════════════════════════════════════════════════════════ cursor
const w = p => p.b[3] - p.b[0];
const h = p => p.b[4] - p.b[1];
const d = p => p.b[5] - p.b[2];
const cx = p => (p.b[0] + p.b[3]) / 2;
const cz = p => (p.b[2] + p.b[5]) / 2;

/**
 * A build head. `y` is the height of the surface currently being built on;
 * LDraw Y is down, so building up means y decreasing. Every course advances by
 * a real part height, which is the whole reason these assemblies hold together.
 */
class Cursor {
  constructor(origin, colorOf) {
    this.ox = origin.x; this.oz = origin.z;
    this.y = 0;
    this.out = [];
    this.colorOf = colorOf || (() => 71);
  }
  /** Place a part with its box centred on (x,z) and its underside at `y`. */
  put(part, x, z, y, opts = {}) {
    if (!part) return null;
    const place = {
      part: part.id,
      color: opts.color != null ? opts.color : this.colorOf(opts.role),
      pos: [x - cx(part), (y == null ? this.y : y) - part.b[4], z - cz(part)],
      mat: opts.mat || Geom.IDENT,
      role: opts.role || null,
      module: opts.module || null
    };
    this.out.push(place);
    return place;
  }
  /** Raise the head by a real height. */
  rise(dy) { this.y -= dy; return this.y; }
  get count() { return this.out.length; }
}

// ═════════════════════════════════════════════════════════════════ modules
/**
 * Every recipe returns { places, footprint:[w,d] in LDU, height, parts }.
 * Footprint and height are what let the site planner put a pediment on top of
 * a colonnade and a colonnade on top of a plinth without measuring anything
 * twice.
 */
const MODULES = {

  /** A raised base. Plates tiled across a rectangle — reads as masonry. */
  plinth(ctx, o = {}) {
    const studsX = o.studsX || 16, studsZ = o.studsZ || 16, courses = o.courses || 2;
    const slab = ctx.palette.get('slab');
    if (!slab) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const sw = Math.max(1, Math.round(w(slab) / LDU)), sd = Math.max(1, Math.round(d(slab) / LDU));
    for (let c = 0; c < courses; c++) {
      // Alternate the bond so courses interlock instead of stacking in columns.
      const off = c % 2 ? sw / 2 : 0;
      for (let ix = 0; ix * sw < studsX; ix++) {
        for (let iz = 0; iz * sd < studsZ; iz++) {
          cur.put(slab,
            ctx.origin.x + (ix * sw + sw / 2 + off - studsX / 2) * LDU,
            ctx.origin.z + (iz * sd + sd / 2 - studsZ / 2) * LDU,
            null, { role: 'slab', module: 'plinth' });
        }
      }
      cur.rise(h(slab) - 4);            // studs sink into the course above
    }
    return pack(cur, [studsX * LDU, studsZ * LDU], -cur.y, 'plinth');
  },

  /** A finished floor: tiles, so nothing above it looks accidental. */
  floor(ctx, o = {}) {
    const studsX = o.studsX || 16, studsZ = o.studsZ || 16;
    const tile = ctx.palette.get('tile') || ctx.palette.get('slab');
    if (!tile) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const tw = Math.max(1, Math.round(w(tile) / LDU)), td = Math.max(1, Math.round(d(tile) / LDU));
    for (let ix = 0; ix * tw < studsX; ix++) {
      for (let iz = 0; iz * td < studsZ; iz++) {
        cur.put(tile,
          ctx.origin.x + (ix * tw + tw / 2 - studsX / 2) * LDU,
          ctx.origin.z + (iz * td + td / 2 - studsZ / 2) * LDU,
          null, { role: 'tile', module: 'floor' });
      }
    }
    return pack(cur, [studsX * LDU, studsZ * LDU], h(tile), 'floor');
  },

  /** One column: base, shafts, capital. The unit the whole order repeats. */
  column(ctx, o = {}) {
    const drums = o.drums || 8;
    const base = ctx.palette.get('base') || ctx.palette.get('slab');
    const shaft = ctx.palette.get('shaft');
    const cap = ctx.palette.get('capital') || ctx.palette.get('slab');
    if (!shaft) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const x = ctx.origin.x, z = ctx.origin.z;

    if (base) { cur.put(base, x, z, null, { role: 'base', module: 'column' }); cur.rise(h(base) - 4); }
    for (let i = 0; i < drums; i++) {
      cur.put(shaft, x, z, null, { role: 'shaft', module: 'column' });
      cur.rise(h(shaft) - 4);
    }
    if (cap) { cur.put(cap, x, z, null, { role: 'capital', module: 'column' }); cur.rise(h(cap) - 4); }

    return pack(cur, [Math.max(w(shaft), base ? w(base) : 0), Math.max(d(shaft), base ? d(base) : 0)],
                -cur.y, 'column');
  },

  /** A rank of columns carrying a beam. This is where the part count arrives. */
  colonnade(ctx, o = {}) {
    const n = o.columns || 6, drums = o.drums || 8;
    const pitch = o.pitch || 60;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    let top = 0, cw = 0;
    for (let i = 0; i < n; i++) {
      const x = ctx.origin.x + (i - (n - 1) / 2) * pitch;
      const col = MODULES.column({ ...ctx, origin: { x, z: ctx.origin.z } }, { drums });
      if (!col) continue;
      cur.out.push(...col.places);
      top = Math.max(top, col.height);
      cw = Math.max(cw, col.footprint[0]);
    }
    // Entablature: beams laid end to end across the whole span, not one per
    // capital. Spacing them at the column pitch left gaps, and everything the
    // pediment then tried to stand on between columns was standing on nothing.
    const beam = ctx.palette.get('beam');
    if (beam) {
      const y = -top;
      const span = (n - 1) * pitch + cw;
      const bw = w(beam);
      const runs = Math.max(1, Math.ceil(span / bw));
      for (let i = 0; i < runs; i++) {
        cur.put(beam, ctx.origin.x + (i + 0.5 - runs / 2) * bw, ctx.origin.z, y,
                { role: 'beam', module: 'colonnade' });
      }
      top += h(beam) - 4;
    }
    return pack(cur, [(n - 1) * pitch + cw, cw], top, 'colonnade');
  },

  /** A gable. Courses of slopes narrowing as they rise. */
  pediment(ctx, o = {}) {
    const span = o.span || 360, courses = o.courses || 6;
    const rake = ctx.palette.get('rake') || ctx.palette.get('block');
    if (!rake) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const rw = w(rake);
    for (let c = 0; c < courses; c++) {
      const width = span - c * rw * 2;
      if (width < rw) break;
      const n = Math.max(1, Math.floor(width / rw));
      for (let i = 0; i < n; i++) {
        const x = ctx.origin.x + (i + 0.5 - n / 2) * rw;
        // Mirror the outer stones so the rake reads as a slope on both sides.
        const mat = (i === 0) ? Geom.rotY(180) : (i === n - 1 ? Geom.IDENT : Geom.IDENT);
        cur.put(rake, x, ctx.origin.z, null, { role: 'rake', module: 'pediment', mat });
      }
      cur.rise(h(rake) - 4);
    }
    return pack(cur, [span, d(rake)], -cur.y, 'pediment');
  },

  /** A processional approach. Each tread sits on the back of the one below. */
  /**
   * A flight that starts on the ground and arrives at `rise`. Each tread is a
   * solid pier, not a single plate hanging in the air: step n is n courses
   * tall, which is both how stairs are actually built in brick and the reason
   * every tread has something underneath it.
   */
  stair(ctx, o = {}) {
    const tread = ctx.palette.get('tread') || ctx.palette.get('slab');
    if (!tread) return null;
    const riser = h(tread) - 4;
    const steps = o.steps || Math.max(2, Math.round((o.rise || 5 * riser) / riser));
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const tw = Math.max(1, Math.round(w(tread) / LDU)), td = Math.max(1, Math.round(d(tread) / LDU));
    const across = Math.max(1, Math.round((o.widthStuds || 8) / tw));

    for (let s = 0; s < steps; s++) {
      const z = ctx.origin.z + (steps - 1 - s) * td * LDU;
      for (let c = 0; c <= s; c++) {                 // the pier under this tread
        for (let i = 0; i < across; i++) {
          cur.put(tread, ctx.origin.x + (i + 0.5 - across / 2) * tw * LDU, z,
                  -c * riser, { role: 'tread', module: 'stair' });
        }
      }
    }
    return pack(cur, [across * tw * LDU, steps * td * LDU], steps * riser, 'stair');
  },

  /** A wall in running bond. */
  wall(ctx, o = {}) {
    const lengthStuds = o.lengthStuds || 12, courses = o.courses || 5;
    const block = ctx.palette.get('block');
    if (!block) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const bw = Math.max(1, Math.round(w(block) / LDU));
    for (let c = 0; c < courses; c++) {
      const off = c % 2 ? bw / 2 : 0;
      const n = Math.max(1, Math.floor(lengthStuds / bw));
      for (let i = 0; i < n; i++) {
        cur.put(block,
          ctx.origin.x + (i * bw + bw / 2 + off - lengthStuds / 2) * LDU,
          ctx.origin.z, null, { role: 'block', module: 'wall' });
      }
      cur.rise(h(block) - 4);
    }
    return pack(cur, [lengthStuds * LDU, d(block)], -cur.y, 'wall');
  },

  /** A rotunda: a ring of short columns under a dish. */
  rotunda(ctx, o = {}) {
    const n = o.columns || 8, radius = o.radius || 90, drums = o.drums || 3;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    let top = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const col = MODULES.column({
        ...ctx,
        origin: { x: ctx.origin.x + Math.cos(a) * radius, z: ctx.origin.z + Math.sin(a) * radius }
      }, { drums });
      if (!col) continue;
      cur.out.push(...col.places);
      top = Math.max(top, col.height);
    }
    const dome = ctx.palette.get('dome') || ctx.palette.get('capital');
    if (dome) {
      cur.put(dome, ctx.origin.x, ctx.origin.z, -top, { role: 'dome', module: 'rotunda' });
      top += h(dome) - 4;
    }
    return pack(cur, [radius * 2 + 40, radius * 2 + 40], top, 'rotunda');
  },

  /** Reef. Scattered, low, dense — the layer that makes the rest look drowned. */
  reef(ctx, o = {}) {
    const n = o.clumps || 24, spread = o.spread || 180, hole = o.hole || 0;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    for (let i = 0; i < n; i++) {
      // Fresh draw each clump: a reef is the one place variety beats repetition.
      const part = ctx.palette.get(ctx.rng() < 0.6 ? 'coral' : 'frond', true);
      if (!part) continue;
      const a = ctx.rng() * Math.PI * 2;
      const r = hole + Math.sqrt(ctx.rng()) * Math.max(20, spread - hole);
      cur.put(part,
        ctx.origin.x + Math.cos(a) * r,
        ctx.origin.z + Math.sin(a) * r,
        0, { role: 'coral', module: 'reef', mat: Geom.rotY(Math.floor(ctx.rng() * 4) * 90) });
    }
    return pack(cur, [spread * 2, spread * 2], 24, 'reef');
  },

  /** Collapse. A ruin is not a failed building; it is a different one. */
  rubblefield(ctx, o = {}) {
    const n = o.stones || 18, spread = o.spread || 140;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    for (let i = 0; i < n; i++) {
      const part = ctx.palette.get(ctx.rng() < 0.5 ? 'rubble' : 'block', true);
      if (!part) continue;
      const a = ctx.rng() * Math.PI * 2, r = Math.sqrt(ctx.rng()) * spread;
      // On the ground. Rubble lifted to a random height is rubble resting on
      // nothing, which the audit is right to call floating.
      cur.put(part,
        ctx.origin.x + Math.cos(a) * r,
        ctx.origin.z + Math.sin(a) * r, 0,
        { role: 'rubble', module: 'rubblefield', mat: Geom.rotY(Math.floor(ctx.rng() * 4) * 90) });
    }
    return pack(cur, [spread * 2, spread * 2], 48, 'rubblefield');
  },

  /** A wreck: ribs rising from a keel, with a spar. */
  wreck(ctx, o = {}) {
    const ribs = o.ribs || 7;
    const hull = ctx.palette.get('hull') || ctx.palette.get('rake');
    const spar = ctx.palette.get('spar');
    if (!hull) return null;
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const step = Math.max(20, w(hull));
    const rise = h(hull) - 4;
    for (let i = 0; i < ribs; i++) {
      const t = i / (ribs - 1 || 1);
      const beam = Math.round(Math.sin(t * Math.PI) * 24 / 20) * 20;   // swells amidships
      const courses = 1 + Math.round(Math.sin(t * Math.PI) * 2);       // and rises with it
      for (let c = 0; c < courses; c++) {
        for (const side of [beam, -beam]) {
          if (beam === 0 && side < 0) continue;
          cur.put(hull, ctx.origin.x + (i - (ribs - 1) / 2) * step,
                  ctx.origin.z + side, -c * rise,
                  { role: 'hull', module: 'wreck', mat: Geom.rotY(side < 0 ? 180 : 0) });
        }
      }
    }
    // The mast stands on the keel, course on course, not hanging above it.
    if (spar) {
      for (let i = 0; i < 5; i++) {
        cur.put(spar, ctx.origin.x, ctx.origin.z, -i * (h(spar) - 4),
                { role: 'spar', module: 'wreck' });
      }
    }
    return pack(cur, [ribs * step, 100], 120, 'wreck');
  },

  /** A shrine: a small enclosure with something inside worth enclosing. */
  shrine(ctx, o = {}) {
    const cur = new Cursor(ctx.origin, ctx.colorOf);
    const base = MODULES.plinth({ ...ctx }, { studsX: 8, studsZ: 8, courses: 1 });
    if (base) cur.out.push(...base.places);
    const y0 = base ? -base.height : 0;
    const col = ctx.palette.get('shaft');
    if (col) {
      for (const [dx, dz] of [[-60,-60],[60,-60],[-60,60],[60,60]]) {
        for (let i = 0; i < 3; i++) {
          cur.put(col, ctx.origin.x + dx, ctx.origin.z + dz, y0 - i * (h(col) - 4),
                  { role: 'shaft', module: 'shrine' });
        }
      }
    }
    const relic = ctx.palette.get('relic') || ctx.palette.get('cone');
    if (relic) cur.put(relic, ctx.origin.x, ctx.origin.z, y0, { role: 'relic', module: 'shrine' });
    const roof = ctx.palette.get('beam');
    if (roof) {
      const y = y0 - 3 * (col ? h(col) - 4 : 24);
      const rw = w(roof), rd = d(roof);
      const nx = Math.max(1, Math.ceil(160 / rw)), nz = Math.max(1, Math.ceil(160 / rd));
      for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
        cur.put(roof, ctx.origin.x + (ix + 0.5 - nx / 2) * rw,
                      ctx.origin.z + (iz + 0.5 - nz / 2) * rd, y,
                { role: 'beam', module: 'shrine' });
      }
    }
    return pack(cur, [160, 160], 130, 'shrine');
  }
};

function pack(cur, footprint, height, name) {
  return { places: cur.out, footprint, height: Math.abs(height) || 0,
           parts: cur.out.length, module: name };
}

/**
 * A temple is not a module, it is a composition of them, and composing is where
 * the piece count really lands: plinth + floor + two colonnades + pediment +
 * stair comes to roughly a hundred and seventy pieces.
 */
const STRUCTURES = {
  temple(ctx, o = {}) {
    const wide = o.columns || 6, drums = o.drums || 8, pitch = o.pitch || 60;
    const studsX = o.studsX || Math.round((wide * pitch) / LDU) + 4;
    const studsZ = o.studsZ || 12;
    const out = [];
    let y = 0;

    const plinth = MODULES.plinth(ctx, { studsX, studsZ, courses: 2 });
    if (plinth) { out.push(...plinth.places); y = plinth.height; }

    const floor = MODULES.floor(shift(ctx, 0, 0), { studsX: studsX - 2, studsZ: studsZ - 2 });
    if (floor) { lift(floor.places, y); out.push(...floor.places); y += floor.height - 4; }

    const front = MODULES.colonnade(shift(ctx, 0, -(studsZ / 2 - 1.5) * LDU),
                                    { columns: wide, drums, pitch });
    const back  = MODULES.colonnade(shift(ctx, 0,  (studsZ / 2 - 1.5) * LDU),
                                    { columns: wide, drums, pitch });
    let colTop = 0;
    for (const c of [front, back]) if (c) { lift(c.places, y); out.push(...c.places); colTop = Math.max(colTop, c.height); }
    y += colTop;

    const ped = MODULES.pediment(shift(ctx, 0, 0), { span: (wide - 1) * pitch, courses: o.pedimentCourses || 4 });
    if (ped) { lift(ped.places, y); out.push(...ped.places); y += ped.height; }

    // The stair climbs to the floor, so its top tread has to arrive at the
    // floor's level. Left at ground level it was buried in the plinth.
    const floorY = plinth ? plinth.height : 0;
    const stair = MODULES.stair(shift(ctx, 0, (studsZ / 2 + 2) * LDU),
                                { rise: floorY, widthStuds: 10 });
    if (stair) out.push(...stair.places);

    return { places: out, footprint: [studsX * LDU, studsZ * LDU + 200], height: y,
             parts: out.length, module: 'temple' };
  },

  /** Somewhere the sea is winning. */
  ruin(ctx, o = {}) {
    const out = [];
    const plinth = MODULES.plinth(ctx, { studsX: 12, studsZ: 12, courses: 1 });
    if (plinth) out.push(...plinth.places);
    const y = plinth ? plinth.height : 0;
    const col = MODULES.colonnade(shift(ctx, 0, -60), { columns: o.columns || 4, drums: 2, pitch: 60 });
    if (col) { lift(col.places, y); out.push(...col.places); }
    const rub = MODULES.rubblefield(shift(ctx, 0, 90), { stones: o.stones || 18, spread: 120 });
    if (rub) { lift(rub.places, y); out.push(...rub.places); }
    return { places: out, footprint: [280, 320], height: 140, parts: out.length, module: 'ruin' };
  },

  /** The garden that grew over everything. */
  gardens(ctx, o = {}) {
    const out = [];
    const plinth = MODULES.plinth(ctx, { studsX: 14, studsZ: 14, courses: 1 });
    if (plinth) out.push(...plinth.places);
    const y = plinth ? plinth.height : 0;
    const reef = MODULES.reef(shift(ctx, 0, 0), { clumps: o.clumps || 30, spread: 130, hole: 110 });
    if (reef) { lift(reef.places, y); out.push(...reef.places); }
    // The shrine stands in the middle; the reef is pushed to the margin so the
    // two are not competing for the same ground.
    const shrine = MODULES.shrine(shift(ctx, 0, 0), {});
    if (shrine) { lift(shrine.places, y); out.push(...shrine.places); }
    return { places: out, footprint: [300, 300], height: 160, parts: out.length, module: 'gardens' };
  },

  harbour(ctx, o = {}) {
    const out = [];
    const wreck = MODULES.wreck(ctx, { ribs: o.ribs || 7 });
    if (wreck) out.push(...wreck.places);
    const rub = MODULES.rubblefield(shift(ctx, 0, 120), { stones: 12, spread: 100 });
    if (rub) out.push(...rub.places);
    const reef = MODULES.reef(shift(ctx, 0, -120), { clumps: 16, spread: 110 });
    if (reef) out.push(...reef.places);
    return { places: out, footprint: [340, 400], height: 130, parts: out.length, module: 'harbour' };
  },

  pavilion(ctx, o = {}) {
    const out = [];
    const plinth = MODULES.plinth(ctx, { studsX: 12, studsZ: 12, courses: 2 });
    if (plinth) out.push(...plinth.places);
    const y = plinth ? plinth.height : 0;
    const rot = MODULES.rotunda(shift(ctx, 0, 0), { columns: o.columns || 8, radius: 90, drums: 3 });
    if (rot) { lift(rot.places, y); out.push(...rot.places); }
    return { places: out, footprint: [280, 280], height: 200, parts: out.length, module: 'pavilion' };
  }
};

const shift = (ctx, dx, dz) => ({ ...ctx, origin: { x: ctx.origin.x + dx, z: ctx.origin.z + dz } });
const lift  = (places, y) => { for (const p of places) p.pos[1] -= y; };

// ══════════════════════════════════════════════════════════════════ site
/**
 * Somewhere to put buildings. Not the 9x9 semantic tray — that is for reading
 * the narrative. This is a build plot with real metres in it, where a structure
 * reserves the ground it stands on so the next one is placed beside it rather
 * than inside it.
 */
class Site {
  constructor(opts = {}) {
    this.extent = opts.extent || 1200;      // LDU across
    this.claims = [];                       // {x, z, w, d, label}
    this.places = [];
    this.log = [];
  }

  free(x, z, fw, fd, pad = 16) {
    if (Math.abs(x) + fw / 2 > this.extent / 2) return false;
    if (Math.abs(z) + fd / 2 > this.extent / 2) return false;
    return !this.claims.some(c =>
      Math.abs(c.x - x) < (c.w + fw) / 2 + pad &&
      Math.abs(c.z - z) < (c.d + fd) / 2 + pad);
  }

  /**
   * Find ground for a footprint, spiralling out from a preferred point. The
   * search has to reach the edge of the site: a fixed fourteen rings covered
   * 630 LDU whatever the extent, so once the middle was taken a large temple
   * was told there was no room in a plot with half of it still empty.
   */
  findPlot(fw, fd, prefer, rng) {
    const px = prefer ? prefer.x : 0, pz = prefer ? prefer.z : 0;
    if (this.free(px, pz, fw, fd)) return { x: px, z: pz };
    const step = 60;
    const rings = Math.ceil(this.extent / (2 * step)) + 2;
    for (let ring = 1; ring <= rings; ring++) {
      const tries = 8 + ring * 4;
      for (let i = 0; i < tries; i++) {
        const a = (i / tries) * Math.PI * 2 + (rng ? rng() : 0);
        const r = step * ring;
        const x = Math.round((px + Math.cos(a) * r) / 20) * 20;
        const z = Math.round((pz + Math.sin(a) * r) / 20) * 20;
        if (this.free(x, z, fw, fd)) return { x, z };
      }
    }
    return null;
  }

  /**
   * Build a structure and land it. Returns a receipt, or a refusal that names
   * what stopped it — the site is allowed to say no.
   */
  raise(name, ctx, opts, rng) {
    const fn = STRUCTURES[name] || MODULES[name];
    if (!fn) return { ok: false, reason: 'no such module: ' + name };

    // Build once at the origin to learn the real footprint, then move it.
    const probe = fn({ ...ctx, origin: { x: 0, z: 0 } }, opts || {});
    if (!probe || !probe.places.length) return { ok: false, reason: name + ' produced nothing' };

    const plot = this.findPlot(probe.footprint[0], probe.footprint[1], opts && opts.prefer, rng);
    if (!plot) return { ok: false, reason: 'no free ground for ' + name +
                        ' (' + Math.round(probe.footprint[0]) + '×' + Math.round(probe.footprint[1]) + ' LDU)' };

    for (const p of probe.places) { p.pos[0] += plot.x; p.pos[2] += plot.z; }

    // Settle. Recipes compose modules that were each sound on their own, and
    // where two of them meet a few pieces will always want the same volume.
    // Rather than hand-tuning every seam, the site drops the later piece and
    // reports how many it took — a build that needs a lot of settling is a
    // recipe that needs fixing, and the count is how you find out.
    const settled = [];
    let dropped = 0;
    for (const p of probe.places) {
      const box = Geom.worldBox(p);
      if (!box) { dropped++; continue; }
      const clash = settled.some(q => Geom.penetration(box, q.box) > 0) ||
                    this.places.some(q => {
                      const b = Geom.worldBox(q);
                      return b && Geom.penetration(box, b) > 0;
                    });
      if (clash) { dropped++; continue; }
      settled.push({ p, box });
    }

    // Ground-settle. Every recipe leaves a few edge pieces reaching past what
    // holds them up — the outermost stone of a pediment course, a coral on a
    // slope that ends. Rather than patch each recipe forever, the site refuses
    // to place anything it cannot trace back to the ground, and says how much.
    const standing = groundSettle(settled, this.places);
    const unsupported = settled.length - standing.length;

    this.claims.push({ x: plot.x, z: plot.z, w: probe.footprint[0], d: probe.footprint[1], label: name });
    this.places.push(...standing.map(s => s.p));
    const receipt = { ok: true, module: name, parts: standing.length, dropped, unsupported, at: plot,
                      footprint: probe.footprint.map(Math.round), height: Math.round(probe.height) };
    this.log.push(receipt);
    return receipt;
  }

  get count() { return this.places.length; }
}

/**
 * Keep only what stands. Seed from anything resting on the ground plane or on
 * the world already built, then propagate upward through contacts until nothing
 * new is reachable; whatever is left over was never held up by anything.
 */
function groundSettle(candidates, world) {
  const worldBoxes = world.map(p => Geom.worldBox(p)).filter(Boolean);
  const held = new Array(candidates.length).fill(false);
  const boxes = candidates.map(c => c.box);

  for (let i = 0; i < candidates.length; i++) {
    if (Math.abs(boxes[i].max[1]) <= 6) { held[i] = true; continue; }     // on the ground
    for (const b of worldBoxes) {
      if (Geom.stacked(boxes[i], b)) { held[i] = true; break; }
    }
  }
  let growing = true;
  while (growing) {
    growing = false;
    for (let i = 0; i < candidates.length; i++) {
      if (held[i]) continue;
      for (let j = 0; j < candidates.length; j++) {
        if (!held[j] || i === j) continue;
        if (Geom.stacked(boxes[i], boxes[j])) { held[i] = true; growing = true; break; }
      }
    }
  }
  return candidates.filter((_, i) => held[i]);
}

global.NabugoModules = { ROLES, Palette, Cursor, MODULES, STRUCTURES, Site, groundSettle,
                         LDU, PLATE, BRICK };
})(typeof window !== 'undefined' ? window : globalThis);

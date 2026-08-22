/**
 * NABUGO CREW — the expedition layer
 * ==================================
 * The complaint this answers: it was hard to drive, and it did not use the
 * -ators. So the driving surface is now an expedition with a crew, and the
 * crew draw from the same libraries the -ators draw from.
 *
 *   scene-shells.json     the ground a location stands on   (locationator)
 *   minifig-library.json  eight curated figures, part by part (minifigurator)
 *   vehicle-library.json  vessel types                       (vehiculator)
 *
 * Nobody here reimplements those pages. The crew read their vocabulary and put
 * it into a build that compiles, which is the thing the -ators never did — each
 * of them emits one part per label against a hardcoded layout table.
 *
 * A watch is one unit of work: one crew member does one job and writes a line
 * in the log. Resurrecting a city is a great many watches.
 */
(function (global) {
'use strict';
const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules;
if (!N || !E || !M) throw new Error('nabugo-crew.js requires nabugo.js, -evo.js and -modules.js');
const { Catalog, Geom } = N;

// ═══════════════════════════════════════════════════════════════════ stores
/** The -ator libraries, loaded once and shared. */
const Stores = (() => {
  const D = './wag-viewer-prime-integration-20251112-055341 copy/';
  let shells = [], figures = [], vessels = [], loaded = false;

  async function grab(url, pick, label) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return pick(await r.json()) || [];
    } catch (e) {
      console.warn('[crew] ' + label + ' unavailable:', e.message);
      return [];
    }
  }

  async function load() {
    if (loaded) return status();
    [shells, figures, vessels] = await Promise.all([
      grab(D + 'scene-shells.json',    j => j.shells,                      'scene shells'),
      grab(D + 'minifig-library.json', j => j.curated,                     'minifig library'),
      grab('./vehicle-library.json',   j => Object.values(j.vehicleTypes || {}), 'vehicle library')
    ]);
    loaded = true;
    return status();
  }
  const status = () => ({ shells: shells.length, figures: figures.length, vessels: vessels.length });

  /** Ground plates the locationator would stand a scene on. */
  const groundShells = () => shells.filter(s => /baseplate/i.test(s.head || ''));
  const hullShells   = () => shells.filter(s => /hull|boat/i.test(s.head || ''));

  return { load, status, get shells(){return shells;}, get figures(){return figures;},
           get vessels(){return vessels;}, groundShells, hullShells };
})();

// ══════════════════════════════════════════════════════════════════ toolkit
/**
 * Tools are the verbs a crew member can use. Keeping them named and countable
 * is what makes a watch legible: "the mason raised a colonnade" is a sentence
 * you can check against the part count.
 */
/**
 * Everything that reaches the site goes through here. The first version let
 * the bosun and the purser push straight into `site.places`, which is how an
 * expedition finished with 385 interpenetrations and 96 figures standing in
 * mid-air: the settle passes only ever saw the mason's work.
 */
function commit(exp, places, opts = {}) {
  const boxes = [];
  const kept = [];
  let clashed = 0, unsupported = 0;

  // An assembly is one object. A minifig's arms are meant to be inside its
  // torso and a wheel is meant to be inside its arch; checking a figure against
  // its own parts is what refused every minifig with "2 of 4 pieces clash".
  // The group is still checked against the world, which is the check that matters.
  const selfClash = opts.selfClash !== false;
  for (const p of places) {
    const box = Geom.worldBox(p);
    if (!box) { clashed++; continue; }
    const hitsWorld = exp.site.places.some(q => {
      const b = Geom.worldBox(q);
      return b && Geom.penetration(box, b) > 0;
    });
    if (hitsWorld || (selfClash && boxes.some(b => Geom.penetration(box, b) > 0))) { clashed++; continue; }
    kept.push({ p, box }); boxes.push(box);
  }

  // A group placed as a unit (a figure, say) stands or falls together: half a
  // minifig resting on a step is worse than none.
  if (opts.atomic && kept.length !== places.length) {
    return { ok: false, reason: clashed + ' of ' + places.length + ' pieces clash', parts: 0 };
  }
  if (opts.requireSupport !== false) {
    const standing = M.groundSettle(kept, exp.site.places);
    unsupported = kept.length - standing.length;
    if (opts.atomic && unsupported) {
      return { ok: false, reason: 'nothing to stand on', parts: 0 };
    }
    kept.length = 0; kept.push(...standing);
  }
  if (!kept.length) return { ok: false, reason: 'nothing could be placed', parts: 0 };

  exp.site.places.push(...kept.map(k => k.p));
  return { ok: true, parts: kept.length, clashed, unsupported };
}

const Tools = {
  /** Lay the ground a district stands on, from the locationator's own shells. */
  layGround(exp, at, opts = {}) {
    const pool = Stores.groundShells();
    if (!pool.length) return { ok: false, reason: 'no baseplate shells loaded' };
    const shell = pool[Math.floor(exp.rng() * pool.length)];
    const id = String(shell.filename || '').replace(/\.dat$/i, '');
    const part = Catalog.get(id);
    if (!part) return { ok: false, reason: 'shell ' + id + ' not in catalogue' };
    const place = {
      part: id, color: opts.color != null ? opts.color : 71,
      pos: [at.x - (part.b[0] + part.b[3]) / 2, -part.b[4], at.z - (part.b[2] + part.b[5]) / 2],
      mat: Geom.IDENT, role: 'ground', module: 'district'
    };
    const c = commit(exp, [place], { atomic: true, requireSupport: false });
    if (!c.ok) return { ok: false, reason: 'ground would clash at ' + at.x + ',' + at.z };
    exp.site.claims.push({ x: at.x, z: at.z,
      w: part.b[3] - part.b[0], d: part.b[5] - part.b[2], label: 'ground' });
    return { ok: true, parts: 1, note: shell.description || id };
  },

  /** Raise a structure. The mason's only tool, and where the pieces come from. */
  raise(exp, name, opts = {}) {
    return exp.site.raise(name, exp.ctx(), opts, exp.rng);
  },

  /**
   * Put a curated minifig on the site, built part by part from the
   * minifigurator's library rather than as a single blob.
   */
  muster(exp, at, opts = {}) {
    const pool = Stores.figures;
    if (!pool.length) return { ok: false, reason: 'no curated figures loaded' };
    const fig = pool[Math.floor(exp.rng() * pool.length)];
    const asm = 'fig' + (exp.asmNo = (exp.asmNo || 0) + 1);
    // ── the standing minifig, taken from the bar rather than invented ──────
    // Three different kits author the identical skeleton — 7140's Biggs
    // Darklighter and Rebel Technician, and 1621's driver — so these are not
    // our numbers, they are LEGO's. Origins, not undersides: every offset is
    // relative to the TORSO origin at zero.
    //
    //   head  3626      y -24
    //   torso  973      y   0
    //   arms  3818/19   y  +9   x -/+15.552, splayed ~9.8 degrees at the shoulder
    //   hips  3815      y +32
    //   legs  3816/17   y +44
    //
    // The legs reach 28 LDU below their own origin, so the whole figure stands
    // on a deck when the torso origin is 72 above it.
    const SPLAY_L = [0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1];
    const SPLAY_R = [0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1];
    const BONE = {
      'HEAD':      [-24, 0, null], 'HEADGEAR': [-24, 0, null],
      'TORSO':     [0, 0, null],
      'LEFT ARM':  [9, -15.552, SPLAY_L], 'RIGHT ARM': [9, 15.552, SPLAY_R],
      'LEFT HAND': [24, -23.863, SPLAY_L], 'RIGHT HAND': [24, 23.863, SPLAY_R],
      'HIPS':      [32, 0, null],
      'LEGS':      [44, 0, null], 'LEFT LEG': [44, 0, null], 'RIGHT LEG': [44, 0, null]
    };
    const LEG_DROP = 72;                       // torso origin to the soles

    const deck = surfaceAt(exp, at.x, at.z);
    if (deck == null) return { ok: false, reason: 'no deck under ' + at.x + ',' + at.z };
    const torsoY = deck - LEG_DROP;

    const out = [];
    for (const p of (fig.parts || [])) {
      const id = String(p.filename || '').replace(/\.dat$/i, '');
      const part = Catalog.get(id);
      if (!part) continue;
      const bone = BONE[String(p.label || '').toUpperCase()] || BONE.TORSO;
      out.push({ part: id, color: p.colorCode != null ? p.colorCode : (fig.colorCode || 4),
                 pos: [at.x + bone[1], torsoY + bone[0], at.z],
                 mat: bone[2] || Geom.IDENT,
                 role: (p.label || 'part').toLowerCase(), module: 'crew:' + fig.id, asm });
    }
    if (!out.length) return { ok: false, reason: 'figure ' + fig.id + ' resolved to nothing' };
    settleGroup(out, deck);
    // A figure is not made of independently supported parts — a head rests on a
    // torso, not on the ground — so the group is exempted from the support
    // sweep and checked only for clashes, as one object.
    const c = commit(exp, out, { atomic: true, requireSupport: false, selfClash: false });
    if (!c.ok) return { ok: false, reason: c.reason };
    const asked = (fig.parts || []).length;
    return { ok: true, parts: c.parts,
             note: fig.title + ' — ' + (fig.archetype || '') +
                   (c.parts < asked ? '  (' + c.parts + ' of ' + asked + ' parts in the catalogue)' : '') };
  },

  /**
   * Assemble a vessel from the vehiculator's own library and stand it on the
   * site. vehicle-library.json has been loading on every page for months and
   * nothing has ever read it: Stores.vessels was live and no hand called it.
   * A vehicle is one object — chassis, then whatever sits on the chassis — so
   * it commits atomically and is exempt from the per-part support sweep the
   * way a figure is.
   */
  launch(exp, at, opts = {}) {
    const types = Stores.vessels;
    if (!types.length) return { ok: false, reason: 'no vessel types loaded' };
    const t = opts.type ? types.find(v => v.chassis && v.chassis.length && opts.type) || types[0]
                        : types[Math.floor(exp.rng() * types.length)];
    const pick = a => (a && a.length) ? a[Math.floor(exp.rng() * a.length)] : null;
    const idOf = e => e ? String(e.filename || '').replace(/\.dat$/i, '') : null;
    const partOf = e => { const id = idOf(e); return id ? Catalog.get(id) : null; };

    const chassisEntry = pick(t.chassis);
    const chassis = partOf(chassisEntry);
    if (!chassis) return { ok: false, reason: 'chassis not in the catalogue' };

    const deck = surfaceAt(exp, at.x, at.z);
    if (deck == null) return { ok: false, reason: 'no deck under ' + at.x + ',' + at.z };

    const cx = p => (p.b[0] + p.b[3]) / 2, cz = p => (p.b[2] + p.b[5]) / 2;
    const hOf = p => p.b[4] - p.b[1];
    const colour = opts.colour != null ? opts.colour
                 : [1, 4, 14, 15, 71, 72][Math.floor(exp.rng() * 6)];
    const asm = 'ves' + (exp.asmNo = (exp.asmNo || 0) + 1);

    const out = [{ part: idOf(chassisEntry), color: colour,
                   pos: [at.x - cx(chassis), deck - chassis.b[4], at.z - cz(chassis)],
                   mat: Geom.IDENT, role: 'chassis', module: 'vessel', asm }];

    // Everything else rides on the chassis deck, front to back along Z so a
    // windscreen does not land on top of an engine.
    let top = deck - hOf(chassis);
    const zSpan = chassis.b[5] - chassis.b[2];
    const riders = [['windscreen', -zSpan * 0.22], ['engine', zSpan * 0.26], ['wings', 0]];
    for (const [slot, dz] of riders) {
      const e = pick(t[slot]); const part = partOf(e);
      if (!part) continue;
      // Refuse a rider wider than the thing it rides on; that is how you get a
      // 6x8 fuselage panel balanced on a 4x4 car base.
      if ((part.b[3] - part.b[0]) > (chassis.b[3] - chassis.b[0]) * 1.6) continue;
      out.push({ part: idOf(e), color: colour,
                 pos: [at.x - cx(part), top - part.b[4], at.z + dz - cz(part)],
                 mat: Geom.IDENT, role: slot, module: 'vessel', asm });
    }

    // Wheels only where the chassis actually has pins for them. A train base
    // and a boat hull carry their own; bolting four more on is how a build
    // stops reading as a real thing.
    if (/wheel pins?/i.test(chassisEntry.description || '') && t.wheels && t.wheels.length) {
      const e = pick(t.wheels); const w = partOf(e);
      if (w && (w.b[3] - w.b[0]) < (chassis.b[3] - chassis.b[0])) {
        const ox = (chassis.b[3] - chassis.b[0]) / 2, oz = (chassis.b[5] - chassis.b[2]) / 2;
        for (const [sx, sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
          out.push({ part: idOf(e), color: 0,
                     pos: [at.x + sx * ox - cx(w), deck - w.b[4], at.z + sz * oz * 0.6 - cz(w)],
                     mat: Geom.IDENT, role: 'wheel', module: 'vessel', asm });
        }
      }
    }

    settleGroup(out, deck);
    const c = commit(exp, out, { atomic: true, requireSupport: false, selfClash: false });
    if (!c.ok) return { ok: false, reason: c.reason };
    const kind = (chassisEntry.description || 'vessel').split(/\s{2,}|\s+\d/)[0];
    return { ok: true, parts: c.parts, note: kind + ' — ' + out.length + ' pieces at ' + at.x + ',' + at.z };
  },

  /** Inspect. Facts only; the log records them whether or not they are good. */
  inspect(exp) {
    const scene = exp.scene();
    const a = N.Audit.run(scene, exp.brief);
    return { ok: true, audit: a,
             note: a.parts + ' parts · ' + (a.compiles ? 'compiles' : 'DOES NOT COMPILE') +
                   ' · ' + a.collisions + ' collisions · ' + a.floating + ' floating' };
  },

  /** Record. Emits the MPD and puts it on the bus. */
  record(exp) {
    const text = exp.toMPD();
    const sent = N.Bus.emit(exp.scene(), { name: exp.brief.title + ' · ' + exp.name }, 'nabugo-expedition');
    return { ok: true, parts: exp.site.count, note: (sent ? 'broadcast · ' : 'local · ') + text.length + ' bytes' };
  }
};

/** The highest solid surface at (x,z), or null if nothing is there. */
function surfaceAt(exp, x, z) {
  let best = null;
  for (const p of exp.site.places) {
    const b = Geom.worldBox(p);
    if (!b) continue;
    if (x < b.min[0] - 4 || x > b.max[0] + 4) continue;
    if (z < b.min[2] - 4 || z > b.max[2] + 4) continue;
    if (best == null || b.min[1] < best) best = b.min[1];   // Y-down: min is highest
  }
  return best;
}

/**
 * Somewhere with a deck under it. The purser used to compute one point,
 * `c.z + c.d/2 + 40` — forty LDU past the far edge of the claim — and muster
 * there. That is deliberately off the built footprint, so surfaceAt returned
 * null and every single figure in every single expedition was refused with
 * "no deck under". Six hundred pieces and not one minifig, all voyage.
 *
 * So: probe. On the claim first, because a figure standing on the thing is
 * more legible than one standing beside it, then the four approaches, then
 * anywhere on the site at all. First candidate with something underfoot wins.
 */
/**
 * Drop a finished assembly until its lowest part rests on the deck. The layer
 * table assumes a whole minifig — legs, hips, torso, arms, head — but several
 * of the curated figures resolve to only four parts in our catalogue, and a
 * figure with no legs placed by the table hovers twenty-eight LDU above the
 * ground and audits as four floating parts. Settling the group by its own
 * lowest point works whatever survived resolution.
 */
function settleGroup(out, deck) {
  let lowest = -Infinity;                 // Y is down: the lowest point is the largest Y
  for (const o of out) {
    const part = Catalog.get(o.part);
    if (!part) continue;
    const bottom = o.pos[1] + part.b[4];
    if (bottom > lowest) lowest = bottom;
  }
  if (lowest === -Infinity) return out;
  const dy = deck - lowest;
  if (dy) for (const o of out) o.pos[1] += dy;
  return out;
}

function roomAt(exp, x, z, half, height) {
  const deck = surfaceAt(exp, x, z);
  if (deck == null) return null;
  // Y is down: the deck is the smallest Y at this column, so the volume a
  // figure or a vessel needs is deck-height .. deck. A point with a deck under
  // it is not the same as a point with room on it — the first version checked
  // only the former and lost half its figures to "2 of 4 pieces clash".
  const box = { min: [x - half, deck - height, z - half], max: [x + half, deck - 2, z + half] };
  for (const p of exp.site.places) {
    const b = Geom.worldBox(p);
    if (b && Geom.penetration(box, b) > 0) return null;
  }
  return deck;
}

function standing(exp, need = {}) {
  const half = need.half == null ? 14 : need.half;
  const height = need.height == null ? 72 : need.height;
  const claims = exp.site.claims.filter(c => c.label !== 'ground');
  const cand = [];
  const jitter = f => Math.round((exp.rng() - 0.5) * f);
  for (const c of claims) {
    cand.push({ x: Math.round(c.x) + jitter(c.w * 0.5), z: Math.round(c.z) + jitter(c.d * 0.5) });
    for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      cand.push({ x: Math.round(c.x + dx * (c.w / 2 + 30)), z: Math.round(c.z + dz * (c.d / 2 + 30)) });
    }
  }
  // Last resort: stand on whatever has actually been laid, wherever that is.
  const places = exp.site.places;
  for (let i = 0; i < 24 && places.length; i++) {
    const p = places[Math.floor(exp.rng() * places.length)];
    const b = Geom.worldBox(p);
    if (b) cand.push({ x: Math.round((b.min[0] + b.max[0]) / 2), z: Math.round((b.min[2] + b.max[2]) / 2) });
  }
  for (let i = cand.length - 1; i > 0; i--) {            // seeded shuffle, not a fixed order
    const j = Math.floor(exp.rng() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t;
  }
  for (const c of cand) if (roomAt(exp, c.x, c.z, half, height) != null) return { x: c.x, z: c.z, y: 0 };
  return null;
}

// ═══════════════════════════════════════════════════════════════════ crew
/**
 * Each hand does one job per watch and says what it did. An expedition is the
 * roster plus the order they take their turn in.
 */
const CREW = {
  surveyor: {
    name: 'Surveyor', job: 'reads the brief and sets the next landfall',
    watch(exp) {
      const target = exp.ledger.next(exp.rng);
      if (!target) return { note: 'every void has been credited; nothing left to survey' };
      exp.target = target;
      exp.plan = exp.planFor(target);
      return { note: 'landfall on ' + target.id + ' — ' + target.narrative_need +
                     ' · plan: ' + exp.plan.map(p => p[0]).join(', ') };
    }
  },

  quarryman: {
    name: 'Quarryman', job: 'draws a palette from the active ecologies',
    watch(exp) {
      const t = exp.target;
      const ecos = (t && t.ecologies) || exp.brief.ecologies || E.Ecology.ids().slice(0, 3);
      const lex = (exp.brief.zones[(t && t.zone) || 3] || {}).lex || [];
      exp.palette = new M.Palette(ecos, lex, exp.rng);
      // Fixing the load-bearing roles up front is what makes a district read as
      // one place: the same column, the same paving, all the way across it.
      const chosen = ['slab','tile','shaft','capital','base','beam','rake']
        .map(r => { const p = exp.palette.get(r); return p ? r + '=' + p.id : null; })
        .filter(Boolean);
      return { note: ecos.length + ' ecologies · ' + chosen.join(' ') };
    }
  },

  bosun: {
    name: 'Bosun', job: 'lays the ground a district stands on',
    watch(exp) {
      if (!exp.plan || !exp.plan.length) return { note: 'no plan to ground' };
      const at = exp.nextPlot();
      const r = Tools.layGround(exp, at);
      return r.ok ? { parts: r.parts, note: 'ground at ' + at.x + ',' + at.z + ' — ' + r.note }
                  : { note: 'no ground laid: ' + r.reason };
    }
  },

  mason: {
    name: 'Mason', job: 'raises structures out of modules',
    watch(exp) {
      if (!exp.plan || !exp.plan.length) return { note: 'nothing on the plan' };
      // Largest first. Taking the plan in order meant the small work seeded the
      // middle of the site and the temple was then refused for want of ground.
      const RANK = { temple: 5, pavilion: 4, ruin: 3, gardens: 3, harbour: 2, shrine: 1, wreck: 1 };
      exp.plan.sort((a, b) => (RANK[b[0]] || 0) - (RANK[a[0]] || 0));
      const [name, opts] = exp.plan.shift();
      const r = Tools.raise(exp, name, opts);
      if (!r.ok) return { note: 'refused: ' + r.reason };
      return { parts: r.parts,
               note: 'raised ' + name + ' at ' + r.at.x + ',' + r.at.z +
                     ' · ' + r.parts + ' pieces, ' + r.height + ' LDU tall' +
                     (r.dropped ? ' (' + r.dropped + ' settled out)' : '') +
                     (r.unsupported ? ' (' + r.unsupported + ' unsupported, refused)' : '') };
    }
  },

  naturalist: {
    name: 'Naturalist', job: 'lets the sea back in',
    watch(exp) {
      const r = Tools.raise(exp, 'reef', { clumps: 18 + Math.floor(exp.rng() * 14), spread: 150 });
      return r.ok ? { parts: r.parts, note: 'reef of ' + r.parts + ' at ' + r.at.x + ',' + r.at.z }
                  : { note: 'no reef: ' + r.reason };
    }
  },

  shipwright: {
    name: 'Shipwright', job: 'wrecks and moorings',
    watch(exp) {
      const r = Tools.raise(exp, 'harbour', { ribs: 6 + Math.floor(exp.rng() * 4) });
      return r.ok ? { parts: r.parts, note: 'harbour works, ' + r.parts + ' pieces' }
                  : { note: 'no harbour: ' + r.reason };
    }
  },

  purser: {
    name: 'Purser', job: 'musters the crew onto the site',
    watch(exp) {
      const at = standing(exp, { half: 14, height: 76 });
      if (!at) return { note: 'nowhere with room to stand' };
      const r = Tools.muster(exp, at);
      return r.ok ? { parts: r.parts, note: r.note + ' at ' + at.x + ',' + at.z }
                  : { note: 'no muster: ' + r.reason };
    }
  },

  coxswain: {
    name: 'Coxswain', job: 'brings a vessel alongside',
    watch(exp) {
      const at = standing(exp, { half: 46, height: 56 });
      if (!at) return { note: 'no quay with room alongside' };
      const r = Tools.launch(exp, at);
      return r.ok ? { parts: r.parts, note: r.note } : { note: 'no vessel: ' + r.reason };
    }
  },

  inspector: {
    name: 'Inspector', job: 'checks that what stands, stands',
    watch(exp) {
      const r = Tools.inspect(exp);
      exp.lastAudit = r.audit;
      if (exp.target && r.audit.parts > (exp.creditedAt || 0) + 40) {
        exp.ledger.credit(exp.target.id, {
          round: exp.watchNo, audit: r.audit,
          judgment: { void: { score: 0.7, evidence: r.note } }
        });
        exp.creditedAt = r.audit.parts;
      }
      return { note: r.note };
    }
  },

  draughtsman: {
    name: 'Draughtsman', job: 'records the state of the works',
    watch(exp) {
      const r = Tools.record(exp);
      return { note: r.note };
    }
  }
};

// ══════════════════════════════════════════════════════════════ expedition
/**
 * A voyage. Give it a brief, a roster, and a target piece count, then keep
 * calling `watch()`. It is slow on purpose: a city is not one gesture.
 */
class Expedition {
  constructor(opts = {}) {
    this.name = opts.name || 'Expedition';
    this.brief = opts.brief || N.Brief.BRIEFS.atlantis;
    this.roster = opts.roster ||
      ['surveyor','quarryman','bosun','mason','mason','mason','mason','naturalist',
       'mason','shipwright','mason','purser','mason','coxswain','mason','naturalist',
       'purser','mason','inspector'];
    this.target = null;
    this.plan = [];
    this.palette = null;
    this.watchNo = 0;
    this.maxWatches = opts.maxWatches || 400;
    this.piecesWanted = opts.pieces || 1500;
    this.site = new M.Site({ extent: opts.extent || 1400 });
    this.maxExtent = opts.maxExtent || 4200;
    this.ledger = new E.VoidLedger(this.brief);
    this.log = [];
    this.creditedAt = 0;
    this.lastAudit = null;
    this.rng = N.mulberry32(opts.seed ?? 20250822);
    this.settled = false;
    this.plotRing = 0;
    this.palettes = [];
  }

  /** What the mason should build for this void. */
  planFor(target) {
    const z = target.zone || 3;
    const pick = a => a[Math.floor(this.rng() * a.length)];
    const big = () => ['temple', { columns: 5 + Math.floor(this.rng() * 4),
                                   drums: 6 + Math.floor(this.rng() * 4) }];
    if (z === 1) return [big(), ['pavilion', {}], ['shrine', {}]];
    if (z === 2) return [big(), ['pavilion', { columns: 6 + Math.floor(this.rng() * 4) }],
                         pick([['ruin', {}], ['shrine', {}]])];
    if (z === 3) return [['ruin', { columns: 4 + Math.floor(this.rng() * 3) }],
                         ['gardens', { clumps: 24 + Math.floor(this.rng() * 16) }],
                         ['rubblefield', { stones: 18 }]];
    return [['harbour', { ribs: 6 + Math.floor(this.rng() * 5) }],
            ['gardens', { clumps: 20 }], ['wreck', {}]];
  }

  nextPlot() {
    const r = 120 + this.plotRing * 90;
    const a = this.rng() * Math.PI * 2;
    this.plotRing = (this.plotRing + 1) % 8;
    return { x: Math.round(Math.cos(a) * r / 20) * 20, z: Math.round(Math.sin(a) * r / 20) * 20 };
  }

  ctx() {
    if (!this.palette) this.palette = new M.Palette(this.brief.ecologies, [], this.rng);
    return {
      palette: this.palette, origin: { x: 0, z: 0 }, rng: this.rng,
      colorOf: role => this.colorOf(role)
    };
  }

  colorOf(role) {
    const c = this.colors || (this.colors = {
      slab: 71, tile: 15, shaft: 15, capital: 15, base: 71, beam: 71, rake: 15,
      tread: 71, block: 71, coral: 2, frond: 2, rubble: 72, hull: 70, spar: 70,
      dome: 15, relic: 14, ground: 71
    });
    return c[role] != null ? c[role] : 71;
  }

  /** One unit of work. Returns the log entry, or null once the voyage is over. */
  /**
   * Choose whose watch it is. A hand that has failed twice running is stood
   * down for a while: the first version kept the roster in strict rotation, so
   * once the site filled up the mason was refused every third watch and the log
   * became nothing but the purser mustering another minifig.
   */
  nextHand() {
    this.idle = this.idle || {};
    for (let i = 0; i < this.roster.length; i++) {
      const who = this.roster[(this.watchNo + i) % this.roster.length];
      if ((this.idle[who] || 0) <= 0) return who;
    }
    for (const k in this.idle) this.idle[k] = 0;      // everyone rested; carry on
    return this.roster[this.watchNo % this.roster.length];
  }

  watch() {
    if (this.settled) return null;
    this.watchNo++;
    const who = this.nextHand();
    const hand = CREW[who];
    const before = this.site.count;

    let out;
    try { out = hand.watch(this) || {}; }
    catch (e) { out = { note: 'error: ' + e.message }; }

    // Bookkeeping for the rotation, and for the ground.
    this.idle = this.idle || {};
    for (const k in this.idle) if (this.idle[k] > 0) this.idle[k]--;
    if (this.site.count === before) {
      this.idle[who] = (this.idle[who] || 0) + 2;
      this.barren = (this.barren || 0) + 1;
      // The site is full. A survey does not stop at the first fence: take in
      // more ground and carry on, up to a stated limit.
      if (this.barren >= 6 && this.site.extent < this.maxExtent) {
        this.site.extent = Math.min(this.maxExtent, Math.round(this.site.extent * 1.35));
        this.barren = 0;
        out.note = (out.note ? out.note + ' · ' : '') +
                   'ground exhausted — survey extended to ' + this.site.extent + ' LDU';
      }
    } else {
      this.barren = 0;
    }

    const entry = {
      watch: this.watchNo, who: hand.name, job: hand.job,
      parts: this.site.count - before,
      total: this.site.count,
      note: out.note || '',
      target: this.target ? this.target.id : null
    };
    this.log.push(entry);

    if (this.site.count >= this.piecesWanted || this.watchNo >= this.maxWatches) this.settled = true;
    return entry;
  }

  run(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const e = this.watch();
      if (!e) break;
      out.push(e);
    }
    return out;
  }

  scene() {
    const s = new N.Scene(this.brief.title + ' · ' + this.name);
    for (const p of this.site.places) {
      s.add({ part: p.part, color: p.color, pos: p.pos, mat: p.mat,
              vignette: p.module, strategy: p.role, zone: 2, asm: p.asm });
    }
    return s;
  }

  audit() { return N.Audit.run(this.scene(), this.brief); }

  toMPD() {
    const a = this.audit();
    return this.scene().toMPD({
      filename: 'nabugo-' + this.name.toLowerCase().replace(/\W+/g, '-') + '.mpd',
      author: 'Nabugo · ' + this.name,
      brief: this.brief.title + ' — ' + this.brief.description,
      meta: { expedition: this.name, watches: this.watchNo, parts: a.parts,
              unique: a.unique, collisions: a.collisions, floating: a.floating,
              modules: this.site.log.length, ledger: this.ledger.summary() }
    });
  }

  /** What has been raised, by module type — the manifest of the works. */
  manifest() {
    const by = new Map();
    for (const r of this.site.log) {
      const e = by.get(r.module) || { module: r.module, n: 0, parts: 0 };
      e.n++; e.parts += r.parts;
      by.set(r.module, e);
    }
    const crewParts = this.site.places.filter(p => String(p.module).startsWith('crew:')).length;
    if (crewParts) by.set('crew', { module: 'crew', n: 1, parts: crewParts });
    return [...by.values()].sort((a, b) => b.parts - a.parts);
  }
}

global.NabugoCrew = { Stores, Tools, CREW, Expedition };
})(typeof window !== 'undefined' ? window : globalThis);

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

  for (const p of places) {
    const box = Geom.worldBox(p);
    if (!box) { clashed++; continue; }
    const hitsWorld = exp.site.places.some(q => {
      const b = Geom.worldBox(q);
      return b && Geom.penetration(box, b) > 0;
    });
    if (hitsWorld || boxes.some(b => Geom.penetration(box, b) > 0)) { clashed++; continue; }
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
    // Y offsets down a standing minifig, LDraw Y-down: legs, torso, arms, head.
    const LAYER = { 'LEGS': 0, 'HIPS': 0, 'TORSO': -28, 'LEFT ARM': -28,
                    'RIGHT ARM': -28, 'LEFT HAND': -28, 'RIGHT HAND': -28, 'HEAD': -56 };
    // Stand on whatever is actually underfoot at (x,z), not at y=0.
    const deck = surfaceAt(exp, at.x, at.z);
    if (deck == null) return { ok: false, reason: 'no deck under ' + at.x + ',' + at.z };

    const out = [];
    for (const p of (fig.parts || [])) {
      const id = String(p.filename || '').replace(/\.dat$/i, '');
      const part = Catalog.get(id);
      if (!part) continue;
      const dy = LAYER[p.label] != null ? LAYER[p.label] : -28;
      out.push({ part: id, color: p.colorCode != null ? p.colorCode : (fig.colorCode || 4),
                 pos: [at.x - (part.b[0] + part.b[3]) / 2, deck + dy - part.b[4],
                       at.z - (part.b[2] + part.b[5]) / 2],
                 mat: Geom.IDENT,
                 role: (p.label || 'part').toLowerCase(), module: 'crew:' + fig.id });
    }
    if (!out.length) return { ok: false, reason: 'figure ' + fig.id + ' resolved to nothing' };
    // A figure is not made of independently supported parts — a head rests on a
    // torso, not on the ground — so the group is exempted from the support
    // sweep and checked only for clashes, as one object.
    const c = commit(exp, out, { atomic: true, requireSupport: false });
    if (!c.ok) return { ok: false, reason: c.reason };
    return { ok: true, parts: c.parts, note: fig.title + ' — ' + (fig.archetype || '') };
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
      const claims = exp.site.claims.filter(c => c.label !== 'ground');
      if (!claims.length) return { note: 'nowhere to stand yet' };
      const c = claims[Math.floor(exp.rng() * claims.length)];
      const at = { x: Math.round(c.x + (exp.rng() - 0.5) * c.w * 0.6),
                   z: Math.round(c.z + c.d / 2 + 40), y: 0 };
      const r = Tools.muster(exp, at);
      return r.ok ? { parts: r.parts, note: r.note + ' at ' + at.x + ',' + at.z }
                  : { note: 'no muster: ' + r.reason };
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
       'mason','shipwright','mason','purser','mason','naturalist','inspector'];
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
              vignette: p.module, strategy: p.role, zone: 2 });
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

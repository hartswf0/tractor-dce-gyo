/**
 * NABUGO EVO — evolutionary ecology of construction
 * =================================================
 * Layered on nabugo.js. The separation it exists to enforce:
 *
 *     The judges supply selective pressure.
 *     The compiler defines viability.
 *
 * A visually convincing candidate does not survive if its bricks float,
 * collide, reference parts that do not exist, or fail to connect. No judge can
 * overrule that, and no compiler can declare a temple narratively convincing.
 *
 * Nothing here authors coordinates in prose. A genome states *relationships* —
 * this attaches to that, by this port, repeated bilaterally — and the compiler
 * resolves exact positions against the port registry extracted from the real
 * library. That is where hallucinated geometry would otherwise enter.
 *
 *   NabugoPorts     where a part can actually be joined
 *   NabugoEcology   associations that cut sideways across the taxonomy
 *   NabugoBag       a temporary population drawn into one void
 *   NabugoGenome    a relational assembly plan + its mutation operators
 *   NabugoCompiler  genome -> placements, or a repair report
 *   NabugoViability hard gates: facts, not opinions
 *   NabugoJudges    a judge ecology, kept on a Pareto frontier
 *   NabugoArchive   viable / selected / novel / deceptive / repairable / fossil
 *   NabugoVoid      the void ledger that replaces a fidelity percentage
 *   NabugoFinch     a beak: one temperament over the same gene pool
 */
(function (global) {
'use strict';
const N = global.Nabugo;
if (!N) throw new Error('nabugo-evo.js requires nabugo.js');

const { Geom, Catalog, Scene, Brief } = N;
const AXES = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];
const UP = 3;    // -Y. LDraw's Y points down, so up is negative.
const DOWN = 2;

// ══════════════════════════════════════════════════════════════════════ ports
const NabugoPorts = (() => {
  let map = {}, loaded = false, meta = null;
  const normalized = new Map();

  async function load(url = './nabugo-ports.json') {
    if (loaded) return meta;
    const res = await fetch(url);
    if (!res.ok) throw new Error('port registry unavailable: HTTP ' + res.status);
    const j = await res.json();
    map = j.map;
    meta = { parts: j.parts, ports: j.ports, generated: j.generated };
    loaded = true;
    return meta;
  }

  /**
   * Ports for a part. Baseplates and other large lattices were omitted from
   * the registry because storing a thousand studs each would dwarf it; their
   * lattice is regular, so it is synthesised from the footprint instead.
   */
  function of(id) {
    const rec = map[id];
    if (rec) {
      if (normalized.has(id)) return normalized.get(id);
      const part = Catalog.get(id);
      if (!part) return rec;
      // The LDraw tube primitive starts inside the underside cavity. Its
      // origin is geometry, not the insertion plane. Move female ports to the
      // underside insertion plane. For a normal brick this corrects y=4 to
      // y=24; aligning y=4 was burying each new brick twenty LDU inside its
      // parent. Lateral sockets need their own cavity-depth extractor and are
      // deliberately left untouched here.
      const b = part.b;
      const seated = rec.map(p => {
        if (p[0] !== 1) return p;
        const q = p.slice();
        if (q[4] === 2) q[2] = b[4];
        return q;
      });
      normalized.set(id, seated);
      return seated;
    }
    return synthesise(id);
  }

  function synthesise(id) {
    const p = Catalog.get(id);
    if (!p) return [];
    const [x0, y0, , x1, , z1] = [p.b[0], p.b[1], p.b[2], p.b[3], p.b[4], p.b[5]];
    const z0 = p.b[2];
    const nx = Math.max(1, Math.round((x1 - x0) / 20));
    const nz = Math.max(1, Math.round((z1 - z0) / 20));
    // Only lattices omitted by build-nabugo-ports (more than MAX_PORTS=48)
    // may be reconstructed. The old fallback invented studs on every part
    // absent from the registry: tiles, animals, plants and accessories became
    // fake baseplates just because their AABB happened to span 20 LDU.
    if (nx * nz <= 48 || nx * nz > 4096 || !/baseplate|plate|brick/i.test(p.c + ' ' + p.d)) return [];
    const out = [];
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      out.push([0, Math.round(x0 + 10 + i*20), Math.round(y0 + 4), Math.round(z0 + 10 + k*20), UP]);
    }
    return out;
  }

  const studs = id => of(id).filter(p => p[0] === 0);
  const tubes = id => of(id).filter(p => p[0] === 1);
  /** Ports on the part's upward face — where something can be stacked. */
  const topStuds = id => studs(id).filter(p => p[4] === UP);
  const undersideTubes = id => tubes(id).filter(p => p[4] === DOWN);
  const has = id => !!map[id];

  return { load, of, studs, tubes, topStuds, undersideTubes, has, get meta(){ return meta; },
           get count(){ return Object.keys(map).length; } };
})();

// ═══════════════════════════════════════════════════════════════════ ecology
/**
 * An ecology is not another category. If "Atlantis" is a folder of hand-picked
 * blue bricks we have rebuilt the taxonomy under a thematic name. An ecology
 * cuts sideways: it names guilds (roles a part can play) and recruits across
 * kingdoms to fill them, and it keeps a list of neighbours it can borrow from.
 *
 * The interesting members are usually not the central ones. A windscreen is a
 * cockpit to the vehicle ecology, a dome to the location ecology, and a flooded
 * enclosure to Atlantis — a keystone part, because it lets ecologies exchange
 * material.
 */
const NabugoEcology = (() => {

  const GUILDS = ['anchors', 'supports', 'membranes', 'signals', 'inhabitants', 'connectors'];

  const ECOLOGIES = {
    eco_monumental_architecture: {
      id: 'eco_monumental_architecture', name: 'Monumental Architecture',
      habitat: ['vertical', 'ceremonial'],
      guilds: {
        anchors:     { cat: /baseplate|brick/i, lex: ['baseplate','large','base'] },
        supports:    { cat: /brick|arch|panel|slope/i, lex: ['arch','column','cylinder','support','pillar'] },
        membranes:   { cat: /panel|tile|wall/i, lex: ['panel','wall','tile','facade'] },
        signals:     { cat: /flag|antenna|cone/i, lex: ['spire','flag','finial','cone'] },
        connectors:  { cat: /plate|bracket|hinge/i, lex: ['plate','bracket','jumper'] },
        inhabitants: { cat: /minifig/i, lex: ['torso','head','legs'] }
      },
      neighbours: ['eco_ruin', 'eco_ritual', 'eco_curved_enclosure']
    },
    eco_aquatic_membrane: {
      id: 'eco_aquatic_membrane', name: 'Aquatic Membrane',
      habitat: ['underwater', 'enclosing'],
      guilds: {
        anchors:     { cat: /dish|baseplate/i, lex: ['dish','radar','base'] },
        supports:    { cat: /cylinder|cone|brick/i, lex: ['cylinder','round','curved'] },
        membranes:   { cat: /windscreen|panel|glass/i, lex: ['windscreen','canopy','glass','trans','dome','sail'] },
        signals:     { cat: /antenna|bar/i, lex: ['antenna','crystal','trans'] },
        connectors:  { cat: /hose|technic|plate/i, lex: ['hose','flexible','tube'] },
        inhabitants: { cat: /animal/i, lex: ['fish','shark','octopus','shell','fin','tail'] }
      },
      neighbours: ['eco_animal_morphology', 'eco_curved_enclosure', 'eco_luminous_machine']
    },
    eco_animal_morphology: {
      id: 'eco_animal_morphology', name: 'Animal Morphology',
      habitat: ['organic'],
      guilds: {
        anchors:     { cat: /animal/i, lex: ['body','torso','shell'] },
        supports:    { cat: /animal|bar/i, lex: ['leg','limb','bone','spine'] },
        membranes:   { cat: /animal|wing/i, lex: ['wing','fin','shell','scale'] },
        signals:     { cat: /animal/i, lex: ['horn','tooth','claw','antenna','tail'] },
        connectors:  { cat: /hinge|bar|animal/i, lex: ['joint','neck','tail'] },
        inhabitants: { cat: /animal/i, lex: ['animal','creature'] }
      },
      neighbours: ['eco_aquatic_membrane', 'eco_ruin']
    },
    eco_technic_motion: {
      id: 'eco_technic_motion', name: 'Technic Motion',
      habitat: ['mobile', 'mechanical'],
      guilds: {
        anchors:     { cat: /technic/i, lex: ['beam','brick','frame'] },
        supports:    { cat: /technic/i, lex: ['axle','liftarm','beam'] },
        membranes:   { cat: /technic|panel/i, lex: ['panel','fairing'] },
        signals:     { cat: /technic|wheel/i, lex: ['gear','propeller','turntable','wheel'] },
        connectors:  { cat: /technic/i, lex: ['pin','connector','axle','joiner'] },
        inhabitants: { cat: /minifig/i, lex: ['torso'] }
      },
      neighbours: ['eco_luminous_machine', 'eco_monumental_architecture']
    },
    eco_curved_enclosure: {
      id: 'eco_curved_enclosure', name: 'Curved Enclosure',
      habitat: ['enclosing'],
      guilds: {
        anchors:     { cat: /dish|cylinder/i, lex: ['dish','cylinder','round'] },
        supports:    { cat: /arch|slope|cone/i, lex: ['arch','curved','bow','cone'] },
        membranes:   { cat: /panel|windscreen|dish/i, lex: ['curved','dome','shell','canopy'] },
        signals:     { cat: /cone|antenna/i, lex: ['spike','cone'] },
        connectors:  { cat: /hinge|plate/i, lex: ['hinge','clip','curved'] },
        inhabitants: { cat: /minifig/i, lex: ['head'] }
      },
      neighbours: ['eco_aquatic_membrane', 'eco_monumental_architecture']
    },
    eco_luminous_machine: {
      id: 'eco_luminous_machine', name: 'Luminous Machine',
      habitat: ['mechanical', 'signalling'],
      guilds: {
        anchors:     { cat: /electric|brick/i, lex: ['light','electric','base'] },
        supports:    { cat: /technic|brick/i, lex: ['frame','beam'] },
        membranes:   { cat: /panel|glass/i, lex: ['trans','glass','lens'] },
        signals:     { cat: /antenna|cone|bar/i, lex: ['trans','crystal','antenna','light','lamp'] },
        connectors:  { cat: /technic|plate/i, lex: ['connector','clip'] },
        inhabitants: { cat: /minifig/i, lex: ['helmet'] }
      },
      neighbours: ['eco_technic_motion', 'eco_aquatic_membrane']
    },
    eco_ruin: {
      id: 'eco_ruin', name: 'Ruin',
      habitat: ['ruined', 'ancient'],
      guilds: {
        anchors:     { cat: /rock|brick|baseplate/i, lex: ['rock','boulder','ruin'] },
        supports:    { cat: /brick|arch/i, lex: ['broken','column','arch'] },
        membranes:   { cat: /slope|panel|tile/i, lex: ['rubble','slope','rough'] },
        signals:     { cat: /plant|animal/i, lex: ['plant','vine','growth','seaweed'] },
        connectors:  { cat: /plate/i, lex: ['plate'] },
        inhabitants: { cat: /minifig|animal/i, lex: ['skeleton','bone'] }
      },
      neighbours: ['eco_monumental_architecture', 'eco_animal_morphology']
    },
    eco_ritual: {
      id: 'eco_ritual', name: 'Ritual / Ceremonial',
      habitat: ['ceremonial'],
      guilds: {
        anchors:     { cat: /brick|plate/i, lex: ['altar','base','pedestal'] },
        supports:    { cat: /brick|cylinder/i, lex: ['column','pillar'] },
        membranes:   { cat: /flag|tile/i, lex: ['banner','flag','cloth'] },
        signals:     { cat: /minifig accessory|bar/i, lex: ['staff','crown','sword','trident','spear','goblet','horn'] },
        connectors:  { cat: /plate|clip/i, lex: ['clip','holder'] },
        inhabitants: { cat: /minifig/i, lex: ['torso','headwear','crown','cape'] }
      },
      neighbours: ['eco_monumental_architecture', 'eco_ruin']
    }
  };

  // Pools are properties of the catalogue, so they are built once per guild.
  const cache = new Map();

  function members(ecoId, guild) {
    const key = ecoId + '/' + guild;
    if (cache.has(key)) return cache.get(key);
    const eco = ECOLOGIES[ecoId];
    const spec = eco && eco.guilds[guild];
    if (!spec) { cache.set(key, []); return []; }

    const scored = [];
    for (const p of Catalog.all()) {
      if (Geom.worldBox({ part: p.id, pos: [0,0,0], mat: Geom.IDENT }) === null) continue;
      const extent = Math.max(p.b[3] - p.b[0], p.b[5] - p.b[2]);
      if (extent > 240) continue;                    // cell-scale work only
      let s = 0;
      if (spec.cat.test(p.c)) s += 0.5;
      for (const w of spec.lex) if (p._t.includes(w)) s += 0.28;
      if (s <= 0.2) continue;
      // Every non-root genome member must be placeable by the compiler we
      // actually have. Clip/bar, pin/axle and minifig joints will join this
      // pool only when their port families exist; until then they cannot leak
      // through as floating decoration.
      if (guild !== 'anchors' && !NabugoPorts.undersideTubes(p.id).length) continue;
      if (NabugoPorts.of(p.id).length) s += 0.15;
      scored.push({ p, s });
    }
    scored.sort((a, b) => b.s - a.s);
    const list = scored.slice(0, 400).map(x => x.p);
    cache.set(key, list);
    return list;
  }

  /**
   * A part that scores in several ecologies at once. These are the ones worth
   * noticing: they let ecologies exchange material, and they are usually where
   * a surprising construction comes from.
   */
  function keystones(ecoIds, limit = 12) {
    const tally = new Map();
    for (const id of ecoIds) {
      for (const g of GUILDS) {
        for (const p of members(id, g).slice(0, 60)) {
          const rec = tally.get(p.id) || { p, ecos: new Set(), guilds: new Set() };
          rec.ecos.add(id); rec.guilds.add(g);
          tally.set(p.id, rec);
        }
      }
    }
    return [...tally.values()]
      .filter(r => r.ecos.size > 1)
      .sort((a, b) => (b.ecos.size * 2 + b.guilds.size) - (a.ecos.size * 2 + a.guilds.size))
      .slice(0, limit)
      .map(r => ({ part: r.p, ecologies: [...r.ecos], guilds: [...r.guilds] }));
  }

  return { ECOLOGIES, GUILDS, members, keystones,
           get(id) { return ECOLOGIES[id]; },
           ids() { return Object.keys(ECOLOGIES); } };
})();

// ═══════════════════════════════════════════════════════════════════════ bag
/**
 * A bag is not twenty unrelated parts; it is a small viable population. It
 * needs internal complementarity — something to anchor, something to span,
 * something to enclose — plus migrants and wild cards so the ecology cannot
 * close around its own clichés.
 */
const NabugoBag = (() => {

  function draw(spec, rng) {
    const { ecologies, composition, migrantFrom, wild } = spec;
    const out = [];
    const taken = new Set();

    const pick = (pool, n, tag, eco) => {
      let guard = 0;
      while (n > 0 && guard++ < n * 40 && pool.length) {
        // Sample from the head so repeated draws differ without going uniform,
        // which would just return whatever dominates the archive.
        const i = Math.floor(Math.pow(rng(), 1.7) * pool.length);
        const p = pool[i];
        if (!p || taken.has(p.id)) continue;
        taken.add(p.id);
        out.push({ part: p, guild: tag, ecology: eco });
        n--;
      }
    };

    for (const [guild, count] of Object.entries(composition)) {
      const eco = ecologies[Math.floor(rng() * ecologies.length)];
      pick(NabugoEcology.members(eco, guild), count, guild, eco);
    }

    // A migrant is a part from a neighbouring ecology. A Matrix-machine part
    // entering Atlantis may become a tidal engine; an animal part entering
    // architecture may become a ribbed vault.
    if (migrantFrom > 0) {
      const neigh = new Set();
      for (const e of ecologies) for (const nb of (NabugoEcology.get(e)?.neighbours || [])) neigh.add(nb);
      const list = [...neigh];
      if (list.length) {
        const eco = list[Math.floor(rng() * list.length)];
        const g = NabugoEcology.GUILDS[Math.floor(rng() * NabugoEcology.GUILDS.length)];
        pick(NabugoEcology.members(eco, g), migrantFrom, 'migrant', eco);
      }
    }

    // Unconditioned. Without this the population inbreeds.
    if (wild > 0) {
      const all = Catalog.all();
      let guard = 0;
      let n = wild;
      while (n > 0 && guard++ < wild * 60) {
        const p = all[Math.floor(rng() * all.length)];
        if (!p || taken.has(p.id)) continue;
        if (Math.max(p.b[3]-p.b[0], p.b[5]-p.b[2]) > 240) continue;
        taken.add(p.id);
        out.push({ part: p, guild: 'wild', ecology: null });
        n--;
      }
    }
    return out;
  }

  return { draw };
})();

// ════════════════════════════════════════════════════════════════════ genome
/**
 * A relational assembly plan. Note what is absent: no coordinates, no rotation
 * matrices, no part paths invented in prose. The genome says what attaches to
 * what and how it repeats; the compiler works out whether that is possible and
 * where it lands.
 */
class NabugoGenome {
  constructor(claim, ecologyMix) {
    this.claim = claim;
    this.ecologyMix = ecologyMix || [];
    this.assemblies = [];   // {id, role, part, attach:{target, port}, repeat, symmetry}
    this.lineage = [];      // operator names applied, oldest first
    this.id = 'g' + Math.random().toString(36).slice(2, 8);
  }

  add(a) { this.assemblies.push(a); return this; }

  clone() {
    const g = new NabugoGenome(this.claim, this.ecologyMix.slice());
    g.assemblies = this.assemblies.map(a => ({ ...a, attach: a.attach ? { ...a.attach } : null }));
    g.lineage = this.lineage.slice();
    g.parent = this.id;
    return g;
  }

  /**
   * Compose a genome from a bag. Anchors go down first, supports attach to
   * them, membranes and signals attach upward from there — lower and enabling
   * conditions before upper and decorative ones.
   */
  static fromBag(bag, claim, ecologyMix, rng, opts = {}) {
    const g = new NabugoGenome(claim, ecologyMix);
    const byGuild = k => bag.filter(b => b.guild === k);
    const anchors = byGuild('anchors'), supports = byGuild('supports');
    const membranes = byGuild('membranes'), signals = byGuild('signals');
    const others = bag.filter(b => ['migrant','wild','inhabitants','connectors'].includes(b.guild));

    const base = anchors[0] || supports[0] || bag[0];
    if (!base) return g;
    g.add({ id: 'a_base', role: 'foundation', part: base.part.id, ecology: base.ecology, attach: null });

    supports.slice(0, opts.supports ?? 3).forEach((s, i) =>
      g.add({ id: 'a_sup' + i, role: 'vertical_support', part: s.part.id, ecology: s.ecology,
              attach: { target: 'a_base', port: 'top' },
              repeat: i === 0 && rng() < 0.5 ? 2 : 1,
              symmetry: 'bilateral' }));

    membranes.slice(0, opts.membranes ?? 2).forEach((m, i) =>
      g.add({ id: 'a_mem' + i, role: 'enclosure', part: m.part.id, ecology: m.ecology,
              attach: { target: g.assemblies[1] ? g.assemblies[1].id : 'a_base', port: 'top' } }));

    signals.slice(0, opts.signals ?? 2).forEach((s, i) =>
      g.add({ id: 'a_sig' + i, role: 'crown', part: s.part.id, ecology: s.ecology,
              attach: { target: 'a_base', port: 'top' } }));

    others.slice(0, opts.others ?? 2).forEach((o, i) =>
      g.add({ id: 'a_oth' + i, role: o.guild === 'migrant' ? 'migrant_organ' : 'ornament',
              part: o.part.id, ecology: o.ecology,
              attach: { target: 'a_base', port: 'top' } }));

    return g;
  }
}

// ══════════════════════════════════════════════════════════════════ operators
/**
 * Variation. Each returns a new genome and records itself in the lineage, so a
 * survivor can always explain how it came to be.
 */
const NabugoOperators = (() => {

  function substitute(g, bag, rng) {
    const out = g.clone();
    const targets = out.assemblies.filter(a => a.role !== 'foundation');
    if (!targets.length || !bag.length) return out;
    const a = targets[Math.floor(rng() * targets.length)];
    const b = bag[Math.floor(rng() * bag.length)];
    a.part = b.part.id; a.ecology = b.ecology;
    out.lineage.push('substitute:' + a.role);
    return out;
  }

  function repeat(g, rng) {
    const out = g.clone();
    const targets = out.assemblies.filter(a => a.attach);
    if (!targets.length) return out;
    const a = targets[Math.floor(rng() * targets.length)];
    a.repeat = Math.min(6, (a.repeat || 1) + 1 + Math.floor(rng() * 2));
    a.symmetry = rng() < 0.6 ? 'bilateral' : 'radial';
    out.lineage.push('repeat:' + a.role + 'x' + a.repeat);
    return out;
  }

  function rotate(g, rng) {
    const out = g.clone();
    const targets = out.assemblies.filter(a => a.attach);
    if (!targets.length) return out;
    const a = targets[Math.floor(rng() * targets.length)];
    a.spin = [0, 90, 180, 270][Math.floor(rng() * 4)];
    out.lineage.push('rotate:' + a.role + '@' + a.spin);
    return out;
  }

  /** Controlled incompleteness. A ruin is not a failed temple. */
  function damage(g, rng) {
    const out = g.clone();
    const targets = out.assemblies.filter(a => a.role !== 'foundation');
    if (targets.length < 2) return out;
    const a = targets[Math.floor(rng() * targets.length)];
    out.assemblies = out.assemblies.filter(x => x !== a);
    out.lineage.push('damage:-' + a.role);
    return out;
  }

  /** Bring a part in from a neighbouring ecology and give it a structural job. */
  function migrate(g, rng) {
    const out = g.clone();
    const neigh = new Set();
    for (const e of out.ecologyMix) for (const nb of (NabugoEcology.get(e)?.neighbours || [])) neigh.add(nb);
    const list = [...neigh];
    if (!list.length) return out;
    const eco = list[Math.floor(rng() * list.length)];
    const guild = ['supports','membranes','signals'][Math.floor(rng() * 3)];
    const pool = NabugoEcology.members(eco, guild);
    if (!pool.length) return out;
    const p = pool[Math.floor(Math.pow(rng(), 1.7) * pool.length)];
    if (!p) return out;
    out.add({ id: 'a_mig' + out.assemblies.length, role: 'migrant_organ', part: p.id, ecology: eco,
              attach: { target: 'a_base', port: 'top' } });
    out.lineage.push('migrate:' + eco);
    return out;
  }

  /** Join fragments from two lineages. */
  function recombine(a, b, rng) {
    const out = a.clone();
    const donors = b.assemblies.filter(x => x.attach);
    if (!donors.length) return out;
    const take = donors.slice(0, 1 + Math.floor(rng() * 2));
    take.forEach((d, i) =>
      out.add({ ...d, id: 'a_rec' + i + '_' + out.assemblies.length,
                attach: { target: 'a_base', port: 'top' } }));
    out.ecologyMix = [...new Set([...a.ecologyMix, ...b.ecologyMix])];
    out.lineage.push('recombine:' + b.id);
    return out;
  }

  const ALL = { substitute, repeat, rotate, damage, migrate };
  return { ...ALL, recombine, names: Object.keys(ALL) };
})();

// ═══════════════════════════════════════════════════════════════════ compiler
/**
 * Genome -> exact placements. This is the part that must never guess.
 *
 * A placement is derived from a pair of compatible ports. The parent's male
 * port and the child's female port must coincide in world space and point in
 * opposite directions. Bounding boxes only reject collisions; they never
 * manufacture a connection.
 */
const NabugoCompiler = (() => {

  const EPS = 0.75;
  const applyPoint = (m, pos, p) => [
    m[0]*p[1] + m[1]*p[2] + m[2]*p[3] + pos[0],
    m[3]*p[1] + m[4]*p[2] + m[5]*p[3] + pos[1],
    m[6]*p[1] + m[7]*p[2] + m[8]*p[3] + pos[2]
  ];
  const applyLocalPoint = (m, p) => [
    m[0]*p[1] + m[1]*p[2] + m[2]*p[3],
    m[3]*p[1] + m[4]*p[2] + m[5]*p[3],
    m[6]*p[1] + m[7]*p[2] + m[8]*p[3]
  ];
  const applyAxis = (m, axis) => {
    const a = AXES[axis];
    return [m[0]*a[0] + m[1]*a[1] + m[2]*a[2],
            m[3]*a[0] + m[4]*a[1] + m[5]*a[2],
            m[6]*a[0] + m[7]*a[1] + m[8]*a[2]];
  };
  const axisIs = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2] > 0.985;
  const samePoint = (a, b) => Math.abs(a[0]-b[0]) <= EPS &&
                                    Math.abs(a[1]-b[1]) <= EPS &&
                                    Math.abs(a[2]-b[2]) <= EPS;
  const portKey = p => p.map(v => Math.round(v)).join(',');

  /** Actual upward male ports offered by a placed parent. */
  function worldStuds(place) {
    const m = place.mat || Geom.IDENT;
    return NabugoPorts.studs(place.part)
      .filter(p => axisIs(applyAxis(m, p[4]), AXES[UP]))
      .map(p => ({ port: p, point: applyPoint(m, place.pos, p) }));
  }

  /** Actual downward female receivers available under an oriented child. */
  function childTubes(partId, mat) {
    return NabugoPorts.tubes(partId)
      .filter(p => axisIs(applyAxis(mat, p[4]), AXES[DOWN]));
  }

  /**
   * Every transform here is proved by at least one coincident stud/tube pair.
   * Multi-port matches are preferred and all covered parent studs are consumed.
   */
  function dockCandidates(parent, partId, mat, consumed) {
    const studs = worldStuds(parent).filter(s => !consumed.has(portKey(s.point)));
    const tubes = childTubes(partId, mat);
    if (!studs.length || !tubes.length) return [];

    const candidates = new Map();
    for (const stud of studs) for (const tube of tubes) {
      const local = applyLocalPoint(mat, tube);
      const pos = [stud.point[0]-local[0], stud.point[1]-local[1], stud.point[2]-local[2]];
      const key = portKey(pos);
      if (candidates.has(key)) continue;

      const matched = [];
      for (const s of studs) {
        const hit = tubes.some(t => samePoint(s.point, applyPoint(mat, pos, t)));
        if (hit) matched.push(portKey(s.point));
      }
      if (matched.length) candidates.set(key, { pos, matched, parentPort: stud.port, childPort: tube });
    }

    const parentBox = Geom.worldBox(parent);
    const cx = parentBox ? (parentBox.min[0] + parentBox.max[0]) / 2 : parent.pos[0];
    const cz = parentBox ? (parentBox.min[2] + parentBox.max[2]) / 2 : parent.pos[2];
    return [...candidates.values()].sort((a, b) =>
      b.matched.length - a.matched.length ||
      Math.hypot(a.pos[0]-cx, a.pos[2]-cz) - Math.hypot(b.pos[0]-cx, b.pos[2]-cz));
  }

  /** Re-prove a stored joint from current transforms; never trust the stamp. */
  function validateJoint(scene, child) {
    const c = child.connection;
    if (!c || c.kind !== 'stud-tube' || !Array.isArray(c.parentPort) || !Array.isArray(c.childPort)) return false;
    const parent = scene.places.find(p => p.pid === c.target);
    if (!parent || c.parentPort[0] !== 0 || c.childPort[0] !== 1) return false;
    const contains = (ports, port) => ports.some(p => p.length === port.length && p.every((v, i) => v === port[i]));
    if (!contains(NabugoPorts.studs(parent.part), c.parentPort) ||
        !contains(NabugoPorts.tubes(child.part), c.childPort)) return false;
    const pm = parent.mat || Geom.IDENT, cm = child.mat || Geom.IDENT;
    const pa = applyAxis(pm, c.parentPort[4]), ca = applyAxis(cm, c.childPort[4]);
    if (pa[0]*ca[0] + pa[1]*ca[1] + pa[2]*ca[2] > -0.985) return false;
    return samePoint(applyPoint(pm, parent.pos, c.parentPort),
                     applyPoint(cm, child.pos, c.childPort));
  }

  function compile(genome, anchor, opts = {}) {
    const scene = new Scene(genome.claim || 'genome');
    const placed = new Map();          // assembly id -> representative placement
    const consumed = new Map();        // placement pid -> seats already taken
    const failures = [];
    let lastPlaced = null;
    const rng = opts.rng || Math.random;
    const color = opts.color || 71;
    const zone = opts.zone || 0;
    const cell = opts.cell || null;

    const stage = (partId, x, y, z, mat, meta) => {
      const p = Catalog.get(partId);
      if (!p) { failures.push({ assembly: meta.id, reason: 'part not in catalogue', part: partId }); return null; }
      const pos = meta.exact ? [x, y, z]
        : [x - (p.b[0] + p.b[3]) / 2, y, z - (p.b[2] + p.b[5]) / 2];
      const trial = { part: partId, color, pos,
                      mat: mat || Geom.IDENT, cell, zone,
                      vignette: meta.vignette, strategy: meta.role, round: opts.round || 0,
                      connection: meta.connection || null };
      const box = Geom.worldBox(trial);
      if (!box) { failures.push({ assembly: meta.id, reason: 'no geometry', part: partId }); return null; }
      for (const q of scene.places) {
        const b = Geom.worldBox(q);
        if (b && Geom.penetration(box, b) > 0) {
          failures.push({ assembly: meta.id, reason: 'collides with ' + q.part, part: partId });
          return null;
        }
      }
      return scene.add(trial);
    };

    for (const a of genome.assemblies) {
      const vignette = (genome.claim || 'GENOME') + ' · ' + a.role;
      const spin = a.spin ? Geom.rotY(a.spin) : Geom.IDENT;

      if (!a.attach) {
        const p = Catalog.get(a.part);
        if (!p) { failures.push({ assembly: a.id, reason: 'part not in catalogue', part: a.part }); continue; }
        const rec = stage(a.part, anchor.x, -p.b[4], anchor.z, spin,
                          { id: a.id, role: a.role, vignette });
        if (rec) { placed.set(a.id, rec); lastPlaced = rec; }
        continue;
      }

      const child = Catalog.get(a.part);
      if (!child) { failures.push({ assembly: a.id, reason: 'part not in catalogue', part: a.part }); continue; }

      // Try the named parent first; if its seats are used up, climb onto the
      // most recently placed sibling. Without this every assembly asked a_base
      // for the same central seat and seven of eight collided with each other.
      const chain = [placed.get(a.attach.target), lastPlaced, placed.get('a_base')]
        .filter((v, i, arr) => v && arr.indexOf(v) === i);
      if (!chain.length) { failures.push({ assembly: a.id, reason: 'attach target never placed: ' + a.attach.target }); continue; }

      const n = Math.max(1, a.repeat || 1);
      let landed = 0, tried = 0;

      for (const parent of chain) {
        if (landed) break;
        const key = parent.pid;
        if (!consumed.has(key)) consumed.set(key, new Set());
        const used = consumed.get(key);
        const matrices = Array.from({ length: n }, (_, i) =>
          a.symmetry === 'radial' && n > 1 ? Geom.rotY(-(i / n) * 360)
          : (a.symmetry === 'bilateral' && i % 2 ? Geom.rotY(180) : spin));
        const candidates = matrices.flatMap((mat, i) =>
          dockCandidates(parent, a.part, mat, used).map(c => ({ ...c, mat, order: i })));
        if (!candidates.length) continue;
        tried++;

        chooseDockings(candidates, n, a.symmetry, rng).forEach(c => {
          const rec = stage(a.part, c.pos[0], c.pos[1], c.pos[2], c.mat,
                            { id: a.id, role: a.role, vignette, exact: true,
                              connection: { kind: 'stud-tube', target: parent.pid,
                                parentPort: c.parentPort, childPort: c.childPort,
                                engaged: c.matched.length } });
          if (rec) {
            landed++;
            c.matched.forEach(k => used.add(k));
            lastPlaced = rec;
            if (!placed.has(a.id)) placed.set(a.id, rec);
          }
        });
      }
      if (!landed) {
        failures.push({ assembly: a.id, part: a.part,
          reason: tried ? 'every legal stud/tube docking collided' :
            'no compatible parent stud and child underside tube' });
      }
    }

    return { scene, failures, placedCount: scene.count };
  }

  /** Pick n proved dockings, honouring the requested symmetry. */
  function chooseDockings(candidates, n, symmetry, rng) {
    const lattice = candidates.map(c => [c.pos[0], c.pos[2], c]);
    if (n === 1) {
      // Centre of the lattice reads as deliberate; a random stud reads as spill.
      const cx = lattice.reduce((s, p) => s + p[0], 0) / lattice.length;
      const cz = lattice.reduce((s, p) => s + p[1], 0) / lattice.length;
      const best = lattice.slice().sort((a, b) =>
        b[2].matched.length - a[2].matched.length ||
        (Math.hypot(a[0]-cx, a[1]-cz)) - (Math.hypot(b[0]-cx, b[1]-cz)))[0];
      return best ? [best[2]] : [];
    }
    if (symmetry === 'bilateral') {
      const sorted = lattice.slice().sort((a, b) => a[0] - b[0]);
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(i % 2 ? sorted[sorted.length - 1 - Math.floor(i/2)] : sorted[Math.floor(i/2)]);
      }
      return out.filter(Boolean).map(x => x[2]);
    }
    if (symmetry === 'radial') {
      const cx = lattice.reduce((s, p) => s + p[0], 0) / lattice.length;
      const cz = lattice.reduce((s, p) => s + p[1], 0) / lattice.length;
      const sorted = lattice.slice().sort((a, b) =>
        Math.atan2(a[1]-cz, a[0]-cx) - Math.atan2(b[1]-cz, b[0]-cx));
      const step = Math.max(1, Math.floor(sorted.length / n));
      return Array.from({ length: n }, (_, i) => sorted[(i * step) % sorted.length])
        .filter(Boolean).map(x => x[2]);
    }
    const out = [];
    for (let i = 0; i < n; i++) out.push(lattice[Math.floor(rng() * lattice.length)]);
    return out.filter(Boolean).map(x => x[2]);
  }

  return { compile, worldStuds, childTubes, dockCandidates, validateJoint };
})();

// ══════════════════════════════════════════════════════════════════ viability
/**
 * Hard gates. Facts, not interpretations. Nothing reaches a judge until it
 * passes every one of these.
 */
const NabugoViability = (() => {
  function check(scene, brief) {
    const a = N.Audit.run(scene, brief);
    const hasLegalOrigin = p => {
      if (p.connection) return NabugoCompiler.validateJoint(scene, p);
      const b = Geom.worldBox(p);
      return !!b && Math.abs(b.max[1]) <= 4.5;
    };
    const gates = {
      hasParts:    a.parts > 0,
      validParts:  a.compiles,
      noCollision: a.collisions === 0,
      supported:   a.floating === 0,
      legalJoints: scene.places.every(hasLegalOrigin),
      coherent:    a.cohesion >= 0.99
    };
    const failed = Object.entries(gates).filter(([, v]) => !v).map(([k]) => k);
    return { viable: failed.length === 0, gates, failed, audit: a };
  }
  return { check };
})();

// ═════════════════════════════════════════════════════════════════════ judges
/**
 * Selective pressure. Deliberately several, deliberately not averaged.
 *
 * One supreme judge produces monoculture: candidates learn its preferences and
 * everything starts to look like "sophisticated composition". A panel kept on a
 * Pareto frontier lets a structurally strong candidate, a narratively forceful
 * one and a strange fertile one all survive, for different reasons.
 */
const NabugoJudges = (() => {

  const JUDGES = {
    /** What absence does this address? */
    void: (c, ctx) => {
      const z = c.zone || 0;
      const need = (ctx.void && ctx.void.assembly_roles) || [];
      const have = new Set(c.genome.assemblies.map(a => a.role));
      const met = need.filter(r => have.has(r)).length;
      const score = need.length ? met / need.length : (c.audit.parts ? 0.5 : 0);
      return { score, evidence: met + ' of ' + (need.length || '?') + ' requested roles present (' +
               [...have].join(', ') + ')' };
    },
    /** Weight, rhythm, negative space. */
    composition: (c) => {
      const a = c.audit;
      const spread = Math.min(1, a.span[0] / 200) * Math.min(1, a.span[2] / 200);
      const height = Math.min(1, a.span[1] / 120);
      const rhythm = Math.min(1, a.unique / Math.max(1, a.parts) * 1.4);
      const score = spread * 0.35 + height * 0.35 + rhythm * 0.30;
      return { score, evidence: 'span ' + a.span.join('×') + ' LDU, ' + a.unique +
               ' distinct of ' + a.parts + ' parts' };
    },
    /** What does it make legible without explanation? */
    narrative: (c) => {
      const lex = c.lexicon || [];
      let hits = 0, seen = new Set();
      for (const p of c.scene.places) {
        const part = Catalog.get(p.part);
        if (!part || seen.has(p.part)) continue;
        seen.add(p.part);
        for (const w of lex) if (part._t.includes(w)) { hits++; break; }
      }
      const score = seen.size ? Math.min(1, hits / seen.size * 1.3) : 0;
      return { score, evidence: hits + ' of ' + seen.size + ' distinct parts read as the brief' };
    },
    /** Do the participating parts transform one another's roles? */
    ecological: (c) => {
      const ecos = new Set(c.genome.assemblies.map(a => a.ecology).filter(Boolean));
      const migrants = c.genome.assemblies.filter(a => a.role === 'migrant_organ').length;
      const score = Math.min(1, ecos.size / 3 * 0.7 + Math.min(migrants, 2) / 2 * 0.3);
      return { score, evidence: ecos.size + ' ecologies participating' +
               (migrants ? ', ' + migrants + ' migrant organ(s)' : ', no migrants') };
    },
    /** Does this open a lineage not already present? */
    novelty: (c, ctx) => {
      const seen = ctx.seenParts || new Set();
      const mine = new Set(c.scene.places.map(p => p.part));
      let fresh = 0;
      for (const p of mine) if (!seen.has(p)) fresh++;
      const opsNew = c.genome.lineage.filter(l => !(ctx.seenOps || new Set()).has(l)).length;
      const score = mine.size ? Math.min(1, fresh / mine.size * 0.75 + Math.min(opsNew, 3) / 3 * 0.25) : 0;
      return { score, evidence: fresh + ' of ' + mine.size + ' parts unseen in this world' +
               (opsNew ? ', ' + opsNew + ' new operator(s)' : '') };
    },
    /** Can figures enter, see, reach and use it? */
    habitation: (c) => {
      const a = c.audit;
      // A minifig is ~44 LDU tall and needs somewhere to stand.
      const standable = c.scene.places.filter(p => {
        const b = Geom.worldBox(p);
        return b && (b.max[0]-b.min[0]) >= 20 && (b.max[2]-b.min[2]) >= 20;
      }).length;
      const headroom = a.span[1] >= 44 ? 1 : a.span[1] / 44;
      const score = Math.min(1, standable / Math.max(1, a.parts) * 0.6 + headroom * 0.4);
      return { score, evidence: standable + ' surface(s) a figure could stand on, ' +
               a.span[1] + ' LDU of height' };
    }
  };

  const names = Object.keys(JUDGES);

  function judge(candidate, ctx) {
    const out = {};
    for (const [k, fn] of Object.entries(JUDGES)) {
      try { out[k] = fn(candidate, ctx || {}); }
      catch (e) { out[k] = { score: 0, evidence: 'judge failed: ' + e.message }; }
    }
    return out;
  }

  /**
   * Pareto frontier. A candidate survives if nothing else beats it on every
   * axis at once. No weighted sum, because a weighted sum is a supreme judge
   * wearing a disguise.
   */
  function frontier(candidates) {
    const dominates = (a, b) => {
      let better = false;
      for (const k of names) {
        const x = a.judgment[k].score, y = b.judgment[k].score;
        if (x < y - 1e-9) return false;
        if (x > y + 1e-9) better = true;
      }
      return better;
    };
    return candidates.filter(c => !candidates.some(o => o !== c && dominates(o, c)));
  }

  /** Which axis is this candidate the best on? Used to explain why it survived. */
  function championOf(c, all) {
    let best = null, margin = -1;
    for (const k of names) {
      const mine = c.judgment[k].score;
      const top = Math.max(...all.map(o => o.judgment[k].score));
      if (mine >= top - 1e-9 && mine - averageExcept(all, c, k) > margin) {
        margin = mine - averageExcept(all, c, k); best = k;
      }
    }
    return best;
  }
  function averageExcept(all, c, k) {
    const rest = all.filter(o => o !== c);
    return rest.length ? rest.reduce((s, o) => s + o.judgment[k].score, 0) / rest.length : 0;
  }

  return { JUDGES, names, judge, frontier, championOf };
})();

// ════════════════════════════════════════════════════════════════════ archive
/**
 * If only winners reproduce, the system overuses a few reliable bricks within
 * a handful of generations. A candidate that failed because one hinge is
 * oriented wrongly should not be erased — its genome can mutate and return.
 */
class NabugoArchive {
  constructor() {
    this.viable = []; this.selected = []; this.novel = [];
    this.deceptive = []; this.repairable = []; this.fossil = [];
    this.seenParts = new Set(); this.seenOps = new Set();
  }
  note(c) {
    for (const p of c.scene.places) this.seenParts.add(p.part);
    for (const l of c.genome.lineage) this.seenOps.add(l);
  }
  /** File a candidate into every archive it belongs in. */
  file(c, ctx) {
    if (c.viability.viable) {
      this.viable.push(c);
      if (c.judgment && c.judgment.novelty.score >= 0.6) this.novel.push(c);
      // Strong claim, poor current scores: kept because the judges of a later
      // world may want it.
      if (c.judgment && c.judgment.ecological.score >= 0.5 &&
          c.judgment.void.score < 0.35) this.deceptive.push(c);
    } else if (c.viability.failed.length === 1 &&
               ['noCollision','supported','coherent'].includes(c.viability.failed[0])) {
      this.repairable.push(c);
    } else {
      this.fossil.push(c);
    }
    this.note(c);
    return c;
  }
  select(c) { this.selected.push(c); return c; }
  counts() {
    return { viable: this.viable.length, selected: this.selected.length,
             novel: this.novel.length, deceptive: this.deceptive.length,
             repairable: this.repairable.length, fossil: this.fossil.length };
  }
  /** Genomes worth breeding from: recent survivors plus a repairable outsider. */
  breedingStock(n = 4) {
    const pool = [...this.selected.slice(-n), ...this.novel.slice(-2), ...this.repairable.slice(-1)];
    return pool.filter(Boolean).map(c => c.genome);
  }
}

// ═══════════════════════════════════════════════════════════════════════ void
/**
 * A void ledger, not a fidelity percentage. A single "Narrative_Fidelity: 83%"
 * is usually invented rather than measured; a ledger of what is resolved,
 * partially resolved, unresolved and emergent can be pointed at.
 */
class NabugoVoidLedger {
  constructor(brief) {
    this.brief = brief;
    this.voids = (brief.voids || []).map(v => ({ ...v, state: 'unresolved', evidence: [] }));
    this.emergent = [];
  }
  unresolved() { return this.voids.filter(v => v.state === 'unresolved'); }
  partial()    { return this.voids.filter(v => v.state === 'partial'); }
  resolved()   { return this.voids.filter(v => v.state === 'resolved'); }

  /** Pick the void most worth working on: unresolved before partial. */
  next(rng) {
    const pool = this.unresolved().length ? this.unresolved() : this.partial();
    if (!pool.length) return null;
    return pool[Math.floor((rng || Math.random)() * pool.length)];
  }

  credit(voidId, candidate) {
    const v = this.voids.find(x => x.id === voidId);
    if (!v) return;
    const s = candidate.judgment ? candidate.judgment.void.score : 0;
    v.evidence.push({ round: candidate.round, parts: candidate.audit.parts,
                      score: Math.round(s * 100), why: candidate.judgment.void.evidence });
    v.state = s >= 0.6 ? 'resolved' : s > 0 ? 'partial' : v.state;
  }

  /**
   * The upstream reversal. The material is allowed to talk back: when a
   * migrant organ carries a survivor, the brief's own description of the void
   * is no longer the whole truth about it.
   */
  observe(candidate) {
    const migrants = candidate.genome.assemblies.filter(a => a.role === 'migrant_organ');
    if (!migrants.length) return null;
    const ecos = [...new Set(migrants.map(a => a.ecology).filter(Boolean))]
      .map(e => NabugoEcology.get(e)?.name || e);
    if (!ecos.length) return null;
    const note = 'A part from ' + ecos.join(' / ') + ' survived as structure here; ' +
                 'the void reads less like ' + (candidate.void ? candidate.void.narrative_need : 'its description') +
                 ' and more like something that ' + verbFor(ecos[0]) + '.';
    this.emergent.push({ round: candidate.round, note, parts: migrants.map(m => m.part) });
    return note;
  }

  summary() {
    return { resolved: this.resolved().map(v => v.id),
             partial: this.partial().map(v => v.id),
             unresolved: this.unresolved().map(v => v.id),
             emergent: this.emergent.map(e => e.note) };
  }
}
function verbFor(ecoName) {
  const n = String(ecoName).toLowerCase();
  if (n.includes('animal')) return 'grew rather than was built';
  if (n.includes('technic') || n.includes('motion')) return 'moves, or once moved';
  if (n.includes('luminous')) return 'signals across water';
  if (n.includes('ruin')) return 'is already outliving its purpose';
  if (n.includes('ritual')) return 'is attended rather than used';
  if (n.includes('aquatic')) return 'holds air against the sea';
  return 'exceeds its description';
}

// ══════════════════════════════════════════════════════════════════════ finch
/**
 * A beak. Same gene pool, same compiler, same judges — different sampling
 * pressure and different survival rule. Darwin's finches diverged by what they
 * could get at, not by what was available.
 */
const FINCHES = {
  ground: {
    key: 'ground', name: 'Ground Finch', latin: 'Geospiza magnirostris',
    beak: 'heavy, crushing',
    strategy: 'Takes the largest seed it can crack. Anchors and supports first, ' +
              'migrants last, and it will not select a candidate that any judge scores near zero.',
    composition: { anchors: 2, supports: 4, connectors: 2, membranes: 1, signals: 1 },
    migrantFrom: 1, wild: 1,
    population: 5, mutationsPerRound: 2,
    ops: ['repeat', 'repeat', 'substitute', 'rotate'],
    /** Conservative: no weak axis tolerated. */
    select(frontier) {
      const safe = frontier.filter(c => NabugoJudges.names.every(k => c.judgment[k].score > 0.12));
      const pool = safe.length ? safe : frontier;
      return pool.slice().sort((a, b) =>
        (b.judgment.composition.score + b.judgment.void.score) -
        (a.judgment.composition.score + a.judgment.void.score))[0];
    }
  },
  cactus: {
    key: 'cactus', name: 'Cactus Finch', latin: 'Geospiza scandens',
    beak: 'long, probing',
    strategy: 'Reaches into flowers other beaks cannot. Weighted toward membranes and ' +
              'signals, draws freely from neighbouring ecologies, and selects for what ' +
              'the brief makes legible.',
    composition: { anchors: 1, supports: 2, membranes: 3, signals: 3, inhabitants: 1 },
    migrantFrom: 2, wild: 1,
    population: 6, mutationsPerRound: 2,
    ops: ['migrate', 'substitute', 'rotate', 'repeat'],
    select(frontier) {
      return frontier.slice().sort((a, b) =>
        (b.judgment.narrative.score * 2 + b.judgment.habitation.score) -
        (a.judgment.narrative.score * 2 + a.judgment.habitation.score))[0];
    }
  },
  warbler: {
    key: 'warbler', name: 'Warbler Finch', latin: 'Certhidea olivacea',
    beak: 'fine, tool-using',
    strategy: 'The one that picks up a twig. Highest migrant and wild fraction, breeds from ' +
              'the deceptive archive as readily as the selected one, and takes the strangest ' +
              'thing on the frontier rather than the strongest.',
    composition: { anchors: 1, supports: 2, membranes: 2, signals: 2, connectors: 1, inhabitants: 1 },
    migrantFrom: 3, wild: 3,
    population: 7, mutationsPerRound: 3,
    ops: ['migrate', 'damage', 'substitute', 'rotate', 'repeat'],
    select(frontier) {
      return frontier.slice().sort((a, b) =>
        (b.judgment.novelty.score * 2 + b.judgment.ecological.score) -
        (a.judgment.novelty.score * 2 + a.judgment.ecological.score))[0];
    }
  }
};

// ═══════════════════════════════════════════════════════════════════ the loop
/**
 * One finch, one brief, one world. Each round:
 *   select a void -> draw a bag -> compose genomes -> compile -> gate ->
 *   judge -> keep a frontier -> select one -> commit -> let it revise the brief
 */
class NabugoPopulation {
  constructor(finchKey, brief, opts = {}) {
    this.finch = FINCHES[finchKey] || FINCHES.ground;
    this.brief = brief;
    this.scene = new Scene(brief.title + ' · ' + this.finch.name);
    this.ledger = new NabugoVoidLedger(brief);
    this.archive = new NabugoArchive();
    this.round = 0;
    this.maxRounds = opts.maxRounds || 16;
    this.history = [];
    this.settled = false;
    this.usedCells = new Set();
    this.rng = N.mulberry32(opts.seed ?? hash(this.finch.key));
  }

  pickCell(zone) {
    const cells = Brief.cellsOfZone(zone || 3);
    const clear = c => {
      const w = Brief.cellToWorld(c.r, c.c);
      const probe = { min: [w.x - 34, -600, w.z - 34], max: [w.x + 34, 6, w.z + 34] };
      return !this.scene.places.some(p => {
        const b = Geom.worldBox(p);
        return b && Geom.penetration(probe, b) > 0;
      });
    };
    const shuffled = cells.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.find(c => !this.usedCells.has(c.label) && clear(c)) ||
           shuffled.find(clear) || shuffled[0];
  }

  step() {
    if (this.settled || this.round >= this.maxRounds) { this.settled = true; return null; }
    this.round++;
    const f = this.finch;

    const target = this.ledger.next(this.rng);
    if (!target) { this.settled = true; return null; }

    const zone = target.zone || 3;
    const cell = this.pickCell(zone);
    const ecologies = target.ecologies && target.ecologies.length
      ? target.ecologies : this.brief.ecologies || NabugoEcology.ids().slice(0, 3);
    const lexicon = (this.brief.zones[zone] && this.brief.zones[zone].lex) || [];

    // ---- draw a population, compose genomes ------------------------------
    const genomes = [];
    for (let i = 0; i < f.population; i++) {
      const bag = NabugoBag.draw({
        ecologies, composition: f.composition,
        migrantFrom: f.migrantFrom, wild: f.wild
      }, this.rng);
      genomes.push(NabugoGenome.fromBag(bag, target.narrative_need || target.id, ecologies, this.rng));
    }
    // ---- variation, including from the archive ---------------------------
    const stock = this.archive.breedingStock(3);
    for (let i = 0; i < f.mutationsPerRound; i++) {
      const parent = stock.length && this.rng() < 0.6
        ? stock[Math.floor(this.rng() * stock.length)]
        : genomes[Math.floor(this.rng() * genomes.length)];
      if (!parent) continue;
      const op = f.ops[Math.floor(this.rng() * f.ops.length)];
      const bag = NabugoBag.draw({ ecologies, composition: { supports: 3, signals: 2 },
                                   migrantFrom: f.migrantFrom, wild: f.wild }, this.rng);
      genomes.push(op === 'substitute' ? NabugoOperators.substitute(parent, bag, this.rng)
                 : NabugoOperators[op](parent, this.rng));
    }
    if (stock.length >= 2 && this.rng() < 0.4) {
      genomes.push(NabugoOperators.recombine(stock[0], stock[1], this.rng));
    }

    // ---- compile, then gate. Nothing unviable reaches a judge ------------
    const anchor = Brief.cellToWorld(cell.r, cell.c);
    const candidates = [];
    let rejected = 0;
    // Snapshot: what this world had already seen when the round began.
    const seenParts = new Set(this.archive.seenParts);
    const seenOps = new Set(this.archive.seenOps);
    for (const g of genomes) {
      const built = NabugoCompiler.compile(g, anchor, {
        rng: this.rng, zone, cell: cell.label, round: this.round,
        color: colorFor(zone, f.key)
      });
      if (!built.scene.count) { rejected++; continue; }
      const viability = NabugoViability.check(built.scene, this.brief);
      const c = { genome: g, scene: built.scene, failures: built.failures,
                  viability, audit: viability.audit, zone, cell: cell.label,
                  void: target, lexicon, round: this.round };
      // Judge before filing. Filing records every part the candidate uses, so
      // running it first made the novelty judge score every candidate zero:
      // by the time it looked, the world had already "seen" the very parts it
      // was being asked to assess.
      if (viability.viable) {
        c.judgment = NabugoJudges.judge(c, { void: target, seenParts, seenOps });
        candidates.push(c);
      } else {
        rejected++;
      }
      this.archive.file(c, {});
    }

    const rec = { round: this.round, finch: f.key, void: target.id,
                  cell: cell.label, zone, generated: genomes.length,
                  rejected, survivors: candidates.length,
                  frontier: 0, chosen: null, emergent: null };

    if (!candidates.length) {
      rec.note = 'No genome survived the gates this round. ' +
                 'Failures: ' + summariseFailures(genomes.length, this.archive);
      this.history.push(rec);
      return rec;
    }

    // ---- judge, keep a frontier, choose one ------------------------------
    const frontier = NabugoJudges.frontier(candidates);
    rec.frontier = frontier.length;
    rec.frontierDetail = frontier.map(c => ({
      claim: c.genome.claim, parts: c.audit.parts,
      champion: NabugoJudges.championOf(c, candidates),
      lineage: c.genome.lineage.slice(-2),
      scores: Object.fromEntries(NabugoJudges.names.map(k => [k, +c.judgment[k].score.toFixed(2)]))
    }));

    const chosen = f.select(frontier) || frontier[0];

    // The chosen build passed its gates as a whole, so it is committed as a
    // whole. Dropping just the parts that clash with the standing world removes
    // whatever they were resting on and leaves the rest of the stack floating —
    // a build that was verified as supported arrives in the world unsupported.
    // If a candidate cannot land intact, the next one on the frontier gets the
    // cell instead.
    const ordered = [chosen, ...frontier.filter(c => c !== chosen)];
    let committed = null;
    for (const cand of ordered) {
      const boxes = cand.scene.places.map(p => Geom.worldBox(p));
      const clashes = boxes.some(box => box && this.scene.places.some(q => {
        const b = Geom.worldBox(q);
        return b && Geom.penetration(box, b) > 0;
      }));
      if (clashes) continue;
      // Scene.add allocates new pids. Preserve the graph by remapping each
      // candidate-local parent id to the id allocated in the standing world.
      const pidMap = new Map();
      for (const p of cand.scene.places) {
        const connection = p.connection ? {
          ...p.connection,
          target: pidMap.get(p.connection.target) || p.connection.target
        } : null;
        const added = this.scene.add({ ...p, connection });
        pidMap.set(p.pid, added.pid);
      }
      committed = cand;
      break;
    }
    if (!committed) {
      rec.note = 'Frontier of ' + frontier.length + ' could not land in ' + cell.label +
                 ' without clashing with the standing world; cell left alone.';
      this.history.push(rec);
      return rec;
    }
    if (committed !== chosen) rec.substituted = committed.genome.claim;
    this.usedCells.add(cell.label);
    this.archive.select(committed);
    this.ledger.credit(target.id, committed);
    rec.emergent = this.ledger.observe(committed);

    rec.chosen = {
      claim: committed.genome.claim, parts: committed.audit.parts,
      champion: NabugoJudges.championOf(committed, candidates),
      lineage: committed.genome.lineage,
      ecologies: [...new Set(committed.genome.assemblies.map(a => a.ecology).filter(Boolean))],
      scores: Object.fromEntries(NabugoJudges.names.map(k => [k, +committed.judgment[k].score.toFixed(2)])),
      evidence: Object.fromEntries(NabugoJudges.names.map(k => [k, committed.judgment[k].evidence]))
    };
    rec.archive = this.archive.counts();
    this.history.push(rec);

    if (!this.ledger.unresolved().length && !this.ledger.partial().length) this.settled = true;
    if (this.round >= this.maxRounds) this.settled = true;
    return rec;
  }

  run(n) {
    const out = [];
    for (let i = 0; i < (n || this.maxRounds); i++) {
      if (this.settled) break;
      const r = this.step();
      if (r) out.push(r);
    }
    return out;
  }

  audit() { return N.Audit.run(this.scene, this.brief); }

  toMPD() {
    const a = this.audit();
    return this.scene.toMPD({
      filename: 'nabugo-' + this.brief.key + '-' + this.finch.key + '.mpd',
      author: 'Nabugo · ' + this.finch.name,
      brief: this.brief.title + ' — ' + this.brief.description,
      meta: { finch: this.finch.key, beak: this.finch.beak, round: this.round,
              parts: a.parts, collisions: a.collisions, floating: a.floating,
              archive: this.archive.counts(), ledger: this.ledger.summary() }
    });
  }
}

function colorFor(zone, finch) {
  const palette = { ground: [72, 70, 19, 7], cactus: [27, 2, 71, 15], warbler: [25, 4, 46, 14] };
  return (palette[finch] || palette.ground)[(zone || 0) % 4];
}
function summariseFailures(total, archive) {
  const last = archive.fossil.slice(-3).concat(archive.repairable.slice(-2));
  const reasons = new Map();
  for (const c of last) for (const f of (c.failures || [])) {
    reasons.set(f.reason.split(' with ')[0], (reasons.get(f.reason.split(' with ')[0]) || 0) + 1);
  }
  return [...reasons.entries()].map(([r, n]) => r + ' ×' + n).join(', ') || 'gates not met';
}
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ══════════════════════════════════════════════════════════════════ aviary
/** Three beaks on one brief. */
class NabugoAviary {
  constructor(briefKey, opts = {}) {
    this.brief = (N.Brief.BRIEFS[briefKey]) || N.Brief.BRIEFS.atlantis || N.Brief.BRIEFS.theseus;
    this.birds = Object.keys(FINCHES).map(k => new NabugoPopulation(k, this.brief, opts));
    this.round = 0;
  }
  get(key) { return this.birds.find(b => b.finch.key === key); }
  step() { this.round++; return this.birds.map(b => ({ finch: b.finch.key, rec: b.step() })); }
  run(n = 16) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (this.birds.every(b => b.settled)) break;
      out.push(this.step());
    }
    return out;
  }
  scoreboard() {
    return this.birds.map(b => {
      const a = b.audit();
      const last = b.history.filter(h => h.chosen).slice(-1)[0];
      return {
        finch: b.finch.key, name: b.finch.name, beak: b.finch.beak,
        round: b.round, settled: b.settled, audit: a,
        archive: b.archive.counts(), ledger: b.ledger.summary(),
        champion: last && last.chosen ? last.chosen.champion : null,
        scores: last && last.chosen ? last.chosen.scores : null
      };
    });
  }
}

global.NabugoEvo = {
  Ports: NabugoPorts, Ecology: NabugoEcology, Bag: NabugoBag,
  Genome: NabugoGenome, Operators: NabugoOperators, Compiler: NabugoCompiler,
  Viability: NabugoViability, Judges: NabugoJudges, Archive: NabugoArchive,
  VoidLedger: NabugoVoidLedger, Population: NabugoPopulation, Aviary: NabugoAviary,
  FINCHES
};
})(typeof window !== 'undefined' ? window : globalThis);

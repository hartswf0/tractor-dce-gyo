/**
 * NABUGO LOOPS — foraging, and writing programmes that build
 * ==========================================================
 * Two loops in the spirit of the operative builder and the correspondence
 * clinic, but aimed at the layer above placements. Neither of them writes
 * coordinates. One searches the material; the other searches the programme.
 *
 *   FORAGER      The script states what it wants — ASSERT parts > 700,
 *                ASSERT supported — and the forager goes out into the
 *                catalogue to find material that satisfies it. It changes
 *                ecologies, pins roles, and re-draws; it never edits geometry.
 *                Fucked-until-proven-otherwise, applied to the gene pool.
 *
 *   SCRIPTORIUM  A population of programmes. Mutate, recombine, compile, keep
 *                a Pareto frontier on the probes. The script is the genome, so
 *                one changed number regenerates hundreds of placements and the
 *                thing under selection is a procedure rather than a phenotype.
 *
 * Both are deterministic and offline. The ASSERTs are the fitness function and
 * the compiler is still the law.
 */
(function (global) {
'use strict';
const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules, S = global.NabugoScript;
if (!N || !E || !M || !S) throw new Error('nabugo-loops.js requires nabugo, -evo, -modules, -atorscript');

// ═════════════════════════════════════════════════════════════ seed scripts
const SEEDS = {
  cathedral: `WORLD "Cathedral of the Drowned"
SEED 4812
USE ECOLOGY eco_monumental_architecture
USE ECOLOGY eco_aquatic_membrane
INVITE ECOLOGY eco_animal_morphology AT 0.25
SITE span=2400

PLACE cathedral AT 0,0 WITH bays=5 span=130 spire=16 clumps=22
RING pavilion AROUND 0,0 RADIUS 620 COUNT 5 WITH columns=6
REPEAT ruin COUNT 4 SPREAD 820 WITH columns=5
SCATTER reef COUNT 18 SPREAD 1000
AGE 0.10

ASSERT compiles
ASSERT no_collisions
ASSERT supported
ASSERT parts > 900
ASSERT distinct > 30
ASSERT modules > 24
PROBE silhouette
PROBE variety
PROBE density`,

  jellyfish: `WORLD "Jellyfish Data Temples"
SEED 9317
USE ECOLOGY eco_luminous_machine
USE ECOLOGY eco_technic_motion
INVITE ECOLOGY eco_aquatic_membrane AT 0.4
SITE span=2400
COLOR coral 36
COLOR block 72

GRID datatemple COLS 2 ROWS 2 PITCH 660 WITH racks=5 height=12 tentacles=10
PLACE bloom AT 0,0 WITH count=7
SCATTER bloom COUNT 5 SPREAD 950 WITH count=4
SCATTER reef COUNT 12 SPREAD 1000

ASSERT compiles
ASSERT no_collisions
ASSERT supported
ASSERT parts > 1200
ASSERT height > 600
PROBE silhouette
PROBE habitation
PROBE density`
};

// ══════════════════════════════════════════════════════════════════ forager
/**
 * The material is guilty until it proves otherwise. Each round the forager
 * takes the loudest failing ASSERT, forms one hypothesis about what in the
 * gene pool would fix it, and tries exactly that — an ecology swapped in, a
 * role pinned to a different kind of part, a seed re-drawn. The programme's
 * structure is left alone: this loop searches material, not form.
 */
class Forager {
  constructor(opts = {}) {
    this.src = opts.src || SEEDS.cathedral;
    this.rng = N.mulberry32(opts.seed ?? 1831);
    this.maxRounds = opts.maxRounds || 40;
    this.round = 0;
    this.settled = false;
    this.history = [];
    this.best = null;
    this.tried = new Set();
    this.result = null;
  }

  compile(src) {
    const prog = S.parse(src);
    if (prog.errors.length) return { prog, errors: prog.errors, score: -1 };
    const r = S.compile(prog, {});
    r.score = this.score(r);
    return r;
  }

  /** How close is this to satisfying its own claims? */
  score(r) {
    if (!r.verdicts.length) return 0;
    const passed = r.verdicts.filter(v => v.pass).length;
    // Partial credit on the numeric claims, so "620 of 900 pieces" reads as
    // progress rather than as the same failure twice.
    let partial = 0;
    for (const v of r.verdicts) {
      if (v.pass) continue;
      const m = v.detail.match(/^(\d+)/);
      const want = v.text.match(/(\d+)\s*$/);
      if (m && want) partial += Math.min(1, +m[1] / Math.max(1, +want[1])) * 0.8;
    }
    return (passed + partial) / r.verdicts.length;
  }

  /** The loudest failing claim, in the order that matters. */
  worst(r) {
    const order = ['compiles', 'no_collisions', 'supported', 'connected'];
    const fails = r.verdicts.filter(v => !v.pass);
    if (!fails.length) return null;
    for (const k of order) {
      const hit = fails.find(v => v.text.toLowerCase().startsWith(k));
      if (hit) return hit;
    }
    return fails[0];
  }

  /** One hypothesis about the gene pool, expressed as an edit to the script. */
  forage(src, fail) {
    const lines = src.split(/\r?\n/);
    const t = (fail ? fail.text : '').toLowerCase();
    const r = this.rng;

    // Not enough material → recruit an ecology, or ask for more copies.
    if (/parts|modules|distinct/.test(t)) {
      if (r() < 0.45) {
        const have = new Set(lines.filter(l => /^USE ECOLOGY/i.test(l)).map(l => l.split(/\s+/)[2]));
        const fresh = E.Ecology.ids().filter(id => !have.has(id));
        if (fresh.length) {
          const pick = fresh[Math.floor(r() * fresh.length)];
          const at = lines.findIndex(l => /^SITE/i.test(l));
          lines.splice(at < 0 ? 3 : at, 0, 'USE ECOLOGY ' + pick);
          return { src: lines.join('\n'), move: 'recruited ' + pick,
                   why: 'the pool was too narrow to fill ' + (fail ? fail.text : 'the brief') };
        }
      }
      // More copies of what already works.
      const idx = [];
      lines.forEach((l, i) => { if (/^(SCATTER|REPEAT|RING|GRID)\b/i.test(l)) idx.push(i); });
      if (idx.length) {
        const i = idx[Math.floor(r() * idx.length)];
        const m = lines[i].match(/\bCOUNT\s+(\d+)/i);
        if (m) {
          const now = Math.min(40, Math.ceil(+m[1] * (1.3 + r() * 0.6)));
          lines[i] = lines[i].replace(/\bCOUNT\s+\d+/i, 'COUNT ' + now);
          return { src: lines.join('\n'), move: 'COUNT ' + m[1] + ' → ' + now,
                   why: 'more of a thing that already stands' };
        }
      }
    }

    // Things are falling over or overlapping → the material is the wrong size.
    if (/supported|no_collisions|connected/.test(t)) {
      const roles = ['shaft', 'slab', 'block', 'beam', 'tread'];
      const wants = ['2 x 2', '2 x 4', '4 x 6', '2 x 8', '1 x 4', '4 x 4'];
      const role = roles[Math.floor(r() * roles.length)];
      const want = wants[Math.floor(r() * wants.length)];
      const key = 'PIN:' + role + ':' + want;
      if (!this.tried.has(key)) {
        this.tried.add(key);
        const at = lines.findIndex(l => /^(PLACE|RING|SCATTER|REPEAT|GRID)/i.test(l));
        const without = lines.filter(l => !new RegExp('^PIN\\s+' + role + '\\b', 'i').test(l));
        const insert = without.findIndex(l => /^(PLACE|RING|SCATTER|REPEAT|GRID)/i.test(l));
        without.splice(insert < 0 ? without.length : insert, 0, 'PIN ' + role + ' ' + want);
        return { src: without.join('\n'), move: 'pinned ' + role + ' to a ' + want,
                 why: 'what is failing is the size of the material, not the plan' };
      }
    }

    // Nothing specific to try: re-draw the bag.
    const n = Math.floor(r() * 99999);
    const si = lines.findIndex(l => /^SEED\b/i.test(l));
    if (si >= 0) lines[si] = 'SEED ' + n; else lines.unshift('SEED ' + n);
    return { src: lines.join('\n'), move: 'reseeded to ' + n,
             why: 'no hypothesis left; draw the bag again' };
  }

  step() {
    if (this.settled || this.round >= this.maxRounds) { this.settled = true; return null; }
    this.round++;

    const cur = this.compile(this.src);
    this.result = cur;
    if (!this.best || cur.score > this.best.score) this.best = { score: cur.score, src: this.src, r: cur };

    const fail = cur.errors ? { text: 'parse', detail: cur.errors[0].message } : this.worst(cur);
    const rec = {
      round: this.round,
      parts: cur.audit ? cur.audit.parts : 0,
      modules: cur.graph ? cur.graph.length : 0,
      score: Math.round((cur.score || 0) * 100),
      passed: cur.verdicts ? cur.verdicts.filter(v => v.pass).length : 0,
      total: cur.verdicts ? cur.verdicts.length : 0,
      fail: fail ? fail.text : null,
      detail: fail ? fail.detail : 'every claim satisfied',
      move: null, why: null, kept: false
    };

    if (!fail) {
      this.settled = true;
      rec.move = 'the programme satisfies itself — foraging complete';
      this.history.push(rec);
      return rec;
    }

    const f = this.forage(this.src, fail);
    const trial = this.compile(f.src);
    rec.move = f.move; rec.why = f.why;
    rec.trialParts = trial.audit ? trial.audit.parts : 0;
    rec.trialScore = Math.round((trial.score || 0) * 100);

    // Keep the change only if the material actually got better at the job.
    if ((trial.score || -1) >= (cur.score || 0)) {
      this.src = f.src; this.result = trial; rec.kept = true;
      if (!this.best || trial.score > this.best.score) this.best = { score: trial.score, src: f.src, r: trial };
    }
    this.history.push(rec);
    return rec;
  }

  run(n) { const out = []; for (let i = 0; i < (n || this.maxRounds); i++) { const r = this.step(); if (!r) break; out.push(r); } return out; }
  scene() { return (this.best && this.best.r.scene) || (this.result && this.result.scene) || new N.Scene('empty'); }
  toMPD() {
    const r = (this.best && this.best.r) || this.result;
    if (!r) return '';
    return r.scene.toMPD({ filename: 'forager.mpd', author: 'Nabugo · Forager',
      brief: r.prog.world, meta: { rounds: this.round, score: Math.round(this.best.score * 100),
        script: r.prog.world, parts: r.audit.parts, modules: r.graph.length } });
  }
}

// ══════════════════════════════════════════════════════════════ scriptorium
/**
 * A population of programmes under selection. Nothing here looks at a single
 * brick: it mutates numbers and swaps modules in text, compiles each variant,
 * and keeps a frontier. Because the genome is a procedure, a surviving lineage
 * is a *way of building*, which is the thing worth inheriting.
 */
class Scriptorium {
  constructor(opts = {}) {
    this.seedSrc = opts.src || SEEDS.jellyfish;
    this.rng = N.mulberry32(opts.seed ?? 9317);
    this.size = opts.size || 6;
    this.maxRounds = opts.maxRounds || 24;
    this.round = 0;
    this.settled = false;
    this.history = [];
    this.population = [];
    this.champion = null;
    this.lineages = 0;
  }

  evaluate(src, lineage) {
    const prog = S.parse(src);
    if (prog.errors.length) return null;
    const r = S.compile(prog, {});
    const passed = r.verdicts.filter(v => v.pass).length;
    const a = r.audit;
    return {
      src, lineage, r, prog,
      traits: {
        // Deliberately several axes, none of them summed.
        lawful: passed / Math.max(1, r.verdicts.length),
        mass: Math.min(1, a.parts / 1600),
        reach: Math.min(1, a.span[1] / 800),
        variety: Math.min(1, a.unique / 90),
        economy: a.parts ? Math.min(1, r.graph.length / 30) : 0
      },
      parts: a.parts, modules: r.graph.length, unique: a.unique, height: a.span[1],
      passed, total: r.verdicts.length
    };
  }

  /** Pareto frontier over the traits. No weighted sum, so no monoculture. */
  frontier(pop) {
    const keys = Object.keys(pop[0].traits);
    const dominates = (a, b) => {
      let better = false;
      for (const k of keys) {
        if (a.traits[k] < b.traits[k] - 1e-9) return false;
        if (a.traits[k] > b.traits[k] + 1e-9) better = true;
      }
      return better;
    };
    return pop.filter(c => !pop.some(o => o !== c && dominates(o, c)));
  }

  step() {
    if (this.settled || this.round >= this.maxRounds) { this.settled = true; return null; }
    this.round++;

    if (!this.population.length) {
      const founder = this.evaluate(this.seedSrc, 'L0');
      if (!founder) { this.settled = true; return null; }
      this.population = [founder];
      this.champion = founder;
    }

    // Breed. Mutation dominates; recombination when there is anything to cross.
    const offspring = [];
    while (offspring.length < this.size) {
      const parent = this.population[Math.floor(this.rng() * this.population.length)];
      let src, note;
      if (this.population.length > 1 && this.rng() < 0.3) {
        const other = this.population[Math.floor(this.rng() * this.population.length)];
        src = S.recombine(parent.src, other.src, this.rng);
        note = 'crossed ' + parent.lineage + ' × ' + other.lineage;
      } else {
        const m = S.mutate(parent.src, this.rng);
        src = m.src; note = m.note;
      }
      const child = this.evaluate(src, 'L' + (++this.lineages));
      if (!child) continue;
      child.note = note; child.parent = parent.lineage;
      offspring.push(child);
    }

    const pool = [...this.population, ...offspring];
    const front = this.frontier(pool);
    this.population = front.slice(0, 8);

    // The champion is whoever satisfies the most of the programme's own claims,
    // with mass as the tie-break — a legal building beats a large illegal one.
    for (const c of pool) {
      if (!this.champion ||
          c.traits.lawful > this.champion.traits.lawful + 1e-9 ||
          (Math.abs(c.traits.lawful - this.champion.traits.lawful) < 1e-9 && c.parts > this.champion.parts)) {
        this.champion = c;
      }
    }

    const rec = {
      round: this.round, bred: offspring.length, frontier: front.length,
      champion: { lineage: this.champion.lineage, parts: this.champion.parts,
                  modules: this.champion.modules, unique: this.champion.unique,
                  height: this.champion.height,
                  passed: this.champion.passed, total: this.champion.total,
                  traits: Object.fromEntries(Object.entries(this.champion.traits)
                            .map(([k, v]) => [k, +v.toFixed(2)])) },
      offspring: offspring.map(o => ({ lineage: o.lineage, parent: o.parent, note: o.note,
                                       parts: o.parts, passed: o.passed, total: o.total,
                                       onFrontier: front.includes(o) }))
    };
    this.history.push(rec);
    if (this.champion.traits.lawful >= 0.999 && this.round >= 6) this.settled = true;
    return rec;
  }

  run(n) { const out = []; for (let i = 0; i < (n || this.maxRounds); i++) { const r = this.step(); if (!r) break; out.push(r); } return out; }
  scene() { return this.champion ? this.champion.r.scene : new N.Scene('empty'); }
  toMPD() {
    if (!this.champion) return '';
    const c = this.champion;
    return c.r.scene.toMPD({ filename: 'scriptorium.mpd', author: 'Nabugo · Scriptorium',
      brief: c.prog.world, meta: { round: this.round, lineage: c.lineage,
        parts: c.parts, modules: c.modules, passed: c.passed + '/' + c.total } });
  }
}

global.NabugoLoops = { SEEDS, Forager, Scriptorium };
})(typeof window !== 'undefined' ? window : globalThis);

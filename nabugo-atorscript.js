/**
 * ATORSCRIPT — the script is the genome
 * =====================================
 * A giant castle should not be authored as forty thousand MPD lines. It should
 * be authored as a compact developmental program that compiles into them.
 *
 *   the script          is the genome
 *   the assembly graph  is the developing organism
 *   the MPD             is the compiled phenotype
 *
 * Which changes the job from "write coordinates" to "write construction
 * procedures". `tower_count: 4 → 7` regenerates the ring, the spacing and the
 * gates; nobody rewrites a thousand placements, and a mutation that flips one
 * number coherently changes hundreds of them.
 *
 * The language is deliberately small and typed. It cannot execute arbitrary
 * code — every statement is one of a fixed set of construction verbs resolved
 * against the module library, so a model can write it without being able to
 * reach anything else.
 *
 *   WORLD "Flooded Cathedral"
 *   SEED 4812
 *   USE ECOLOGY eco_aquatic_membrane
 *   INVITE ECOLOGY eco_animal_morphology AT 0.2
 *   SITE span 1800
 *   PIN shaft 2x2                    -- steer a role without naming a part
 *
 *   PLACE cathedral AT 0,0 WITH bays=5 span=130 spire=16
 *   RING pavilion AROUND 0,0 RADIUS 520 COUNT 6 WITH columns=6
 *   SCATTER reef COUNT 14 SPREAD 900
 *   REPEAT ruin COUNT 3 SPREAD 700 WITH columns=5
 *   AGE 0.15
 *
 *   ASSERT no_collisions
 *   ASSERT supported
 *   ASSERT parts > 900
 *   PROBE silhouette
 */
(function (global) {
'use strict';
const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules;
if (!N || !E || !M) throw new Error('nabugo-atorscript.js requires nabugo.js, -evo.js and -modules.js');
const { Catalog, Geom } = N;

// ════════════════════════════════════════════════════════════════════ parse
/**
 * One statement per line, comments after `--`. Small enough that a hand-rolled
 * reader is clearer than a grammar, and strict enough that a bad line is an
 * error with a line number rather than a silent no-op.
 */
const VERBS = new Set(['WORLD','SEED','USE','INVITE','EXCLUDE','SITE','PIN','PALETTE',
                       'PLACE','RING','SCATTER','REPEAT','GRID','AGE','POPULATE',
                       'ASSERT','PROBE','COLOR']);

function parse(src) {
  const prog = { world: 'Untitled', seed: 1, ecologies: [], invited: [], excluded: [],
                 site: { span: 1600 }, pins: {}, colors: {}, steps: [],
                 asserts: [], probes: [], errors: [] };

  String(src || '').split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/--.*$/, '').trim();
    if (!line) return;
    const ln = i + 1;
    const tok = line.match(/"[^"]*"|\S+/g) || [];
    const verb = (tok[0] || '').toUpperCase();
    const err = m => prog.errors.push({ line: ln, text: raw.trim(), message: m });

    if (!VERBS.has(verb)) { err('unknown verb "' + tok[0] + '"'); return; }
    const rest = tok.slice(1);
    const unquote = t => String(t || '').replace(/^"|"$/g, '');

    switch (verb) {
      case 'WORLD': prog.world = unquote(rest.join(' ')) || 'Untitled'; break;
      case 'SEED': {
        const n = Number(rest[0]);
        if (!Number.isFinite(n)) return err('SEED wants a number');
        prog.seed = n >>> 0; break;
      }
      case 'USE': {
        if ((rest[0] || '').toUpperCase() !== 'ECOLOGY') return err('USE ECOLOGY <id>');
        const id = rest[1];
        if (!E.Ecology.get(id)) return err('no such ecology "' + id + '"');
        prog.ecologies.push(id); break;
      }
      case 'INVITE': {
        if ((rest[0] || '').toUpperCase() !== 'ECOLOGY') return err('INVITE ECOLOGY <id> AT <0..1>');
        const id = rest[1];
        if (!E.Ecology.get(id)) return err('no such ecology "' + id + '"');
        const at = rest[2] && rest[2].toUpperCase() === 'AT' ? Number(rest[3]) : 0.15;
        prog.invited.push({ id, at: Number.isFinite(at) ? at : 0.15 }); break;
      }
      case 'EXCLUDE': prog.excluded.push(rest[rest.length - 1]); break;
      case 'SITE': {
        const kv = pairs(rest);
        if (kv.span) prog.site.span = +kv.span;
        break;
      }
      case 'PIN':    prog.pins[rest[0]] = rest.slice(1).join(' '); break;
      case 'COLOR':  prog.colors[rest[0]] = Number(rest[1]); break;
      case 'PALETTE': break;                             // reserved, no-op
      case 'AGE': {
        const n = Number(rest[0]);
        prog.steps.push({ op: 'AGE', amount: Number.isFinite(n) ? n : 0.15, line: ln });
        break;
      }
      case 'ASSERT': prog.asserts.push({ text: rest.join(' '), line: ln }); break;
      case 'PROBE':  prog.probes.push({ name: rest[0] || 'silhouette', line: ln }); break;
      case 'POPULATE': {
        const kv = pairs(rest);
        prog.steps.push({ op: 'POPULATE', count: +(kv.count || 4), line: ln });
        break;
      }
      default: {
        // PLACE / RING / SCATTER / REPEAT / GRID <module> …
        const mod = rest[0];
        if (!mod) return err(verb + ' needs a module name');
        if (!M.STRUCTURES[mod] && !M.MODULES[mod]) return err('no such module "' + mod + '"');
        const kv = pairs(rest.slice(1));
        prog.steps.push({ op: verb, module: mod, args: kv, line: ln });
      }
    }
  });

  if (!prog.ecologies.length) prog.ecologies = ['eco_monumental_architecture'];
  return prog;
}

/**
 * Read `KEY value`, `KEY=value` and `WITH a=1 b=2` into one flat bag. Bare
 * positional words after AT / AROUND become coordinates.
 */
function pairs(tokens) {
  const out = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const up = t.toUpperCase();
    if (up === 'WITH') continue;
    if (up === 'AT' || up === 'AROUND') {
      const c = String(tokens[++i] || '0,0').split(',').map(Number);
      out.x = Number.isFinite(c[0]) ? c[0] : 0;
      out.z = Number.isFinite(c[1]) ? c[1] : 0;
      continue;
    }
    if (t.includes('=')) {
      const [k, v] = t.split('=');
      out[k.toLowerCase()] = isNaN(Number(v)) ? v : Number(v);
      continue;
    }
    const nxt = tokens[i + 1];
    if (nxt !== undefined && !isNaN(Number(nxt))) { out[up.toLowerCase()] = Number(nxt); i++; }
    else out[up.toLowerCase()] = true;
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════ compile
/**
 * Run a program. The result is an assembly graph — a list of what was raised,
 * where and out of how many pieces — plus the scene it compiles to, plus the
 * verdicts of every ASSERT and PROBE.
 */
function compile(prog, opts = {}) {
  const rng = N.mulberry32(prog.seed);
  const ecologies = prog.ecologies.slice();
  for (const inv of prog.invited) if (rng() < 0.5 + inv.at) ecologies.push(inv.id);

  const lex = (opts.lexicon || []).slice();
  const palette = new M.Palette(ecologies, lex, rng);

  // PIN steers a role by description rather than by naming a part id, which is
  // the whole point: the script says "a 2x2 shaft", not "part 3062b".
  for (const [role, want] of Object.entries(prog.pins)) {
    const pool = palette.pool(role);
    const hit = pool.find(p => p._t.includes(String(want).toLowerCase()));
    if (hit) palette.fixed.set(role, hit);
  }

  const colorOf = role => {
    if (prog.colors[role] != null) return prog.colors[role];
    const d = opts.colors || {};
    return d[role] != null ? d[role] : 71;
  };

  const site = new M.Site({ extent: prog.site.span });
  const ctx = { palette, origin: { x: 0, z: 0 }, rng, colorOf };
  const graph = [];
  const trace = [];

  // `count`, `spread`, `radius` and friends tell the interpreter where to put
  // copies; they are not parameters of the thing being copied. Passing them
  // through made SCATTER … SPREAD 900 ask for a reef nine hundred studs across,
  // which the site then refused for want of ground.
  const PLACEMENT = new Set(['count','spread','radius','cols','rows','pitch','x','z','prefer']);
  const moduleArgs = args => {
    const out = {};
    for (const [k, v] of Object.entries(args || {})) if (!PLACEMENT.has(k)) out[k] = v;
    return out;
  };

  const raise = (mod, args, prefer, label) => {
    const r = site.raise(mod, ctx, { ...moduleArgs(args), prefer }, rng);
    if (r.ok) graph.push({ module: mod, at: r.at, parts: r.parts, label,
                           footprint: r.footprint, height: r.height });
    trace.push({ module: mod, label, ok: r.ok,
                 note: r.ok ? r.parts + ' pieces at ' + r.at.x + ',' + r.at.z : r.reason });
    return r;
  };

  for (const st of prog.steps) {
    switch (st.op) {
      case 'PLACE':
        raise(st.module, st.args, { x: st.args.x || 0, z: st.args.z || 0 }, 'PLACE:' + st.line);
        break;

      case 'RING': {
        const count = st.args.count || 6;
        const radius = st.args.radius || 400;
        // A colonnade's own column pitch is spelled `colpitch` so it survives.
        if (st.args.colpitch != null) st.args.pitch = st.args.colpitch;
        const cxp = st.args.x || 0, czp = st.args.z || 0;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          raise(st.module, st.args,
                { x: Math.round((cxp + Math.cos(a) * radius) / 20) * 20,
                  z: Math.round((czp + Math.sin(a) * radius) / 20) * 20 },
                'RING:' + st.line + '#' + i);
        }
        break;
      }

      case 'GRID': {
        const cols = st.args.cols || 3, rows = st.args.rows || 3;
        const pitch = st.args.pitch || 420;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          raise(st.module, st.args,
                { x: Math.round((c - (cols - 1) / 2) * pitch), z: Math.round((r - (rows - 1) / 2) * pitch) },
                'GRID:' + st.line + '#' + r + ',' + c);
        }
        break;
      }

      case 'SCATTER':
      case 'REPEAT': {
        const count = st.args.count || 5;
        const spread = st.args.spread || 700;
        for (let i = 0; i < count; i++) {
          const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * spread;
          raise(st.module, st.args,
                { x: Math.round(Math.cos(a) * rr / 20) * 20, z: Math.round(Math.sin(a) * rr / 20) * 20 },
                st.op + ':' + st.line + '#' + i);
        }
        break;
      }

      case 'AGE': {
        // Ruination as a script operator: remove a fraction of what stands,
        // preferring the top of things, so a building reads as collapsed
        // rather than as never finished.
        const amount = Math.max(0, Math.min(0.6, st.amount));
        const before = site.places.length;
        const ranked = site.places
          .map((p, i) => ({ i, y: Geom.worldBox(p) ? Geom.worldBox(p).min[1] : 0 }))
          .sort((a, b) => a.y - b.y);                      // Y-down: most negative is highest
        const kill = new Set(ranked.slice(0, Math.floor(before * amount))
          .filter(() => rng() < 0.75).map(r => r.i));
        site.places = site.places.filter((_, i) => !kill.has(i));
        // Knocking the top off a building orphans whatever it was carrying, so
        // weathering has to settle after itself or it leaves debris in mid-air.
        const withBox = site.places.map(p => ({ p, box: Geom.worldBox(p) })).filter(x => x.box);
        const standing = M.groundSettle(withBox, []);
        const orphaned = withBox.length - standing.length;
        site.places = standing.map(x => x.p);
        trace.push({ module: 'AGE', ok: true,
                     note: 'weathered away ' + (before - site.places.length) + ' pieces' +
                           (orphaned ? ' (' + orphaned + ' of them fell with what held them)' : '') });
        break;
      }

      case 'POPULATE':
        trace.push({ module: 'POPULATE', ok: false,
                     note: 'the crew are mustered by the expedition, not the script' });
        break;
    }
  }

  // ---- compile to a scene ------------------------------------------------
  const scene = new N.Scene(prog.world);
  for (const p of site.places) {
    scene.add({ part: p.part, color: p.color, pos: p.pos, mat: p.mat,
                vignette: p.module, strategy: p.role, zone: 2 });
  }
  const audit = N.Audit.run(scene, opts.brief || N.Brief.BRIEFS.atlantis);

  // ---- ASSERT: the script's own claims, checked -------------------------
  const verdicts = prog.asserts.map(a => check(a, audit, graph));
  const probes = prog.probes.map(p => probe(p.name, audit, graph, site));

  return { prog, site, scene, audit, graph, trace, verdicts, probes, palette,
           ecologies, ok: verdicts.every(v => v.pass) };
}

/** ASSERT understands a handful of claims and refuses the rest by name. */
function check(a, audit, graph) {
  const t = a.text.trim();
  const mk = (pass, detail) => ({ line: a.line, text: t, pass, detail });
  let m;
  if (/^no_collisions$/i.test(t))  return mk(audit.collisions === 0, audit.collisions + ' interpenetrations');
  if (/^supported$/i.test(t))      return mk(audit.floating === 0, audit.floating + ' pieces resting on nothing');
  if (/^compiles$/i.test(t))       return mk(audit.compiles, audit.compiles ? 'every reference resolves' : audit.unknown.join(', '));
  if (/^connected$/i.test(t))      return mk(audit.cohesion >= 0.99, 'cohesion ' + Math.round(audit.cohesion * 100) + '%');
  if ((m = t.match(/^parts\s*([<>]=?)\s*(\d+)$/i)))
    return mk(cmp(audit.parts, m[1], +m[2]), audit.parts + ' pieces');
  if ((m = t.match(/^distinct\s*([<>]=?)\s*(\d+)$/i)))
    return mk(cmp(audit.unique, m[1], +m[2]), audit.unique + ' distinct parts');
  if ((m = t.match(/^height\s*([<>]=?)\s*(\d+)$/i)))
    return mk(cmp(audit.span[1], m[1], +m[2]), audit.span[1] + ' LDU tall');
  if ((m = t.match(/^modules\s*([<>]=?)\s*(\d+)$/i)))
    return mk(cmp(graph.length, m[1], +m[2]), graph.length + ' modules raised');
  return mk(false, 'ASSERT does not understand "' + t + '"');
}
const cmp = (v, op, n) => op === '>' ? v > n : op === '>=' ? v >= n : op === '<' ? v < n : v <= n;

/** PROBE reports rather than judges. */
function probe(name, audit, graph, site) {
  switch (name) {
    case 'silhouette':
      return { name, value: audit.span.join(' × ') + ' LDU',
               note: 'aspect ' + (audit.span[1] / Math.max(1, Math.max(audit.span[0], audit.span[2]))).toFixed(2) +
                     ' — height against footprint' };
    case 'density':
      return { name, value: (audit.parts / Math.max(1, graph.length)).toFixed(0) + ' pieces per module',
               note: graph.length + ' modules, ' + audit.parts + ' pieces' };
    case 'variety':
      return { name, value: audit.unique + ' distinct of ' + audit.parts,
               note: (100 * audit.unique / Math.max(1, audit.parts)).toFixed(1) + '% distinct' };
    case 'ground':
      return { name, value: site.claims.length + ' plots on ' + site.extent + ' LDU',
               note: 'site ' + (site.claims.length > 10 ? 'crowded' : 'open') };
    case 'habitation': {
      const tall = audit.span[1] >= 44;
      return { name, value: tall ? 'a figure fits' : 'too low for a figure',
               note: audit.span[1] + ' LDU of headroom' };
    }
    default:
      return { name, value: '—', note: 'no such probe' };
  }
}

// ═════════════════════════════════════════════════════════════════ mutation
/**
 * Mutation targets the genes, not the phenotype. One changed number here
 * coherently regenerates hundreds of placements, which is the entire reason
 * for having a script in the middle.
 */
const NUMERIC = ['count','radius','spread','columns','drums','bays','span','racks',
                 'height','tentacles','clumps','stones','ribs','pitch','cols','rows','spire','depth'];

function mutate(src, rng) {
  const r = rng || Math.random;
  const lines = String(src).split(/\r?\n/);
  const idx = [];
  lines.forEach((l, i) => { if (/^\s*(PLACE|RING|SCATTER|REPEAT|GRID|SEED|AGE)\b/i.test(l)) idx.push(i); });
  if (!idx.length) return { src, note: 'nothing mutable' };

  const pick = idx[Math.floor(r() * idx.length)];
  const line = lines[pick];

  // Reseeding is a mutation too: same programme, different draw from the bag.
  if (/^\s*SEED\b/i.test(line)) {
    const n = Math.floor(r() * 99999);
    lines[pick] = 'SEED ' + n;
    return { src: lines.join('\n'), note: 'reseeded to ' + n, line: pick + 1 };
  }

  const found = NUMERIC.filter(k => new RegExp('\\b' + k + '=\\d+').test(line));
  if (found.length && r() < 0.8) {
    const key = found[Math.floor(r() * found.length)];
    const m = line.match(new RegExp('\\b' + key + '=(\\d+)'));
    const was = +m[1];
    const scale = 0.5 + r() * 1.4;
    const now = Math.max(1, Math.round(was * scale));
    lines[pick] = line.replace(new RegExp('\\b' + key + '=\\d+'), key + '=' + now);
    return { src: lines.join('\n'), note: key + ': ' + was + ' → ' + now, line: pick + 1 };
  }

  // Otherwise swap the module for a sibling — the structural mutation.
  const mods = Object.keys(M.STRUCTURES);
  const cur = (line.trim().split(/\s+/)[1] || '');
  const to = mods[Math.floor(r() * mods.length)];
  if (to && to !== cur) {
    lines[pick] = line.replace(new RegExp('\\b' + cur + '\\b'), to);
    return { src: lines.join('\n'), note: 'module: ' + cur + ' → ' + to, line: pick + 1 };
  }
  return { src, note: 'no change' };
}

/** Cross two programmes by taking each one's steps in turn. */
function recombine(a, b, rng) {
  const r = rng || Math.random;
  const head = String(a).split(/\r?\n/);
  const tail = String(b).split(/\r?\n/);
  const isStep = l => /^\s*(PLACE|RING|SCATTER|REPEAT|GRID)\b/i.test(l);
  const prelude = head.filter(l => !isStep(l) && !/^\s*(ASSERT|PROBE)\b/i.test(l));
  const coda = head.filter(l => /^\s*(ASSERT|PROBE)\b/i.test(l));
  const stepsA = head.filter(isStep), stepsB = tail.filter(isStep);
  const mixed = [];
  const n = Math.max(stepsA.length, stepsB.length);
  for (let i = 0; i < n; i++) {
    const from = r() < 0.5 ? stepsA : stepsB;
    if (from[i]) mixed.push(from[i]);
  }
  return [...prelude, ...mixed, ...coda].join('\n');
}

global.NabugoScript = { parse, compile, mutate, recombine, VERBS, NUMERIC, pairs };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * NABUGO GAUNTLET — the blind critic, and the loop it drives.
 * ===========================================================
 * The builder never judges itself and the critic never builds. This module is
 * the second half of that split: it measures nothing of its own (every number
 * comes from NabugoKits.measurePlacements, the one measuring function), it
 * places nothing, and it holds no opinion that is not a band published in the
 * axis registry.
 *
 * WHAT BLIND MEANS HERE
 * ---------------------
 * Not "we promise not to peek". The judging kernel is a function of an axis
 * definition and two bare numbers, `kernel(axis, va, vb)`. It has no argument
 * that could tell it which side is ours, and the two sides reach it in an
 * order decided by a seeded coin toss. Only after every axis has a winner does
 * `unmask()` read the key and turn A/B into ours/kit — and only then is "ties
 * go to the kit" applied, because that rule needs to know which side is the
 * kit and is therefore not allowed anywhere near the kernel.
 *
 * The placements are anonymised too, symmetrically: submodel names become
 * sub-N.ldr, assembly ids become asm-N, layer stamps are dropped (a kit
 * placement has none, so a stamped one is a tell). None of that moves an axis
 * value — the harness asserts it — it only removes the label.
 *
 * NEVER SUMMED
 * ------------
 * There is no total, no average, no weight vector, and no field a caller could
 * mistake for one. `compare()` returns wins/losses/na as counts of a list, and
 * the exit condition reads `allWon`, not a score. A weighted sum is a supreme
 * judge in disguise: it would let a build trade a SNOT rate of 0.000 against a
 * good colour count and call itself improved.
 *
 * TWO DEFECTS IN THE CONTRACT, RESOLVED HERE AND REPORTED
 * -------------------------------------------------------
 * 1. §3.2's formula `win = inBand(ours) && dist(ours) < dist(bar)` with
 *    `dist` = distance to the band, combined with §3.1's rule that an axis is
 *    only applicable when the BAR is in band, makes dist(bar) === 0 on every
 *    applicable axis and therefore makes a win arithmetically impossible.
 *    Measured: all twelve axes of 5935 are in band, so a literal reading loses
 *    12/12 forever and §8's definition of done can never be reached. The same
 *    section's prose says what was meant — "strictly closer to the corpus
 *    median than the bar is" — so the comparison here is lexicographic:
 *    (distance to the band, then distance to the axis target), where the
 *    target is the axis median clamped into its own band. Band distance still
 *    dominates, ties still go to the kit, and `strict:true` reproduces the
 *    literal formula for anyone who wants to see it fail.
 * 2. Every one of the sixteen real kits fails G-CLASH, ten fail G-FLOAT and
 *    three fail G-BUFFER when measured through the gate set they are the bar
 *    for. A gate the bar itself cannot pass is not a fact about legality, it
 *    is a fact about axis-aligned bounding boxes; enforcing it absolutely
 *    would void every round forever and would punish precisely the studs-off-
 *    vertical construction the SKIN layer is ordered to produce. So a gate
 *    voids a round when ours fails it and the BAR PASSES it, and when the bar
 *    fails it too, ours may not be worse than the worst of the sixteen real
 *    kits (CORPUS_CEILING, measured here). Every gate row carries the bar's
 *    verdict, our rate and that ceiling; `gatePolicy:'absolute'` restores the
 *    literal rule.
 */
(function (global) {
'use strict';

const VERSION = '1.0.0';

// ══════════════════════════════════════════════════════════════════ numerics
const r6 = (v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v);
const r4 = (v) => (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : v);
/** Axis values span 0.000–1060; one formatter so a verdict reads the same everywhere. */
function fmt(v) {
  if (!Number.isFinite(v)) return 'n/a';
  const a = Math.abs(v);
  return a >= 100 ? v.toFixed(1) : a >= 10 ? v.toFixed(2) : v.toFixed(3);
}

// ═══════════════════════════════════════════════════════ module dependencies
/**
 * Resolved late and by name. Page load order is not this module's business,
 * and a missing dependency must say which one rather than throwing
 * "undefined is not an object" three frames deep.
 */
function kits() {
  const K = global.NabugoKits;
  if (!K || !K.AXES || typeof K.measurePlacements !== 'function') {
    throw new Error('NabugoGauntlet needs NabugoKits (the axis registry and the one measuring function)');
  }
  return K;
}
function rngFrom(seed) {
  const N = global.Nabugo;
  if (N && typeof N.mulberry32 === 'function') return N.mulberry32(seed >>> 0);
  // Deterministic fallback so the critic still runs in a harness that loaded
  // only NabugoKits. Same generator, inlined; never Math.random.
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ═════════════════════════════════════════════════════════════════ distances
/**
 * The axis target: the corpus median, clamped into the axis band. AX-REUSE's
 * declared median is 0.000 while its band is [0.05, 0.60] — six of sixteen
 * kits instance nothing — so an unclamped median would name a target the band
 * forbids. Clamping is the only place a band and a median are reconciled.
 */
function target(axis) {
  const [lo, hi] = axis.band;
  const m = Number.isFinite(axis.median) ? axis.median : (lo + hi) / 2;
  return Math.min(Math.max(m, lo), hi);
}
/** 0 inside the band; distance to the nearer edge outside it. NabugoKits owns this. */
function bandDist(axis, v) {
  const K = global.NabugoKits;
  if (K && typeof K.dist === 'function') return K.dist(axis, v);
  const [lo, hi] = axis.band;
  if (!Number.isFinite(v)) return Infinity;
  return v >= lo && v <= hi ? 0 : Math.min(Math.abs(v - lo), Math.abs(v - hi));
}
function inBand(axis, v) { return bandDist(axis, v) === 0; }
function targetDist(axis, v) { return Number.isFinite(v) ? Math.abs(v - target(axis)) : Infinity; }
function bandWidth(axis) { return Math.max(axis.band[1] - axis.band[0], 1e-6); }

/**
 * The open interval of values that would beat `barValue` on this axis: inside
 * the band AND strictly nearer the target than the bar is. Handed to the
 * builder in the brief so it aims at an interval, not at a point it will
 * overshoot. Empty when the bar sits exactly on the target.
 */
function winWindow(axis, barValue) {
  const t = target(axis), d = targetDist(axis, barValue);
  if (!(d > 0)) return null;
  const lo = Math.max(axis.band[0], t - d), hi = Math.min(axis.band[1], t + d);
  return hi > lo ? [r6(lo), r6(hi)] : null;
}

// ══════════════════════════════════════════════════════════ THE BLIND KERNEL
/**
 * Judge one axis from two bare numbers. This function is the whole of the
 * blindness guarantee: it takes an axis definition and two values and has no
 * parameter, closure or global through which it could learn which value came
 * from us. `strict` reproduces the contract's literal band-only formula.
 *
 * The comparison is lexicographic: how far outside the band, then how far from
 * the axis target. Band distance dominates, so a build that is inside the band
 * always beats one that is not, whichever side it is on.
 */
function kernel(axis, va, vb, strict) {
  const dA = bandDist(axis, va), dB = bandDist(axis, vb);
  const tA = targetDist(axis, va), tB = targetDist(axis, vb);
  let winner, basis;
  if (!Number.isFinite(va) || !Number.isFinite(vb)) { winner = 'TIE'; basis = 'unmeasured'; }
  else if (dA !== dB) { winner = dA < dB ? 'A' : 'B'; basis = 'band'; }
  else if (strict || tA === tB) { winner = 'TIE'; basis = dA === 0 ? 'both in band' : 'both miss by ' + fmt(dA); }
  else { winner = tA < tB ? 'A' : 'B'; basis = 'target'; }
  return {
    id: axis.id, label: axis.label, layer: axis.layer,
    band: axis.band.slice(), unit: axis.unit || '', target: r6(target(axis)),
    A: r6(va), B: r6(vb),
    bandDistA: r6(dA), bandDistB: r6(dB),
    targetDistA: r6(tA), targetDistB: r6(tB),
    inBandA: dA === 0, inBandB: dB === 0,
    winner, basis,
    // Normalised so axes measured in shares and axes measured in matrices per
    // hundred pieces can be ranked against each other at all.
    margin: r6(Math.abs(dA - dB) / bandWidth(axis) + (dA === dB ? Math.abs(tA - tB) / bandWidth(axis) : 0)),
  };
}

/** Judge every axis blind. Rows carry A and B and nothing that names a side. */
function judgeBlind(A, B, axes, opts) {
  const o = opts || {};
  const list = axes || kits().AXES;
  const va = A && A.axes ? A.axes : {}, vb = B && B.axes ? B.axes : {};
  return list.map((ax) => kernel(ax, va[ax.id], vb[ax.id], !!o.strict));
}

// ══════════════════════════════════════════════════════════════ THE UNMASKING
/**
 * Turn blind rows into verdicts, now that we may know which side is ours.
 * Rules, in the contract's order:
 *   the bar's own value outside the band  -> N/A  (a bar that does not
 *                                            exercise an axis cannot judge it)
 *   ours outside the band                 -> LOSS
 *   the kernel did not hand us the win    -> LOSS (a TIE is a LOSS: the kit
 *                                            keeps the point)
 *   otherwise                             -> WIN
 */
function unmask(rows, key, axes) {
  const byId = new Map((axes || kits().AXES).map((a) => [a.id, a]));
  const oursSide = key && key.A === 'ours' ? 'A' : 'B';
  const barSide = oursSide === 'A' ? 'B' : 'A';
  return rows.map((row) => {
    const axis = byId.get(row.id);
    const ours = row[oursSide], bar = row[barSide];
    const dOurs = row['bandDist' + oursSide], dBar = row['bandDist' + barSide];
    const tOurs = row['targetDist' + oursSide], tBar = row['targetDist' + barSide];
    let verdict, why;
    if (!(dBar === 0)) {
      verdict = 'N/A';
      why = 'the bar is at ' + fmt(bar) + ', outside [' + row.band[0] + ', ' + row.band[1] +
            ']; a kit that does not exercise this axis cannot judge it';
    } else if (!(dOurs === 0)) {
      verdict = 'LOSS';
      why = fmt(ours) + ' is ' + (ours < row.band[0] ? 'below the floor ' + row.band[0]
                                                     : 'above the ceiling ' + row.band[1]) +
            ' by ' + fmt(dOurs) + (row.unit ? ' ' + row.unit : '') + '; the kit is at ' + fmt(bar);
    } else if (row.winner !== oursSide) {
      verdict = 'LOSS';
      why = row.winner === 'TIE'
        ? 'dead level with the kit at ' + fmt(ours) + '; ties go to the kit'
        : 'inside the band but ' + fmt(tOurs) + ' from the target ' + fmt(row.target) +
          ' where the kit is ' + fmt(tBar) + '; ties go to the kit';
    } else {
      verdict = 'WIN';
      why = fmt(ours) + ' against the kit\'s ' + fmt(bar) + ', ' + fmt(tOurs) +
            ' from the target where the kit is ' + fmt(tBar);
    }
    // Shortfall ranks LOSSes. Band distance first, because being outside the
    // band is a different kind of failure from being inside it and second
    // best; the target term only discriminates among the in-band losses.
    const shortfall = verdict === 'LOSS'
      ? r6((dOurs + (dOurs === 0 ? Math.max(0, tOurs - tBar) : 0)) / bandWidth(axis || { band: row.band }))
      : 0;
    return {
      id: row.id, label: row.label, layer: row.layer, band: row.band.slice(),
      unit: row.unit, target: row.target,
      ours: ours, bar: bar,
      verdict, why,
      margin: row.margin, shortfall,
      distOurs: dOurs, distBar: dBar, targetDistOurs: tOurs, targetDistBar: tBar,
      inBandOurs: dOurs === 0, inBandBar: dBar === 0,
      blindWinner: row.winner, basis: row.basis,
      winWindow: winWindow(axis || { band: row.band, median: row.target }, bar),
    };
  });
}

// ══════════════════════════════════════════════════════════════════ BLINDING
/** Which of a vector's fields name their author rather than describe the model. */
const VECTOR_TELLS = ['label', 'kit', 'file', 'name', 'note', 'seed', 'temperament', 'brief'];

function blindVector(v) {
  if (!v) return v;
  const out = {};
  for (const k of Object.keys(v)) { if (VECTOR_TELLS.indexOf(k) < 0) out[k] = v[k]; }
  out.label = '';
  return out;
}

/**
 * Anonymise a flat Placement[]. Submodel names become sub-N.ldr in order of
 * first appearance and assembly ids become asm-N, which preserves every
 * equivalence class AX-ANATOMY and AX-REUSE count while destroying the names
 * ('Left Foot' vs 'parts/5935 - plane.ldr') that give the author away. Layer
 * stamps are dropped because only our placements carry them.
 */
function blindPlacements(places) {
  const blocks = new Map(), asms = new Map();
  return (places || []).map((p) => {
    let parent = p.parent || 'root';
    if (!blocks.has(parent)) blocks.set(parent, 'sub-' + (blocks.size + 1) + '.ldr');
    let asm = p.asm || null;
    if (asm !== null) { if (!asms.has(asm)) asms.set(asm, 'asm-' + (asms.size + 1)); asm = asms.get(asm); }
    return {
      part: p.part, color: p.color,
      pos: p.pos ? p.pos.slice() : [0, 0, 0], mat: p.mat ? p.mat.slice() : null,
      lpos: p.lpos ? p.lpos.slice() : null, lmat: p.lmat ? p.lmat.slice() : null,
      parent: blocks.get(parent), depth: p.depth, layer: 'UNASSIGNED', asm,
      desc: p.desc || '',
    };
  });
}

/**
 * Strip an MPD of everything that names its author, per §6.2: the filename,
 * `0 Author`, `0 Name`, `0 !LDRAW_ORG` and the rest of the meta headers, every
 * `0 //` comment, and the submodel names — which are renamed consistently in
 * the `0 FILE` headers and in the type-1 lines that reference them, or the
 * file stops loading.
 */
function blindText(text) {
  const src = String(text || '');
  const lines = src.split(/\r?\n/);
  const names = new Map();                       // lowercased original -> sub-N.ldr
  for (const ln of lines) {
    const m = /^\s*0\s+FILE\s+(.+?)\s*$/i.exec(ln);
    if (m && !names.has(m[1].toLowerCase())) names.set(m[1].toLowerCase(), 'sub-' + (names.size + 1) + '.ldr');
  }
  const out = [];
  for (const ln of lines) {
    const f = /^\s*0\s+FILE\s+(.+?)\s*$/i.exec(ln);
    if (f) { out.push('0 FILE ' + names.get(f[1].toLowerCase())); continue; }
    if (/^\s*0\s+(Author|Name|!LDRAW_ORG|!LICENSE|!HELP|!CATEGORY|!KEYWORDS|!HISTORY|!CMDLINE)\b/i.test(ln)) continue;
    if (/^\s*0\s*\/\//.test(ln)) continue;
    const t = ln.trim().split(/\s+/);
    if (t[0] === '1' && t.length >= 15) {
      const ref = t.slice(14).join(' ');
      const sub = names.get(ref.toLowerCase());
      if (sub) { out.push(t.slice(0, 14).join(' ') + ' ' + sub); continue; }
    }
    out.push(ln);
  }
  return out.join('\n');
}

/**
 * Two anonymous entrants in a shuffled order. `key` is SEALED: it is
 * non-enumerable, so JSON.stringify of the pair cannot leak it into a log, and
 * gauntlet-page.js is the only caller that may read it, on `reveal`.
 * judgeAxis, judgeBlind and compare never receive it.
 */
function blind(a, b, rng) {
  const roll = (typeof rng === 'function' ? rng() : 0.0) < 0.5;
  const asEntrant = (x) => {
    if (!x) return { vector: null, text: '', places: null };
    if (x.axes) return { vector: blindVector(x), text: blindText(x.text || ''), places: null };
    return {
      vector: x.vector ? blindVector(x.vector) : null,
      text: blindText(x.text || ''),
      places: x.places ? blindPlacements(x.places) : null,
    };
  };
  const ea = asEntrant(a), eb = asEntrant(b);
  const A = roll ? ea : eb, B = roll ? eb : ea;
  const key = Object.freeze({ A: roll ? 'ours' : 'kit', B: roll ? 'kit' : 'ours' });
  const pair = { A, B };
  Object.defineProperty(pair, 'key', { value: key, enumerable: false, writable: false });
  return pair;
}

// ═══════════════════════════════════════════════════════════════════ THE CRITIC
/**
 * The critic proper. It reads two placement lists, never a filename, and it
 * puts them through the one measuring function so a kit and a build cannot be
 * measured by two different rulers.
 */
const Critic = {
  kernel, judgeBlind, unmask, blindPlacements, blindText, blindVector,

  /**
   * Judge ours against a kit, blind. The shuffle is real and the unmasking is
   * the only place the mapping is used.
   * @param {Placement[]} oursPlacements
   * @param {Placement[]} kitPlacements
   * @param {AxisDef[]} [axes]
   * @param {{seed?:number, strict?:boolean, rng?:function}} [opts]
   * @returns {Verdict[]}
   */
  judge(oursPlacements, kitPlacements, axes, opts) {
    const o = opts || {};
    const K = kits();
    const list = axes || K.AXES;
    const rng = o.rng || rngFrom(o.seed === undefined ? 0x9E3779B9 : o.seed);
    // Anonymise BEFORE measuring, and identically on both sides: the vectors
    // the kernel sees are then functions of geometry alone.
    const oursV = K.measurePlacements(blindPlacements(oursPlacements), { gates: false });
    const kitV = K.measurePlacements(blindPlacements(kitPlacements), { gates: false });
    const pair = blind(oursV, kitV, rng);
    const rows = judgeBlind(pair.A.vector, pair.B.vector, list, o);
    return unmask(rows, pair.key, list);
  },

  /**
   * The single biggest remaining gap: the largest normalised shortfall among
   * the LOSSes, ties broken by registry order (SNOT before COLOUR before
   * VOCAB). Returns null when nothing is lost.
   */
  worst(verdicts) {
    let best = null;
    for (const v of verdicts || []) {
      if (v.verdict !== 'LOSS') continue;
      if (!best || v.shortfall > best.shortfall + 1e-12) best = v;
    }
    return best;
  },

  /** The accusation, as one imperative sentence a builder can act on. */
  brief(axis, verdicts, kit) {
    const v = typeof axis === 'string'
      ? (verdicts || []).find((x) => x.id === axis)
      : axis;
    if (!v) return 'Nothing is lost. Take the harder bar.';
    return instruction(v, kit);
  },
};

// ════════════════════════════════════════════════════════ the accusations
/**
 * One instruction per axis, imperative, naming the Brand layer that owns it
 * and the exact vocabulary the contract measured in the kits. The numbers are
 * substituted from the verdict, so the builder is told how many pieces, not
 * how it ought to feel.
 */
function instruction(v, kit) {
  const barName = typeof kit === 'string' ? kit : (kit && kit.kit) || 'the kit';
  const win = v.winWindow;
  const aim = win ? fmt(win[0]) + '-' + fmt(win[1]) : fmt(v.target);
  // Direction matters more than vocabulary: 0.468 of the pieces being
  // inhabitants is as wrong as 0.000, and "put inhabitants in it" would be a
  // brief that makes the build worse.
  const high = win ? v.ours > win[1] : v.ours > v.target;
  const body = (ACCUSATIONS[v.id] || { low: 'move ' + v.id + ' into its band.', high: 'move ' + v.id + ' into its band.' })[high ? 'high' : 'low'];
  return v.layer + ': ' + body +
         ' You are at ' + fmt(v.ours) + ' (' + (high ? 'too high' : 'too low') + '); ' +
         barName + ' is at ' + fmt(v.bar) + '. Land inside ' + aim + '.';
}

/**
 * One accusation per axis per direction, imperative, naming the vocabulary the
 * contract measured in the kits rather than a quality to aspire to. Overshoot
 * gets its own sentence because a band is not a floor: 63 distinct parts in 66
 * pieces is not vocabulary, it is a bag of curiosities, and telling that build
 * to "widen the vocabulary" is how a loop chases its own tail.
 */
const ACCUSATIONS = {
  'AX-SNOT': {
    low: 'turn pieces studs-off-vertical. Anchor vocabulary only - 47905 (studs two opposite sides), ' +
         '30414 (1x4 studs on side), 4070 (headlight), 2555 (tile with clip), 3794a/47457 (studs down) - ' +
         'at exact half-widths: 10 LDU to the side stud face plus 8 LDU of plate body is 18. ' +
         "The corpus's commonest SNOT matrix is 1 0 0 / 0 0 -1 / 0 1 0.",
    high: 'too much of the build is studs-off-vertical: there is no frame left, only face. ' +
          'Put the load path back on studs-up brick and keep SNOT for the skin.',
  },
  'AX-POSE': {
    low: 'pose joints off-axis. 3937 hinge base under 6134 hinge top, inside a submodel, at 63.0 degrees ' +
         '(1 0 0 / 0 0.454 -0.891 / 0 0.891 0.454) or 45 (1 0 0 / 0 0.707 0.707 / 0 0.707 -0.707). ' +
         'A yaw of 90 is an axis rotation, not a pose, and scores nothing here.',
    high: 'too many placements sit at arbitrary angles. A pose is a joint that was set; the rest of the ' +
          'build belongs on the axes. Return the unposed pieces to exact 0/90/180/270.',
  },
  'AX-SERVICES': {
    low: 'place the fast layer: hinge+turntable, bracket+clip, window+door, bar+antenna. Select from ' +
         'Nabugo.Catalog through NabugoKits.affordancesOf and cross-check joinability with ' +
         'NabugoEvo.Ports.of. Do not relax NabugoModules.NOT_STRUCTURAL - it is right for STRUCTURE and ' +
         'SKIN; SERVICES bypasses Palette instead.',
    high: 'the fast layer has eaten the building. Hinges and clips wear out on a 7-15 year clock; a frame ' +
          'made of them cannot last 30. Move the load-bearing work back into brick and plate.',
  },
  'AX-STUFF': {
    low: 'put inhabitants in it: minifig, wheel+tyre, flag+cloth, each figure and each vehicle its own asm ' +
         'so it can be lifted out. Use NabugoBrand.MINIFIG_SKELETON - both legs at x=0 with ' +
         '1 0 0 / 0 0 1 / 0 -1 0 - never the shipped MINIFIG_HEIGHTS table. plant+animal does not count.',
    high: 'this is a crowd, not a building. STUFF is on a daily clock and must be removable without ' +
          'destroying anything; build the slow layers it stands in before adding another figure.',
  },
  'AX-ANATOMY': {
    low: 'cut the build into named asm blocks. Tier A is anatomy: 10-80 parts, named after the thing ' +
         "('Left Foot', 'Hull Bay 2'), depth at most 5. One flat block scores 0 by definition however " +
         'many pieces it holds.',
    high: 'the build is shredded into blocks. A block per two pieces is filing, not anatomy: merge until ' +
          'each block is a part of a body someone could name.',
  },
  'AX-REUSE': {
    low: 'instance blocks more than once through Build.instance. A 2-5 part detail atom is cut into its own ' +
         'block the moment it is used twice and must then be used twice. A block placed once is not an assembly.',
    high: 'almost every piece arrives through a repeated block. That is a tiling, not a model; keep the ' +
          'repeated bays and build the parts that differ.',
  },
  'AX-VOCAB': {
    low: 'widen the part vocabulary: one part repeated is scaffolding. Reach for the staples the kits use ' +
         '(3001/3002/3003/3020/3022/3023) plus the slopes, wedges and tiles the SKIN layer owns.',
    high: 'this is a bag of curiosities, not a vocabulary. Almost every piece is a different part, so ' +
          'nothing repeats and nothing reads as made. Repeat the staples and spend the novelty on the skin.',
  },
  'AX-COLOUR': {
    low: 'raise the effective colour count, exp(H) over the colour shares. A horizontal band is made by ' +
         'SUBSTITUTING the part at the banded course - a ring of 3063b corner-rounds in an 87081 stack - ' +
         'never by recolouring in place, and never by one red tile in 200 grey bricks.',
    high: 'the colour is confetti. exp(H) above the ceiling means no colour is the buildings colour; ' +
          'pick two or three that carry the mass and let the rest be accents.',
  },
  'AX-ROT': {
    low: 'widen the rotation vocabulary: distinct matrices per hundred pieces. Yaw 0/90/180/270 on every ' +
         'placement is four matrices however long the build runs; the kits get theirs from posed submodels ' +
         'and from wedges that face somewhere.',
    high: 'nearly every piece has its own matrix, which is noise, not orientation. Reuse orientations the ' +
          'way a kit does: a few families, each used many times.',
  },
  'AX-LATTICE': {
    low: 'put the placements back on the LOCAL lattice: x and z on 10 LDU, y on 4, all three at once, ' +
         "within 0.51. Continuous polar coordinates score zero here. Tidy inside the submodel, posed in " +
         "the world - that is the kits' discipline.",
    high: 'the lattice is too perfect to be a model: everything on grid means nothing was ever posed. ' +
          'Keep the frame on the lattice and let SERVICES and SKIN come off it.',
  },
  'AX-SYMMETRY': {
    low: 'mirror about the sagittal plane with Build.mirror: the chirality twin at the reflected position ' +
         'with the SAME matrix, or a 2-fold-Y-symmetric part with rotY(180). Never negate a matrix column - ' +
         'det(M) < 0 is a gate failure, not a mirror.',
    high: 'the build is a mirror and nothing else. Total symmetry has no front; break it where the thing ' +
          'has a purpose - a door, a cockpit, a single arm.',
  },
  'AX-DENSITY': {
    low: 'inhabit the volume you claim. Shrink the plot rather than adding pieces: G-SCALE caps the piece ' +
         'count against the bar, so a colonnade over a baseplate reads as the empty box it is.',
    high: 'the envelope is packed solid. Scenario buffering is a hard rule: at least a quarter of the ' +
          'envelope stays uncommitted, permanently, or the future is locked out.',
  },
};

/**
 * The other axes, as regressions the next round may not cause. `forbidden` is
 * the contract's string[]; `hold` is the same information as numbers, because
 * a builder cannot honour a sentence. Without it, one-axis-per-brief plus
 * coupled knobs is a limit cycle: fix AX-ANATOMY, break AX-REUSE, fix
 * AX-REUSE, break AX-ANATOMY, forever, and the loop has no round-count exit
 * to save it.
 */
function forbidden(verdicts, exceptId) {
  const out = [];
  for (const v of verdicts || []) {
    if (v.id === exceptId || v.verdict === 'N/A') continue;
    if (v.verdict === 'WIN') out.push(v.id + ' is won at ' + fmt(v.ours) + '; do not give it back');
    else if (v.inBandOurs) out.push(v.id + ' is inside [' + v.band[0] + ', ' + v.band[1] + '] at ' +
                                    fmt(v.ours) + '; do not push it out');
  }
  return out;
}
function holds(verdicts, exceptId) {
  const out = [];
  for (const v of verdicts || []) {
    if (v.id === exceptId || v.verdict === 'N/A') continue;
    if (v.verdict !== 'WIN' && !v.inBandOurs) continue;
    out.push({ axis: v.id, layer: v.layer, ours: v.ours, band: v.band.slice(),
               window: v.verdict === 'WIN' ? v.winWindow : v.band.slice(), verdict: v.verdict });
  }
  return out;
}

/**
 * The window restated in the builder's own currency. An axis measured as a
 * share of pieces is answered by placing an integer number of pieces, and when
 * the bar sits near the corpus median the winning interval can be narrower
 * than one piece: 5935's AX-STUFF is 0.049 against a target of 0.046, so the
 * window is 0.0432-0.0489, which at 142 pieces is 6.1 to 6.9 pieces and holds
 * no integer at all. The axis is then unwinnable at that piece count and
 * winnable at another, and the brief has to say so rather than let the loop
 * spin on it.
 */
function windowPieces(v) {
  if (!v || !v.winWindow || !v.pieces || !/^share/.test(v.unit || '')) return null;
  const n = v.pieces;
  const lo = v.winWindow[0] * n, hi = v.winWindow[1] * n;
  let feasible = false;
  for (let k = Math.ceil(lo); k <= Math.floor(hi) + 1; k++) {
    if (k / n > v.winWindow[0] && k / n < v.winWindow[1]) { feasible = true; break; }
  }
  return {
    lo: r4(lo), hi: r4(hi), pieces: n, feasible,
    why: feasible ? '' : 'no whole number of pieces lands inside the window at ' + n +
         ' pieces; change the piece count (G-SCALE allows ' + (v.scaleBand ? v.scaleBand.join('-') : 'the bar band') + ')',
  };
}

/** The brief object the loop hands to the builder. Exactly one axis. */
function brief(worst, bar) {
  if (!worst) return null;
  const barName = bar && bar.kit ? bar.kit : 'the kit';
  if (bar && bar.scaleBand) worst.scaleBand = bar.scaleBand;
  const wp = windowPieces(worst);
  return {
    pieceWindow: wp,
    feasible: wp ? wp.feasible : true,
    axis: worst.id,
    layer: worst.layer,
    target: worst.target,
    window: worst.winWindow,
    barValue: worst.bar,
    ours: worst.ours,
    band: worst.band.slice(),
    shortfall: worst.shortfall,
    bar: barName,
    instruction: instruction(worst, barName) +
      (wp ? ' That is ' + fmt(wp.lo) + '-' + fmt(wp.hi) + ' pieces of ' + wp.pieces +
            (wp.feasible ? '.' : ' — and ' + wp.why + '.') : ''),
    forbidden: [],           // filled by compare(), which can see the other axes
    hold: [],                // the same, as numbers a builder can honour
  };
}

// ═════════════════════════════════════════════════════════════════════ gates
/** Gate why-strings start with their magnitude ("26 interpenetrating pairs"). */
function magnitudeOf(why) {
  const m = /^(\d+)/.exec(String(why || ''));
  return m ? Number(m[1]) : null;
}

/**
 * What the sixteen real kits actually do to the gates they are the bar for,
 * measured through NabugoKits.GATES on this machine. These are ceilings, not
 * targets: no real LEGO set is worse than this, so a build that is worse is
 * not doing something a kit does.
 *
 *   G-CLASH   interpenetrating AABB pairs per piece   max 1.6528  10174 (SNOT
 *             at 87% off vertical; axis-aligned boxes cannot tell a clutched
 *             side stud from a collision, which is the whole limitation)
 *   G-FLOAT   unfooted placements per piece           max 0.8298  30054
 *   G-BUFFER  occupancy STRUCTURE / +SKIN / ALL       max 0.5293 4838,
 *                                                         0.7063 6965,
 *                                                         0.8091 car
 *
 * Provenance: NabugoKits.measure over KITS minus 6156, 2026-08-22.
 */
const CORPUS_CEILING = Object.freeze({
  'G-CLASH':  Object.freeze({ rate: 1.6528, argmax: '10174-imperial-atst-ucs', of: 'interpenetrating pairs per piece' }),
  'G-FLOAT':  Object.freeze({ rate: 0.8298, argmax: '30054-atst-mini', of: 'unfooted placements per piece' }),
  'G-BUFFER': Object.freeze({ occ: Object.freeze([0.5293, 0.7063, 0.8091]),
                              argmax: '4838 / 6965 / car', of: 'envelope occupancy STRUCTURE, +SKIN, ALL' }),
});

/** How far past the corpus ceiling this gate failure is, or null if unmeasurable. */
function pastCeiling(id, oursVector) {
  const c = CORPUS_CEILING[id];
  if (!c) return null;
  if (c.occ) {
    const o = oursVector.raw && oursVector.raw.occupancy;
    if (!o) return null;
    const v = [o.STRUCTURE, o.STRUCTURE_SKIN, o.ALL];
    let worst = null;
    for (let i = 0; i < 3; i++) {
      const over = v[i] - c.occ[i];
      if (worst === null || over > worst.over) worst = { over: r6(over), value: r6(v[i]), ceiling: c.occ[i], which: ['STRUCTURE', 'STRUCTURE+SKIN', 'ALL'][i] };
    }
    return worst;
  }
  const mag = magnitudeOf((oursVector.gates[id] || {}).why);
  if (mag === null || !oursVector.pieces) return null;
  const value = r6(mag / oursVector.pieces);
  return { over: r6(value - c.rate), value, ceiling: c.rate, which: c.of };
}

/**
 * Gate rows, corpus-calibrated.
 *
 * A gate the BAR PASSES is absolute: ours fails it, the round is void, no axis
 * is scored, no partial credit. A gate the bar FAILS cannot be absolute
 * without voiding every round forever — all sixteen kits fail G-CLASH — so it
 * voids only when ours is worse than the worst real kit in the corpus. Both
 * numbers ride on the row, so nothing is hidden: `barOk`, `rate`, `ceiling`.
 *
 * This is a backstop, not the clash check. The real one is
 * NabugoCrew.commit at placement time, which refuses rather than reports.
 */
function gateRows(oursVector, bar, policy) {
  const absolute = policy === 'absolute';
  const barGates = (bar && bar.vector && bar.vector.gates) || {};
  const barPieces = (bar && bar.pieces) || 0;
  const rows = [];
  for (const id of Object.keys(oursVector.gates || {})) {
    const g = oursVector.gates[id];
    const bg = barGates[id];
    const barOk = bg ? bg.ok : true;
    let voids = !g.ok, note = '', rate = null, barRate = null, ceiling = null;
    if (!g.ok && !barOk && !absolute) {
      const mb = magnitudeOf(bg.why);
      if (mb !== null && barPieces) barRate = r6(mb / barPieces);
      const past = pastCeiling(id, oursVector);
      const c = CORPUS_CEILING[id];
      if (past) {
        rate = past.value; ceiling = past.ceiling;
        voids = past.over > 0;
        note = voids
          ? ' — and past the corpus ceiling: ' + fmt(past.value) + ' ' + past.which + ' against ' +
            fmt(past.ceiling) + ', worse than any of the sixteen real kits (' + c.argmax + ')'
          : ' — the bar fails this gate too and ' + fmt(past.value) + ' is inside the corpus ceiling ' +
            fmt(past.ceiling) + ' (' + c.argmax + '), so it cannot void a round';
      } else {
        voids = false;
        note = ' — the bar fails this gate too (' + bg.why + ') and there is no corpus ceiling for it, ' +
               'so it cannot void a round';
      }
    }
    rows.push({ id, ok: g.ok, why: g.why + note, barOk, voids, rate, barRate, ceiling });
  }
  // G-SCALE needs the bar, and measurePlacements is often called without one.
  const scale = rows.find((r) => r.id === 'G-SCALE');
  if (bar && bar.scaleBand && scale && /not checked/.test(scale.why)) {
    const [lo, hi] = bar.scaleBand;
    const n = oursVector.pieces;
    scale.ok = n >= lo && n <= hi;
    scale.voids = !scale.ok;
    scale.barOk = true;
    scale.why = scale.ok
      ? n + ' pieces, inside ' + lo + '-' + hi
      : n + ' pieces is outside ' + lo + '-' + hi + ' against ' + bar.kit +
        '; the critic would be judging size, not craft';
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════════ compare
/**
 * The whole comparison. Gates first — a voiding gate short-circuits and no
 * axis is scored, because partial credit for a build that clashes worse than
 * the bar is how a standard rots. Then the twelve axes, judged through the
 * blind kernel with the sides shuffled, and unmasked.
 */
function compare(oursVector, bar, opts) {
  const o = opts || {};
  const K = kits();
  const axes = K.AXES;
  const barVector = bar && bar.vector ? bar.vector : bar;
  const rng = o.rng || rngFrom(o.seed === undefined ? 0x5BD1E995 : o.seed);

  const gates = o.gates === false ? [] : gateRows(oursVector, bar, o.gatePolicy || GATE_POLICY);
  const failed = gates.filter((g) => g.voids);
  if (failed.length) {
    const g = failed[0];
    return {
      void: true,
      voidReason: g.id + ': ' + g.why,
      gates,
      axes: [], wins: 0, losses: 0, na: 0,
      applicable: (bar && bar.applicable) || [],
      worst: null, allWon: false,
      bar: (bar && bar.kit) || '', pieces: oursVector.pieces,
      verdict: 'VOID — ' + g.id + ' failed: ' + g.why + '. No axis was scored and the round is not progress.',
      brief: gateBrief(g, bar),
    };
  }

  const pair = blind(oursVector, barVector, rng);
  const rows = judgeBlind(pair.A.vector, pair.B.vector, axes, o);
  const verdicts = unmask(rows, pair.key, axes);
  for (const v of verdicts) v.pieces = oursVector.pieces;

  const wins = verdicts.filter((v) => v.verdict === 'WIN').length;
  const losses = verdicts.filter((v) => v.verdict === 'LOSS').length;
  const na = verdicts.filter((v) => v.verdict === 'N/A').length;
  const worst = Critic.worst(verdicts);
  const allWon = losses === 0 && wins > 0;
  const b = brief(worst, bar);
  if (b) { b.forbidden = forbidden(verdicts, worst.id); b.hold = holds(verdicts, worst.id); }

  return {
    void: false,
    gates,
    axes: verdicts,
    wins, losses, na,
    applicable: verdicts.filter((v) => v.verdict !== 'N/A').map((v) => v.id),
    worst, allWon,
    bar: (bar && bar.kit) || '', pieces: oursVector.pieces,
    verdict: verdictSentence({ wins, losses, na, worst, allWon }, bar),
    brief: b,
  };
}

/** One sentence. It names the worst failure and there is no praise field. */
function verdictSentence(r, bar) {
  const kit = (bar && bar.kit) || 'the kit';
  if (r.allWon) {
    return 'Every one of the ' + r.wins + ' applicable axes beaten on ' + kit +
           '; ' + r.na + ' were N/A because the bar itself is outside their bands. Take the harder bar.';
  }
  if (!r.worst) return 'Nothing was scored against ' + kit + '.';
  const w = r.worst;
  return r.losses + ' of ' + (r.losses + r.wins) + ' applicable axes lost to ' + kit +
         '. Worst is ' + w.id + ' (' + w.label + ', ' + w.layer + '): ' + w.why + '.';
}

/** A voided round still gets a brief; it is a gate, so it names the gate. */
function gateBrief(g, bar) {
  const fix = {
    'G-DET': 'STRUCTURE: never negate a matrix column. Mirror through the chirality twin or through a ' +
             '2-fold-Y part at rotY(180), or refuse the mirror.',
    'G-KNOWN': 'Every part id must resolve in Nabugo.Catalog before it is placed.',
    'G-CLASH': 'Go through NabugoCrew.commit and let it refuse. Interlocking within one asm is legal; ' +
               'between two is not.',
    'G-FLOAT': 'Every placement must reach the build\'s own footing by vertical adjacency. Settle it.',
    'G-SCALE': 'Build smaller. Scale parity with the bar is a gate, not an axis, and building smaller is ' +
               'the builder\'s job.',
    'G-BUFFER': 'Leave the future somewhere to go: STRUCTURE at most 0.45 of the envelope, +SKIN 0.60, ' +
                'all six 0.75. Over-specifying every cubic LDU locks it out.',
    'G-BLIND': 'Strip the authorship lines before handing the file in.',
  }[g.id] || 'Fix the gate before anything is scored.';
  return {
    axis: g.id, layer: 'GATE', target: null, window: null,
    barValue: null, ours: null, band: null, shortfall: Infinity,
    bar: (bar && bar.kit) || '',
    instruction: fix + ' (' + g.why + ')',
    forbidden: [],
  };
}

/** Score one axis, harshly, per the contract's public signature. */
function judgeAxis(axis, ours, bar, opts) {
  const o = opts || {};
  const row = kernel(axis, ours, bar, !!o.strict);
  const v = unmask([row], { A: 'ours', B: 'kit' }, [axis])[0];
  return { id: v.id, ours: v.ours, bar: v.bar, verdict: v.verdict, margin: v.margin, why: v.why,
           shortfall: v.shortfall, target: v.target, band: v.band, layer: v.layer,
           winWindow: v.winWindow };
}

// ══════════════════════════════════════════════════════════════════ the loop
const GATE_POLICY = 'corpus-calibrated';

/**
 * Normalise whatever the builder handed back. A Build, a bare Placement[], or
 * {places, note} are all acceptable; a builder that returns nothing stops the
 * loop with a reason rather than scoring an empty list as a loss.
 */
function harvest(built) {
  if (!built) return null;
  if (Array.isArray(built)) return { places: built, build: null, note: '', mpd: null };
  const places = built.places
    || (built.site && built.site.places)
    || null;
  if (!places) return null;
  return {
    places,
    build: typeof built.measure === 'function' ? built : (built.build || null),
    note: built.note || built.did || '',
    mpd: typeof built.toMPD === 'function' ? null : (built.mpd || null),
  };
}

/** The builder for a round: the caller's, or NabugoBrand.compose, or nothing. */
function builderFor(opts) {
  if (opts && typeof opts.builder === 'function') return opts.builder;
  const B = global.NabugoBrand;
  if (B && typeof B.compose === 'function') {
    return (req) => B.compose({
      bar: req.bar, seed: req.seed, temperament: req.temperament,
      subject: req.subject, focusAxis: req.brief ? req.brief.axis : null,
    });
  }
  return null;
}

async function start(opts) {
  const o = opts || {};
  const K = kits();
  const bar = await K.bar(o.kit || '5935-island-hopper');
  return {
    bar, seed: o.seed === undefined ? 1 : o.seed,
    temperament: o.temperament === 'HIGH' ? 'HIGH' : 'LOW',
    subject: o.subject || '',
    round: 0, build: null, vector: null, result: null, brief: null,
    history: [], transcript: [],
    stopped: false, stopReason: '',
    opts: o,
  };
}

function stop(state, why) {
  state.stopped = true;
  state.stopReason = why || 'stopped';
  return state;
}

/**
 * One turn. Build (or amend), measure, judge blind, record, and set the next
 * brief from the worst axis. Never runs more than one build, and never scores
 * a build it did not receive.
 */
async function round(state) {
  if (state.stopped) return state;
  const K = kits();
  const build = builderFor(state.opts);
  if (!build) {
    return stop(state, 'no builder: pass opts.builder, or load a NabugoBrand that exposes compose()');
  }

  const accused = state.brief;                  // the brief this round was told to answer
  const beforeVector = state.vector;
  const beforeVerdict = accused && state.result && !state.result.void
    ? (state.result.axes.find((a) => a.id === accused.axis) || null)
    : null;

  let built;
  try {
    built = await build({
      bar: state.bar, seed: state.seed + state.round, round: state.round,
      temperament: state.temperament, subject: state.subject,
      brief: accused, previous: state.build, vector: beforeVector,
    });
  } catch (err) {
    return stop(state, 'builder threw on round ' + state.round + ': ' + (err && err.message || err));
  }
  const got = harvest(built);
  if (!got) return stop(state, 'builder returned nothing placeable on round ' + state.round);

  // ONE measuring function, for the kit and for us. The bar goes into the
  // context so G-SCALE has something to check against.
  const vector = got.build && typeof got.build.measure === 'function'
    ? got.build.measure()
    : K.measurePlacements(got.places, {
        label: 'round-' + state.round,
        bar: { kit: state.bar.kit, pieces: state.bar.pieces },
        skipGates: ['G-BLIND'],
      });
  vector.pieces = vector.pieces === undefined ? got.places.length : vector.pieces;

  const result = compare(vector, state.bar, {
    seed: (state.seed + state.round) >>> 0,
    gatePolicy: (state.opts && state.opts.gatePolicy) || GATE_POLICY,
    strict: !!(state.opts && state.opts.strict),
  });

  const afterVerdict = !result.void && accused
    ? (result.axes.find((a) => a.id === accused.axis) || null)
    : null;

  state.transcript.push({
    round: state.round,
    bar: state.bar.kit,
    pieces: vector.pieces,
    accused: accused ? { axis: accused.axis, layer: accused.layer, instruction: accused.instruction } : null,
    did: got.note || (accused ? '(builder left no note)' : 'first build, no brief'),
    before: beforeVerdict ? beforeVerdict.ours : (accused && beforeVector ? beforeVector.axes[accused.axis] : null),
    after: afterVerdict ? afterVerdict.ours : (accused && vector.axes ? vector.axes[accused.axis] : null),
    band: accused ? accused.band : null,
    was: beforeVerdict ? beforeVerdict.verdict : null,
    now: afterVerdict ? afterVerdict.verdict : (result.void ? 'VOID' : null),
    flipped: !!(beforeVerdict && afterVerdict && beforeVerdict.verdict !== afterVerdict.verdict &&
                afterVerdict.verdict === 'WIN'),
    regressed: regressions(beforeVector, vector, result),
    wins: result.wins, losses: result.losses, na: result.na,
    void: result.void, voidReason: result.voidReason || '',
    worst: result.worst ? result.worst.id : null,
    verdict: result.verdict,
  });

  state.build = got.build || null;
  state.places = got.places;
  state.vector = vector;
  state.result = result;
  state.brief = result.brief;
  state.history.push({
    round: state.round, worst: result.worst ? result.worst.id : null,
    wins: result.wins, losses: result.losses, na: result.na, void: result.void,
  });
  state.round += 1;

  if (result.allWon) {
    // The exit is winning, and then a harder bar. Never a round count.
    const next = K.nextBar(state.bar.kit);
    if (next && next !== state.bar.kit) {
      state.bar = await K.bar(next);
      state.brief = null;
      state.promoted = (state.promoted || []).concat([{ round: state.round - 1, from: result.bar, to: next }]);
    } else {
      stop(state, 'beat every applicable axis on ' + state.bar.kit + ', the hardest bar in the corpus');
    }
  }
  return state;
}

/** Which axes got worse while the builder was answering one brief. */
function regressions(before, after, result) {
  if (!before || !before.axes || !after || !after.axes) return [];
  const out = [];
  for (const v of (result.axes || [])) {
    const was = before.axes[v.id];
    if (!Number.isFinite(was)) continue;
    const dWas = bandDist({ band: v.band, median: v.target }, was);
    if (v.distOurs > dWas + 1e-9) out.push(v.id + ' ' + fmt(was) + ' -> ' + fmt(v.ours));
  }
  return out;
}

/**
 * Run until every applicable axis wins or the caller stops it. There is no
 * round limit in the engine; `opts.maxRounds` is the CALLER's limit and says
 * so when it fires.
 */
async function run(state, onRound, opts) {
  const o = opts || {};
  const cap = Number.isFinite(o.maxRounds) ? o.maxRounds : Infinity;
  let ran = 0;
  while (!state.stopped) {
    if (ran >= cap) { stop(state, 'caller round limit ' + cap + ' reached; the engine has none'); break; }
    await round(state);
    ran += 1;
    if (typeof onRound === 'function') {
      const keep = onRound(state);
      if (keep === false) { stop(state, 'caller stopped the loop'); break; }
    }
  }
  return state;
}

/**
 * Per round: which axis was accused, what was done about it, the before and
 * after of that axis, and whether it flipped. The loop's own record, not a
 * scoreboard — there is no total in it.
 */
function transcript(state) {
  return (state && state.transcript ? state.transcript : []).map((t) => ({
    round: t.round, bar: t.bar, pieces: t.pieces,
    accused: t.accused ? t.accused.axis : null,
    layer: t.accused ? t.accused.layer : null,
    did: t.did,
    before: t.before, after: t.after, band: t.band,
    was: t.was, now: t.now, flipped: t.flipped,
    delta: Number.isFinite(t.before) && Number.isFinite(t.after) ? r6(t.after - t.before) : null,
    regressed: t.regressed,
    wins: t.wins, losses: t.losses, na: t.na,
    void: t.void, voidReason: t.voidReason,
    worst: t.worst,
    verdict: t.verdict,
  }));
}

/** One line per round, for a log that has to fit in a terminal. */
function transcriptLines(state) {
  return transcript(state).map((t) => {
    const head = 'r' + String(t.round).padStart(2, '0') + ' ' + String(t.pieces).padStart(4) + 'p ';
    if (t.void) return head + 'VOID  ' + t.voidReason;
    const acc = t.accused ? t.accused + ' ' + fmt(t.before) + '->' + fmt(t.after) +
                            ' ' + (t.flipped ? 'FLIPPED' : (t.now || '-')) : '(no brief)';
    return head + 'W' + t.wins + '/L' + t.losses + '/NA' + t.na + '  ' + acc +
           '  next=' + (t.worst || '-');
  });
}

/**
 * The loop object. `new` is optional; the contract-level start/round/run act on
 * the same state, so a page may drive either.
 */
function Gauntlet(kitId, opts) {
  if (!(this instanceof Gauntlet)) return new Gauntlet(kitId, opts);
  const o = opts || {};
  this._opts = o;
  this._kit = kitId || o.kit || '5935-island-hopper';
  this._state = null;
  this._ready = null;
}
Gauntlet.prototype.ready = function () {
  if (!this._ready) {
    this._ready = start(Object.assign({}, this._opts, { kit: this._kit })).then((s) => { this._state = s; return s; });
  }
  return this._ready;
};
Gauntlet.prototype.round = async function () { return round(await this.ready()); };
Gauntlet.prototype.run = async function (n, onRound) {
  return run(await this.ready(), onRound, { maxRounds: Number.isFinite(n) ? n : Infinity });
};
Gauntlet.prototype.state = function () { return this._state; };
Gauntlet.prototype.history = function () { return this._state ? this._state.history : []; };
Gauntlet.prototype.transcript = function () { return transcript(this._state); };
Gauntlet.prototype.lines = function () { return transcriptLines(this._state); };
Gauntlet.prototype.stop = function (why) { return this._state ? stop(this._state, why) : null; };

// ═════════════════════════════════════════════════════════════════ exports
const NabugoGauntlet = {
  VERSION, GATE_POLICY,
  Critic, Gauntlet,
  blind, blindText, blindPlacements, blindVector,
  judgeAxis, judgeBlind, unmask, kernel,
  compare, brief, instruction, forbidden, holds, windowPieces, ACCUSATIONS, CORPUS_CEILING,
  start, round, run, stop, transcript, transcriptLines,
  target, bandDist, inBand, targetDist, winWindow, bandWidth,
  /**
   * The two places this module knowingly departs from the letter of
   * GAUNTLET-CONTRACT.md, and why. Read by the page so the departure is on
   * screen rather than buried in a comment.
   */
  DEPARTURES: Object.freeze([
    Object.freeze({
      clause: '§3.2 / §4.3 judgeAxis',
      literal: 'win = inBand(ours) && bandDist(ours) < bandDist(bar)',
      defect: 'combined with §3.1 (an axis is applicable only when the bar is in band) this makes ' +
              'bandDist(bar) === 0 on every applicable axis, so no win is arithmetically possible and ' +
              '§8 can never be satisfied. Measured: 12/12 axes of 5935-island-hopper are in band.',
      resolution: '§3.2\'s own prose — "strictly closer to the corpus median than the bar is" — read as a ' +
                  'lexicographic (bandDist, targetDist) comparison, target = median clamped into the band. ' +
                  'Pass {strict:true} to reproduce the literal formula.',
    }),
    Object.freeze({
      clause: '§2 GATES',
      literal: 'a gate failure is an automatic loss of the whole round',
      defect: 'all 16 real kits fail G-CLASH, 10 fail G-FLOAT and 3 fail G-BUFFER through this gate set; ' +
              'the bar cannot pass its own gates, so absolute enforcement voids every round forever and ' +
              'punishes the studs-off-vertical construction SKIN is ordered to produce.',
      resolution: 'corpus-calibrated: a gate the bar passes is absolute; a gate the bar fails voids only ' +
                  'when ours is worse than the worst of the sixteen real kits (CORPUS_CEILING). ' +
                  'Pass {gatePolicy:\'absolute\'} for the literal rule.',
    }),
  ]),
};

global.NabugoGauntlet = NabugoGauntlet;
if (typeof module !== 'undefined' && module.exports) module.exports = NabugoGauntlet;

})(typeof window !== 'undefined' ? window : globalThis);

#!/usr/bin/env node
/* tools/model.js — a film set as a real brick model: designed as a program of ops, laid in real parts on the stud
   grid (world/dsl.js tiles cells into bricks and plates in running bond and drops anything that floats), then held to
   account: every stud joint counted, every piece traced to the ground through studs, the weak ones named; the build
   cut into steps for a manual; the model written as an LDraw MPD with STEP markers and packed for the world's loader.

   A stud joint is one stud of a piece seated in one anti-stud of the piece above it: the two pieces meet at a plate
   boundary and share a cell where the lower piece has a stud and the upper piece an open bottom. Tiles have no studs;
   a slope has studs only on its stud row; a window, a door frame, an arch have studs on top and open bottoms. Pieces
   touching side by side share no joint: side contact holds nothing. A piece is supported when a chain of joints leads
   to the ground (any piece whose bottom is the ground is anchored); a piece is weak when it has a footprint of two
   studs or more and hangs by a single joint; a piece is unsupported when no chain reaches the ground.

   Usage: node tools/model.js <name> [--out ldraw/models] [--json play/models] [--no-pack]
     <name> is a module in world/models/<name>.js exporting { name, title, description, program, scale?, stage? }.
   Prints the sheet: pieces, steps, pages, stud joints, weak joints, unsupported pieces, and the inventory. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
require(path.join(root, 'world/dsl.js')); const Dsl = global.Dsl || (global.window && global.window.Dsl);
const { DIMS, STUD, PLATE, BRICK } = Dsl;

/* ── parts the models use beyond the DSL's own table: [x0, x1, z0, z1, height] in the part's LDraw frame ── */
Object.assign(DIMS, {
  '3069b': [-20, 20, -10, 10, 8], '87079': [-40, 40, -20, 20, 8], '3070b': [-10, 10, -10, 10, 8], '3068b': [-20, 20, -20, 20, 8],
  '3036': [-60, 60, -80, 80, 8], '3035': [-40, 40, -60, 60, 8], '3034': [-80, 80, -20, 20, 8], '3795': [-60, 60, -20, 20, 8], '3021': [-30, 30, -20, 20, 8], '3811': [-160, 160, -160, 160, 8], '3030': [-100, 100, -40, 40, 8],
  '3665': [-10, 10, -10, 30, 24], '3660': [-20, 20, -10, 30, 24], '3298': [-30, 30, -30, 10, 24], '3045': [-20, 20, -20, 20, 24], '3044': [-20, 20, -20, 20, 24],
  '4073': [-10, 10, -10, 10, 8], '4589': [-10, 10, -10, 10, 24], '3942': [-20, 20, -20, 20, 48], '3941': [-20, 20, -20, 20, 24], '3062b': [-10, 10, -10, 10, 24],
  '60593': [-20, 20, -10, 10, 72], '60594': [-40, 40, -10, 10, 72], '3853': [-40, 40, -10, 10, 72], '60596': [-40, 40, -10, 10, 144], '3861': [-40, 40, -10, 10, 120],
  '3307': [-60, 60, -10, 10, 48], '6183': [-60, 60, -20, 20, 48], '3185': [-40, 40, -10, 10, 48], '4175': [-40, 40, -10, 10, 96], '85959': [-6, 6, -6, 6, 56],
  '2412b': [-20, 20, -10, 10, 8], '30137': [-40, 40, -10, 10, 24], '30136': [-20, 20, -10, 10, 24], '24201': [-10, 10, -10, 30, 24], '4079': [-20, 20, -20, 20, 8], '3010': [-40, 40, -10, 10, 24], '3006': [-100, 100, -20, 20, 24], '3007': [-80, 80, -20, 20, 24],
  '2453b': [-10, 10, -10, 10, 120], '3245b': [-10, 10, -10, 10, 48], '3622': [-30, 30, -10, 10, 24], '3700': [-20, 20, -10, 10, 24], '3794a': [-20, 20, -10, 10, 8], '3794b': [-20, 20, -10, 10, 8],
  '4162': [-80, 80, -10, 10, 8], '2431': [-40, 40, -10, 10, 8], '6636': [-60, 60, -10, 10, 8], '3958': [-60, 60, -60, 60, 8], '3032': [-60, 60, -40, 40, 8], '3031': [-40, 40, -40, 40, 8],
  '3960': [-40, 40, -40, 40, 8], '4740': [-40, 40, -40, 40, 8], '3623': [-30, 30, -10, 10, 8], '3710': [-40, 40, -10, 10, 8], '3666': [-60, 60, -10, 10, 8], '3460': [-80, 80, -10, 10, 8], '3832': [-100, 100, -20, 20, 8],
  '4032': [-20, 20, -20, 20, 8], '3937': [-20, 20, -10, 10, 8], '3938': [-20, 20, -10, 10, 8], '4085': [-10, 10, -10, 10, 8], '2921': [-10, 10, -10, 10, 24], '30414': [-40, 40, -10, 10, 24],
  '4460b': [-10, 10, -10, 10, 72], '3747b': [-40, 40, -30, 10, 24], '3037': [-40, 40, -30, 10, 24], '3039': [-20, 20, -30, 10, 24], '3040b': [-10, 10, -30, 10, 24], '3676': [-20, 20, -20, 20, 24],
  '6541': [-10, 10, -10, 10, 24], '3005': [-10, 10, -10, 10, 24], '3004': [-20, 20, -10, 10, 24], '3003': [-20, 20, -20, 20, 24], '3001': [-40, 40, -20, 20, 24], '3002': [-30, 30, -20, 20, 24],
  '3008': [-80, 80, -10, 10, 24], '3009': [-60, 60, -10, 10, 24], '3020': [-40, 40, -20, 20, 8], '3022': [-20, 20, -20, 20, 8], '3023': [-20, 20, -10, 10, 8], '3024': [-10, 10, -10, 10, 8],
  '3455': [-60, 60, -10, 10, 24], '60592': [-20, 20, -10, 10, 48], '60623': [-4, 67, -7, 7, 137], '3823': [-40, 40, -30, 20, 48], '3626b': [-10, 10, -10, 10, 24],
  '48288': [-160, 160, -80, 80, 8], '1751': [-40, 40, -40, 40, 8], '95228': [-10, 10, -10, 10, 48], '33085': [-10, 10, -10, 10, 7], '98138': [-10, 10, -10, 10, 8], '6141': [-10, 10, -10, 10, 8],   /* the store: big floor tiles, a bottle, a banana (its footprint one cell: a bunch lies across its neighbours), round tiles and plates for fruit */
  '3009': [-60, 60, -10, 10, 24], '3010': [-40, 40, -10, 10, 24], '3245c': [-20, 20, -10, 10, 48], '4070': [-10, 10, -10, 10, 24], '3899': [-8, 8, -8, 8, 24], '3957': [-10, 10, -10, 10, 24],
});
/** What a part offers on top and accepts underneath, in cells of its footprint at rotation 0: 'all', 'none', or 'back' (the stud row of a slope: the max-z row at rotation 0, the way the DSL's roof lays them). */
const TOP = { '48288': 'none', '1751': 'none', '33085': 'none', '98138': 'none', '3068b': 'none', '3069b': 'none', '3070b': 'none', '87079': 'none', '2412b': 'none', '3039': 'back', '3040b': 'back', '3298': 'back', '3747b': 'back', '3037': 'none', '3045': 'corner', '3044': 'corner', '4589': 'none', '3942': 'none', '85959': 'none', '4085': 'none', '2921': 'none', '3676': 'back', '3823': 'none' };
const BOTTOM = { '24201': 'back', '3665': 'back', '3660': 'back', '3676': 'back' };
const NAMES = { '3001': 'brick 2×4', '3002': 'brick 2×3', '3003': 'brick 2×2', '3004': 'brick 1×2', '3005': 'brick 1×1', '3008': 'brick 1×8', '3009': 'brick 1×6', '3010': 'brick 1×4', '3006': 'brick 2×10', '3007': 'brick 2×8',
  '3020': 'plate 2×4', '3021': 'plate 2×3', '3022': 'plate 2×2', '3023': 'plate 1×2', '3024': 'plate 1×1', '3031': 'plate 4×4', '3032': 'plate 4×6', '3034': 'plate 2×8', '3035': 'plate 4×8', '3036': 'plate 6×8', '3710': 'plate 1×4', '3795': 'plate 2×6', '3958': 'plate 6×6', '3811': 'baseplate 32×32', '3030': 'plate 4×10',
  '3623': 'plate 1×3', '3666': 'plate 1×6', '3460': 'plate 1×8', '3832': 'plate 2×10', '4032': 'round plate 2×2', '4073': 'round plate 1×1', '3068b': 'tile 2×2', '3069b': 'tile 1×2', '3070b': 'tile 1×1', '87079': 'tile 2×4', '2412b': 'grille tile 1×2', '3937': 'hinge plate 1×2', '3938': 'hinge plate 1×2',
  '3039': 'slope 45 2×2', '3040b': 'slope 45 2×1', '3298': 'slope 33 3×2', '3660': 'inverted slope 45 2×2', '3665': 'inverted slope 45 2×1', '3045': 'corner slope 2×2', '3044': 'corner slope 2×2 inverted', '3747b': 'inverted slope 33 3×2', '3037': 'double slope 2×4', '3676': 'inverted slope 2×2 double',
  '3941': 'round brick 2×2', '3062b': 'round brick 1×1', '4589': 'cone 1×1', '3942': 'cone 2×2', '4085': 'clip plate 1×1', '2921': 'brick 1×1 with handle', '4460b': 'brick 1×2×3', '3245b': 'brick 1×2×2', '2453b': 'brick 1×1×5', '3622': 'brick 1×3', '3700': 'technic brick 1×2',
  '24201': 'inverted curved slope 2×1', '4079': 'minifig seat 2×2', '30137': 'log brick 1×4', '30136': 'log brick 1×2', '4493c01': 'horse', '4032': 'round plate 2×2',
  '60592': 'window 1×2×2', '60593': 'window 1×2×3', '60594': 'window 1×4×3', '3853': 'window frame 1×4×3', '60596': 'door frame 1×4×6', '60623': 'door 1×4×6', '3861': 'door 1×4×5', '3455': 'arch 1×6', '3307': 'arch 1×6×2', '6183': 'arch 2×6×2', '3185': 'fence 1×4×2', '4175': 'ladder 1×4×6', '85959': 'flame', '24201': 'inverted curved slope 2×1', '4079': 'minifig seat 2×2', '30137': 'log brick 1×4', '30414': 'brick 1×4 with studs on side', '3823': 'windscreen 2×4', '3626b': 'minifig head', '4070': 'headlight brick 1×1', '3899': 'cup', '3957': 'antenna', '6541': 'technic brick 1×1', '3794a': 'jumper plate 1×2', '3794b': 'jumper plate 1×2', '4162': 'tile 1×8', '2431': 'tile 1×4', '6636': 'tile 1×6', '3960': 'dish 4×4', '4740': 'dish 4×4', '3245c': 'brick 1×2×2', '48288': 'tile 8×16', '1751': 'tile 4×4', '95228': 'bottle', '33085': 'banana', '98138': 'round tile 1×1', '6141': 'round plate 1×1' };
const COLOUR_NAMES = { 0: 'black', 1: 'blue', 2: 'green', 4: 'red', 14: 'yellow', 15: 'white', 19: 'tan', 25: 'orange', 28: 'dark tan', 70: 'reddish brown', 71: 'light grey', 72: 'dark grey', 322: 'azure', 27: 'lime', 5: 'pink', 85: 'purple', 308: 'dark brown', 288: 'dark green', 320: 'dark red', 379: 'sand blue', 84: 'medium nougat', 26: 'magenta', 47: 'trans clear', 36: 'trans red', 33: 'trans blue', 42: 'trans neon green', 46: 'trans yellow', 7: 'old grey', 8: 'old dark grey', 3: 'teal', 10: 'bright green', 29: 'bright light green', 191: 'bright light orange', 226: 'bright light yellow', 212: 'bright light blue', 73: 'medium blue', 78: 'light nougat', 18: 'light yellow', 92: 'nougat', 297: 'pearl gold', 179: 'flat silver', 135: 'pearl light grey', 89: 'blue violet', 74: 'medium green', 151: 'light stone grey', 30: 'lavender', 31: 'medium lavender', 44: 'trans violet', 232: 'sky blue', 272: 'dark blue', 484: 'dark orange', 41: 'trans light blue', 57: 'trans orange', 34: 'trans green', 6: 'brown', 20: 'trans light blue', 40: 'trans black', 35: 'trans bright green' };

/* ── pieces: everything the DSL laid, as one list with cells, plates and connectors ── */
function pieces(result) {
  const out = [];
  for (const p of result.pieces) out.push({ part: p.part, col: p.col, x: p.x, y: p.y, z: p.z, rot: p.rot & 3, w: p.w, d: p.d, hp: p.plate ? 1 : BRICK, op: p.op == null ? -1 : p.op });
  for (const p of result.parts) { const h = DIMS[p.part] ? DIMS[p.part][4] : 24; out.push({ part: p.part, col: p.col, x: p.x, y: p.y, z: p.z, rot: p.rot & 3, w: p.w, d: p.d, hp: Math.max(1, Math.round(h / PLATE)), op: p.op == null ? -1 : p.op }); }
  out.forEach((p, i) => { p.i = i; });
  return out;
}
/** The cells of a piece that carry studs on top ('top') or accept studs underneath ('bottom'), as [x, z] pairs. */
function connectorCells(p, side) {
  const rule = (side === 'top' ? TOP : BOTTOM)[p.part] || 'all', cells = [];
  if (rule === 'none') return cells;
  for (let x = p.x; x < p.x + p.w; x++) for (let z = p.z; z < p.z + p.d; z++) {
    if (rule === 'all') { cells.push([x, z]); continue; }
    if (rule === 'back') {   // the stud row of a slope: max z at rotation 0, min z at 2, max x at 1, min x at 3
      const r = p.rot; if ((r === 0 && z === p.z + p.d - 1) || (r === 2 && z === p.z) || (r === 1 && x === p.x + p.w - 1) || (r === 3 && x === p.x)) cells.push([x, z]); continue;
    }
    if (rule === 'corner') { if (x === p.x + p.w - 1 && z === p.z + p.d - 1) cells.push([x, z]); continue; }   // a corner slope keeps one stud
  }
  return cells;
}
/** Stud joints between every pair of pieces meeting at a plate boundary: [{ a (below), b (above), n }]. */
function joints(P) {
  const studs = new Map(), key = (x, y, z) => x + ',' + y + ',' + z, out = [], pair = new Map();
  for (const p of P) for (const [x, z] of connectorCells(p, 'top')) studs.set(key(x, p.y + p.hp, z), p.i);
  for (const p of P) for (const [x, z] of connectorCells(p, 'bottom')) { const a = studs.get(key(x, p.y, z)); if (a == null || a === p.i) continue; const k = a + '>' + p.i; let j = pair.get(k); if (!j) { j = { a, b: p.i, n: 0 }; pair.set(k, j); out.push(j); } j.n++; }
  return out;
}
/** Support through the joints: anchored pieces sit on the ground (y 0) or on a reserved base; the rest must reach one through joints. */
function audit(P, J, opts = {}) {
  const per = P.map(() => ({ up: 0, down: 0, links: [] }));
  for (const j of J) { per[j.a].up += j.n; per[j.b].down += j.n; per[j.a].links.push(j.b); per[j.b].links.push(j.a); }
  const ground = opts.ground || (p => p.y === 0);
  const reached = new Set(); const queue = []; for (const p of P) if (ground(p)) { reached.add(p.i); queue.push(p.i); }
  while (queue.length) { const i = queue.pop(); for (const k of per[i].links) if (!reached.has(k)) { reached.add(k); queue.push(k); } }
  const unsupported = P.filter(p => !reached.has(p.i));
  const weak = P.filter(p => reached.has(p.i) && !ground(p) && p.w * p.d >= 2 && per[p.i].up + per[p.i].down <= 1);
  const total = J.reduce((s, j) => s + j.n, 0);
  return { per, total, unsupported, weak, reached };
}

/* ── the manual: steps in the order a builder lays them, bottom up, one sub-assembly at a time ── */
function steps(P, program, opts = {}) {
  const maxPer = opts.perStep || 10, groups = new Map();
  const ops = (program && program.ops) || [];
  const groupName = i => { const o = ops[i]; if (!o) return 'the base'; return o.name || (o.op === 'group' ? 'group ' + (i + 1) : o.op); };
  for (const p of P) { const k = p.op; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  const out = []; let n = 0;
  for (const k of [...groups.keys()].sort((a, b) => a - b)) {
    const list = groups.get(k).slice().sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
    const layers = new Map(); for (const p of list) { if (!layers.has(p.y)) layers.set(p.y, []); layers.get(p.y).push(p); }
    for (const y of [...layers.keys()].sort((a, b) => a - b)) {
      const L = layers.get(y);
      for (let i = 0; i < L.length; i += maxPer) { const chunk = L.slice(i, i + maxPer); out.push({ n: ++n, group: groupName(k), op: k, layer: y, pieces: chunk.map(p => p.i), note: `${groupName(k)}: ${chunk.length} piece${chunk.length > 1 ? 's' : ''} at plate ${y}` }); }
    }
  }
  return out;
}
function inventory(P) {
  const m = new Map(); for (const p of P) { const k = p.part + ':' + p.col; m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].map(([k, n]) => { const [part, col] = k.split(':'); return { part, col: +col, n, name: NAMES[part] || part, colour: COLOUR_NAMES[+col] || ('colour ' + col) }; }).sort((a, b) => b.n - a.n);
}

/* ── LDraw out: every piece a line, a STEP after each step, the sheet in the header ── */
const r4 = v => (Math.round(v * 1000) / 1000).toString();
const ROT = [[1, 0, 0, 0, 1, 0, 0, 0, 1], [0, 0, 1, 0, 1, 0, -1, 0, 0], [-1, 0, 0, 0, 1, 0, 0, 0, -1], [0, 0, -1, 0, 1, 0, 1, 0, 0]];
/* the DSL's own frame: the world rotated about x by π, (x, y, z) → (x, −y, −z), a turn about y flipping its sense (world/dsl.js toMPD) */
function pieceLine(p) { const b = Dsl.box(p.part, p.rot), h = DIMS[p.part] ? DIMS[p.part][4] : 24; return `1 ${p.col} ${r4(p.x * STUD - b[0])} ${r4(-(p.y * PLATE + h))} ${r4(-(p.z * STUD - b[2]))} ${ROT[(4 - (p.rot & 3)) & 3].join(' ')} parts/${p.part}.dat`; }
function toMPD(model, P, S, sheet, inv) {
  const L = [`0 FILE ${model.name}.mpd`, `0 ${model.title}`, '0 Name: ' + model.name + '.mpd', '0 Author: word to world, tools/model.js', '0 !LDRAW_ORG Unofficial_Model', '0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt', '',
    `0 // ${model.description}`, `0 // ${sheet.pieces} pieces, ${sheet.steps} steps, ${sheet.pages} pages, ${sheet.joints} stud joints, ${sheet.weak} weak, ${sheet.unsupported} unsupported`,
    `0 !MODEL SHEET ${JSON.stringify(sheet)}`, '0 // inventory: ' + inv.slice(0, 12).map(i => `${i.n} ${i.name} ${i.colour}`).join('; '), ''];
  for (const s of S) { L.push(`0 // step ${s.n}: ${s.note}`); for (const i of s.pieces) L.push(pieceLine(P[i])); L.push('0 STEP'); }
  return L.join('\n') + '\n';
}

function build(model, opts = {}) {
  const program = typeof model.program === 'function' ? model.program() : model.program;
  const kept = Dsl.BRICKS.slice(); if (model.bricks) { Dsl.BRICKS.length = 0; Dsl.BRICKS.push(...kept.filter(b => model.bricks.includes(b[0]))); }   /* a model may narrow the tiler's bricks (a log wall has no 1×8 log) */
  let result; try { result = Dsl.compile(program, { maxOps: 4000 }); } finally { Dsl.BRICKS.length = 0; Dsl.BRICKS.push(...kept); }
  const P = pieces(result);
  if (model.swap) for (const p of P) { const to = model.swap.from[p.part]; if (to && (!model.swap.col || model.swap.col.includes(p.col))) p.part = to; }   /* a like-for-like swap after the tiler: same footprint and height, another face (a 1×4 brick laid as a 1×4 log) */
  const J = joints(P), A = audit(P, J, { ground: model.ground }), S = steps(P, program, opts), inv = inventory(P);
  const pages = 1 + S.length + Math.ceil(inv.length / 40);
  const sheet = { pieces: P.length, steps: S.length, pages, joints: A.total, weak: A.weak.length, unsupported: A.unsupported.length, floating: result.report.floating, blocked: result.report.blocked, errors: result.report.errors.length, unknown: result.report.unknown.length };
  return { model, program, result, P, J, A, S, inv, sheet };
}
function write(b, { out = 'ldraw/models', json = 'play/models', pack = true } = {}) {
  const { model, P, S, sheet, inv } = b;
  const mpd = toMPD(model, P, S, sheet, inv); const file = path.join(root, out, model.name + '.mpd'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, mpd);
  const jf = path.join(root, json, model.name + '.json'); fs.mkdirSync(path.dirname(jf), { recursive: true });
  fs.writeFileSync(jf, JSON.stringify({ name: model.name, title: model.title, description: model.description, sheet, inventory: inv, pieces: P.map(p => ({ part: p.part, col: p.col, x: p.x, y: p.y, z: p.z, rot: p.rot, w: p.w, d: p.d, hp: p.hp, op: p.op })),
    ...(model.plan ? { plan: model.plan } : {}), steps: S, weak: b.A.weak.map(p => p.i), unsupported: b.A.unsupported.map(p => p.i), joints: b.J }));
  if (pack) { const r = require('child_process').spawnSync('node', [path.join(root, 'tools/donor-pack.js'), model.name + '.mpd'], { encoding: 'utf8' }); if (r.status) console.error(r.stderr); else console.log(r.stdout.trim().split('\n').pop()); }
  return { file, jf };
}
module.exports = { build, write, pieces, joints, audit, steps, inventory, toMPD, DIMS, NAMES, COLOUR_NAMES };

if (require.main === module) {
  const args = process.argv.slice(2), name = args.find(a => !a.startsWith('--')); if (!name) { console.error('usage: node tools/model.js <name> [--out dir] [--json dir] [--no-pack]'); process.exit(1); }
  const model = require(path.join(root, 'world/models', name + '.js'));
  const b = build(model), { sheet, inv } = b;
  console.log(`${model.title}: ${sheet.pieces} pieces, ${sheet.steps} steps, ${sheet.pages} pages, ${sheet.joints} stud joints, ${sheet.weak} weak, ${sheet.unsupported} unsupported` + (sheet.floating ? `, ${sheet.floating} floated and were dropped by the tiler` : '') + (sheet.blocked ? `, ${sheet.blocked} cells blocked` : '') + (sheet.errors ? `, ${sheet.errors} op errors` : ''));
  if (b.result.report.errors.length) console.log('errors:', JSON.stringify(b.result.report.errors.slice(0, 5)));
  if (b.result.report.unknown.length) console.log('unknown ops:', JSON.stringify(b.result.report.unknown.slice(0, 5)));
  if (b.A.weak.length) console.log('weak:', b.A.weak.slice(0, 8).map(p => `${NAMES[p.part] || p.part} at ${p.x},${p.y},${p.z} (op ${p.op})`).join('; '));
  if (b.A.unsupported.length) console.log('unsupported:', b.A.unsupported.slice(0, 8).map(p => `${NAMES[p.part] || p.part} at ${p.x},${p.y},${p.z} (op ${p.op})`).join('; '));
  console.log('inventory:', inv.slice(0, 10).map(i => `${i.n} × ${i.name} ${i.colour}`).join(', '));
  const o = { out: (args.find(a => a.startsWith('--out=')) || '--out=ldraw/models').slice(6), json: (args.find(a => a.startsWith('--json=')) || '--json=play/models').slice(7), pack: !args.includes('--no-pack') };
  const w = write(b, o); console.log('wrote', path.relative(root, w.file), path.relative(root, w.jf));
}

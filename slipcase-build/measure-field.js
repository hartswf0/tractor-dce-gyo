// Open-stud field: which studs face air, per model, and what happens when a
// placement pass is routed by that field instead of by a layer generator.
// Runs in node against the repo's own catalogue (nabugo-parts.json) and port
// index (nabugo-ports.json). Nothing here is estimated: every number is counted.
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/tractor-dce-gyo';
const OUT = path.join(ROOT, 'slipcase-build', 'work', 'field');
const PJ = JSON.parse(fs.readFileSync(ROOT + '/nabugo-parts.json', 'utf8'));
const byId = new Map(PJ.parts.map(p => [p.id, p]));
global.Nabugo = { Catalog: { get: id => byId.get(String(id)) || null, all: () => PJ.parts, size: () => PJ.parts.length } };
const K = require(ROOT + '/nabugo-kits.js');
const G = require(ROOT + '/nabugo-gauntlet.js');
const PORTS = JSON.parse(fs.readFileSync(ROOT + '/nabugo-ports.json', 'utf8'));
const AXES = PORTS.axes;

function studsOf(part) {
  const m = PORTS.map[part];
  if (m) return m.filter(p => p[0] === 0).map(p => ({ l: [p[1], p[2], p[3]], a: AXES[p[4]] }));
  const c = byId.get(part);
  if (c && c.s && c.s.length === 2 && c.b && c.b[1] <= -3.5) {   // stud-topped part omitted from the map (>48 ports)
    const [w, d] = c.s, out = [];
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++)
      out.push({ l: [-(w - 1) * 10 + i * 20, c.b[1] + 4, -(d - 1) * 10 + j * 20], a: [0, -1, 0], synth: true });
    return out;
  }
  return [];
}
function xf(m, v) { return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]; }
function contains(b, p, eps) { return p[0] > b.min[0]-eps && p[0] < b.max[0]+eps && p[1] > b.min[1]-eps && p[1] < b.max[1]+eps && p[2] > b.min[2]-eps && p[2] < b.max[2]+eps; }

function field(places) {
  const boxes = places.map(p => K.worldBox(p));
  const studs = [];
  let noBox = 0, noPorts = 0;
  places.forEach((p, i) => {
    if (!boxes[i]) { noBox++; return; }
    const s = studsOf(p.part);
    if (!s.length) { noPorts++; return; }
    for (const st of s) {
      const w = xf(p.mat, st.l); const pos = [w[0]+p.pos[0], w[1]+p.pos[1], w[2]+p.pos[2]];
      const ax = xf(p.mat, st.a);
      const probe = [pos[0]+ax[0]*2, pos[1]+ax[1]*2, pos[2]+ax[2]*2];
      let covered = false;
      for (let j = 0; j < boxes.length; j++) {
        if (j === i || !boxes[j]) continue;
        if (contains(boxes[j], probe, 0.25)) { covered = true; break; }
      }
      studs.push({ owner: i, pos, ax, open: !covered, up: Math.abs(ax[1] + 1) < 1e-6 });
    }
  });
  const open = studs.filter(s => s.open);
  // structural = not on a baseplate and not at the ground level (deliberately open surfaces)
  const groundY = studs.length ? Math.max(...studs.map(s => s.pos[1])) : 0;
  for (const s of studs) { const c = byId.get(places[s.owner].part); s.ground = (c && c.c === 'Baseplate') || Math.abs(s.pos[1] - groundY) < 1e-6; }
  const structural = studs.filter(s => !s.ground), openStructural = structural.filter(s => s.open);
  const nonGroundPieces = new Set(structural.map(s => s.owner)).size;
  return { pieces: places.length, studs: studs.length, open: open.length, openUp: open.filter(s => s.up).length,
           structuralStuds: structural.length, openStructural: openStructural.length,
           openStructuralShare: +(openStructural.length / (structural.length || 1)).toFixed(3),
           openStructuralPerPiece: +(openStructural.length / (nonGroundPieces || 1)).toFixed(3),
           openPerPiece: +(open.length / (places.length || 1)).toFixed(3), openShare: +(open.length / (studs.length || 1)).toFixed(3),
           noBox, noPorts, list: studs };
}

// SEED-01 closing pass: the next pieces go where the open studs solicit them.
const TILE = { '2x2': '3068b', '1x2': '3069b', '1x1': '3070b' };
const ROT_Z = [0,0,1, 0,1,0, -1,0,0];
function closingPass(places, F, opts) {
  const o = opts || {};
  const boxes = places.map(p => K.worldBox(p));
  let open = F.list.filter(s => s.open && s.up);
  if (o.ragged) {
    // the field weighs solicitations: ground and baseplates are deliberately open; a
    // piece whose top is partly covered is ragged, and its remaining studs solicit.
    const groundY = Math.max(...F.list.map(s => s.pos[1]));
    const per = new Map();
    for (const s of F.list) { const r = per.get(s.owner) || { n: 0, open: 0 }; r.n++; if (s.open) r.open++; per.set(s.owner, r); }
    open = open.filter(s => {
      const c = byId.get(places[s.owner].part); if (c && c.c === 'Baseplate') return false;
      if (Math.abs(s.pos[1] - groundY) < 1e-6) return false;
      const r = per.get(s.owner); return r.open < r.n;
    });
  }
  const key = s => `${Math.round(s.pos[1])}|${Math.round(s.pos[0])}|${Math.round(s.pos[2])}`;
  const at = new Map(open.map(s => [key(s), s]));
  const used = new Set(); const added = []; const newBoxes = [];
  const clash = (b) => {
    const t = { min: [b.min[0]+0.5, b.min[1]+0.5, b.min[2]+0.5], max: [b.max[0]-0.5, b.max[1]-4.5, b.max[2]-0.5] }; // ignore the stud zone at the bottom
    const hit = (bb) => bb && !(t.max[0] <= bb.min[0] || t.min[0] >= bb.max[0] || t.max[1] <= bb.min[1] || t.min[1] >= bb.max[1] || t.max[2] <= bb.min[2] || t.min[2] >= bb.max[2]);
    return boxes.some(hit) || newBoxes.some(hit);
  };
  const place = (part, x, y, z, mat, colour, studsUsed) => {
    const p = { part, color: colour, pos: [x, y, z], mat, lpos: [x, y, z], lmat: mat, parent: 'field', depth: 1, layer: 'FIELD', asm: null };
    const b = K.worldBox(p); if (!b || clash(b)) return false;
    added.push(p); newBoxes.push(b); studsUsed.forEach(k => used.add(k)); return true;
  };
  const sorted = open.slice().sort((a, b) => a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0] || a.pos[2] - b.pos[2]);
  for (const s of sorted) {
    const k0 = key(s); if (used.has(k0)) continue;
    const [x, y, z] = s.pos.map(Math.round);
    const col = places[s.owner].color;
    const k = (dx, dz) => `${y}|${x+dx}|${z+dz}`;
    const free = (...ks) => ks.every(kk => at.has(kk) && !used.has(kk));
    if (!o.max || o.max >= 4) {
      if (free(k0, k(20,0), k(0,20), k(20,20)) && place(TILE['2x2'], x+10, y-8, z+10, K.Core.IDENT, col, [k0, k(20,0), k(0,20), k(20,20)])) continue;
    }
    if (!o.max || o.max >= 2) {
      if (free(k0, k(20,0)) && place(TILE['1x2'], x+10, y-8, z, K.Core.IDENT, col, [k0, k(20,0)])) continue;
      if (free(k0, k(0,20)) && place(TILE['1x2'], x, y-8, z+10, ROT_Z, col, [k0, k(0,20)])) continue;
    }
    place(TILE['1x1'], x, y-8, z, K.Core.IDENT, col, [k0]);
  }
  return added;
}

function lineOf(p) {
  const m = p.mat, t = p.pos;
  return `1 ${p.color} ${t[0]} ${t[1]} ${t[2]} ${m.join(' ')} ${p.part}.dat`;
}
function appendToRoot(text, doc, lines) {
  const root = doc.rootName;
  const re = new RegExp('^0 FILE ' + root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'mi');
  const m = re.exec(text);
  if (!m) return text.replace(/\s*$/, '\n') + lines.join('\n') + '\n';
  const next = text.indexOf('\n0 FILE ', m.index + 1);
  const cut = next < 0 ? text.length : next + 1;
  return text.slice(0, cut).replace(/\s*$/, '\n') + '0 // SEED-01 field closing pass\n' + lines.join('\n') + '\n' + text.slice(cut);
}

function judge(ours, kit) {
  try { return G.Critic.judge(ours, kit, K.AXES, { seed: 1 }); } catch (e) { return { error: String(e.message).slice(0, 200) }; }
}
function verdictSummary(r) {
  if (!r || r.error) return r;
  const rows = Array.isArray(r) ? r : (r.axes || r.rows || []);
  const ax = rows.map(a => ({ id: a.id, verdict: a.verdict, ours: a.ours, bar: a.bar, shortfall: a.shortfall }));
  const n = v => ax.filter(a => a.verdict === v).length;
  return { wins: n('WIN'), losses: n('LOSS'), ties: n('TIE'), na: ax.length - n('WIN') - n('LOSS') - n('TIE'), axes: ax };
}
function judgeLine(j) { return j && j.axes ? `W${j.wins}/L${j.losses}/T${j.ties}/NA${j.na}` : JSON.stringify(j).slice(0, 80); }

const kitText = n => fs.readFileSync(`${ROOT}/kits/${n}.mpd`, 'utf8');
const BAR = '5935-island-hopper';
const barDoc = K.parse(kitText(BAR), BAR), barPl = K.flatten(barDoc);

const results = { generated: new Date().toISOString(), method: 'A stud faces air when the point 2 LDU above its base, along its own axis, lies inside no other placement\'s catalogue AABB (eps 0.25). Studs come from nabugo-ports.json; stud-topped parts omitted from that index (>48 ports) get studs synthesised from their footprint. Anti-stud ports are not used. The AABB of a slope or arch covers the air above its face, so coverage is an upper bound for such parts.', kits: [], builds: [] };

for (const f of fs.readdirSync(ROOT + '/kits').filter(x => x.endsWith('.mpd')).sort()) {
  const n = f.replace('.mpd', ''); const doc = K.parse(kitText(n), n); const pl = K.flatten(doc);
  const F = field(pl);
  results.kits.push({ id: n, pieces: F.pieces, studs: F.studs, open: F.open, openUp: F.openUp, openPerPiece: F.openPerPiece, openShare: F.openShare, structuralStuds: F.structuralStuds, openStructural: F.openStructural, openStructuralShare: F.openStructuralShare, openStructuralPerPiece: F.openStructuralPerPiece, noBox: F.noBox, noPorts: F.noPorts });
}
const TARGETS = ['card-castle', 'card-fallingwater', 'gauntlet-shore-station', 'hms-beagle', 'finch-cactus', 'medusa-scriptorium'];
for (const n of TARGETS) {
  const text = fs.readFileSync(`${ROOT}/builds/${n}.mpd`, 'utf8');
  const doc = K.parse(text, n); const pl = K.flatten(doc);
  const F = field(pl);
  const rec = { id: n, before: { pieces: F.pieces, studs: F.studs, open: F.open, openPerPiece: F.openPerPiece, openShare: F.openShare, openStructural: F.openStructural, openStructuralShare: F.openStructuralShare, openStructuralPerPiece: F.openStructuralPerPiece, noBox: F.noBox, noPorts: F.noPorts },
                judgeBefore: verdictSummary(judge(pl, barPl)), variants: {} };
  fs.writeFileSync(`${OUT}/${n}__before.mpd`, text);
  for (const [vn, vo] of [['A-close-all', {}], ['B-ragged', { ragged: true }]]) {
    const added = closingPass(pl, F, vo);
    const mpd2 = appendToRoot(text, doc, added.map(lineOf));
    fs.writeFileSync(`${OUT}/${n}__${vn}.mpd`, mpd2);
    const doc3 = K.parse(mpd2, n + '-' + vn); const pl3 = K.flatten(doc3); const F3 = field(pl3);   // numbers from the file, not from memory
    rec.variants[vn] = { pieces: F3.pieces, studs: F3.studs, open: F3.open, openPerPiece: F3.openPerPiece, openShare: F3.openShare, openStructural: F3.openStructural, openStructuralShare: F3.openStructuralShare, openStructuralPerPiece: F3.openStructuralPerPiece,
      added: { pieces: added.length, byPart: added.reduce((m, p) => (m[p.part] = (m[p.part] || 0) + 1, m), {}) },
      judge: verdictSummary(judge(pl3, barPl)) };
    console.log(n.padEnd(24), vn.padEnd(12), 'pieces', String(F.pieces).padStart(4), '→', String(F3.pieces).padStart(4), '| open', String(F.open).padStart(4), '→', String(F3.open).padStart(4), '| open/piece', String(F.openPerPiece).padStart(6), '→', String(F3.openPerPiece).padStart(6), '| judge', judgeLine(rec.judgeBefore), '→', judgeLine(rec.variants[vn].judge));
  }
  results.builds.push(rec);
}
// control: the pass applied to a kit
for (const n of ['5935-island-hopper', '7140-xwing-fighter']) {
  const text = kitText(n); const doc = K.parse(text, n); const pl = K.flatten(doc); const F = field(pl);
  const rec = { id: n, control: true, before: { pieces: F.pieces, open: F.open, openPerPiece: F.openPerPiece }, variants: {} };
  for (const [vn, vo] of [['A-close-all', {}], ['B-ragged', { ragged: true }]]) {
    const added = closingPass(pl, F, vo); const F2 = field(pl.concat(added));
    rec.variants[vn] = { pieces: F2.pieces, open: F2.open, openPerPiece: F2.openPerPiece, added: { pieces: added.length } };
    console.log('CONTROL', n.padEnd(20), vn.padEnd(12), 'open/piece', F.openPerPiece, '→', F2.openPerPiece, '| added', added.length);
  }
  results.builds.push(rec);
}
console.log('\nkits: open studs per piece');
for (const k of results.kits) console.log('  ' + k.id.padEnd(28), String(k.pieces).padStart(5), 'pieces', String(k.open).padStart(5), 'open', String(k.openPerPiece).padStart(7), '/piece', 'share', String(k.openShare).padStart(6), '| structural open', String(k.openStructural).padStart(5), 'share', String(k.openStructuralShare).padStart(6), '/piece', String(k.openStructuralPerPiece).padStart(6), k.noPorts ? 'noPorts ' + k.noPorts : '');
console.log('\nbuilds: structural open share (before → A → B)');
for (const b of results.builds.filter(x => !x.control)) console.log('  ' + b.id.padEnd(24), String(b.before.openStructuralShare).padStart(6), '→', String(b.variants['A-close-all'].openStructuralShare).padStart(6), '→', String(b.variants['B-ragged'].openStructuralShare).padStart(6), '| /piece', b.before.openStructuralPerPiece, '→', b.variants['A-close-all'].openStructuralPerPiece, '→', b.variants['B-ragged'].openStructuralPerPiece);
fs.writeFileSync(`${OUT}/field-results.json`, JSON.stringify(results, null, 1));
const c0=results.builds[0]; console.log('\ncastle axes before → A → B:'); for (let i=0;i<c0.judgeBefore.axes.length;i++){const a=c0.judgeBefore.axes[i], b=c0.variants['A-close-all'].judge.axes[i], d=c0.variants['B-ragged'].judge.axes[i]; console.log('  '+a.id.padEnd(12), String(a.verdict).padEnd(5), String(a.ours).padStart(7), '→', String(b.verdict).padEnd(5), String(b.ours).padStart(7), '→', String(d.verdict).padEnd(5), String(d.ours).padStart(7), '| bar', a.bar);}

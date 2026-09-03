#!/usr/bin/env node
// THE WORLD. One CLI the seed agents talk to. It keeps the state, validates every
// placement against the catalogue (AABB clash) and the port index (support), keeps
// the open-port field, emits LDraw MPD (named groups become submodels), and judges
// the emitted file blind against the bar kit with the repository's own critic.
// usage: node world.js <SEED> <command> [args]   state: runs/<SEED>/state.json
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/tractor-dce-gyo';
const PJ = JSON.parse(fs.readFileSync(ROOT + '/nabugo-parts.json', 'utf8'));
const byId = new Map(PJ.parts.map(p => [p.id, p]));
global.Nabugo = { Catalog: { get: id => byId.get(String(id)) || null, all: () => PJ.parts, size: () => PJ.parts.length } };
const K = require(ROOT + '/nabugo-kits.js');
const G = require(ROOT + '/nabugo-gauntlet.js');
const PORTS = JSON.parse(fs.readFileSync(ROOT + '/nabugo-ports.json', 'utf8'));
const AXES = PORTS.axes;
const [,, SEED, CMD, ...ARGS] = process.argv;
if (!SEED || !CMD) { console.log('usage: node world.js <SEED> <command> [args]'); process.exit(2); }
const DIR = path.join(__dirname, 'runs', SEED); fs.mkdirSync(DIR, { recursive: true });
const SF = path.join(DIR, 'state.json');
const IDENT = [1,0,0, 0,1,0, 0,0,1];
const FACING = { e: IDENT, s: [0,0,1, 0,1,0, -1,0,0], w: [-1,0,0, 0,1,0, 0,0,-1], n: [0,0,-1, 0,1,0, 1,0,0] };
const TRAY = ['3001','3003','3004','3005','3010','3009','3622','2357','3020','3021','3022','3023a','3024','3710','3666','3795','3623','3460','3034','3032','3068b','3069b','3070b','2431','6636','3039','3040a','3037','3298','4286','3747a','3660a','3665a','2449','3062b','3941','3942c','4589','3245b','3659','3455','60592','60593','3794a','4070','87087','30414','2877','98283','15533','3626b','973','3815','3816','3817','3818','3819','3820','4740','30165','3937','3938'];
const COLOURS = { 0:'black',1:'blue',2:'green',4:'red',5:'dark pink',7:'light grey',8:'dark grey',10:'bright green',14:'yellow',15:'white',19:'tan',25:'orange',27:'lime',28:'dark tan',70:'reddish brown',71:'light bluish grey',72:'dark bluish grey',84:'medium nougat',85:'dark purple',288:'dark green',320:'dark red',308:'dark brown' };

// ───────────────────────────── part geometry
function partInfo(id) {
  const c = byId.get(id); if (!c) return null;
  const [w, d] = c.s || [1, 1]; const b = c.b;
  const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
  const cells = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) cells.push([cx - (w - 1) * 10 + i * 20, cz - (d - 1) * 10 + j * 20]);
  let studs = (PORTS.map[id] || []).filter(p => p[0] === 0).map(p => ({ l: [p[1], p[2], p[3]], a: AXES[p[4]] }));
  if (!studs.length && b[1] <= -3.5) studs = cells.map(([x, z]) => ({ l: [x, b[1] + 4, z], a: [0, -1, 0], synth: true }));
  return { id, desc: c.d.replace(/\s+/g, ' ').trim(), cat: c.c, w, d, b, cells, studs, height: b[4] - Math.max(0, b[1]), bottom: b[4], ports: studs.length };
}
function body(id) { const p = partInfo(id); return `${id} ${p.desc}  ${p.w}x${p.d} · ${p.height} tall (${p.height/8} plates) · gives ${p.studs.length} up · covers ${p.cells.length} studs`; }
function xf(m, v) { return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2]]; }
function mmul(a, b) { const o = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r*3]*b[c] + a[r*3+1]*b[c+3] + a[r*3+2]*b[c+6]); return o; }
const r1 = v => Math.round(v * 10) / 10;
function worldBox(pl) { return K.worldBox({ part: pl.part, pos: pl.pos, mat: pl.mat }); }
function bodyBox(pl) { const c = byId.get(pl.part); const bb = worldBox(pl); const top = pl.pos[1] + Math.max(0, c.b[1]); return { min: [bb.min[0], Math.max(bb.min[1], top), bb.min[2]], max: bb.max }; }
function overlap(a, b, eps) { return a.max[0] > b.min[0]+eps && a.min[0] < b.max[0]-eps && a.max[1] > b.min[1]+eps && a.min[1] < b.max[1]-eps && a.max[2] > b.min[2]+eps && a.min[2] < b.max[2]-eps; }
function contains(b, p, eps) { return p[0] > b.min[0]-eps && p[0] < b.max[0]+eps && p[1] > b.min[1]-eps && p[1] < b.max[1]+eps && p[2] > b.min[2]-eps && p[2] < b.max[2]+eps; }

// ───────────────────────────── state
function load() { return fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : null; }
function save(S) { fs.writeFileSync(SF, JSON.stringify(S)); }
function fresh(ground, colour) {
  const S = { seed: SEED, places: [], groups: {}, library: {}, hand: null, last: null, lastPort: null, portIds: {}, nextPort: 1, calls: 0, refusals: 0, seated: 0, undos: 0, jointsChecks: { right: 0, wrong: 0 }, log: [], intent: '' };
  S.places.push({ part: ground, color: colour, pos: [0, 0, 0], mat: IDENT, facing: 'e', group: null, ground: true });
  return S;
}
// ───────────────────────────── the field
function field(S) {
  const boxes = S.places.map(worldBox);
  const studs = [];
  S.places.forEach((pl, i) => {
    const info = partInfo(pl.part); if (!info) return;
    for (const st of info.studs) {
      const w = xf(pl.mat, st.l); const pos = [r1(w[0] + pl.pos[0]), r1(w[1] + pl.pos[1]), r1(w[2] + pl.pos[2])];
      const ax = xf(pl.mat, st.a); const probe = [pos[0] + ax[0]*2, pos[1] + ax[1]*2, pos[2] + ax[2]*2];
      let covered = false, by = -1;
      for (let j = 0; j < boxes.length; j++) { if (j === i || !boxes[j]) continue; if (contains(boxes[j], probe, 0.25)) { covered = true; by = j; break; } }
      studs.push({ owner: i, pos, up: Math.abs(ax[1] + 1) < 1e-6, open: !covered, by });
    }
  });
  const groundY = S.places[0].pos[1];
  const per = new Map();
  for (const s of studs) { const r = per.get(s.owner) || { n: 0, open: 0 }; r.n++; if (s.open) r.open++; per.set(s.owner, r); }
  for (const s of studs) {
    s.key = `${s.pos[0]}|${s.pos[1]}|${s.pos[2]}`;
    if (!S.portIds[s.key]) S.portIds[s.key] = 'p' + (S.nextPort++);
    s.id = S.portIds[s.key];
    s.ground = !!S.places[s.owner].ground;
    const r = per.get(s.owner); s.ragged = r.open < r.n && r.open > 0; s.coverage = `${r.n - r.open} of ${r.n}`;
    s.level = Math.round((groundY - s.pos[1]) / 8);
  }
  const structural = studs.filter(s => !s.ground);
  const openStructural = structural.filter(s => s.open);
  return { studs, open: studs.filter(s => s.open), structural: structural.length, openStructural: openStructural.length,
           share: structural.length ? +(openStructural.length / structural.length).toFixed(3) : null, per };
}
function rankField(S, F, k) {
  const last = S.last != null ? S.places[S.last] : null;
  const lp = last ? last.pos : [0, 0, 0];
  const openUp = F.open.filter(s => s.up);
  const keyset = new Set(openUp.map(s => s.key));
  const run = (s, dx, dz) => { let n = 1; while (n < 8 && keyset.has(`${s.pos[0] + dx*20*n}|${s.pos[1]}|${s.pos[2] + dz*20*n}`)) n++; return n; };
  for (const s of openUp) {
    const d = Math.hypot(s.pos[0] - lp[0], s.pos[2] - lp[2], (s.pos[1] - lp[1]) * 0.5);
    s.runX = run(s, 1, 0); s.runZ = run(s, 0, 1);
    s.score = (s.ragged ? 3 : 0) + (s.ground ? 0 : 2) + 2 * Math.exp(-d / 120) + s.level * 0.05 + Math.min(s.runX, 4) * 0.1;
  }
  return openUp.sort((a, b) => b.score - a.score || a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0] || a.pos[2] - b.pos[2]).slice(0, k);
}
function portLine(S, s) {
  const o = S.places[s.owner]; const info = partInfo(o.part);
  return `${s.id.padEnd(6)} on ${info.desc} (${o.color}${COLOURS[o.color] ? ' ' + COLOURS[o.color] : ''}) at (${s.pos[0]},${s.pos[2]}) level ${s.level}  ${s.up ? 'up' : 'side'}  ${s.ground ? 'GROUND' : (s.ragged ? 'ragged ' + s.coverage + ' covered' : 'open top ' + s.coverage + ' covered')}  run ${s.runX || 1}x${s.runZ || 1}`;
}
function findPort(S, F, ref) {
  ref = String(ref).toUpperCase();
  if (ref === 'HERE' || ref === 'LAST-TOP') {
    if (S.last == null) return { err: 'no LAST piece yet' };
    const c = F.open.filter(s => s.up && s.owner === S.last).sort((a, b) => a.pos[0] - b.pos[0] || a.pos[2] - b.pos[2]);
    return c.length ? c[0] : { err: 'LAST has no open stud on top' };
  }
  if (ref.startsWith('BESIDE:')) {
    const noun = ref.slice(7).toLowerCase(); const g = S.groups[noun]; if (!g) return { err: 'no group named ' + noun };
    const idx = new Set(g.members); const boxes = g.members.map(i => worldBox(S.places[i]));
    const min = [Math.min(...boxes.map(b => b.min[0])), Math.min(...boxes.map(b => b.min[2]))], max = [Math.max(...boxes.map(b => b.max[0])), Math.max(...boxes.map(b => b.max[2]))];
    const base = Math.max(...g.members.map(i => bodyBox(S.places[i]).max[1]));
    const c = F.open.filter(s => s.up && !idx.has(s.owner) && Math.abs(s.pos[1] - base) < 1e-6 && s.pos[0] > min[0] - 25 && s.pos[0] < max[0] + 25 && s.pos[2] > min[2] - 25 && s.pos[2] < max[2] + 25)
      .sort((a, b) => a.pos[0] - b.pos[0] || a.pos[2] - b.pos[2]);
    return c.length ? c[0] : { err: 'no open port beside ' + noun + ' at its base level' };
  }
  const s = F.open.find(x => x.id.toUpperCase() === ref);
  if (!s) { const any = F.studs.find(x => x.id.toUpperCase() === ref); return { err: any ? `${ref} is covered (by ${S.places[any.by] ? partInfo(S.places[any.by].part).desc : '?'})` : `${ref} is not a port id` }; }
  if (!s.up) return { err: ref + ' faces sideways; only up ports accept placements in this world' };
  return s;
}
// ───────────────────────────── placement
function tryPlace(S, F, part, colour, port, facing, offset, opts) {
  const info = partInfo(part); if (!info) return { ok: false, why: 'unknown part ' + part };
  if (!TRAY.includes(part) && !(opts && opts.anyPart)) return { ok: false, why: part + ' is not in the tray (run: tray)' };
  const M = FACING[facing]; if (!M) return { ok: false, why: 'FACING must be n|e|s|w' };
  const cells = info.cells.map(([x, z]) => xf(M, [x, 0, z])).map(v => [r1(v[0]), r1(v[2])]);
  const anchor = cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
  const pos = [r1(port.pos[0] - anchor[0] + (offset[0] || 0) * 20), r1(port.pos[1] - info.bottom), r1(port.pos[2] - anchor[1] + (offset[1] || 0) * 20)];
  const pl = { part, color: colour, pos, mat: M, facing, group: S.openGroup || null };
  const nb = bodyBox(pl);
  const hits = [];
  S.places.forEach((o, j) => { const ob = bodyBox(o); if (overlap(nb, ob, 0.5)) hits.push(j); });
  if (hits.length) {
    const h = hits.slice(0, 3).map(j => `${partInfo(S.places[j].part).desc} at (${S.places[j].pos.join(',')})`).join('; ');
    return { ok: false, why: `CLASH with ${hits.length} piece(s): ${h}`, kind: 'clash', hits };
  }
  const bottomY = r1(pos[1] + info.bottom);
  const under = F.open.filter(s => s.up && Math.abs(s.pos[1] - bottomY) < 0.6 && cells.some(([cx, cz]) => Math.abs(cx + pos[0] - s.pos[0]) < 0.6 && Math.abs(cz + pos[2] - s.pos[2]) < 0.6));
  if (!under.length) return { ok: false, why: 'FLOATS: no open stud under any of its cells at that level', kind: 'float' };
  return { ok: true, pl, takes: under.length, under, pos };
}
function commit(S, r, note) {
  S.places.push(r.pl); S.last = S.places.length - 1; S.lastPort = r.under[0].id; S.seated++;
  if (S.openGroup && S.groups[S.openGroup]) S.groups[S.openGroup].members.push(S.last);
  S.log.push({ t: 'seated', i: S.last, part: r.pl.part, colour: r.pl.color, pos: r.pos, facing: r.pl.facing, takes: r.takes, note: note || '' });
}
function seatedPacket(S, F0, F1, r) {
  const info = partInfo(r.pl.part);
  return `SEATED  ${info.desc} (${r.pl.color}) at (${r.pos[0]},${r.pos[1]},${r.pos[2]}) facing ${r.pl.facing} · took ${r.takes} stud(s): ${r.under.slice(0,6).map(s => s.id).join(' ')} · gives ${info.studs.length} up · piece #${S.last} · field ${F0.open.filter(s=>s.up).length} → ${F1.open.filter(s=>s.up).length} open · structural open share ${F0.share} → ${F1.share}`;
}
function refusedPacket(S, F, req, r) {
  const info = partInfo(req.part) || { desc: req.part };
  if (SEED !== 'S02') return `REFUSED ${info.desc} (${req.colour}) ON ${req.portRef} FACING ${req.facing}: ${r.why}`;
  const near = r.kind === 'float' && r.pos ? F.open.filter(s => s.up).map(s => ({ s, d: Math.hypot(s.pos[0]-r.pos[0], s.pos[2]-r.pos[2], s.pos[1]-(r.pos[1]+info.bottom)) })).sort((a,b)=>a.d-b.d).slice(0,3) : [];
  const repair = r.kind === 'clash' ? 'raise by the clashing piece\'s height, or choose a port whose run fits this footprint (see run WxD in the field)' : r.kind === 'float' ? (near.length ? `use ${near.map(n => n.s.id + ' (' + Math.round(n.d) + ' LDU away)').join(', ')}` : 'choose a port from the field') : 'read the tray';
  return [`REFUSED`, `  YOU PLACED   ${info.desc} (${req.colour}) ON ${req.portRef} FACING ${req.facing}${req.offset ? ' OFFSET ' + req.offset.join(' ') : ''}`, `  TARGET       ${S.intent || 'unstated (set with: intent <text>)'}`, `  CONSEQUENCE  ${r.why}`, `  TRUST        ${r.kind === 'clash' ? 'approximate (catalogue AABB; slopes and arches over-cover)' : 'exact (port index)'}`, `  REPAIR       ${repair}`].join('\n');
}
// ───────────────────────────── emit / judge
function ldrLine(pl) { return `1 ${pl.color} ${pl.pos[0]} ${pl.pos[1]} ${pl.pos[2]} ${pl.mat.join(' ')} ${pl.part}.dat`; }
function emit(S) {
  const name = `castle-${SEED}`; const lines = [`0 FILE ${name}.ldr`, `0 ${name} — built in the arena by seed ${SEED}`, `0 Name: ${name}.ldr`, `0 Author: arena/world.js`];
  const subs = [];
  const defined = new Set();
  S.places.forEach((pl, i) => {
    if (pl.instanceOf) return;                       // emitted through its submodel
    if (pl.group && S.groups[pl.group] && S.groups[pl.group].members.length > 1) {
      if (!defined.has(pl.group)) { defined.add(pl.group); const g = S.groups[pl.group]; const a = S.places[g.members[0]].pos;
        lines.push(`1 16 ${a[0]} ${a[1]} ${a[2]} 1 0 0 0 1 0 0 0 1 ${pl.group}.ldr`);
        subs.push([`0 FILE ${pl.group}.ldr`, `0 ${pl.group}`, `0 Name: ${pl.group}.ldr`].concat(g.members.map(m => { const q = S.places[m]; return `1 ${q.color} ${q.pos[0]-a[0]} ${q.pos[1]-a[1]} ${q.pos[2]-a[2]} ${q.mat.join(' ')} ${q.part}.dat`; })));
      }
      return;
    }
    lines.push(ldrLine(pl));
  });
  for (const inst of S.instances || []) lines.push(`1 16 ${inst.at[0]} ${inst.at[1]} ${inst.at[2]} ${inst.mat.join(' ')} ${inst.noun}.ldr`);
  for (const [noun, g] of Object.entries(S.library || {})) {
    if (defined.has(noun)) continue;                 // already written as a placed group
    if (!(S.instances || []).some(i => i.noun === noun)) continue;
    defined.add(noun);
    subs.push([`0 FILE ${noun}.ldr`, `0 ${noun}`, `0 Name: ${noun}.ldr`].concat(g.map(q => `1 ${q.color} ${q.pos[0]} ${q.pos[1]} ${q.pos[2]} ${q.mat.join(' ')} ${q.part}.dat`)));
  }
  return lines.concat(...subs).join('\n') + '\n';
}
function judgeText(text, label) {
  const doc = K.parse(text, label); const pl = K.flatten(doc);
  const bar = K.flatten(K.parse(fs.readFileSync(ROOT + '/kits/5935-island-hopper.mpd', 'utf8'), '5935'));
  const rows = G.Critic.judge(pl, bar, K.AXES, { seed: 1 });
  const n = v => rows.filter(a => a.verdict === v).length;
  return { pieces: pl.length, blocks: (text.match(/^0 FILE /gm) || []).length, wins: n('WIN'), losses: n('LOSS'), ties: n('TIE'), axes: rows.map(a => ({ id: a.id, verdict: a.verdict, ours: +(+a.ours).toFixed(3), bar: +(+a.bar).toFixed(3), layer: a.layer })) };
}
function fieldOfText(text) {
  const doc = K.parse(text, 'x'); const pl = K.flatten(doc);
  const S = { places: pl.map((p, i) => ({ part: p.part, color: p.color, pos: p.pos, mat: p.mat, ground: i === 0 && byId.get(p.part) && byId.get(p.part).c === 'Baseplate' })), portIds: {}, nextPort: 1 };
  const F = field(S); return { structural: F.structural, openStructural: F.openStructural, share: F.share };
}
// ───────────────────────────── commands
process.stdout.on('error', () => process.exit(0));
const out = s => process.stdout.write(s + '\n');
let S = load();
function need() { if (!S) { out('no world yet: run  init'); process.exit(1); } S.calls++; }
const A = ARGS.slice();
switch (CMD) {
  case 'init': { const ground = A[0] || '3811'; const colour = +(A[1] || 2); S = fresh(ground, colour); save(S); out(`world ${SEED} started: ${body(ground)} in colour ${colour}. Field: ${field(S).open.length} open studs on the ground. Run: tray, field, place.`); break; }
  case 'intent': { need(); S.intent = A.join(' '); save(S); out('intent set: ' + S.intent); break; }
  case 'tray': { out('TRAY — parts this world accepts (BODY lines). Colours: ' + Object.entries(COLOURS).map(([k, v]) => k + '=' + v).join(', ')); for (const id of TRAY) out('  ' + body(id)); break; }
  case 'field': { need(); const F = field(S); const k = +(A.includes('--k') ? A[A.indexOf('--k') + 1] : 8); const top = rankField(S, F, k);
    out(`FIELD  ${F.open.filter(s => s.up).length} open up-ports (${F.openStructural} structural of ${F.structural}, share ${F.share}) · pieces ${S.places.length - 1} · LAST #${S.last == null ? '-' : S.last}${S.hand ? ' · HAND ' + S.hand.part + ' (' + S.hand.colour + ')' : ''}`);
    out(`  top ${top.length} by solicitation (ragged tops first, then near LAST):`); for (const s of top) out('  ' + portLine(S, s));
    const lv = A.indexOf('--level') >= 0 ? +A[A.indexOf('--level') + 1] : null; const ni = A.indexOf('--near');
    if (A.includes('--all') || lv != null || ni >= 0) {
      let list = F.open.filter(x => x.up); if (lv != null) list = list.filter(x => x.level === lv);
      if (ni >= 0) { const nx = +A[ni + 1], nz = +A[ni + 2], nr = +(A[ni + 3] || 60); list = list.filter(x => Math.hypot(x.pos[0] - nx, x.pos[2] - nz) <= nr); }
      for (const s of list) { s.runX = s.runX || 1; s.runZ = s.runZ || 1; }
      out(`  ${list.length} open up-port(s)${lv != null ? ' at level ' + lv : ''}${ni >= 0 ? ' near (' + A[ni+1] + ',' + A[ni+2] + ')' : ''}:`);
      for (const s of list.sort((a,b)=>a.pos[1]-b.pos[1]||a.pos[0]-b.pos[0]||a.pos[2]-b.pos[2]).slice(0, 400)) out('  ' + portLine(S, s)); }
    save(S); break; }
  case 'place': case 'put': {
    need(); const F = field(S);
    let part, colour, rest;
    if (CMD === 'put') { if (!S.hand) { out('REFUSED: nothing in HAND (bring <part> [colour] first)'); save(S); break; } part = S.hand.part; colour = S.hand.colour; rest = A.slice(); }
    else { part = String(A[0]); colour = +A[1]; rest = A.slice(2); }
    part = K.resolveId(part, null) || part;
    const up = rest.map(x => String(x).toUpperCase());
    let portRef = up[0] === 'ON' ? rest[1] : (up[0] === 'HERE' ? 'HERE' : rest[0]);
    const fi = up.indexOf('FACING'); const facing = fi >= 0 ? String(rest[fi + 1]).toLowerCase()[0] : 'e';
    const oi = up.indexOf('OFFSET'); const offset = oi >= 0 ? [+rest[oi + 1] || 0, +rest[oi + 2] || 0] : [0, 0];
    const ji = rest.findIndex(x => String(x).startsWith('--joints')); let joints = null;
    if (ji >= 0) { const spec = String(rest[ji]).includes('=') && !String(rest[ji]).startsWith('--joints=') ? rest[ji + 1] : (String(rest[ji]).split('=').slice(1).join('=') || rest[ji + 1]); const m = /takes=(\d+),\s*gives=(\d+)/.exec(String(spec) + ',' + String(rest[ji + 1] || '')); if (m) joints = { takes: +m[1], gives: +m[2] }; }
    if (SEED === 'S05' && !joints) { out('REFUSED: this world requires a JOINTS prediction: --joints takes=<n>,gives=<m>'); S.refusals++; save(S); break; }
    const port = findPort(S, F, portRef);
    const req = { part, colour, portRef, facing, offset: offset[0] || offset[1] ? offset : null };
    if (port.err) { S.refusals++; out(refusedPacket(S, F, req, { why: port.err, kind: 'port' })); save(S); break; }
    if (!Number.isInteger(colour)) { out('REFUSED: colour must be an LDraw colour number'); S.refusals++; save(S); break; }
    const r = tryPlace(S, F, part, colour, port, facing, offset);
    if (!r.ok) { S.refusals++; S.log.push({ t: 'refused', part, colour, portRef, facing, why: r.why }); out(refusedPacket(S, F, req, r)); save(S); break; }
    const info = partInfo(part);
    if (joints) { const actual = { takes: r.takes, gives: info.studs.length }; if (joints.takes !== actual.takes || joints.gives !== actual.gives) { S.jointsChecks.wrong++; S.refusals++; out(`REFUSED: JOINTS prediction wrong. You said takes=${joints.takes},gives=${joints.gives}. True JOINTS: takes ${actual.takes} stud(s) of ${r.under.slice(0,4).map(s=>s.id).join(' ')}; gives ${actual.gives} up. Place again with the true line.`); save(S); break; } S.jointsChecks.right++; }
    commit(S, r); const F1 = field(S); S.lastPattern = { part, colour, facing, offset };
    if (CMD === 'put') S.hand = null;
    out(seatedPacket(S, F, F1, r)); save(S); break; }
  case 'batch': { need(); const ops = JSON.parse(fs.readFileSync(A[0], 'utf8')); if (!Array.isArray(ops) || ops.length > 12) { out('batch: give a JSON array of at most 12 ops {part,colour,on,facing,offset?}'); break; }
    let n = 0; for (const op of ops) { const F = field(S); const part = K.resolveId(String(op.part), null) || String(op.part); const port = findPort(S, F, op.on); const req = { part, colour: +op.colour, portRef: op.on, facing: (op.facing || 'e')[0], offset: op.offset || null };
      if (port.err) { S.refusals++; out(`[${n}] ` + refusedPacket(S, F, req, { why: port.err, kind: 'port' })); n++; continue; }
      const r = tryPlace(S, F, part, +op.colour, port, (op.facing || 'e')[0].toLowerCase(), op.offset || [0, 0]);
      if (!r.ok) { S.refusals++; out(`[${n}] ` + refusedPacket(S, F, req, r)); n++; continue; }
      commit(S, r); out(`[${n}] ` + seatedPacket(S, F, field(S), r)); n++; }
    save(S); break; }
  case 'bring': { need(); const part = K.resolveId(String(A[0]), null) || String(A[0]); if (!TRAY.includes(part)) { out('REFUSED: ' + part + ' is not in the tray'); break; } S.hand = { part, colour: +(A[1] || 71) }; save(S); out(`HAND: ${body(part)} in colour ${S.hand.colour}`); break; }
  case 'again': { need(); if (!S.lastPattern) { out('REFUSED: nothing to repeat yet'); break; } const F = field(S); const ref = A[A.map(x=>x.toUpperCase()).indexOf('AT') + 1] || A[0]; const port = findPort(S, F, ref); if (port.err) { S.refusals++; out('REFUSED: ' + port.err); save(S); break; }
    const p = S.lastPattern; const r = tryPlace(S, F, p.part, p.colour, port, p.facing, p.offset || [0, 0]); if (!r.ok) { S.refusals++; out(refusedPacket(S, F, { part: p.part, colour: p.colour, portRef: ref, facing: p.facing }, r)); save(S); break; }
    commit(S, r, 'again'); out(seatedPacket(S, F, field(S), r)); save(S); break; }
  case 'name': { need(); const noun = String(A[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, ''); if (!noun) { out('name <noun>'); break; }
    const since = S.groups.__cursor == null ? 1 : S.groups.__cursor; const members = []; for (let i = since; i < S.places.length; i++) if (!S.places[i].group && !S.places[i].instanceOf) members.push(i);
    if (!members.length) { out('REFUSED: no unnamed pieces since the last NAME'); break; }
    S.groups[noun] = { members }; members.forEach(i => S.places[i].group = noun); S.groups.__cursor = S.places.length;
    const boxes = members.map(i => worldBox(S.places[i])); const w = Math.max(...boxes.map(b => b.max[0])) - Math.min(...boxes.map(b => b.min[0])), d = Math.max(...boxes.map(b => b.max[2])) - Math.min(...boxes.map(b => b.min[2])), h = Math.max(...boxes.map(b => b.max[1])) - Math.min(...boxes.map(b => b.min[1]));
    const F = field(S); const gives = F.open.filter(s => s.up && members.includes(s.owner)).length;
    S.library[noun] = members.map(i => { const q = S.places[i]; const a = S.places[members[0]].pos; return { part: q.part, color: q.color, pos: [q.pos[0]-a[0], q.pos[1]-a[1], q.pos[2]-a[2]], mat: q.mat }; });
    save(S); out(`NAMED ${noun}: ${members.length} pieces · BODY ${Math.round(w/20)}x${Math.round(d/20)} studs · ${Math.round(h)} tall (${(h/8).toFixed(1)} plates) · gives ${gives} up · anchor piece #${members[0]} at (${S.places[members[0]].pos.join(',')}). Use:  instance ${noun} AT p<n> [MIRRORED]   or   put ON BESIDE:${noun}`); break; }
  case 'instance': { need(); const noun = String(A[0] || '').toLowerCase(); const lib = S.library[noun]; if (!lib) { out('REFUSED: no named thing ' + noun + ' (names: ' + Object.keys(S.library).join(', ') + ')'); break; }
    const F = field(S); const up = A.map(x => String(x).toUpperCase()); const ref = A[up.indexOf('AT') + 1]; const mirrored = up.includes('MIRRORED'); const port = findPort(S, F, ref); if (port.err) { S.refusals++; out('REFUSED: ' + port.err); save(S); break; }
    // anchor = the group's lowest, min-x/min-z bottom cell (relative to the anchor piece)
    const cellsOf = q => { const info = partInfo(q.part); return info.cells.map(([x, z]) => xf(q.mat, [x, 0, z])).map(v => [r1(v[0] + q.pos[0]), r1(v[2] + q.pos[2]), r1(q.pos[1] + info.bottom)]); };
    const allCells = lib.flatMap(cellsOf); const lowest = Math.max(...allCells.map(c => c[2])); const anchor = allCells.filter(c => c[2] === lowest).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
    const MIR = mirrored ? [-1,0,0, 0,1,0, 0,0,1] : IDENT;
    const at = [r1(port.pos[0] - (mirrored ? -anchor[0] : anchor[0])), r1(port.pos[1] - lowest), r1(port.pos[2] - anchor[1])];
    const news = lib.map(q => ({ part: q.part, color: q.color, pos: [r1(at[0] + (mirrored ? -q.pos[0] : q.pos[0])), r1(at[1] + q.pos[1]), r1(at[2] + q.pos[2])], mat: mirrored ? mmul(MIR, q.mat) : q.mat, facing: '?', group: null, instanceOf: noun }));
    const clashes = []; for (const nq of news) { const nb = bodyBox(nq); S.places.forEach((o, j) => { if (overlap(nb, bodyBox(o), 0.5)) clashes.push(j); }); }
    if (clashes.length) { S.refusals++; out(`REFUSED: instance of ${noun} at ${ref} clashes with ${new Set(clashes).size} existing piece(s): ${[...new Set(clashes)].slice(0,3).map(j => partInfo(S.places[j].part).desc).join('; ')}`); save(S); break; }
    const under = F.open.filter(s => s.up && news.some(nq => { const info = partInfo(nq.part); return Math.abs(s.pos[1] - (nq.pos[1] + info.bottom)) < 0.6 && cellsOf(nq).some(c => Math.abs(c[0] - s.pos[0]) < 0.6 && Math.abs(c[1] - s.pos[2]) < 0.6); }));
    if (!under.length) { S.refusals++; out('REFUSED: the instance would float (no open stud under any of its pieces)'); save(S); break; }
    const start = S.places.length; S.places.push(...news); S.instances = S.instances || []; S.instances.push({ noun, at, mat: MIR, members: news.map((_, i) => start + i) }); S.last = S.places.length - 1; S.seated += news.length;
    S.log.push({ t: 'instance', noun, at, mirrored, pieces: news.length }); const F1 = field(S); save(S);
    out(`INSTANCED ${noun}${mirrored ? ' (mirrored)' : ''} at ${ref} → ${news.length} pieces, took ${under.length} stud(s) · field structural open share ${F.share} → ${F1.share} · pieces now ${S.places.length - 1}`); break; }
  case 'describe': { const text = fs.readFileSync(A[0], 'utf8'); const doc = K.parse(text, 'd'); const pl = K.flatten(doc); const T = { places: pl.map((p, i) => ({ part: p.part, color: p.color, pos: p.pos, mat: p.mat, ground: byId.get(p.part) && byId.get(p.part).c === 'Baseplate' })), portIds: {}, nextPort: 1 };
    const F = field(T); const rests = new Map(); for (const s of F.studs) if (!s.open && s.by >= 0) { const r = rests.get(s.by) || new Set(); r.add(s.owner); rests.set(s.by, r); }
    out(`DESCRIBE ${A[0]}: ${pl.length} pieces. Each line: #i BODY · at (x,y,z) · rests on [pieces whose studs it covers]`);
    T.places.forEach((p, i) => { const info = partInfo(p.part); out(`  #${i} ${info ? info.desc : p.part} (${p.color}) ${info ? info.w + 'x' + info.d + ' · ' + info.height + ' tall' : ''} · at (${p.pos.join(',')}) · asm ${pl[i].asm || '-'} · rests on [${[...(rests.get(i) || [])].join(' ')}]`); });
    const json = T.places.map((p, i) => ({ i, part: p.part, desc: partInfo(p.part) ? partInfo(p.part).desc : p.part, colour: p.color, pos: p.pos, mat: p.mat, asm: pl[i].asm || null, restsOn: [...(rests.get(i) || [])] }));
    fs.writeFileSync(path.join(DIR, 'described.json'), JSON.stringify(json)); out(`  (written to runs/${SEED}/described.json)`); break; }
  case 'adopt': { need(); const spec = JSON.parse(fs.readFileSync(A[0], 'utf8')); const desc = JSON.parse(fs.readFileSync(path.join(DIR, 'described.json'), 'utf8'));
    // spec: { groups: { noun: [indices] }, order: [noun, ...] }  — removal order is checked: a group may be removed only if nothing remaining rests on it
    const inGroup = new Map(); for (const [noun, idx] of Object.entries(spec.groups)) for (const i of idx) inGroup.set(i, noun);
    const remaining = new Set(desc.map(d => d.i)); const problems = [];
    for (const noun of spec.order || Object.keys(spec.groups)) { const idx = new Set(spec.groups[noun] || []); for (const d of desc) if (remaining.has(d.i) && !idx.has(d.i)) for (const r of d.restsOn) if (idx.has(r)) problems.push(`${noun}: piece #${d.i} (${d.desc}) still rests on #${r} — cannot remove ${noun} yet`); idx.forEach(i => remaining.delete(i)); }
    for (const [noun, idx] of Object.entries(spec.groups)) S.library[noun] = idx.map(i => desc.find(d => d.i === i)).filter(Boolean).map(d => ({ part: d.part, color: d.colour, pos: d.pos, mat: d.mat })).map((q, _, arr) => ({ part: q.part, color: q.color, pos: [q.pos[0]-arr[0].pos[0], q.pos[1]-arr[0].pos[1], q.pos[2]-arr[0].pos[2]], mat: q.mat }));
    save(S); out(`ADOPTED ${Object.keys(spec.groups).length} named things into the library: ${Object.entries(spec.groups).map(([n, i]) => n + '(' + i.length + ')').join(', ')}. Unassigned pieces: ${desc.filter(d => !inGroup.has(d.i)).length}.`);
    out(problems.length ? `REMOVAL ORDER PROBLEMS (${problems.length}):\n  ` + problems.slice(0, 20).join('\n  ') : 'REMOVAL ORDER OK: every group can be removed in the given order with nothing left resting on it.'); break; }
  case 'undo': { need(); const n = +(A[0] || 1); for (let k = 0; k < n && S.places.length > 1; k++) { const p = S.places.pop(); if (p.group && S.groups[p.group]) S.groups[p.group].members = S.groups[p.group].members.filter(i => i < S.places.length); if (p.instanceOf && S.instances) { const inst = S.instances[S.instances.length - 1]; if (inst && inst.members.includes(S.places.length)) { /* pop the whole instance */ while (S.places.length > inst.members[0]) S.places.pop(); S.instances.pop(); } } S.undos++; }
    S.last = S.places.length > 1 ? S.places.length - 1 : null; save(S); out(`undone → ${S.places.length - 1} pieces`); break; }
  case 'status': { need(); const F = field(S); out(`STATUS ${SEED}: pieces ${S.places.length - 1} · named things ${Object.keys(S.library).length} · instances ${(S.instances || []).length} · seated ${S.seated} · refusals ${S.refusals} · undos ${S.undos} · calls ${S.calls} · open up-ports ${F.open.filter(s => s.up).length} · structural open share ${F.share}${SEED === 'S05' ? ' · JOINTS right/wrong ' + S.jointsChecks.right + '/' + S.jointsChecks.wrong : ''}`); save(S); break; }
  case 'emit': { need(); const text = emit(S); const f = A[0] || path.join(DIR, `castle-${SEED}.mpd`); fs.writeFileSync(f, text); save(S); out(`emitted ${f}: ${(text.match(/^1 /gm) || []).length} type-1 lines, ${(text.match(/^0 FILE /gm) || []).length} blocks`); break; }
  case 'judge': { need(); const text = emit(S); const j = judgeText(text, SEED); const f = fieldOfText(text);
    out(`JUDGE ${SEED} vs 5935 Island Hopper (blind, per axis, ties to the kit): ${j.wins} WIN / ${j.losses} LOSS / ${j.ties} TIE · pieces ${j.pieces} · blocks ${j.blocks} · structural open share ${f.share} (kit band 0.112–0.431)`);
    for (const a of j.axes) out(`  ${a.id.padEnd(12)} ${a.verdict.padEnd(5)} ours ${String(a.ours).padStart(8)}  bar ${String(a.bar).padStart(8)}  (${a.layer})`); save(S); break; }
  case 'judge-file': { const text = fs.readFileSync(A[0], 'utf8'); const j = judgeText(text, A[0]); const f = fieldOfText(text); out(JSON.stringify(Object.assign(j, { field: f }))); break; }
  case 'report': { need(); const text = emit(S); const f = path.join(DIR, `castle-${SEED}.mpd`); fs.writeFileSync(f, text); const j = judgeText(text, SEED); const fl = fieldOfText(text);
    const rep = { seed: SEED, pieces: j.pieces, blocks: j.blocks, judge: j, field: fl, seated: S.seated, refusals: S.refusals, undos: S.undos, calls: S.calls, named: Object.keys(S.library), instances: (S.instances || []).length, joints: S.jointsChecks, intent: S.intent, generated: new Date().toISOString() };
    fs.writeFileSync(path.join(DIR, 'report.json'), JSON.stringify(rep, null, 1)); save(S); out(JSON.stringify(rep, null, 1)); break; }
  case 'report-file': { const f = A[0]; const text = fs.readFileSync(f, 'utf8'); const j = judgeText(text, SEED); const fl = fieldOfText(text);
    const rep = { seed: SEED, file: path.basename(f), pieces: j.pieces, blocks: j.blocks, judge: j, field: fl, rounds: +(A[1] || 0), generated: new Date().toISOString() };
    fs.writeFileSync(path.join(DIR, 'report.json'), JSON.stringify(rep, null, 1)); out(JSON.stringify(rep, null, 1)); break; }
  default: out('unknown command ' + CMD);
}

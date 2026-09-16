#!/usr/bin/env node
/* tools/play-plan.js — the floor plan of a play scene as an LDraw file for the hand table (play/hand-butter.html).

   HAND BUTTER builds with a dozen embedded parts on a plate about 28 studs across, moved by hand in front of a
   camera. A scene's plan is drawn in that vocabulary at one stud to the metre: each mark a 2x3 plate in the
   mark's colour, each figure's first position a 2x3 brick in its torso colour, each donor set's footprint an
   outline of 1x8 bricks in grey, the scene centred on the plate. Open the file with Open scene, then move the
   figures from mark to mark with your hands to walk the beats before the camera does.

   Usage: node tools/play-plan.js [--out play] [scene-key ...]   (every play scene when none is named) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const args = process.argv.slice(2); let out = 'play'; const keys = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--out') out = args[++i]; else keys.push(args[i]); }
/* the scene files are browser scripts: give them a window with a Film and read what they register */
const ctx = { window: null, console }; ctx.window = { Film: { SCENES: {} } }; ctx.Film = ctx.window.Film; vm.createContext(ctx);
for (const f of ['world/scenes-odyssey-play.js', 'world/scenes-monkey.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const SCENES = ctx.window.Film.SCENES, PLAY = ctx.window.Film.PLAY_SCENES || Object.keys(SCENES);
/* the donors' footprints, in LDU at scale 1, measured off the models' own lines (a bounding box of the part placements) */
function footprint(file) {
  const p = path.join(root, 'ldraw', 'models', file); if (!file || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return null;
  const t = fs.readFileSync(p, 'utf8'), subs = new Map(); let cur = '__root__'; subs.set(cur, []);
  for (const line of t.split(/\r?\n/)) { const fm = line.match(/^0\s+FILE\s+(.+)$/i); if (fm) { cur = fm[1].trim().toLowerCase(); subs.set(cur, []); continue; } const m = line.match(/^1\s+\S+\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+((?:-?[\d.]+\s+){9})(.+)$/); if (m) subs.get(cur).push({ x: +m[1], y: +m[2], z: +m[3], m: m[4].trim().split(/\s+/).map(Number), ref: m[5].trim().toLowerCase() }); }
  const first = subs.keys().next().value; let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  const walk = (name, M, depth) => { const rows = subs.get(name); if (!rows || depth > 6) return; for (const r of rows) { const x = M[0] * r.x + M[1] * r.y + M[2] * r.z + M[9], z = M[6] * r.x + M[7] * r.y + M[8] * r.z + M[11]; if (subs.has(r.ref)) walk(r.ref, [M[0] * r.m[0] + M[1] * r.m[3] + M[2] * r.m[6], M[0] * r.m[1] + M[1] * r.m[4] + M[2] * r.m[7], M[0] * r.m[2] + M[1] * r.m[5] + M[2] * r.m[8], M[3] * r.m[0] + M[4] * r.m[3] + M[5] * r.m[6], M[3] * r.m[1] + M[4] * r.m[4] + M[5] * r.m[7], M[3] * r.m[2] + M[4] * r.m[5] + M[5] * r.m[8], M[6] * r.m[0] + M[7] * r.m[3] + M[8] * r.m[6], M[6] * r.m[1] + M[7] * r.m[4] + M[8] * r.m[7], M[6] * r.m[2] + M[7] * r.m[5] + M[8] * r.m[8], x, 0, z], depth + 1); else { lo[0] = Math.min(lo[0], x); hi[0] = Math.max(hi[0], x); lo[1] = Math.min(lo[1], z); hi[1] = Math.max(hi[1], z); } } };
  walk(first, [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 0); return isFinite(lo[0]) ? { w: hi[0] - lo[0], d: hi[1] - lo[1] } : null;
}
const DONOR_FILES = (() => { const t = fs.readFileSync(path.join(root, 'world', 'donors.js'), 'utf8'), m = {}; for (const r of t.matchAll(/'?([\w]+)'?: \{ file: '([^']+)'/g)) m[r[1]] = r[2]; return m; })();
const TORSO = { monkey: 0, 'monkey-banana': 0, citizen: 4, 'odysseus': 320, 'odysseus-sword': 308, 'odysseus-wet': 308, 'odysseus-bronze': 308, hoplite: 297, hauler: 71, sailor: 71, commander: 308, circe: 26, calypso: 1, hermes: 15, eumaeus: 308, polyphemus: 0, 'penelope-ithaca': 272, 'telemachus-ithaca': 71, suitor: 70 };
const S = 20;   // one stud (20 LDU) to the metre
const line = (col, x, y, z, part, rot) => `1 ${col} ${Math.round(x)} ${y} ${Math.round(z)} ${rot || '1 0 0 0 1 0 0 0 1'} ${part}.dat`;
function plan(key) {
  const sc = SCENES[key]; if (!sc) throw new Error('no scene ' + key);
  const rows = [`0 FILE ${key}.ldr`, `0 ${sc.name}: the floor plan for the hand table`, '0 Name: ' + key + '.ldr', '0 Author: tools/play-plan.js', '0 !LDRAW_ORG Unofficial_Model', '0 one stud to the metre; marks are plates, figures are bricks in their torso colour, sets are grey outlines', ''];
  for (const d of sc.donors || []) { const fp = footprint(DONOR_FILES[d.set] || ''); if (!fp) continue; const sc2 = (d.scale || 2.5) / 40 * S;   // LDU of the model → metres → studs
    let w = fp.w * sc2, dd = fp.d * sc2; if (((d.heading || 0) % 180) !== 0) [w, dd] = [dd, w]; const cx = d.x * S, cz = d.z * S; rows.push(`0 ${d.name || d.set}: set ${d.set}, ${(w / S).toFixed(0)} by ${(dd / S).toFixed(0)} metres`);
    for (let x = -w / 2 + 80; x <= w / 2 - 80; x += 160) { rows.push(line(72, cx + x, 0, cz - dd / 2, '3008')); rows.push(line(72, cx + x, 0, cz + dd / 2, '3008')); }
    for (let z = -dd / 2 + 80; z <= dd / 2 - 80; z += 160) { rows.push(line(72, cx - w / 2, 0, cz + z, '3008', '0 0 -1 0 1 0 1 0 0')); rows.push(line(72, cx + w / 2, 0, cz + z, '3008', '0 0 -1 0 1 0 1 0 0')); } }
  const COLS = [4, 14, 1, 2, 25, 26, 5, 15]; let k = 0;
  for (const [name, m] of Object.entries(sc.marks || {})) { const col = m[2] != null ? m[2] : COLS[k++ % COLS.length]; rows.push(`0 mark ${name}`); rows.push(line(col, m[0] * S, 0, m[1] * S, '3021')); }
  for (const a of sc.actors || []) { if (a.crowd) { rows.push(`0 ${a.name}: ${a.n} at ${a.x}, ${a.z}`); for (let i = 0; i < Math.min(a.n, 6); i++) rows.push(line(TORSO[a.kind] || 70, (a.x + Math.cos(i * 1.05) * a.r * 0.6) * S, -24, (a.z + Math.sin(i * 1.05) * a.r * 0.6) * S, '3002')); continue; }
    rows.push(`0 ${a.label || a.name} (${a.figure}) heading ${a.heading || 0}`); rows.push(line(TORSO[a.figure] || 14, a.x * S, -24, a.z * S, '3002', ((a.heading || 0) % 180) === 90 ? '0 0 -1 0 1 0 1 0 0' : undefined)); }
  return rows.join('\n') + '\n';
}
fs.mkdirSync(path.join(root, out), { recursive: true });
const done = [];
for (const key of keys.length ? keys : PLAY) { const text = plan(key); fs.writeFileSync(path.join(root, out, key + '.ldr'), text); done.push({ key, lines: text.split('\n').filter(l => /^1 /.test(l)).length }); }
console.log(done.map(d => `${d.key}: ${d.lines} pieces`).join('\n'));

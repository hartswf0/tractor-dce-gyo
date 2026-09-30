#!/usr/bin/env node
/* odyssey/cascade/tools/verify.mjs — the agent-facing contract: every graph cooked headless, bounded, and its outputs checked, with
   no browser. For each graph in graphs.json:
     1. `cascade check` (static: definitions, types, hierarchy, connections, architecture rules);
     2. `cascade run --frames <verifyFrames> --json --timeout 120000`: the JSON manifest must say completed, list every frame, and
        every listed file must exist and be a PNG larger than a blank one; two frames of a moving graph must differ;
     3. one critic per graph, asked in the terms of its scene's cineosis sign (odyssey/cineosis/score.json): a variant of the graph
        with a parameter changed (written beside it as .verify-<name>.cascade, cooked, deleted) and a count of pixels of a colour
        that must appear, vanish or grow.
   Writes verify.json (committed) and exits 1 on any failure. Run from anywhere: node odyssey/cascade/tools/verify.mjs */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const root = path.resolve(here, '..', '..');
const require = createRequire(path.join(here, 'node_modules', 'cascade', 'package.json'));
const { loadImage, createCanvas } = require('@napi-rs/canvas');
const cli = path.join(here, 'node_modules/cascade/dist/cli/index.js');
const { graphs } = JSON.parse(fs.readFileSync(path.join(here, 'graphs.json'), 'utf8'));
const score = JSON.parse(fs.readFileSync(path.join(root, 'odyssey/cineosis/score.json'), 'utf8'));
const signOf = id => { const s = score.scenes.find(x => x.id === id); return s ? { scene: id, title: s.title, sign: s.primary.symbol, name: s.primary.name, question: s.primary.question } : { scene: id }; };

function cascade(args) {
  const t = Date.now();
  try { return { ok: true, out: execFileSync(process.execPath, [cli, ...args], { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 }), ms: Date.now() - t }; }
  catch (e) { return { ok: false, out: String(e.stdout || '') + String(e.stderr || e.message), ms: Date.now() - t }; }
}
const manifest = out => { const line = out.trim().split('\n').reverse().find(l => l.startsWith('{')); return line ? JSON.parse(line) : null; };
async function pixels(file, test) {
  const img = await loadImage(fs.readFileSync(file)), c = createCanvas(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, img.width, img.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (test(d[i], d[i + 1], d[i + 2])) n++;
  return n;
}
/* a colour test: near an RGB within a tolerance */
const near = (r, g, b, tol = 40) => (R, G, B) => Math.abs(R - r) < tol && Math.abs(G - g) < tol && Math.abs(B - b) < tol;

/* a variant: the graph with some props replaced, cooked at one frame, measured */
async function variant(g, props, frame, test) {
  const doc = JSON.parse(fs.readFileSync(path.join(here, g.graph), 'utf8'));
  for (const [key, v] of Object.entries(props)) { const [id, prop] = key.split('/'); const n = doc.nodes.find(x => x.id === id); n.props = n.props || {}; n.props[prop] = v; }
  const file = `.verify-${g.name}.cascade`, out = `renders/verify/${g.name}-variant`;
  fs.writeFileSync(path.join(here, file), JSON.stringify(doc));
  try {
    const r = cascade(['run', file, '--frames', String(frame), '--fps', String(g.fps), '--json', '--timeout', '120000', '--out', out, '--node', g.output[0]]);
    const m = r.ok && manifest(r.out);
    if (!m || m.status !== 'completed') return { ok: false, error: r.out.slice(0, 400) };
    return { ok: true, count: await pixels(path.join(here, m.files[0]), test), ms: r.ms };
  } finally { fs.rmSync(path.join(here, file), { force: true }); }
}

const ORANGE = near(217, 117, 26, 45), RED = (r, g, b) => r - g > 50 && r - b > 70, SUN = (r, g, b) => r > 150 && g > 80 && g < 190 && b < 90;
const CRITICS = {
  kit: { ask: 'Is the hand\'s world solid: does the gesture quantize to cells, and does the offline kit check clean?', run: async () => {
    const cells = fs.readdirSync(path.join(here, '.cascade-cache')).filter(f => /^gesture-cells\.[0-9a-f]+\.json$/.test(f));
    const kit = path.join(here, 'kit/cascade.gesture-welcome.json'), k = fs.existsSync(kit) ? JSON.parse(fs.readFileSync(kit, 'utf8')) : null;
    const n = cells.length ? JSON.parse(fs.readFileSync(path.join(here, '.cascade-cache', cells.sort((a, b) => fs.statSync(path.join(here, '.cascade-cache', b)).mtimeMs - fs.statSync(path.join(here, '.cascade-cache', a)).mtimeMs)[0]), 'utf8')).count : 0;
    return { ok: n > 0 && !!k && k.loose === 0 && k.clash === 0, cells: n, kit: k && { pieces: k.pieces, loose: k.loose, clash: k.clash } }; } },
  attention: { ask: 'Whose world is this: at threshold 0 with no script the hall stands still (no business), at 300 it is all business?', run: async () => {
    const g = graphs.find(x => x.name === 'attention');
    const still = await variant(g, { 'biz/threshold': 0, 'biz/script': 0 }, 300, ORANGE), busy = await variant(g, { 'biz/threshold': 300 }, 300, ORANGE);
    return { ok: still.ok && busy.ok && still.count === 0 && busy.count > 200, statuesOrangePixels: still.count, frenzyOrangePixels: busy.count }; } },
  clocks: { ask: 'Has everyday life become heroic: four days of sky under the raft, or seven years (more sun arcs at the higher ratio)?', run: async () => {
    const g = graphs.find(x => x.name === 'clocks');
    const four = await variant(g, { 'sky/ratio': 0.4 }, 288, SUN), seven = await variant(g, { 'sky/ratio': 255.7 }, 288, SUN);
    return { ok: four.ok && seven.ok && seven.count > four.count * 2, fourDaysSunPixels: four.count, sevenYearsSunPixels: seven.count }; } },
  forbidden: { ask: 'Does the clash stand alone, answered by no build: nothing drawn at reveal 0, the forbidden volumes at reveal 1?', run: async () => {
    const g = graphs.find(x => x.name === 'forbidden');
    const none = await variant(g, { 'clash/reveal': 0 }, 1, RED), all = await variant(g, { 'clash/reveal': 1 }, 1, RED);
    return { ok: none.ok && all.ok && none.count === 0 && all.count > 1000, revealedNothingRedPixels: none.count, revealedAllRedPixels: all.count }; } },
  facing: { ask: 'How has the world got inside the objects: with facing implicit, does every copy face the same way (the image changes)?', run: async () => {
    const g = graphs.find(x => x.name === 'facing'), grey = near(77, 74, 69, 30);
    const on = await variant(g, { 'field/explicit': true }, 120, grey), off = await variant(g, { 'field/explicit': false }, 120, grey);
    return { ok: on.ok && off.ok && on.count > 0 && off.count > 0 && on.count !== off.count, explicitInkPixels: on.count, implicitInkPixels: off.count }; } },
};

const report = { ran: new Date().toISOString(), cascade: JSON.parse(fs.readFileSync(path.join(here, 'node_modules/cascade/package.json'), 'utf8')).version, graphs: [] };
let failed = 0;
for (const g of graphs) {
  const r = { name: g.name, graph: g.graph, ...signOf(g.scene) };
  const chk = cascade(['check', g.graph]); r.check = chk.ok && /Static check passed/.test(chk.out);
  const out = `renders/verify/${g.name}`; fs.rmSync(path.join(here, out), { recursive: true, force: true });
  const run = cascade(['run', g.graph, '--frames', g.verifyFrames, '--fps', String(g.fps), '--json', '--timeout', '120000', '--out', out, '--node', g.output[0]]);
  const m = run.ok ? manifest(run.out) : null;
  r.run = m ? { status: m.status, frames: m.frames, files: m.files.length, ms: Math.round(m.durationMs), wallMs: run.ms } : { status: 'failed', error: run.out.slice(0, 600) };
  if (m) {
    const sizes = m.files.map(f => { const p = path.join(here, f); return fs.existsSync(p) ? fs.statSync(p).size : 0; });
    const hashes = m.files.map(f => fs.existsSync(path.join(here, f)) ? crypto.createHash('sha1').update(fs.readFileSync(path.join(here, f))).digest('hex') : '');
    r.run.bytes = sizes; r.run.distinctFrames = new Set(hashes).size;
    r.outputs = m.status === 'completed' && m.files.length === m.frames.length && sizes.every(s => s > 2000) && r.run.distinctFrames > 1;
  } else r.outputs = false;
  const c = CRITICS[g.name]; r.critic = c ? { ask: c.ask, ...(await c.run()) } : null;
  r.ok = r.check && r.outputs && (!r.critic || r.critic.ok);
  if (!r.ok) failed++;
  report.graphs.push(r);
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${g.name.padEnd(10)} check ${r.check ? 'passed' : 'FAILED'} · ${r.run.status} ${r.run.files ?? 0} frames, ${r.run.distinctFrames ?? 0} distinct, ${r.run.wallMs ?? '?'} ms · critic ${r.critic ? (r.critic.ok ? 'passed' : 'FAILED') : 'none'}`);
}
report.ok = failed === 0;
fs.writeFileSync(path.join(here, 'verify.json'), JSON.stringify(report, null, 1) + '\n');
console.log(failed ? `${failed} graph(s) failed` : 'every graph cooked, every output present, every critic answered');
process.exit(failed ? 1 : 0);

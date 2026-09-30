#!/usr/bin/env node
/* odyssey/cascade/tools/rig_import.mjs — a scene's choreography sheet onto the rig desk: a Cascade graph, rig-<scene>.cascade, with one
   Subnet per actor holding a project.MinifigRig, the scene's voice as a track, the set, and the acted film's shot camera.

     node tools/rig_import.mjs OD-B12-S03 [--fresh]

   Reads (never changes) odyssey/choreo/<scene>.json (the choreographer's pass, and any director's overrides), odyssey/choreo/marks/
   <scene>.json (the take's blocking, voice envelope, clips, set pieces), films/odyssey/<scene>-acted.json (the shots), and
   assets/rig/<scene>/cameras.json (the take's camera at every drawing, tools/rig_probe.cjs). Writes:
     assets/rig/<scene>/<actor>.json   the actor's sheet: its generated layers (with any override not written by the desk merged in,
                                      as choreo.js merges it), its blocking keys, its height, hips, scale, what its hands hold, the
                                      ship it rides
     assets/rig/<scene>/scene.json     the voice on the take's clock (50 Hz), the words placed through each clip, the lines, the
                                      shots, the set pieces and the floor marks
     rig-<scene>.cascade               the graph. If it exists, every rig node's director props (values, expressions, keyframe
                                      channels) are kept and only the rest is rebuilt; --fresh starts the director's layer empty.
   The desk's own overrides (the lanes listed in the sheet's overrides._desk, written by tools/rig_export.mjs) are the graph's
   director layer, so they are not folded into the base: importing after an export and exporting again changes nothing. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PROP_OF, GROUPS, CH, poseAt } from '../lib/rig.ts';

const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), ROOT = path.resolve(HERE, '..', '..');
const require = createRequire(import.meta.url), Choreo = require(path.join(ROOT, 'film-readymades/choreo.js'));
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
if (!sid) { console.log('node tools/rig_import.mjs OD-Bxx-Syy [--fresh]'); process.exit(1); }
const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const r4 = v => Math.round(v * 1e4) / 1e4, r3 = v => Math.round(v * 1e3) / 1e3;
const deep = v => Array.isArray(v) ? v.map(deep) : typeof v === 'number' ? r4(v) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : v;
const slug = id => id.replace(/[^a-z0-9]+/gi, '_');
const PALETTE = [[0.78, 0.2, 0.16], [0.18, 0.4, 0.75], [0.2, 0.55, 0.3], [0.62, 0.35, 0.7], [0.85, 0.55, 0.15], [0.2, 0.6, 0.65], [0.55, 0.42, 0.3], [0.75, 0.3, 0.5], [0.4, 0.45, 0.2], [0.35, 0.35, 0.55], [0.7, 0.62, 0.2], [0.3, 0.3, 0.3]];

const C = J(`odyssey/choreo/${sid}.json`), M = J(`odyssey/choreo/marks/${sid}.json`);
const film = fs.existsSync(path.join(ROOT, `films/odyssey/${sid}-acted.json`)) ? J(`films/odyssey/${sid}-acted.json`) : null;
const camF = path.join(HERE, 'assets/rig', sid, 'cameras.json'), cams = fs.existsSync(camF) ? JSON.parse(fs.readFileSync(camF, 'utf8')).cams : null;
const OUT = path.join(HERE, 'assets/rig', sid); fs.mkdirSync(OUT, { recursive: true });
const desk = ((C.overrides || {})._desk || {}).lanes || {};
const ids = Object.keys(C.actors);

/* ── the actors' sheets ── */
let PROBE = null;
const JN = ['armRP', 'armLP', 'headP', 'torsoP', 'legRP', 'legLP'];
function perfOf(S, P, id) {
  const out = Object.fromEntries(JN.map(k => [k, []])); let any = false;
  for (let i = 0; i < P.length; i++) { const a = P[i].actors[id], q = a && poseAt(S, P[i].t, null);
    for (const [n, k] of JN.entries()) { const d = a && q && q.vis ? a.j[n].map((x, c) => Math.round((x - q.J[k][c]) * 1000) / 1000) : [0, 0, 0]; if (d.some(v => v)) any = true; out[k].push(d.some(v => v) ? d : 0); } }
  for (const k of JN) if (!out[k].some(Boolean)) delete out[k];
  return any ? out : null;
}
const actors = ids.map((id, n) => {
  const A = C.actors[id], ov = (C.overrides || {})[id] || {}, mine = new Set(desk[id] || []), lanes = {};
  for (const k of new Set([...Object.keys(A.channels || {}), ...Object.keys(ov)])) {
    const o = mine.has(k) ? null : ov[k], L = Choreo.merged((A.channels || {})[k], o);
    if (L.length) lanes[k] = L;
  }
  const keys = M.keys.map((k, i) => ({ t: k.t, win: k.win || null, snap: k.snap[id] ? deep(k.snap[id]) : null, prev: i > 0 && M.keys[i - 1].snap[id] ? deep(M.keys[i - 1].snap[id]) : null, move: k.moves && k.moves[id] ? deep(k.moves[id]) : null }));
  const ship = Object.entries(C.rigs || {}).map(([rid, R]) => (R.type === 'ship' || rid === 'ship') && (R.riders || []).includes(id) ? { pivot: R.pivot, yaw: R.yaw || 0, channels: R.channels } : null).find(Boolean) || null;
  const held = M.held[id] || { R: 0, L: 0, hipsY: -44, scale: M.scale };
  const S = { scene: sid, actor: id, step: C.step || 'twos', layer: C.layer || 'add', total: C.total, H: r4(M.H[id] || 60), hipsY: held.hipsY, scale: held.scale,
    held: { R: held.R, L: held.L }, colour: PALETTE[n % PALETTE.length], keys, lanes, ship, holds: (C.holds || []).filter(h => h.actor === id) };
  /* the take's performance layer: what the page's own pose (tools/rig_probe.cjs) adds over blocking and sheet, per joint and
     drawing; kept from the previous import when there is no probe here (renders/ is not committed) */
  const probeF = path.join(HERE, 'renders/rig', sid + '.probe.json'), prevF = path.join(OUT, id + '.json');
  if (fs.existsSync(probeF)) { PROBE ||= JSON.parse(fs.readFileSync(probeF, 'utf8')).poses; S.perf = perfOf(S, PROBE, id); }
  else if (fs.existsSync(prevF)) S.perf = JSON.parse(fs.readFileSync(prevF, 'utf8')).perf || null;
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(S));
  return S;
});

/* ── the scene: the voice on the take's clock, words, lines, shots, set ── */
const hz = M.hz, n = Math.ceil(C.total * hz), env = new Array(n).fill(0);
for (const c of M.clips) for (let i = Math.floor(c.at * hz); i < Math.min(n, Math.ceil((c.at + c.dur) * hz)); i++) { const x = M.env[Math.floor((c.start + i / hz - c.at) * hz)]; if (x != null) env[i] = r3(x); }
const words = [];
for (const c of M.clips) { const text = String(c.caption || ''), re = /[A-Za-z']+/g, L = Math.max(1, text.length); let m;
  while ((m = re.exec(text))) words.push({ t: r3(c.at + 0.15 + (c.dur - 0.3) * (m.index / L)), w: m[0] }); }
const shots = film ? film.shots.map(s => ({ t: s.t, kind: s.kind, shot: s.shot })) : (M.cut || []).map(q => ({ t: q.t0, kind: q.kind }));
const marks = []; for (const k of M.keys) for (const [id, s] of Object.entries(k.snap)) if (s.vis && ids.includes(id)) marks.push({ actor: id, key: k.id, p: s.p.map(r3), colour: [...PALETTE[ids.indexOf(id) % PALETTE.length], 1] });
const title = (M.keys[0] && M.keys[0].beat) || sid;
fs.writeFileSync(path.join(OUT, 'scene.json'), JSON.stringify({ scene: sid, title, total: C.total, hz, env, clips: M.clips.map(c => ({ at: c.at, dur: c.dur, caption: c.caption, who: c.speaker || '', kind: c.kind })), words, shots, pieces: M.pieces, marks }));

/* ── the score: the place lanes and metric tracks attach (project.ScoreLanes); the voice is written here, other lanes kept ── */
{ const sf = path.join(OUT, 'score.json'), prev = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : null;
  const lanes = [{ id: 'voice', label: 'voice', kind: 'envelope', hz, values: env, range: [0, 1], by: 'tools/rig_import.mjs (odyssey/choreo/marks)' },
    { id: 'words', label: 'words', kind: 'events', events: words.map(w => ({ t: w.t, label: w.w })), by: 'tools/rig_import.mjs' },
    ...((prev && prev.lanes) || []).filter(l => l.id !== 'voice' && l.id !== 'words')];
  fs.writeFileSync(sf, JSON.stringify({ format: 'odyssey-score/0', scene: sid, total: C.total, note: 'lanes on the take\'s clock: envelope|metric {hz, values, range?}, events {events:[{t,label}]}, spans {spans:[{t0,t1,label}]}; add a lane by id (stimulus, intent, action, contact, a metric) and project.ScoreLanes shows it', lanes })); }

/* ── the shot camera as keyframe channels (a key where the camera changes, a constant key before each cut) ── */
function channelOf(series, cuts, tol) {
  /* series[i] at drawing i (frame i + 1); linear keys kept greedily within tol; constant keys at the drawing before a cut */
  const keys = [], N = series.length; let a = 0;
  const seg = (i0, i1) => { let b = i0; keys.push({ frame: i0 + 1, value: r3(series[i0]), interpolation: 'linear' });
    while (b < i1) { let e = b + 1; while (e + 1 <= i1) { let ok = true; for (let q = b + 1; q < e + 1; q++) { const u = (q - b) / (e + 1 - b), v = series[b] + (series[e + 1] - series[b]) * u; if (Math.abs(v - series[q]) > tol) { ok = false; break; } } if (!ok) break; e++; }
      keys.push({ frame: e + 1, value: r3(series[e]), interpolation: 'linear' }); b = e; } };
  const bounds = [0, ...cuts.filter(c => c > 0 && c < N), N];
  for (let s = 0; s + 1 < bounds.length; s++) { const i0 = bounds[s], i1 = bounds[s + 1] - 1; if (i1 < i0) continue; seg(i0, i1); keys[keys.length - 1].interpolation = 'constant'; }
  const out = []; for (const k of keys) { if (out.length && out[out.length - 1].frame === k.frame) out[out.length - 1] = k; else out.push(k); }
  /* the smooth default is written by omission (the document's rule); every key here says what it is */
  return { keys: out.map(k => ({ frame: k.frame, value: k.value, interpolation: k.interpolation })) };
}
let camProps;
if (cams && cams.length) {
  const cuts = []; cams.forEach((c, i) => { if (i && c.shot !== cams[i - 1].shot) cuts.push(i); });
  const D = 100, S = f => cams.map(f), shotIdx = []; let si = 0; cams.forEach((c, i) => { if (i && c.shot !== cams[i - 1].shot) si++; shotIdx.push(si); });
  const ch = (f, tol) => ({ value: r3(f(cams[0])), channel: channelOf(S(f), cuts, tol) });
  camProps = { tx: ch(c => c.pos[0], 0.05), ty: ch(c => c.pos[1], 0.05), tz: ch(c => c.pos[2], 0.05),
    lx: ch(c => c.pos[0] + c.dir[0] * D, 0.08), ly: ch(c => c.pos[1] + c.dir[1] * D, 0.08), lz: ch(c => c.pos[2] + c.dir[2] * D, 0.08), fov: ch(c => c.fov, 0.02),
    aperture: 41.4214, resolution: [1280, 720],
    shot: { value: 0, channel: { keys: [{ frame: 1, value: 0, interpolation: 'constant' }, ...cuts.map((c, k) => ({ frame: c + 1, value: k + 1, interpolation: 'constant' }))] } } };
} else {
  console.warn('no cameras.json yet (run tools/rig_probe.cjs): a still wide camera');
  const xs = marks.map(m => m.p[0]), zs = marks.map(m => m.p[2]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, y0 = Math.min(...marks.map(m => m.p[1]));
  camProps = { tx: cx, ty: y0 + 160, tz: cz + 420, lx: cx, ly: y0 + 30, lz: cz, fov: 40, aperture: 41.4214, resolution: [1280, 720], shot: 0 };
}

/* ── the graph ── */
const gfile = path.join(HERE, `rig-${sid}.cascade`), old = fs.existsSync(gfile) && !args.includes('--fresh') ? JSON.parse(fs.readFileSync(gfile, 'utf8')) : null;
const kept = {}; if (old) for (const nd of old.nodes) if (nd.module === 'project.MinifigRig') kept[nd.id] = nd.props || {};
const DIRPROPS = [...CH.map(c => PROP_OF[c]), ...GROUPS];
const nodes = [], conns = [], annotations = [];
nodes.push({ id: 'voice', module: 'project.VoiceTrack', position: [0, 0], source: 'project', props: { track: { path: `assets/rig/${sid}/scene.json`, mediaType: 'application/json' }, time: { value: 0, expression: '$T' }, window: 8 } });
nodes.push({ id: 'set', module: 'project.RigSet', position: [0, 200], source: 'project', props: { track: { path: `assets/rig/${sid}/scene.json`, mediaType: 'application/json' }, pieces: true, marks: true } });
nodes.push({ id: 'score', module: 'project.ScoreLanes', position: [0, 360], source: 'project', props: { track: { path: `assets/rig/${sid}/score.json`, mediaType: 'application/json' }, time: { value: 0, expression: '$T' }, window: 8, only: '' } });
nodes.push({ id: 'cast', module: 'cascade.geo.Merge', position: [620, 200] });
conns.push([['set', 0, 'geometry'], ['cast', 0, 'inputs']]);
actors.forEach((S, i) => {
  const s = slug(S.actor), sub = 'actor_' + s, rig = 'rig_' + s, prev = kept[rig] || {};
  const props = { sheet: { path: `assets/rig/${sid}/${S.actor}.json`, mediaType: 'application/json' }, time: { value: 0, expression: '$T' }, solo: prev.solo ?? false };
  for (const k of DIRPROPS) props[k] = prev[k] !== undefined ? prev[k] : (k.startsWith('w') && GROUPS.includes(k) ? 1 : 0);
  nodes.push({ id: sub, module: 'cascade.core.Subnet', position: [300, 40 + i * 110], metadata: { actor: S.actor } });
  nodes.push({ id: rig, module: 'project.MinifigRig', parent: sub, position: [0, 0], source: 'project', props });
  nodes.push({ id: 'geo_' + s, module: 'cascade.core.Output', parent: sub, position: [260, 0], props: { outputIndex: 0, outputName: 'geometry', dataType: 'geometry' } });
  nodes.push({ id: 'pose_' + s, module: 'cascade.core.Output', parent: sub, position: [260, 100], props: { outputIndex: 1, outputName: 'pose', dataType: 'object' } });
  conns.push([[rig, 0, 'geometry'], ['geo_' + s, 0, 'input']]);
  conns.push([[rig, 1, 'pose'], ['pose_' + s, 0, 'input']]);
  conns.push([['geo_' + s, 0, 'output'], ['cast', 0, 'inputs']]);
});
nodes.push({ id: 'shotcam', module: 'project.ShotCam', position: [620, 420], source: 'project', props: camProps });
nodes.push({ id: 'camera', module: 'cascade.core.Camera', position: [860, 420], props: { lookAt: true, aperture: 41.4214, resolution: [1280, 720], near: 0.5, far: 10000 } });
conns.push([['shotcam', 0, 'translate'], ['camera', 0, 'translate']], [['shotcam', 1, 'lookat'], ['camera', 3, 'lookat']], [['shotcam', 2, 'focal'], ['camera', 2, 'focal']]);
nodes.push({ id: 'view', module: 'project.RigView', position: [1100, 200], source: 'project', props: { size: [960, 640], strip: true, label: `rig desk: ${sid}`, filename: `previz-${sid}.png` } });
conns.push([['cast', 0, 'geometry'], ['view', 0, 'geometry']], [['camera', 0, 'camera'], ['view', 1, 'camera']], [['voice', 4, 'info'], ['view', 2, 'voice']], [['score', 1, 'info'], ['view', 3, 'score']]);
annotations.push({ id: 'note', position: [0, -160], size: [900, 120], text: `${sid} on the rig desk. Each actor is a Subnet with one Minifig Rig: its generated choreography comes from assets/rig/${sid}/<actor>.json; the director's layer is the rig's own props (an offset per servo, a weight per body part), keyed in the Timeline against the Voice Track. Preview headless: cascade run rig-${sid}.cascade --frames 1-${Math.floor(C.total * 12)} --fps 12. Export: node tools/rig_export.mjs ${sid}.` });
const doc = { version: '0.2', metadata: { name: `Rig desk: ${sid}`, description: `The choreography of ${sid} (${title}) as rigs to key: ${ids.length} actors, the voice, the set and the acted film's shot camera.`, fps: 12, frames: [1, Math.floor(C.total * 12)] }, nodes, connections: conns, annotations };
fs.writeFileSync(gfile, JSON.stringify(doc, null, 1));
console.log('wrote', path.relative(HERE, gfile), ids.length, 'actors;', path.relative(HERE, OUT), fs.readdirSync(OUT).length, 'files;', cams ? 'camera keys ' + camProps.tx.channel.keys.length + ' (tx)' : 'no camera track', old ? '; director props kept from the existing graph' : '');

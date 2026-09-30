#!/usr/bin/env node
/* tools/perform/previz.js — a light previz of a performance: the take's figures posed by tools/perform/body.js (the blocking and the
   sheet exactly as the film poses them), projected through the film's own shot camera at every drawing, drawn as sticks and boxes
   with the heat of every body as a glow, what they hold, the giant as his needle poses him (he is a prop in the take), the four
   needles and a "why" line for the hottest actor; rendered headless on a 2D canvas (chromium, CPU), 12 drawings a second, with the
   scene's voice laid on the clock from its clips.

   node tools/perform/previz.js OD-B01-S03 [--sheet f.choreo.json] [--score f.json] [--name n] [--size 640x360] [--from s --to s] [--light]
   Writes odyssey/perform/media/<name>.mp4 and <name>.jpg (the poster). Frames are kept in the scratchpad while drawing. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const Body = require('./body.js'), Metrics = require('./metrics.js'), Thermo = require('./thermo.js'), Score = require('./score.js'), Choreo = require('../../film-readymades/choreo.js');
const P = require('./perform.js'), Cr = require('../../film-readymades/creatures.js'), crKinds = Object.fromEntries(Cr.kinds().map(k => [k.kind, k]));
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a)), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PAL = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#d35400', '#c0392b', '#7f8c8d', '#16a085', '#8e44ad', '#27ae60', '#e67e22', '#2980b9'];
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const r4 = v => Math.round(v * 1e4) / 1e4;

function build(sid, o) {
  const M = P.marksOf(sid), C = o.sheet, S = o.score, Tr = Metrics.track(M, C), m = Metrics.measure(Tr, { events: S.events, cues: C.cues, holds: C.holds });
  const th = Thermo.thermo(Tr, { ...S, events: S.events }, { events: S.events, viol: m.viol }), es = Thermo.essentials(th), E = Score.Events(S.events || []);
  const ids = Tr.ids, color = Object.fromEntries(ids.map((id, k) => [id, PAL[k % PAL.length]]));
  const pieces = (M.pieces || []).filter(p => !/stage plate|land about|the sea|floor|walls$/.test(p.label));
  const edgesOf = b => { const [x0, y0, z0, x1, y1, z1] = b, c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]; return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([a, b2]) => [c[a], c[b2]]); };
  const objs = S.objects || {}, coupled = S.authored && S.authored.coupled, bands = S.bands || require('./homeostat.js').bandsFor(S.type);
  const markAt = (ob, t) => { if (ob.track) { let p = ob.track[0][1]; for (const [tt, pp] of ob.track) if (tt <= t) p = pp; return p; } return ob.at; };
  const seaM = S.compiled && S.compiled.machine && S.compiled.machine.sea, seaPc = (M.pieces || []).find(p => /the sea|sea$/.test(p.label)), seaBox = seaPc ? seaPc.box : [-200, 0, -300, 200, 5, 300];
  const i0 = Math.round((o.from || 0) * 12), i1 = Math.min(Tr.n, o.to != null ? Math.round(o.to * 12) : Tr.n), frames = [];
  const ev = S.events || [], thrust = ev.find(e => e.kind === 'THRUST' && e.actor === 'odysseus'), glow = ev.find(e => e.id === 'sGlow');
  for (let i = i0; i < i1; i++) { const t = i / 12, fr = Tr.frames[i], Pj = fr.P || (() => null), f = { t, shot: fr.cam ? fr.cam.kind : '', set: [], glow: [], figs: [], props: [], giants: [] };
    const pr = p => { const q = Pj(p); return q ? [r4(q[0]), r4(q[1]), r4(q[2])] : null; };
    /* a piece a ship rig turns (the SEA or the Sirens' hull): its box about the pivot, lifted by the heave (as choreo.js applyShip) */
    const rigOf = pc => { for (const [rid, R] of Object.entries((C && C.rigs) || {})) if ((R.type === 'ship' || rid === 'ship') && R.piece === pc.label) { const v = Choreo.sampleRig(C, rid, t) || {}, Q = Body.mul(Body.eYXZ(v.pitch || 0, R.yaw || 0, v.roll || 0), Body.eYXZ(0, -(R.yaw || 0), 0)); return p => { const q = Body.apR(Q, [p[0] - R.pivot[0], p[1] - R.pivot[1], p[2] - R.pivot[2]]); return [q[0] + R.pivot[0] + (v.dx || 0), q[1] + R.pivot[1] + (v.heave || 0), q[2] + R.pivot[2] + (v.dz || 0)]; }; } return null; };
    for (const pc of pieces) { const tf = rigOf(pc); if (!tf) continue; for (const [a, b] of edgesOf(pc.box)) { const qa = pr(tf(a)), qb = pr(tf(b)); if (qa && qb && Math.abs(qa[0]) < 4 && Math.abs(qb[0]) < 4 && Math.abs(qa[1]) < 4 && Math.abs(qb[1]) < 4) f.set.push([qa[0], qa[1], qb[0], qb[1]]); } }
    if (seaM) { const L = (() => { const lv = seaM.level; return lv[Math.min(lv.length - 1, Math.round(t * 12))][1]; })(), [x0, y0, z0, x1, y1, z1] = seaBox; f.sea = [];
      for (const u of [0.25, 0.5, 0.75]) { const z = z0 + (z1 - z0) * u, pts = []; for (let k = 0; k <= 40; k++) { const x = x0 + (x1 - x0) * k / 40, hh = L * seaM.waves.reduce((s2, q) => s2 + q.A * Math.sin(q.kx * x + q.kz * z - q.w * t + q.ph), 0), q = pr([x, y1 + hh, z]); if (q && Math.abs(q[0]) < 1.6 && Math.abs(q[1]) < 1.6) pts.push([q[0], q[1]]); else { if (pts.length > 1) f.sea.push({ l: L, pts: pts.slice() }); pts.length = 0; } } if (pts.length > 1) f.sea.push({ l: L, pts }); } }
    for (const pc of pieces) if (!rigOf(pc)) for (const [a, b] of edgesOf(pc.box)) { const qa = pr(a), qb = pr(b); if (qa && qb && Math.abs(qa[0]) < 4 && Math.abs(qb[0]) < 4 && Math.abs(qa[1]) < 4 && Math.abs(qb[1]) < 4) f.set.push([qa[0], qa[1], qb[0], qb[1]]); }
    let hot = null, hv = -1;
    for (const id of ids) { const a = fr.a[id]; if (!a) continue; const s = a.s, pts = {}; for (const k of ['head', 'headTop', 'crown', 'face', 'faceC', 'shR', 'shL', 'elR', 'elL', 'handR', 'handL', 'hipR', 'hipL', 'kneeR', 'kneeL', 'footR', 'footL', 'hips', 'neck']) pts[k] = pr(s.pts[k]);
      const H = Tr.H(id), lk = s.pts.gaze, fc = s.pts.faceC; pts.look = pr([fc[0] + lk[0] * 0.35 * H, fc[1] + lk[1] * 0.35 * H, fc[2] + lk[2] * 0.35 * H]);
      if (!pts.hips) continue; const size = pts.crown && pts.footR ? Math.abs(pts.crown[1] - pts.footR[1]) / 2 : 0.05;
      const st = (m.states[id] || '')[i] || null, prin = ((S.actors || {})[id] || {}).principal; f.figs.push({ id, p: pts, c: color[id], s: size, z: pts.hips[2], label: Score.short(id), state: st, principal: prin });
      const T = th.T[id][i]; f.glow.push({ x: pts.hips[0], y: pts.hips[1], r: Math.min(0.4, size * 0.9), T }); const w = T * (prin ? 3 : 1) + (prin ? 0.05 : 0); if (w > hv) { hv = w; hot = id; } }
    /* creatures: the rig posed at t, its nodes' pivots (creatures.js kinds) projected, parent to child */
    f.creatures = []; const crHeads = {};
    for (const [cid, A] of Object.entries((C && C.creatures) || {})) { const sm = Cr.sample(C, cid, t), P0 = sm.rig.pose(sm.v), K = crKinds[A.kind], pos = {};
      for (const nd of K.nodes) if (P0.nodes[nd.id]) pos[nd.id] = Cr.m.ap(P0.nodes[nd.id], nd.p);
      const segs = []; for (const nd of K.nodes) if (nd.parent && pos[nd.parent] && pos[nd.id]) { const a = pr(pos[nd.parent]), b = pr(pos[nd.id]); if (a && b && Math.abs(a[0]) < 3 && Math.abs(b[0]) < 3 && Math.abs(a[1]) < 3 && Math.abs(b[1]) < 3) segs.push([a[0], a[1], b[0], b[1], 0.012 * (A.scale || 1)]); }
      if (!segs.length && sm.rig.K.roots) { const W = sm.rig.world(sm.v); sm.rig.K.roots.forEach((r0, k) => { const j = sm.rig.anchor('jaw' + (k + 1), sm.v); if (!j) return; const a = pr(Cr.m.ap(W, r0)), b = pr(j.slice(0, 3)); if (a && b && Math.abs(a[0]) < 3 && Math.abs(b[0]) < 3 && Math.abs(a[1]) < 3 && Math.abs(b[1]) < 3) segs.push([a[0], a[1], b[0], b[1], 0.02 * (A.scale || 1)]); }); }   /* Scylla: each neck root to its jaw */
      const hm = sm.rig.anchor('head', sm.v), em = sm.rig.anchor('eye', sm.v), hq = hm ? pr(hm.slice(0, 3)) : null, hq2 = hm ? pr([hm[0], hm[1] + 30 * (A.scale || 1), hm[2]]) : null, eq = em ? pr(em.slice(0, 3)) : null;
      const head = hq && hq2 ? [hq[0], hq[1], Math.min(0.2, Math.abs(hq2[1] - hq[1]) / 2)] : null; if (hq) crHeads[cid] = hq;
      if (segs.length || head) f.creatures.push({ segs, head, eye: eq ? [eq[0], eq[1], sm.v.eye || 0] : null, label: cid, lx: hq ? hq[0] : segs.length ? segs[0][0] : 0, ly: hq ? hq[1] : segs.length ? segs[0][1] : 0 }); }
    const crGlow = (cid, Tn) => crHeads[cid] ? [{ x: crHeads[cid][0], y: crHeads[cid][1], r: 0.18, T: Tn }] : [];
    /* objects: held (a spear), a line through many hands (the stake), a heat source (the fire), a giant */
    const own = Choreo.propsAt(C, t).own;
    for (const [oid, ob] of Object.entries(objs)) {
      const Tn = th.T[oid] ? th.T[oid][i] : 0;
      if (ob.kind === 'rock' && ob.track && ob.track.length > 1) { const tr = ob.track, ta = tr[1][0], tb = tr[tr.length - 1][0]; if (t < ta || t > tb + 0.3) continue; const p0 = markAt(ob, t), qa = pr(p0), qb = pr([p0[0] + 14, p0[1] + 6, p0[2]]); if (qa && qb) f.props.push({ a: qa, b: qb, w: 12, c: '#8c8577' }); continue; }
      if (C && C.creatures && C.creatures[oid]) { f.glow.push(...crGlow(oid, Tn)); continue; }
      if (ob.kind === 'giant') { const p = markAt(ob, t), q = pr(p); if (!q) continue; const qh = pr([p[0], p[1] + 100, p[2]]); const s = qh ? Math.abs(qh[1] - q[1]) / 2 : 0.2;
        let up = 0.3; if (coupled) { const x = coupled.x[1][Math.min(coupled.x[1].length - 1, Math.round(t * coupled.hz))]; up = Math.max(0, Math.min(1, (x + 1) / 2)); }
        f.giants.push({ x: q[0], y: q[1], s: s * 1.2, up, eye: true, blind: !!(thrust && t >= thrust.t0) }); f.glow.push({ x: q[0], y: q[1], r: s * 0.8, T: Tn }); continue; }
      if (ob.holder) { const h = own[ob.holder] || ob.holder, [who, sd] = h.split(':'), a = fr.a[who]; if (!a) continue; const hp = a.s.pts['hand' + (sd || 'R')], el = a.s.pts['el' + (sd || 'R')], H = Tr.H(who);
        const d = [hp[0] - el[0], hp[1] - el[1], hp[2] - el[2]], n = Math.hypot(...d) || 1, up = [d[0] / n * 0.3, 0.7 + d[1] / n * 0.3, d[2] / n * 0.3], L = ob.kind === 'spear' ? 1.15 * H : 0.2 * H;
        const qa = pr([hp[0] - up[0] * L * 0.3, hp[1] - up[1] * L * 0.3, hp[2] - up[2] * L * 0.3]), qb = pr([hp[0] + up[0] * L * 0.7, hp[1] + up[1] * L * 0.7, hp[2] + up[2] * L * 0.7]); if (qa && qb) f.props.push({ a: qa, b: qb, w: 2.5 }); continue; }
      if (ob.kind === 'stake' && ob.touches) { const hs = ob.touches.map(w => fr.a[w]).filter(Boolean).map(a => a.s.pts.handR), cpl = (S.authored.couplings || []).find(c => c.to === oid && c.from === ob.touches[0]);
        const held = cpl && t >= cpl.t0 && t <= (cpl.t1 || 1e9);
        if (held && hs.length >= 2) { let a = hs[0], b = hs[0], dm = 0; for (const x of hs) for (const y of hs) { const d = Math.hypot(x[0] - y[0], x[2] - y[2]); if (d > dm) { dm = d; a = x; b = y; } }
          const tip = markAt(objs.polyphemus || ob, t), da = Math.hypot(a[0] - tip[0], a[2] - tip[2]), db = Math.hypot(b[0] - tip[0], b[2] - tip[2]), [near, far] = da < db ? [a, b] : [b, a];
          const ext = [near[0] + (near[0] - far[0]) * 0.35, near[1] + (near[1] - far[1]) * 0.35, near[2] + (near[2] - far[2]) * 0.35], qa = pr(far), qb = pr(ext);
          if (qa && qb) f.props.push({ a: qa, b: qb, w: 5, c: '#8b6b3e', glow: !!(glow && t >= glow.t0 && (!thrust || t < thrust.t0 + 3)) }); }
        else { const p = markAt(ob, t), q = pr(p), q2 = pr([p[0] + 60, p[1], p[2] + 10]); if (q && q2) f.props.push({ a: q, b: q2, w: 5, c: '#6b4b2e' }); }
        f.glow.push({ x: f.props.length ? f.props[f.props.length - 1].b[0] : 0, y: f.props.length ? f.props[f.props.length - 1].b[1] : 0, r: 0.05, T: Tn }); continue; }
      if (ob.at && (ob.material === 'fire' || Tn > 0.05)) { const q = pr(markAt(ob, t)); if (q) f.glow.push({ x: q[0], y: q[1], r: 0.12, T: Tn + (ob.material === 'fire' ? 0.6 : 0) }); } }
    /* why: the hottest figure's chain */
    if (hot) { const w = E.why(hot, t); f.why = Score.short(hot) + ': ' + (w.chain.length ? w.chain.slice(0, 4).map(c => c.kind + (c.label ? ' (' + c.label.slice(0, 40) + ')' : '')).join(' / ') : 'nothing authored'); }
    /* the needles: the coupled units when the scene has them, else the homeostat's four essential variables against their bands */
    if (coupled) f.needles = coupled.units.map((u, k) => { const x = coupled.x[k][Math.min(coupled.x[k].length - 1, Math.round(t * coupled.hz))]; return { label: u.slice(0, 5), v: (x + 1) / 2, band: u === 'CREW' ? [0, (0.55 + 1) / 2] : null, out: u === 'CREW' && x > 0.55 && (!thrust || t < thrust.t0) }; });
    else f.needles = ['H1', 'H2', 'H3', 'H4'].map(k => { const b = bands[k].band, top = Math.max(b[1] * 2, 1e-3), v = es.series[k][i]; return { label: { H1: 'MOTN', H2: 'CAUS', H3: 'CNTR', H4: 'VIAB' }[k], v: v / top, band: [b[0] / top, b[1] / top], out: v < b[0] || v > b[1] }; });
    frames.push(f); }
  return { M, frames, title: sid + ' ' + (o.label || ''), es, m };
}
/* the voice on the clock: each clip of the recording laid at its place (as tools/export-odyssey.js lays it), as a WAV */
function voiceWav(M, sid, seconds, out, from) {
  const SR = 48000, file = path.join(ROOT, 'odyssey/take/voice', sid + '.m4a'); if (!fs.existsSync(file)) return null;
  const raw = execFileSync(FF, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 }), v = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const n = Math.round(seconds * SR), o = new Float32Array(n);
  for (const c of M.clips || []) { const a = Math.round((c.at - from) * SR), s = Math.round(c.start * SR), d = Math.round(c.dur * SR); for (let i = 0; i < d; i++) { const k = a + i; if (k >= 0 && k < n && s + i < v.length) o[k] += v[s + i]; } }
  const buf = Buffer.alloc(44 + n * 2); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(o[i] * 0.95 * 32767))), 44 + i * 2);
  fs.writeFileSync(out, buf); return out;
}
async function render(sid, o) {
  const B = build(sid, o), [W, H] = (o.size || '640x360').split('x').map(Number), name = o.name || 'previz-' + sid;
  const scratch = path.join('/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/previz', name); fs.rmSync(scratch, { recursive: true, force: true }); fs.mkdirSync(scratch, { recursive: true });
  const { chromium } = require('playwright'); const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent('<html><body style="margin:0;background:#000"><canvas id="c" width="' + W + '" height="' + H + '"></canvas></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'previz-draw.js'), 'utf8') });
  const D = { title: B.title, dark: !o.light };
  for (let k = 0; k < B.frames.length; k += 36) {
    const batch = B.frames.slice(k, k + 36), urls = await page.evaluate(({ D, batch }) => { const c = document.getElementById('c'), g = c.getContext('2d'); return batch.map(f => { PervizDraw.frame(g, c.width, c.height, D, f); return c.toDataURL('image/jpeg', 0.86); }); }, { D, batch });
    urls.forEach((u, j) => fs.writeFileSync(path.join(scratch, String(k + j).padStart(5, '0') + '.jpg'), Buffer.from(u.split(',')[1], 'base64'))); }
  await browser.close();
  const outDir = path.join(ROOT, 'odyssey/perform/media'); fs.mkdirSync(outDir, { recursive: true });
  const from = o.from || 0, seconds = B.frames.length / 12, wav = voiceWav(B.M, sid, seconds, path.join(scratch, 'voice.wav'), from), mp4 = path.join(outDir, name + '.mp4');
  execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(scratch, '%05d.jpg'), ...(wav ? ['-i', wav, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '64k'] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', String(o.crf || 30), '-pix_fmt', 'yuv420p', '-r', '12', '-t', seconds.toFixed(3), '-movflags', '+faststart', mp4]);
  const poster = B.frames[Math.floor(B.frames.length * (o.posterAt != null ? o.posterAt : 0.5))];
  fs.copyFileSync(path.join(scratch, String(B.frames.indexOf(poster)).padStart(5, '0') + '.jpg'), path.join(outDir, name + '.jpg'));
  return { mp4, frames: B.frames.length, bytes: fs.statSync(mp4).size, scratch };
}
module.exports = { build, render, voiceWav };
if (require.main === module) (async () => {
  const sheet = P.J(opt('sheet', P.sheetF(sid, ''))), score = P.J(opt('score', P.scoreF(sid, '')));
  const r = await render(sid, { sheet, score, name: opt('name', null), size: opt('size', '640x360'), from: opt('from', null) != null ? +opt('from') : 0, to: opt('to', null) != null ? +opt('to') : null, light: args.includes('--light'), label: opt('label', ''), crf: opt('crf', 30) });
  console.log('previz', path.relative(ROOT, r.mp4), r.frames, 'frames', (r.bytes / 1048576).toFixed(2), 'MB; frames in', r.scratch);
})().catch(e => { console.error(e); process.exit(1); });

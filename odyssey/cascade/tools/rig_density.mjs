#!/usr/bin/env node
/* odyssey/cascade/tools/rig_density.mjs — the acting density of a scene computed from the rig desk graph, in about a second: every
   rig's director props resolved by Cascade's PropAnimator at every drawing, the figure posed by the rig's own kinematics (lib/rig.ts,
   the code project.MinifigRig runs), in frame or not by the graph's shot camera, and counted by tools/choreograph.js's rule (seven
   points on the body, moving if one moved more than 0.5% of the figure's height since the drawing before). The fast pre-check
   before a render; the film's own measure is tools/choreograph.js density (the take in the page, about 15 minutes).

     node tools/rig_density.mjs OD-B12-S03 [--graph file.cascade] [--json out.json] [--compare]

   --score    writes each figure's motion per drawing into assets/rig/<scene>/score.json as a metric lane (project.ScoreLanes).
   --compare  also prints the page's measure (odyssey/choreo/density/<scene>.json, `after`) and, when tools/rig_probe.cjs has run,
              the density of the take's own poses, figure by figure, with the rig's. */
import fs from 'node:fs';
import path from 'node:path';
import { loadDesk, directorOf, cameraOf, HERE, ROOT } from './rig_graph.mjs';
import { poseAt, inFrame, density } from '../lib/rig.ts';

export function rigDensity(sid, graphFile, { from = 0, to = Infinity } = {}) {
  const desk = loadDesk(sid, graphFile), S0 = desk.rigs[0].S, N = Math.floor(S0.total * 12 + 1e-6), frames = [];
  const holds = desk.rigs.flatMap(r => (r.S.holds || []).map(h => ({ actor: r.actor, t0: h.t0, t1: h.t1 })));
  for (let i = 0; i < N; i++) {
    const t = i / 12; if (t < from - 1e-6 || t > to + 1e-6) continue;
    desk.at(i + 1); const cam = cameraOf(desk), actors = {};
    for (const r of desk.rigs) { const P = poseAt(r.S, t, directorOf(r.node)); if (!P || !P.vis) continue;
      actors[r.actor] = { on: inFrame(cam, P.head) || inFrame(cam, P.hips), H: r.S.H, p: P.pts }; }
    frames.push({ t, actors });
  }
  return { density: density(frames, holds), frames };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a)), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
  if (!sid) { console.log('node tools/rig_density.mjs OD-Bxx-Syy [--graph g.cascade] [--json out.json] [--compare]'); process.exit(1); }
  const t0 = Date.now(), { density: D } = rigDensity(sid, opt('graph', null)), ms = Date.now() - t0;
  const pct = v => v == null ? '  -  ' : (v * 100).toFixed(0).padStart(4) + '%';
  let page = null, probe = null;
  if (args.includes('--compare')) {
    const pf = path.join(ROOT, `odyssey/choreo/density/${sid}.json`); if (fs.existsSync(pf)) page = JSON.parse(fs.readFileSync(pf, 'utf8')).after;
    const qf = path.join(HERE, `renders/rig/${sid}.probe.json`);
    if (fs.existsSync(qf)) { const C = JSON.parse(fs.readFileSync(path.join(ROOT, `odyssey/choreo/${sid}.json`), 'utf8')), Q = JSON.parse(fs.readFileSync(qf, 'utf8')).poses;
      probe = density(Q.map(p => ({ t: p.t, actors: Object.fromEntries(Object.entries(p.actors).map(([id, a]) => [id, { on: a.on, H: a.H, p: a.p }])) })), C.holds || []); }
  }
  console.log(`${sid}: rig density in ${ms} ms: mean ${pct(D.mean)}, worst still ${D.worstFrozen} s, ${D.over80}/${D.count} over 80%` + (page ? `  | page (choreograph.js) mean ${pct(page.mean)}` : '') + (probe ? `  | take's poses mean ${pct(probe.mean)}` : ''));
  console.log('  actor'.padEnd(24), 'rig  still(s) at'.padEnd(24), page ? 'page still(s) at'.padEnd(24) : '', probe ? 'take still(s)' : '');
  for (const [id, a] of Object.entries(D.actors)) {
    const p = page && page.actors[id], q = probe && probe.actors[id];
    console.log('  ' + id.padEnd(22), (pct(a.moving) + ' ' + a.longestFrozen.toFixed(2) + ' @' + a.frozenAt).padEnd(24), p ? (pct(p.moving) + ' ' + p.longestFrozen.toFixed(2) + ' @' + p.frozenAt).padEnd(24) : '', q ? pct(q.moving) + ' ' + q.longestFrozen.toFixed(2) + ' @' + q.frozenAt : '');
  }
  /* --score: each figure's motion per drawing (the largest of the seven points' moves, in figure heights) as a metric lane in the
     scene's score, for project.ScoreLanes to show under the previz; raw data, not a target */
  if (args.includes('--score')) { const { frames } = rigDensity(sid, opt('graph', null)), sf = path.join(HERE, `assets/rig/${sid}/score.json`), SC = JSON.parse(fs.readFileSync(sf, 'utf8'));
    const ids = [...new Set(frames.flatMap(f => Object.keys(f.actors)))], lanes = ids.map(id => { const v = []; let prev = null;
      for (const f of frames) { const a = f.actors[id]; v.push(a && prev ? Math.round(Math.max(...a.p.map((x, i) => Math.hypot(x[0] - prev.p[i][0], x[1] - prev.p[i][1], x[2] - prev.p[i][2]))) / a.H * 1e4) / 1e4 : 0); prev = a || null; }
      return { id: 'motion:' + id, label: 'motion ' + id, kind: 'metric', hz: 12, values: v, range: [0, 0.02], by: 'tools/rig_density.mjs --score' }; });
    SC.lanes = SC.lanes.filter(l => !l.id.startsWith('motion:')).concat(lanes); fs.writeFileSync(sf, JSON.stringify(SC)); console.log('score: motion lanes for', ids.length, 'figures ->', path.relative(HERE, sf)); }
  if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify({ scene: sid, measured: new Date().toISOString().slice(0, 10), by: 'odyssey/cascade/tools/rig_density.mjs', ms, rule: 'tools/choreograph.js density on the rig desk\'s poses', density: D, page, probe }, null, 1));
}

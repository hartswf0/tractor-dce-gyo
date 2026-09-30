#!/usr/bin/env node
/* odyssey/cascade/tools/rig_report.mjs — the rig desk's facts for the page (media/rigdesk.json): per scene, the round trip (import
   then export with the director's layer cleared writes nothing; export of the graph as it stands matches the sheet), the density from
   the rig with and without the director's layer beside the page's own measure (raw data, not a target), and how long each took. */
import fs from 'node:fs';
import path from 'node:path';
import { HERE, ROOT } from './rig_graph.mjs';
import { exportDesk } from './rig_export.mjs';
import { rigDensity } from './rig_density.mjs';

const out = { measured: new Date().toISOString().slice(0, 10), scenes: {} };
for (const sid of ['OD-B01-S03', 'OD-B12-S03', 'OD-B22-S01']) {
  const g = path.join(HERE, `rig-${sid}.cascade`), d = JSON.parse(fs.readFileSync(g, 'utf8')), W = new Set(['wRoot', 'wTorso', 'wHead', 'wArmR', 'wArmL', 'wLegs']);
  for (const n of d.nodes) if (n.module === 'project.MinifigRig') for (const k of Object.keys(n.props)) if (!['sheet', 'time', 'solo'].includes(k)) n.props[k] = W.has(k) ? 1 : 0;
  const bare = path.join(HERE, `.rig-report-${sid}.cascade`); fs.writeFileSync(bare, JSON.stringify(d));
  try {
    /* the bare graph exported against a sheet with no desk lanes is the import round trip: nothing to write */
    const C = JSON.parse(fs.readFileSync(path.join(ROOT, `odyssey/choreo/${sid}.json`), 'utf8')), desk = (C.overrides && C.overrides._desk) || null;
    const eb = exportDesk(sid, bare), noOp = Object.keys(eb.lanesOf).length === 0, ed = exportDesk(sid);
    let t = Date.now(); const db = rigDensity(sid, bare).density, tb = Date.now() - t; t = Date.now(); const dd = rigDensity(sid).density, td = Date.now() - t;
    const pf = path.join(ROOT, `odyssey/choreo/density/${sid}.json`), page = fs.existsSync(pf) ? JSON.parse(fs.readFileSync(pf, 'utf8')).after : null;
    const pick = D => ({ mean: D.mean, worstStill: D.worstFrozen, actors: Object.fromEntries(Object.entries(D.actors).map(([k, v]) => [k, { moving: v.moving, longestStill: v.longestFrozen, at: v.frozenAt }])) });
    out.scenes[sid] = { roundTripNoOp: noOp, sheetInStep: !ed.changed, deskLanes: desk ? desk.lanes : {}, densityMs: [tb, td], rigBare: pick(db), rigDirector: pick(dd), pageBeforeDesk: page && pick(page) };
    console.log(sid, 'round trip no-op', noOp, '· sheet in step', !ed.changed, '· density', db.mean, '->', dd.mean, 'page', page && page.mean, `(${tb} ms, ${td} ms)`);
  } finally { fs.rmSync(bare, { force: true }); }
}
const pv = path.join(HERE, 'media/previz.json'); if (fs.existsSync(pv)) out.previz = JSON.parse(fs.readFileSync(pv, 'utf8'));
fs.writeFileSync(path.join(HERE, 'media/rigdesk.json'), JSON.stringify(out, null, 1));

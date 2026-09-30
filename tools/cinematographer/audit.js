/* tools/cinematographer/audit.js — for tools/cinematographer/dev.js (`js tools/cinematographer/audit.js`): the take's old cameras (the
   shot camera at every drawing, as tools/perform/probe.js read it: odyssey/score/cameras/<scene>.json) against the plan's, once a
   second, through the solver's own checks: is the lens inside geometry, is each head in the frame and seen. Writes <dir>/audit.json. */
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, dir) => {
  const sid = await page.evaluate(() => OdysseyTake.info().scene), ROOT = path.resolve(__dirname, '..', '..');
  const f = path.join(ROOT, 'odyssey/score/cameras', sid + '.json'); if (!fs.existsSync(f)) return 'no probe cameras for ' + sid;
  const P = JSON.parse(fs.readFileSync(f, 'utf8')), total = await page.evaluate(() => OdysseyTake.info().total), runs = P.runs;
  const at = t => { let r = runs[0]; for (const x of runs) if (x.t <= t + 1e-6) r = x; return r; };
  const ts = []; for (let t = 0.5; t < total; t += 1) ts.push(+t.toFixed(2));
  const before = await page.evaluate(c => OdysseyTake.cineDraw(c), ts.map(t => { const r = at(t); return { t, pos: r.pos, dir: r.dir, fov: r.fov }; }));
  const after = await page.evaluate(c => OdysseyTake.cineDraw(c), ts.map(t => ({ t })));
  const sum = A => { const n = A.length, o = { samples: n, inside: A.filter(a => a.inside).length, seen: {}, inFrame: {} }; for (const a of A) for (const [id, w] of Object.entries(a.who)) { o.inFrame[id] = (o.inFrame[id] || 0) + (w.inFrame ? 1 : 0); o.seen[id] = (o.seen[id] || 0) + (w.seen ? 1 : 0); } return o; };
  const out = { scene: sid, rule: 'once a second: L1 (the lens inside geometry) and, per figure, its head (a creature its eye) in the frame and seen', before: sum(before), after: sum(after), samples: { before, after } };
  fs.writeFileSync(path.join(dir, 'audit.json'), JSON.stringify(out, null, 1)); return { before: out.before, after: out.after };
};

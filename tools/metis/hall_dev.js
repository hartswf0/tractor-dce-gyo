/* tools/metis/hall_dev.js — dev stills and the light's cost for the hall's causal map, run inside tools/cinematographer/dev.js
   (`js tools/metis/hall_dev.js`) on a prepared take of OD-B21-S07 or OD-B22-S01. HALL_DEV (a JSON file path, env; else <dir>/hall_dev_spec.json) lists the stills:
     [{name, t, pos: [x, yup, z], target: [x, yup, z], fov, hide: [labels], show: [labels], noLight: true}]
   in the kit's frame (as tools/metis/hall.py writes places); each is drawn with the take at t from that camera and written to
   <dir>/<name>.jpg. {cost: [t, ...]} times the frames with the practicals and with them switched off. */
'use strict';
const fs = require('fs'), path = require('path');
module.exports = async (page, dir) => {
  const spec = JSON.parse(fs.readFileSync(process.env.HALL_DEV || path.join(dir, 'hall_dev_spec.json'), 'utf8')), out = [];
  for (const s of spec.stills || []) {
    const r = await page.evaluate(async s => {
      const A = OdysseyFilm.asset(), c = A.center, k = A.scale, F = p => [(p[0] - c[0]) * k, (p[1] - c[1]) * k, (-p[2] - c[2]) * k];
      const cam = { pos: F(s.pos), target: F(s.target), fov: s.fov || 40 };
      /* the take draws the frame with the caller's camera; pieces hidden or shown for this drawing only, by label, through the hall's own hook */
      window.__hallOverride = { hide: s.hide || [], show: s.show || [], noLight: !!s.noLight };
      const t0 = performance.now(); const f = await OdysseyTake.frame(s.t, { quality: 0.88, cam, captions: s.captions !== false }); const ms = performance.now() - t0;
      window.__hallOverride = null; return { jpeg: f.jpeg, ms, shot: f.shot };
    }, s);
    fs.writeFileSync(path.join(dir, s.name + '.jpg'), Buffer.from(r.jpeg, 'base64')); out.push({ name: s.name, t: s.t, ms: Math.round(r.ms) });
  }
  if (spec.cost) {
    const time = async (t, noLight) => page.evaluate(async ({ t, noLight }) => { window.__hallOverride = { noLight, hide: [], show: [] }; const t0 = performance.now(); await OdysseyTake.frame(t, { quality: 0.88 }); const ms = performance.now() - t0; window.__hallOverride = null; return ms; }, { t, noLight });
    const res = { lit: [], dark: [] };
    for (const t of spec.cost) { res.lit.push(Math.round(await time(t, false))); res.dark.push(Math.round(await time(t, true))); }
    out.push({ cost: res });
  }
  fs.writeFileSync(path.join(dir, 'hall_dev.json'), JSON.stringify(out, null, 1));
  return out;
};

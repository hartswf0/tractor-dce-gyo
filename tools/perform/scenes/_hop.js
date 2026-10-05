/* tools/perform/scenes/_hop.js — what the Hearts of Plastic episodes (OD-B26-S0N, tools/making/hop_script.py) add to the conversation
   grammar of _making2.js: the slates (the First AD chops the clapperboard on the clap, caused by her own slate line; the clap a SOUND)
   and the dailies (the crew turn to the camera's monitor while a real take plays: a SIGHT caused by the line before it, a HOLD each). */
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function hopEvents(sid, M, G_, o) {
  const { q, hold, I, St } = G_, F = o.ad || 'firstad', watchers = o.watchers || ['director', 'firstad', 'cinematographer'];
  const hop = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../odyssey/take/making/' + sid + '.json'), 'utf8')).hop;
  hop.clap.forEach((t, j) => { const slate = M.clips.filter(x => x.voice === F && x.at < t).pop();
    I({ id: 'clap' + j, actor: F, kind: 'GESTURE', target: o.camAt, t0: q(t - 0.5), t1: q(t + 0.5), label: 'the clapperboard, in front of the lens', params: { shape: 'chop', at: q(t - 0.05), side: 'L', amp: 1.0, hold: 0.3 }, because: slate ? [{ id: 'say' + slate.gi }] : [] });
    St({ id: 'sClap' + j, t0: q(t), t1: q(t + 0.3), kind: 'SOUND', label: 'the clap', actor: F, because: [{ id: 'clap' + j }] }); });
  hop.dailies.forEach((d, j) => { const cause = M.clips.filter(x => x.at < d.start).pop();
    St({ id: 'sDaily' + j, t0: q(d.start), t1: q(d.start + 0.5), kind: 'SIGHT', label: 'the dailies on the monitor', because: cause ? [{ id: 'say' + cause.gi }] : [] });
    for (const a of watchers) hold(a, q(d.start + 0.1), q(d.start + d.dur), 'watching the take on the monitor', [[o.camAt, d.dur]], { id: 'hD' + j + a.slice(0, 3), because: [{ id: 'sDaily' + j }] }); });
  return hop;
};

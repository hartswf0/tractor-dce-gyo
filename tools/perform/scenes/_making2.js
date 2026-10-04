/* tools/perform/scenes/_making2.js — part two of the making-of (OD-B25-S05..S08, "Hearts of Plastic", odyssey/writers-room/BIBLE.md):
   a conversation laid out from the take, on _making.js's grammar. Every line is said by its speaker to its addressee and heard by
   everyone present (a nod from the one it is for); a line from the loudspeaker (voice 'pa', a NARRATION: the mandates, never seen)
   is a SOUND that turns every head up to the speaker; every walk the take has between keys is owned, caused by the last line or sound
   before it. The scene's module adds its own business (the broom, the glass, the slow turn) and returns the score. */
'use strict';
module.exports = function converse(M, X, o) {
  const G = require('./_making.js')(M, X), { q, T, K, end, say, hear, walk, I, St } = G;
  const lines = M.clips.filter(c => c.kind === 'DIALOGUE' || c.kind === 'NARRATION').sort((a, b) => a.at - b.at);
  const present = o.present, speaker = o.speaker;
  const causeOf = c => c.voice === 'pa' ? 'pa' + c.gi : 'say' + c.gi;
  for (const c of lines) {
    if (c.voice === 'pa') {
      St({ id: 'pa' + c.gi, t0: q(c.at), t1: q(c.at + 0.6), kind: 'SOUND', label: 'the loudspeaker: "' + c.caption.slice(0, 60) + '"', because: o.paBecause && o.paBecause[c.gi] ? [{ id: o.paBecause[c.gi] }] : [] });
      for (const a of present) I({ id: 'up' + c.gi + a.slice(0, 3), actor: a, kind: 'ATTEND', target: speaker, t0: q(c.at + 0.25), t1: q(end(c) + 0.3), label: 'looks up at the speaker', because: [{ id: 'pa' + c.gi }] });
      continue;
    }
    const sh = (o.shapes && o.shapes[c.gi]) || ['open', 'describe', 'point'];
    say(c.gi, { shapes: sh, maxBeats: 1, target: c.addressee || (o.lens || undefined), side: (o.side && o.side[c.gi]) || 'R', because: o.because && o.because[c.gi] ? [{ id: o.because[c.gi] }] : [] });
    for (const a of present) if (a !== c.voice && !(o.deaf && o.deaf[c.gi] && o.deaf[c.gi].includes(a))) hear(a, c.gi, { id: 'h' + c.gi + a.slice(0, 3), nod: a === c.addressee });
  }
  for (const k of M.keys) {
    if (!k.moves || !k.win) continue;
    const prev = lines.filter(c => end(c) <= k.win[0] + 0.05).pop(), next = lines.find(c => c.at >= k.win[0] - 0.05);
    for (const a of Object.keys(k.moves)) {
      if (!present.includes(a)) continue;
      const tg = (o.walkTo && o.walkTo[k.id] && o.walkTo[k.id][a]) || (next && next.voice !== 'pa' ? (next.voice === a ? next.addressee : next.voice) : null) || speaker;
      walk(a, k.id, tg || speaker, (o.walkLabel && o.walkLabel[k.id] && o.walkLabel[k.id][a]) || 'to the next mark', prev ? [{ id: (o.walkBecause && o.walkBecause[k.id]) || causeOf(prev) }] : [], 'go' + k.id + a.slice(0, 3));
    }
  }
  return G;
};

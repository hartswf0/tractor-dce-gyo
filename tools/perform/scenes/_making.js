/* tools/perform/scenes/_making.js — what the four scenes of the making-of film (OD-B25-S01..S04, the LEGO film studio) share: the
   cast, and the small grammar of a conversation in the studio. Each line is said (DECLARE on the line's stresses, the head on the one
   addressed), heard (LISTEN, the head on the voice, a nod as it ends) and watched (a HOLD with its reason, the looks on the voice).
   The scene's module lays its own acts over this: the walks (APPROACH owns the take's walk between keys), the work, the notices.
   Every movement is caused: by a line (the clip's VOICE event 'v<gi>'), by a stimulus the module names, or by another body's act. */
'use strict';
const NAMES = { director: 'the director', agent: 'the agent', cinematographer: 'the cinematographer', odysseus: 'Odysseus', examiner: 'the examiner', firstad: 'the First AD', sweeper: 'the sweeper',
  polyphemus: 'Polyphemus', irus: 'Irus', antinous: 'Antinous', achilles: 'Achilles', anticleia: 'Anticleia', calypso: 'Calypso' };
module.exports = function making(M, X) {
  const q = t => Math.round(t * 12) / 12, T = M.total, K = id => M.keys.find(k => k.id === id);
  const clip = gi => M.clips.find(c => c.gi === gi);
  const intents = [], holds = [], stimuli = [], I = o => (intents.push(o), o.id), H = o => (holds.push(o), o.id), St = o => (stimuli.push(o), o.id);
  const end = c => q(c.at + c.dur);
  /* the line said: gestures on its stresses, the head on whom it is for */
  function say(gi, o = {}) {
    const c = clip(gi); if (!c) return null;
    return I({ id: o.id || 'say' + gi, actor: c.voice, kind: o.kind || 'DECLARE', target: o.target !== undefined ? o.target : (c.addressee || undefined), utterance: gi, t0: q(c.at - 0.3), t1: end(c),
      label: o.label || '"' + c.caption.slice(0, 60) + '"', params: Object.assign({ shapes: o.shapes || ['open', 'describe', 'point'], maxBeats: o.maxBeats || 1, side: o.side || 'R', amp: o.amp || 0.85 }, o.params || {}),
      because: [{ id: 'v' + gi, rel: 'realises' }].concat(o.because || []) });
  }
  /* heard: the listener's head on the voice, a nod where the line ends (unless nod: false) */
  function hear(actor, gi, o = {}) {
    const c = clip(gi); if (!c) return null;
    return I({ id: o.id || 'hear' + gi + actor.slice(0, 3), actor, kind: 'LISTEN', target: c.voice, t0: q(c.at + 0.1), t1: q(c.at + c.dur + (o.tail || 0.4)),
      label: o.label || 'listens to ' + NAMES[c.voice], params: { nods: o.nod === false ? [] : [q(c.at + c.dur - 0.25)] }, because: [{ id: 'v' + gi }].concat(o.because || []) });
  }
  /* a still body with its reason and its looks: [[target, seconds], ...] */
  function hold(actor, t0, t1, reason, look, o = {}) {
    if (t1 - t0 < 0.25) return null;
    return H({ id: o.id || 'h' + actor.slice(0, 3) + Math.round(t0 * 10), actor, t0: q(t0), t1: q(t1), reason, params: Object.assign({ look: look || [], weight: o.weight !== false }, o.still ? { still: true } : {}), because: o.because || [] });
  }
  /* the take's walk between keys, owned as an intent */
  function walk(actor, key, target, label, because, id) {
    const k = K(key); if (!k || !k.moves || !k.moves[actor]) return null;
    return I({ id: id || 'go' + key + actor.slice(0, 3), actor, kind: 'APPROACH', key, t0: k.win[0], t1: k.win[1], target, label, because });
  }
  return { q, T, K, clip, end, intents, holds, stimuli, I, H, St, say, hear, hold, walk, NAMES };
};
module.exports.NAMES = NAMES;

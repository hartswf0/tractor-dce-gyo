#!/usr/bin/env python3
"""tools/making/shots.py — the making-of film's shots, edited by hand over the cinematographer's plan.

    python3 tools/making/shots.py OD-B25-S01 [...]      (after tools/cinematographer/plan.js; the solver then finds each camera)

plan.js cuts these scenes on their heat, and the agent's typing (a contact on every keystroke) made the openings a run of 1.6 s
wides. The edit here follows the conversation instead, the way the earlier hand-edited plans do (rule 'hand: ...'): a wide to open
each scene and wherever bodies cross the studio between lines; the one who speaks on a close or a mid (alternating, so two shots on
one face never share a size), a long line split into the speaker and then the one it is said to; and the scene's own moments
(the frozen animatic, Odysseus's line and his turn to the horse, the dark, the split block, the camera turned on the crew) as their
own shots. The plan's other fields are kept; plan.js's own shots are kept under `planned` for comparison."""
import json, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]
PRINC = {'OD-B25-S01': ['director', 'agent', 'odysseus', 'cinematographer'], 'OD-B25-S02': ['director', 'agent', 'cinematographer', 'odysseus'],
         'OD-B25-S03': ['agent', 'director', 'cinematographer'], 'OD-B25-S04': ['examiner', 'director', 'agent', 'cinematographer', 'odysseus']}
# the scene's own moments: (t0 or a line's gi as 'g<gi>' / 'g<gi>+' for its end, t1 likewise, size, subjects, why)
SPECIAL = {
 'OD-B25-S01': [(0, 'g1', 'WIDE', ['odysseus', 'director', 'cinematographer'], 'the animatic: action is called and nobody on the little set moves; the set, the camera and the director in one frame'),
                ('g7', 'g8', 'MID', ['director', 'odysseus'], 'action called again: the director and, past him, the actor who now has his cue'),
                ('g8', 'g8+', 'MID', ['odysseus'], 'Odysseus says the first sentence of the Odyssey: the actor acting, on his own'),
                ('g8+', 'g9', 'WIDE', ['odysseus', 'director', 'agent'], 'the turn to the horse, seen whole, and the director seeing it'),
                ('g10', 'g10+', 'CLOSE', ['agent'], 'the answer: the cause, on the agent\'s face')],
 'OD-B25-S02': [(0, 'g1', 'MID', ['cinematographer', 'odysseus'], 'the camera hard against the ram, the cinematographer at the eyepiece'),
                ('g6+', 'g7', 'WIDE', ['agent', 'odysseus', 'director'], 'night: the render farm running, the director asleep in his chair'),
                ('g8', 'g8+', 'MID', ['odysseus', 'agent'], 'the actor asks: the two of them by the towers'),
                ('K5', 'g10', 'WIDE', ['agent', 'odysseus'], 'the power goes: the dark, the red lamps'),
                ('K6', 'g12', 'WIDE', ['agent', 'odysseus'], 'the power back: the towers lit again')],
 'OD-B25-S03': [(0, 'g1', 'WIDE', ['agent', 'director', 'cinematographer'], 'the block of the player against the 95 MB wall, too tall for the gate'),
                ('g3+', 'g4', 'MID', ['agent'], 'the block split: the agent carries one small brick through the gate')],
 'OD-B25-S04': [(0, 'g0+', 'MID', ['director', 'examiner'], 'the examiner at the ledger, the glass over the page, the director by her'),
                ('g9+', 'g11', 'MID', ['director', 'agent', 'examiner', 'odysseus'], 'the camera turned on the crew: the film is about them'),
                ('g11', 'end', 'WIDE', ['director', 'agent', 'examiner', 'odysseus'], 'action called on the crew itself: the last shot holds them, looking into the lens')],
}

def build(sid):
    tk = json.loads((REPO / 'odyssey/take/making' / (sid + '.json')).read_text())
    plan_f = REPO / 'tools/cinematographer/plans' / (sid + '.json'); P = json.loads(plan_f.read_text())
    M = json.loads((REPO / 'odyssey/choreo/marks' / (sid + '.json')).read_text())
    T = M['total']; segs = tk['voice']['segments']; keyT = {k['id']: k['t'] for k in M['keys']}
    keyAt = lambda t: max((k for k in M['keys'] if k['t'] <= t + 1e-6), key=lambda k: k['t'])['id']
    def tt(x):
        if isinstance(x, (int, float)): return float(x)
        if x == 'end': return T
        if x in keyT: return keyT[x]
        g = int(x[1:].rstrip('+')); s = segs[g]
        return s['start'] + s['dur'] + 0.25 if x.endswith('+') else s['start'] - 0.15
    shots = []
    def add(t0, t1, size, subj, why, line=None, kind=None):
        if t1 - t0 < 0.3: return
        shots.append(dict(t0=round(t0, 3), t1=round(t1, 3), kind=kind or ('WIDE' if size == 'WIDE' else 'HOT'), size=size, subjects=subj, primary=subj[0], aim='head',
                          line=line, angle='eye', lens='normal', beat=keyAt(t0 + 0.05), why=dict(cut='hand', rule='hand: ' + why)))
    # the conversation: each line on its speaker; the gaps (walks, acts) wide
    last = {}; t = 0.0
    for i, s in enumerate(segs):
        a = s['start'] - 0.15; b = segs[i + 1]['start'] - 0.15 if i + 1 < len(segs) else T
        e = s['start'] + s['dur'] + 0.25
        if a - t > 0.3: add(t, a, 'WIDE', [x for x in PRINC[sid] if x != 'examiner' or sid == 'OD-B25-S04'][:3], 'between the lines: the bodies that move, whole')
        who, to = s['voice'], s.get('addressee')
        size = 'MID' if last.get(who) == 'CLOSE' else 'CLOSE'
        if to and to in PRINC[sid] and s['dur'] > 5.5:
            mid = a + (e - a) * 0.62; add(a, mid, size, [who], f'{who} speaks: on the face that says it', [who, to])
            add(mid, e if b - e > 1.5 else b, 'MID', [to, who], f'what {who} says lands on {to}', [who, to], kind='REACT'); last[to] = 'MID'
        else:
            add(a, e if b - e > 1.5 else b, size, [who], f'{who} speaks: on the face that says it', [who, to] if to in PRINC[sid] else None)
        last[who] = size; t = e if b - e > 1.5 else b
    if T - t > 0.3: add(t, T, 'WIDE', PRINC[sid][:3], 'the scene ends on the studio')
    # the scene's own moments laid over the conversation
    for x0, x1, size, subj, why in SPECIAL.get(sid, []):
        a, b = tt(x0), tt(x1); keep = []
        for s in shots:
            if s['t1'] <= a + 1e-6 or s['t0'] >= b - 1e-6: keep.append(s); continue
            if s['t0'] < a: keep.append(dict(s, t1=round(a, 3)))
            if s['t1'] > b: keep.append(dict(s, t0=round(b, 3)))
        shots = keep; add(a, b, size, subj, why); shots.sort(key=lambda s: s['t0'])
    # no shot under a second: folded into the one before
    out = []
    for s in sorted(shots, key=lambda s: s['t0']):
        if out and s['t1'] - s['t0'] < 1.0: out[-1]['t1'] = s['t1']; continue
        if out and out[-1]['t1'] - out[-1]['t0'] < 1.0: s = dict(s, t0=out[-1]['t0']); out.pop()
        out.append(s)
    for i, s in enumerate(out): s['i'] = i
    if 'planned' not in P: P['planned'] = P['shots']
    P['shots'] = out; P['edited'] = 'by hand after plan.js (tools/making/shots.py): the conversation followed, the scene\'s moments as their own shots'
    plan_f.write_text(json.dumps(P, indent=1))
    print(sid, len(out), 'shots:', ' '.join(f"{s['t0']:.1f}{s['size'][0]}:{s['primary'][:4]}" for s in out))

if __name__ == '__main__':
    for sid in sys.argv[1:]: build(sid)

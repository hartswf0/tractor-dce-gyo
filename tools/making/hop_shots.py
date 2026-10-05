#!/usr/bin/env python3
"""tools/making/hop_shots.py — Hearts of Plastic: the episodes' shots, edited by hand over the cinematographer's plan (as
tools/making/shots.py does for the making-of studio), with what the episodes add: a creature that speaks is shot as a giant (low,
from below: his request, and plan.js R8), the slates are mids on the First AD and her clapperboard, the physical gags (the stone,
the ram) are mids and closes, never a far wide (the broom stroke read weakly in a wide), and a dailies window is a held mid of the
crew at the monitor (the real take is cut in over it by hop_film.py).

    python3 tools/making/hop_shots.py OD-B26-S01      (after tools/cinematographer/plan.js)"""
import json, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]
CREATURES = {'polyphemus'}
PRINC = {'OD-B26-S01': ['director', 'firstad', 'cinematographer', 'odysseus', 'polyphemus'],
         'OD-B26-S02': ['director', 'firstad', 'cinematographer', 'odysseus-as-beggar', 'irus', 'antinous'],
         'OD-B26-S03': ['director', 'firstad', 'cinematographer', 'odysseus', 'anticleia', 'achilles'],
         'OD-B26-S04': ['director', 'firstad', 'cinematographer', 'odysseus', 'calypso', 'crew-at-the-oars-1', 'crew-at-the-oars-2', 'crew-at-the-oars-3', 'crew-at-the-oars-5', 'the-sirens-4']}
# the episode's own moments over the conversation: (t0, t1, size, subjects, why, opts); t as seconds, 'g<gi>' (a line's start),
# 'g<gi>+' (its end), 'c<j>' (the j-th clap), 'd<j>' / 'd<j>+' (a dailies window), 'b<j>' / 'b<j>+' (a beat), 'end'
SPECIAL = {
 'OD-B26-S01': [
  (0, 'g0', 'WIDE', ['firstad', 'director', 'cinematographer'], 'cold open: the crew on the Cyclops\'s real set, the camera at a ram', dict(t1off=2.4)),
  ('g0', 'c0+', 'MID', ['firstad'], 'the slate: the AD and her clapperboard', dict(t0off=2.4)),
  ('g1', 'g1+', 'MID', ['director'], 'the one-word call from the chair', {}),
  ('b0', 'g2', 'MID', ['cinematographer', 'odysseus'], 'rolling: the cinematographer at the eyepiece, the lens in the ram', {}),
  ('g3', 'g3+', 'MID', ['cinematographer'], '"in the ram": the camera and the wool, in a mid, not a wide', {}),
  ('d0', 'd0+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g10', 'c1+', 'MID', ['firstad'], 'the slate', {}),
  ('d1', 'd1+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g15', 'g15+', 'MID', ['firstad', 'polyphemus'], 'the AD to the giant: his close-up', {}),
  ('c2', 'g19+', 'CLOSE', ['polyphemus'], 'his close-up, from below, as he asked: "Strangers, who are you?"', dict(kind='GIANT', angle='low', giant='polyphemus')),
  ('g22', 'c3+', 'MID', ['firstad'], 'the slate', {}),
  ('b1', 'b1', 'WIDE', ['polyphemus'], 'take one: the giant reaches for the stone beside the door (the key\'s camera: from the pen side, the giant in profile, the stone and the door)', dict(kind='WIDE', nogiant=True, t1off=1.9)),
  ('b1', 'g24', 'MID', ['cinematographer'], 'take one: on the cinematographer at his camera while the stone goes into the door (unseen: as it was)', dict(t0off=1.9)),
  ('g25', 'g25+', 'WIDE', ['polyphemus'], '"now it is in the door": the same frame, the stone in the door', dict(kind='WIDE', nogiant=True)),
  ('g27', 'g29+', 'MID', ['odysseus'], '"Nobody." "That\'s my name."', {}),
  ('g31', 'c4+', 'MID', ['firstad'], 'the slate: take two', {}),
  ('b2', 'b2+', 'WIDE', ['polyphemus'], 'take two: the stone carried into the door, seen whole (the key\'s camera, as take one)', dict(kind='WIDE', nogiant=True)),
  ('d2', 'd3+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g36', 'end', 'MID', ['director', 'cinematographer'], '"Keep it."', {}),
 ],
 'OD-B26-S02': [
  (0, 'b0', 'WIDE', ['firstad', 'director', 'cinematographer'], 'cold open: the crew in the megaron, the camera on the beggars\' marks', {}),
  ('b0', 'b0+', 'WIDE', ['odysseus-as-beggar', 'irus'], 'the two beggars walk in side by side (the key\'s camera, from the front)', dict(kind='WIDE')),
  ('g1', 'g1+', 'MID', ['director'], '"Which one is Irus?"', {}),
  ('g2', 'g4+', 'WIDE', ['irus', 'odysseus-as-beggar'], 'the two beggars in one frame from the front, the same figure twice, while each says who he is (the key\'s camera)', dict(kind='WIDE')),
  ('g10', 'c0+', 'MID', ['firstad'], 'the slate: take two', {}),
  ('g11', 'g13+', 'MID', ['antinous'], 'Antinous with the stool: which beggar?', {}),
  ('g14', 'g14+', 'MID', ['director'], 'the call', {}),
  ('b1', 'b1+', 'WIDE', ['antinous', 'odysseus-as-beggar'], 'the throw as take two had it, from the front (the key\'s camera): a third of a second', dict(kind='WIDE')),
  ('d0', 'd0+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g21', 'c1+', 'MID', ['firstad'], 'the slate: take three', {}),
  ('g22', 'g22+', 'MID', ['director'], 'the call', {}),
  ('b2', 'b2+', 'WIDE', ['antinous', 'odysseus-as-beggar'], 'take three: six tenths of a second, the smear bricks, from the front (the key\'s camera)', dict(kind='WIDE')),
  ('g23', 'g23+', 'CLOSE', ['odysseus-as-beggar'], '"I stand like a rock."', {}),
  ('d1', 'd1+', 'MID', ['director', 'firstad'], 'the dailies: the new take (cut in over this)', {}),
  ('g27', 'end', 'MID', ['irus', 'firstad'], '"Do I get a stool?"', {}),
 ],
 'OD-B26-S03': [
  (0, 'g0', 'WIDE', ['firstad', 'director', 'odysseus'], 'cold open: the crew on the shore of the dead', dict(t1off=2.4)),
  ('g0', 'c0+', 'MID', ['firstad'], 'the slate', dict(t0off=2.4)),
  ('g1', 'g1+', 'MID', ['director'], 'the call', {}),
  ('b0', 'g2+', 'MID', ['odysseus', 'anticleia'], 'the first embrace, in a mid: his arms through her', {}),
  ('g3', 'g3+', 'MID', ['director'], '"Again."', {}),
  ('g4', 'c1+', 'MID', ['firstad'], 'the slate', {}),
  ('b1', 'g5+', 'MID', ['anticleia', 'odysseus'], 'the second embrace: "Still dead."', {}),
  ('d0', 'd0+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g9', 'c2+', 'MID', ['firstad'], 'the slate', {}),
  ('b2', 'g10+', 'MID', ['odysseus', 'anticleia'], 'the third embrace: "I have eternity."', {}),
  ('g13', 'g13+', 'CLOSE', ['anticleia'], 'her patience, on her own face', {}),
  ('b3', 'b3+', 'MID', ['achilles'], 'Achilles comes up the shore in the visored helmet', {}),
  ('g15', 'g15+', 'CLOSE', ['achilles'], '"The fans want the helmet": the visor, close', {}),
  ('g16', 'g16+', 'MID', ['cinematographer', 'achilles'], '"I can\'t find his face."', {}),
  ('g21', 'g21+', 'CLOSE', ['achilles'], '"I am ACHILLES."', {}),
  ('d1', 'd1+', 'MID', ['odysseus', 'achilles'], 'the dailies, with their sound (cut in over this)', {}),
  ('g23', 'g23+', 'CLOSE', ['odysseus'], '"That\'s my voice."', {}),
  ('g27', 'end', 'MID', ['achilles', 'firstad'], '"The fans..."', {}),
 ],
 'OD-B26-S04': [
  (0, 'g0', 'WIDE', ['firstad', 'director', 'crew-at-the-oars-1'], 'cold open: the crew on the deck of the Sirens\' ship', dict(t1off=1.6)),
  ('g0', 'c0+', 'MID', ['firstad'], 'the slate', dict(t0off=1.6)),
  ('g1', 'g1+', 'MID', ['director'], 'the call', {}),
  ('b0', 'b0+', 'MID', ['crew-at-the-oars-1', 'crew-at-the-oars-3'], 'the rowers on one clock, in a mid', {}),
  ('g3', 'g3+', 'MID', ['crew-at-the-oars-2', 'crew-at-the-oars-4'], 'the clock described over the strokes', {}),
  ('g7', 'g7+', 'MID', ['the-sirens-4'], 'the Siren on the shore', {}),
  ('g12', 'c1+', 'MID', ['firstad'], 'the slate', {}),
  ('g13', 'g13+', 'MID', ['director'], 'the call', {}),
  ('b1', 'g14+', 'MID', ['odysseus'], 'he steps in, his face to the lens: her trees behind his head', {}),
  ('d0', 'd0+', 'MID', ['director', 'firstad'], 'the dailies (cut in over this)', {}),
  ('g19', 'g19+', 'CLOSE', ['calypso'], '"Seven years I kept him."', {}),
  ('b2', 'g22+', 'MID', ['calypso', 'odysseus'], 'a man\'s height apart: her face, her trees', {}),
  ('g23', 'g23+', 'MID', ['odysseus', 'calypso'], 'the bow on his back still across the frame', {}),
 ],
}

def build(sid):
    tk = json.loads((REPO / 'odyssey/take/making' / (sid + '.json')).read_text()); hop = tk['hop']
    plan_f = REPO / 'tools/cinematographer/plans' / (sid + '.json'); P = json.loads(plan_f.read_text())
    M = json.loads((REPO / 'odyssey/choreo/marks' / (sid + '.json')).read_text())
    T = M['total']; segs = tk['voice']['segments']
    keyAt = lambda t: max((k for k in M['keys'] if k['t'] <= t + 1e-6), key=lambda k: k['t'])['id']
    def tt(x):
        if isinstance(x, (int, float)): return float(x)
        if x == 'end': return T
        plus = x.endswith('+'); x = x.rstrip('+'); n = int(x[1:])
        if x[0] == 'g': s = segs[n]; return s['start'] + s['dur'] + 0.25 if plus else s['start'] - 0.15
        if x[0] == 'c': t = hop['clap'][n]; return t + 0.6 if plus else t - 0.6
        if x[0] in 'db': e = (hop['dailies'] if x[0] == 'd' else hop['beats'])[n]; return e['start'] + e['dur'] + 0.1 if plus else e['start'] - 0.1
    shots = []
    def add(t0, t1, size, subj, why, line=None, kind=None, **o):
        if t1 - t0 < 0.3: return
        giant = o.get('giant') or (subj[0] if subj[0] in CREATURES and not o.get('nogiant') else None)
        shots.append(dict(t0=round(t0, 3), t1=round(t1, 3), kind=kind or ('GIANT' if giant else 'WIDE' if size == 'WIDE' else 'HOT'), size=size, subjects=subj, primary=subj[0], aim='head',
                          line=line, angle=o.get('angle') or ('low' if giant else 'eye'), lens='wide' if giant and size == 'WIDE' else 'normal', beat=keyAt(t0 + 0.05),
                          why=dict(cut='hand', rule='hand: ' + why), **({'giant': giant} if giant else {})))
    last = {}; t = 0.0
    for i, s in enumerate(segs):
        a = s['start'] - 0.15; b = segs[i + 1]['start'] - 0.15 if i + 1 < len(segs) else T; e = s['start'] + s['dur'] + 0.25
        if a - t > 0.3: add(t, a, 'WIDE', PRINC[sid][:3], 'between the lines: the bodies that move, whole')
        who, to = s['voice'], s.get('addressee')
        size = 'MID' if last.get(who) == 'CLOSE' else 'CLOSE'
        lineP = [who, to] if to in PRINC[sid] and who not in CREATURES and to not in CREATURES else None
        if to and to in PRINC[sid] and s['dur'] > 5.5:
            mid = a + (e - a) * 0.62; add(a, mid, size, [who], f'{who} speaks: on the face that says it', lineP)
            add(mid, e if b - e > 1.5 else b, 'MID', [to, who], f'what {who} says lands on {to}', lineP, kind='REACT'); last[to] = 'MID'
        else: add(a, e if b - e > 1.5 else b, size, [who], f'{who} speaks: on the face that says it', lineP)
        last[who] = size; t = e if b - e > 1.5 else b
    if T - t > 0.3: add(t, T, 'WIDE', PRINC[sid][:3], 'the episode ends on the set')
    for x0, x1, size, subj, why, o in SPECIAL.get(sid, []):
        a, b = tt(x0) + o.get('t0off', 0), tt(x1) + o.get('t1off', 0); keep = []
        for s in shots:
            if s['t1'] <= a + 1e-6 or s['t0'] >= b - 1e-6: keep.append(s); continue
            if s['t0'] < a: keep.append(dict(s, t1=round(a, 3)))
            if s['t1'] > b: keep.append(dict(s, t0=round(b, 3)))
        shots = keep; add(a, b, size, subj, why, kind=o.get('kind'), angle=o.get('angle'), giant=o.get('giant'), nogiant=o.get('nogiant')); shots.sort(key=lambda s: s['t0'])
    out = []
    for s in sorted(shots, key=lambda s: s['t0']):
        if out and s['t1'] - s['t0'] < 1.0: out[-1]['t1'] = s['t1']; continue
        if out and out[-1]['t1'] - out[-1]['t0'] < 1.0: s = dict(s, t0=out[-1]['t0']); out.pop()
        out.append(s)
    for i, s in enumerate(out): s['i'] = i
    if 'planned' not in P: P['planned'] = P['shots']
    P['shots'] = out; P['edited'] = 'by hand after plan.js (tools/making/hop_shots.py): the conversation followed; the slates, the giant from below, the gags in mids and closes'
    plan_f.write_text(json.dumps(P, indent=1))
    print(sid, len(out), 'shots:', ' '.join(f"{s['t0']:.1f}{s['size'][0]}:{s['primary'][:4]}" for s in out))

if __name__ == '__main__':
    for sid in sys.argv[1:]: build(sid)

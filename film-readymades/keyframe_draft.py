"""Draft a scene's critical stills from its storyboard, for the keyframe gate to judge and a hand to finish.
Each beat of odyssey/previs/<scene>.json becomes a still: the beat's subject and object resolved to actors (or set pieces:
a troll, a giant), attention blocked (the subject turns to its object, everyone else to the subject), a camera rig chosen by
the shot's kind (establish and pullback wide from the front quarter, medium as a two-shot or a three-quarter single, ots over
the object's shoulder, push closer, track and orbit from the side), the subject alternately on the left and right thirds.
python film-readymades/keyframe_draft.py OD-B09-S09 [...]   writes odyssey/keyframes/<scene>.json unless one exists (--force)"""
import json, re, sys, math
from pathlib import Path
R = Path(__file__).parent; REPO = R.parent
slug = lambda n: re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')

def draft(sid):
    e = json.load(open(R / 'production' / f'odyssey-{sid.lower()}.json')); pv = json.load(open(REPO / 'odyssey/previs' / f'{sid}.json'))
    pre = f'odyssey-{sid.lower()}-'; acts = {a['kind'][len(pre):]: a for a in e['upgradeActors']}
    boxes = {pg['label']: pg['box'] for pg in e['pages'] if pg.get('box')}
    def who(i):
        if i is None or i < 0 or i >= len(pv['cast']): return None
        n = slug(pv['cast'][i]['name'])
        if n in acts: return n
        nm = pv['cast'][i]['name'].lower()
        for l in boxes:
            if l not in ('stage plate', 'the sea') and (l == nm or nm in l or l in nm): return 'piece:' + l
        return None
    def at(sub):
        if sub is None: return None
        if sub.startswith('piece:'): b = boxes[sub[6:]]; return [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2]
        a = acts[sub]; return [a['x'], a['z']]
    (x0, _, z0), (x1, y1, z1) = e['bounds']; ext = max(x1 - x0, z1 - z0) / 2
    base = [{'id': k, 'x': round(a['x'], 1), 'z': round(a['z'], 1), 'y': 'floor', **({'props': False} if re.search(r'crew|sailors|oars', k) else {})} for k, a in acts.items()]   # stood on whatever is under them; a crew's oars are the ship's
    keys = []
    for n, s in enumerate(pv['shots']):
        cam = s['camera']; kind = cam['kind']; sub = who(cam.get('subject')); obj = who(cam.get('object', -1))
        if obj == sub: obj = None
        place = 'L' if n % 2 else 'R'
        blk = []
        for k in acts:   # attention
            if k == sub: blk.append({'id': k, 'face': (obj if obj and not obj.startswith('piece:') else at(obj)) if obj else [acts[k]['x'], acts[k]['z'] + 400]})
            elif sub: blk.append({'id': k, 'face': sub if not sub.startswith('piece:') else at(sub)})
        actor = sub and not sub.startswith('piece:')
        subj = [{'id': sub, 'primary': True, **({'face': True} if actor else {})}] if sub else []
        if obj: subj.append({'id': obj, 'soft': True, 'cut': True})
        allow = []
        if kind in ('establish', 'pullback') or not sub:
            k_ = 1.25 if kind == 'establish' else 1.6
            c = {'type': 'wide', 'pos': [round(-0.45 * ext * k_, 1), round(0.62 * ext * k_, 1), round(ext * k_, 1)], 'target': [0, 35, 0], 'fov': 38}
            for s_ in subj: s_.update(soft=True, min=0.02); s_.pop('face', None)
        elif not actor:   # a set piece: a low three-quarter from the front
            b = boxes[sub[6:]]; h = max(b[4] - b[1], (b[3] - b[0]) * 0.6, (b[5] - b[2]) * 0.6); cx, cz = at(sub); d = h / (2 * math.tan(math.radians(17))) / 0.55   # the piece at 55% of the frame's height
            c = {'type': 'wide', 'pos': [round(cx - 0.45 * d, 1), round(b[1] + (b[4] - b[1]) * 0.6 + d * 0.15, 1), round(cz + 0.9 * d, 1)], 'target': sub, 'fov': 34, 'subject': sub, 'place': place, 'eye': 0.4}
            subj[0]['min'] = 0.25
        elif kind == 'ots' and obj and not obj.startswith('piece:'):
            c = {'type': 'ots', 'over': obj, 'at': sub, 'dist': 45, 'off': 22, 'height': 12, 'fov': 30, 'subject': sub, 'place': place, 'eye': 0.36}; allow = [obj]; subj[0]['min'] = 0.12
        elif kind == 'medium' and obj and not obj.startswith('piece:'):
            a, b = acts[sub], acts[obj]; span = math.hypot(a['x'] - b['x'], a['z'] - b['z'])
            c = {'type': 'two', 'a': sub, 'b': obj, 'bias': 0.4, 'dist': round(max(170, span * 2.4), 1), 'height': 12, 'fov': 32, 'subject': sub, 'place': place, 'eye': 0.36}; subj[0]['min'] = 0.1
        elif kind == 'push':
            c = {'type': 'hero', 'a': sub, 'dist': 120, 'height': 6, 'yaw': 0.3, 'fov': 32, 'subject': sub, 'place': place, 'eye': 0.34}; subj[0]['min'] = 0.2
        elif kind in ('track', 'orbit'):
            c = {'type': 'hero', 'a': sub, 'dist': 210, 'height': 22, 'yaw': 0.9 if n % 2 else -0.9, 'fov': 32, 'subject': sub, 'place': place, 'eye': 0.36}; subj[0]['min'] = 0.1
        else:
            c = {'type': 'hero', 'a': sub, 'dist': 175, 'height': 10, 'yaw': 0.5 if n % 2 else -0.5, 'fov': 32, 'subject': sub, 'place': place, 'eye': 0.36}; subj[0]['min'] = 0.12
        keys.append({'id': f'K{n + 1}', 'beat': s['beat'], 'kind': kind, 'draft': True, 'blocking': blk, 'camera': c, 'subjects': subj, **({'lensAllow': allow} if allow else {})})
    return {'scene': sid, 'location': 'odyssey-' + sid.lower(), 'title': pv['title'].title(), 'note': 'Drafted from the storyboard by film-readymades/keyframe_draft.py: attention blocking and rigs by shot kind. Finish by hand where the gate fails.',
            'look': {'sky': ['#5f97d3', '#efe2c4'], 'fog': [700, 2400]}, 'spread': 36, 'blocking': base, 'keys': keys}

if __name__ == '__main__':
    for sid in [a for a in sys.argv[1:] if not a.startswith('--')]:
        out = REPO / 'odyssey/keyframes' / f'{sid}.json'
        if out.exists() and '--force' not in sys.argv: print(sid, 'exists (hand-blocked); --force to redraft'); continue
        d = draft(sid); out.write_text(json.dumps(d, indent=1)); print(sid, len(d['keys']), 'stills drafted ->', out.relative_to(REPO))

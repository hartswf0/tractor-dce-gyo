#!/usr/bin/env python3
"""tools/making/hop_keys.py — Hearts of Plastic: the episodes' keyframes (odyssey/keyframes/OD-B26-S0N.json), in the source location's
own coordinates (the episode's card keeps its frame: tools/making/hop.py). Who stands where at each key, the crew's furniture (the
camera on its tripod, the director's chair, the clapperboard in the First AD's hand), the creatures' places (a staged prop each, which
the director's module's rig replaces), the light (the source scene's own, with a work light for the crew).

    python3 tools/making/hop_keys.py [OD-B26-S01 ...]"""
import json, math, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]; sys.path.insert(0, str(Path(__file__).parent))
import lego_script as S

def fig(id, x, z, face=None, pose=None, sit=False, props=None, absent=False, **kw):
    if absent: return dict(id=id, absent=True, x=x, z=z, y='floor')
    e = dict(id=id, x=x, z=z, y='floor', free=True)
    if face is not None: e['face'] = list(face)
    if pose: e['pose'] = pose
    if sit: e.update(sit=True, pose=dict(pose or {}, legRP=[-1.5708, 0, 0], legLP=[-1.5708, 0, 0]), reach=60, lift=1.5)
    if props is not None: e['props'] = props
    e.update(kw); return e
def prop(name, x, z, rot=0.0, scale=1.0, pid=None, y=0, floor=True, **kw):
    e = dict(name=name, id=pid or name, at=[x, y, z], rot=[0, rot, 0], floor=floor, free=True)
    if scale != 1.0: e['scale'] = scale
    e.update(kw); return e
def AIM(x, z, tx, tz): return math.atan2(tx - x, -(tz - z))   # a prop's yaw that turns its -z (the camera's lens) from (x, z) toward (tx, tz)
def FACE(x, z, tx, tz): return math.atan2(-(tx - x), -(tz - z))   # the chair turned so its sitter faces (tx, tz) (its back toward -z ... set by stills)
CAMERA = lambda x, z, tx, tz: prop('movieCamera', x, z, rot=AIM(x, z, tx, tz), pid='camera')
CHAIR = lambda x, z, tx, tz: prop('directorChair', x, z, rot=AIM(x, z, tx, tz) + math.pi, pid='chair')
CLAP = dict(name='clapper', id='clapper', after=True, aim=dict(to='hand:firstad:L', anchor='centre', dir=[0, -1, 0]))
def cam(pos, target, fov=50): return dict(type='wide', pos=list(pos), target=list(target), fov=fov)
def key(id, blocking, props, look, camera, subjects=(), beat='', hide=(), after=None):
    k = dict(id=id, beat=beat, text=beat, hide=list(hide), props=list(props), blocking=blocking, camera=camera, subjects=list(subjects), look=look)
    if after: k['after'] = after
    return k
def beat(sid, k): return ' / '.join(f"{S.CAST[w]['name']}: {t}" for kk, w, _, _, t, *r in S.SCENES[sid]['lines'] if kk == k and w in S.CAST)

SC = {}
# ======== E1: the Cave (the location of OD-B09-S06: the door at z 215, the great stone beside it at (100, 175) until it is set in the
# door, the fire at (-66, 28), the pen x 47..198 z -141..9, the cheese racks at the back left) ========
sid = 'OD-B26-S01'
src = json.loads((REPO / 'odyssey/keyframes/OD-B09-S06.json').read_text())
LIT = dict(src['keys'][3]['look']); LIT['lights'] = LIT['lights'] + [dict(at=[-170, 210, 170], color='#fff2dc', intensity=1.1, distance=560, decay=1.0)]   # the milking's light, and the crew's work lamp by the door
LIT['exposure'] = 1.2
HIDE = ['polyphemus', 'cyclops flock', 'cave-blocking stone', 'fire and dry logs']
G0, GS = (-30, -150), (-10, 140)          # the giant at his mark at the back; at the stone (turned to the door, as in OD-B09-S06)
RAM_CAM = (-30, 100)                       # the ram the camera went into
CH = (-160, 10)                            # the director's chair, where it stays
def giant(x, z, h): return prop('polyphemus', x, z, rot=h, pid='polyphemus', y=15, scale=1.4)
def rams(r1=RAM_CAM, h1=math.pi / 2): return [prop('ram', r1[0], r1[1], rot=h1, pid='ram1', scale=1.5), prop('ram', 110, -60, rot=0.6, pid='ram2', scale=1.5), prop('ramBlack', 150, -105, rot=1.2, pid='ram3', scale=1.5)]
D = lambda tx, tz: fig('director', CH[0], CH[1], face=(tx, tz), sit=True, props=False)
AD = lambda x, z, tx, tz: fig('firstad', x, z, face=(tx, tz), props=True)
C = lambda x, z, tx, tz, **kw: fig('cinematographer', x, z, face=(tx, tz), props=False, **kw)
O = lambda x, z, tx, tz: fig('odysseus', x, z, face=(tx, tz), props=True)
EYE = {'armRP': [-1.9, 0, 0]}
SC[sid] = [
 key('K1', [D(-30, 120), AD(-120, 70, -30, 140), C(-30, 195, -30, 100, pose=EYE), O(70, 90, -30, 160)],
     [CHAIR(*CH, -30, 120), CAMERA(-30, 165, *RAM_CAM), CLAP, giant(*G0, 0)] + rams(), LIT, cam((-260, 230, -40), (-20, 40, 120), 52),
     [dict(id='cinematographer', primary=True), dict(id='director', soft=True)], beat(sid, 'K1'), HIDE),
 key('K2', [D(-30, 170), AD(-80, 175, -30, 195), C(-30, 195, -80, 175), O(70, 90, -30, 160)],
     [CHAIR(*CH, -30, 120), CAMERA(-30, 165, *RAM_CAM), CLAP, giant(*G0, 0)] + rams(), LIT, cam((60, 120, 260), (-40, 50, 130), 46),
     [dict(id='cinematographer', primary=True, face=True), dict(id='firstad', soft=True)], beat(sid, 'K2'), HIDE),
 key('K3', [D(-30, 170), AD(-90, 175, CH[0], CH[1]), C(-30, 200, -30, -100, pose=EYE), O(70, 90, -30, 160)],
     [CHAIR(*CH, -30, 120), CAMERA(-30, 172, -30, -100), CLAP, giant(*G0, 0)] + rams((100, 30), 0.3), LIT, cam((60, 120, 260), (-40, 50, 130), 46),
     [dict(id='director', primary=True, face=True), dict(id='cinematographer', soft=True)], beat(sid, 'K3'), HIDE),
 key('K4', [D(-30, -120), AD(-95, -35, *G0), C(-30, -45, *G0, pose=EYE), O(70, 90, *G0)],
     [CHAIR(*CH, -30, -120), CAMERA(-30, -75, *G0), CLAP, giant(*G0, 0)] + rams((100, 30), 0.3), LIT, cam((120, 60, 40), (-30, 110, -150), 56),
     [dict(id='polyphemus', primary=True), dict(id='cinematographer', soft=True)], beat(sid, 'K4'), HIDE),
 key('K5', [D(-10, 160), AD(-110, 90, -10, 160), C(-150, 125, -10, 200, pose=EYE), O(-200, 160, CH[0], CH[1])],
     [CHAIR(*CH, -10, 160), CAMERA(-125, 140, -10, 200), CLAP, giant(*GS, 0)] + rams((100, 30), 0.3), LIT, cam((-240, 140, 20), (-10, 70, 190), 50),
     [dict(id='polyphemus', primary=True), dict(id='director', soft=True)], beat(sid, 'K5'), HIDE),
 key('K6', [D(-10, 160), AD(-110, 90, -10, 160), C(-150, 125, -10, 200, pose=EYE), O(-200, 160, -10, 180)],
     [CHAIR(*CH, -10, 160), CAMERA(-125, 140, -10, 200), CLAP, giant(*GS, 0)] + rams((100, 30), 0.3), LIT, cam((-240, 140, 20), (-10, 70, 190), 50),
     [dict(id='polyphemus', primary=True), dict(id='director', soft=True)], beat(sid, 'K6'), HIDE),
 key('K7', [D(60, 0), AD(-100, 90, CH[0], CH[1]), C(-130, 60, CH[0], CH[1]), O(-200, 160, 60, 0)],
     [CHAIR(*CH, 60, 0), CAMERA(-60, -60, 70, 0), CLAP, giant(40, 0, 2.2)] + rams((100, 30), 0.3), LIT, cam((-260, 160, 120), (0, 50, 0), 50),
     [dict(id='director', primary=True, face=True), dict(id='cinematographer', soft=True)], beat(sid, 'K7'), HIDE),
]

if __name__ == '__main__':
    ONLY = [a for a in sys.argv[1:] if a.startswith('OD-B26-')]
    for sid, keys in SC.items():
        if ONLY and sid not in ONLY: continue
        sc = S.SCENES[sid]
        spec = dict(scene=sid, location='odyssey-' + sid.lower(), title='Hearts of Plastic: ' + sc['title'],
                    source='Hearts of Plastic (odyssey/writers-room/BIBLE.md): tools/making/hop_script.py (the script and its evidence)',
                    note=f"Episode {sc['episode']} on the set of {sc['location']} (its card, tools/making/hop.py), the crew walked onto it. Marks in tools/making/hop_keys.py, in that location's coordinates.",
                    look=keys[0]['look'], spread=0, blocking=[], walkHeight='first', keys=keys)
        (REPO / 'odyssey/keyframes' / (sid + '.json')).write_text(json.dumps(spec, indent=1))
        print(sid, len(keys), 'keys')

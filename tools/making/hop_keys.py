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
CAMERA = lambda x, z, tx, tz: prop('movieCamera', x, z, rot=AIM(x, z, tx, tz), pid='camera', scale=0.75)   # three quarters: the studio's camera stands over a minifigure on a set
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
G0, GS = (-30, -150), (40, 135)          # the giant at his mark at the back; at the great stone, turned to the door
RAM_CAM = (0, 60)                          # the ram the camera went into, in the open floor between the fire and the pen
CH = (-160, 120)                           # the director's chair, where it stays
def giant(x, z, h): return prop('polyphemus', x, z, rot=h, pid='polyphemus', y=15, scale=1.4)
def rams(r1=RAM_CAM, h1=math.pi / 2): return [prop('ram', r1[0], r1[1], rot=h1, pid='ram1', scale=1.5), prop('ram', 110, -60, rot=0.6, pid='ram2', scale=1.5), prop('ramBlack', 150, -105, rot=1.2, pid='ram3', scale=1.5)]
D = lambda tx, tz: fig('director', CH[0], CH[1], face=(tx, tz), sit=True, props=False)
AD = lambda x, z, tx, tz: fig('firstad', x, z, face=(tx, tz), props=True)
C = lambda x, z, tx, tz, **kw: fig('cinematographer', x, z, face=(tx, tz), props=False, **kw)
O = lambda x, z, tx, tz: fig('odysseus', x, z, face=(tx, tz), props=True)
EYE = {'armRP': [-1.9, 0, 0]}
DOOR = (-10, 215)
STONE_CAM = cam((170, 110, 60), (20, 60, 190), 50)   # the stone's key camera: from the pen side, the giant in profile, the stone beside the door and the door
SC[sid] = [   # the crew in a row facing what is being shot, a stride apart (no one's head in another's close), the cinematographer beside his camera
 key('K1', [D(*RAM_CAM), AD(-95, 100, *RAM_CAM), C(-40, 140, *RAM_CAM), O(75, 95, 0, 125)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(0, 125, *RAM_CAM), CLAP, giant(*G0, 0)] + rams(), LIT, cam((-260, 230, -40), (-20, 40, 120), 52),
     [dict(id='cinematographer', primary=True), dict(id='director', soft=True)], beat(sid, 'K1'), HIDE),
 key('K2', [D(*RAM_CAM), AD(-95, 100, *RAM_CAM), C(-40, 140, *RAM_CAM), O(75, 95, 0, 125)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(0, 125, *RAM_CAM), CLAP, giant(*G0, 0)] + rams(), LIT, cam((60, 120, 260), (-40, 50, 130), 46),
     [dict(id='cinematographer', primary=True, face=True), dict(id='firstad', soft=True)], beat(sid, 'K2'), HIDE),
 key('K3', [D(*RAM_CAM), AD(-95, 100, *RAM_CAM), C(-40, 140, *RAM_CAM), O(75, 95, 0, 125)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(0, 125, -30, -100), CLAP, giant(*G0, 0)] + rams((100, 30), 0.3), LIT, cam((60, 120, 260), (-40, 50, 130), 46),
     [dict(id='director', primary=True, face=True), dict(id='cinematographer', soft=True)], beat(sid, 'K3'), HIDE),
 key('K4', [D(*G0), AD(-130, -30, *G0), C(-80, -55, *G0), O(75, 95, *G0)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(-40, -65, *G0), CLAP, giant(*G0, 0)] + rams((100, 30), 0.3), LIT, cam((120, 60, 40), (-30, 110, -150), 56),
     [dict(id='cinematographer', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K4'), HIDE),
 key('K5', [D(*DOOR), AD(-190, 40, *DOOR), C(-150, 60, *DOOR), O(-60, 100, *DOOR)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(-120, 95, *DOOR), CLAP, giant(*GS, 0)] + rams((100, 30), 0.3), LIT, STONE_CAM,
     [dict(id='director', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K5'), HIDE),
 key('K6', [D(*DOOR), AD(-190, 40, *DOOR), C(-150, 60, *DOOR), O(-60, 100, *DOOR)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(-120, 95, *DOOR), CLAP, giant(*GS, 0)] + rams((100, 30), 0.3), LIT, STONE_CAM,
     [dict(id='director', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K6'), HIDE),
 key('K7', [D(40, 0), AD(-190, 40, 40, 0), C(-150, 60, 40, 0), O(-60, 100, 40, 0)],
     [CHAIR(*CH, *RAM_CAM), CAMERA(-120, 95, *DOOR), CLAP, giant(40, 0, 2.2)] + rams((100, 30), 0.3), LIT, cam((-40, 120, 150), (60, 40, -20), 50),
     [dict(id='director', primary=True, face=True), dict(id='cinematographer', soft=True)], beat(sid, 'K7'), HIDE),
]

# ======== E2: the Hall (the location of OD-B17-S05: the megaron; Antinous's table at the left, the four columns, the braziers before the
# threshold at z 250; the beggars' marks between the columns, the crew toward the threshold) ========
sid = 'OD-B26-S02'
src = json.loads((REPO / 'odyssey/keyframes/OD-B17-S05.json').read_text())
HALL = dict(src['look']); HALL['lights'] = [dict(at=[60, 220, 230], color='#fff2dc', intensity=1.1, distance=560, decay=1.0)]   # the hall's sun, and the crew's work lamp by the threshold
CH2 = (140, 140); BG, IR = (-80, 0), (-35, 0); AN = (-205, -25); CAM2 = (0, 130)
B2 = lambda x, z, tx, tz: fig('odysseus-as-beggar', x, z, face=(tx, tz), props=True)
IR2 = lambda x, z, tx, tz: fig('irus', x, z, face=(tx, tz), props=True)
AN2 = lambda tx, tz, **kw: fig('antinous', AN[0], AN[1], face=(tx, tz), props=True, **kw)
D2 = lambda tx, tz: fig('director', CH2[0], CH2[1], face=(tx, tz), sit=True, props=False)
AD2 = lambda tx, tz: fig('firstad', 80, 130, face=(tx, tz), props=True)
C2 = lambda tx, tz, **kw: fig('cinematographer', 38, 145, face=(tx, tz), props=False, **kw)
STOOL_HAND = dict(name='stool', id='stool', aim=dict(anchor='seat', to='hand:antinous:R', dir=[0, -1, 0], off=[0, 6, 0]))
STOOL_DOWN = prop('stool', -110, -25, pid='stool')
SMEAR = prop('stoolSmear', -260, 200, pid='stoolSmear')
base2 = lambda: [CHAIR(*CH2, -60, 0), CAMERA(*CAM2, -60, 0), CLAP]
cam2 = cam((150, 140, 230), (-80, 40, 0), 50)
PAIR2 = cam((-57, 75, 125), (-57, 45, 0), 46)        # the two beggars from the front, side by side
THROW2 = cam((-150, 110, 175), (-140, 40, -10), 50)   # the throw from the front: Antinous at his table, the beggar on his mark, the stool between
SC[sid] = [
 key('K1', [B2(-110, 225, -110, 100), IR2(-70, 225, -70, 100), AN2(-80, 0), D2(-60, 0), AD2(-60, 0), C2(-60, 0, pose=EYE)], base2() + [STOOL_DOWN], HALL, cam2,
     [dict(id='firstad', primary=True), dict(id='director', soft=True)], beat(sid, 'K1'), ['thrown footstool']),
 key('K1a', [B2(*BG, -40, 130), IR2(*IR, -40, 130), AN2(*BG), D2(-60, 0), AD2(-60, 0), C2(-60, 0)], base2() + [STOOL_DOWN], HALL, PAIR2,
     [dict(id='odysseus-as-beggar', primary=True), dict(id='irus', soft=True)], 'The two beggars walk in from the threshold to their marks.', ['thrown footstool'], after=['K1', 6.8]),
 key('K2', [B2(*BG, *CH2), IR2(*IR, *CH2), AN2(*BG), D2(-60, 0), AD2(-60, 0), C2(*CH2)], base2() + [STOOL_DOWN], HALL, PAIR2,
     [dict(id='cinematographer', primary=True), dict(id='director', soft=True)], beat(sid, 'K2'), ['thrown footstool']),
 key('K3', [B2(*BG, -40, 130), IR2(*IR, *AN), AN2(*BG, pose={'armRP': [-1.2, 0, 0]}), D2(-60, 0), AD2(-60, 0), C2(-60, 0)], base2() + [STOOL_HAND], HALL, THROW2,
     [dict(id='antinous', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K3'), ['thrown footstool']),
 key('K4', [B2(*BG, -40, 130), IR2(*IR, *AN), AN2(*BG, pose={'armRP': [-1.2, 0, 0]}), D2(-60, 0), AD2(-60, 0), C2(-60, 0)], base2() + [STOOL_HAND, SMEAR], HALL, THROW2,
     [dict(id='cinematographer', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K4'), ['thrown footstool']),
 key('K5', [B2(*BG, *CH2), IR2(*IR, 40, 100), AN2(*BG), D2(-60, 0), AD2(-60, 0), C2(*CH2)], base2() + [STOOL_DOWN], HALL, cam2,
     [dict(id='director', primary=True), dict(id='irus', soft=True)], beat(sid, 'K5'), ['thrown footstool']),
]

# ======== E3: the Underworld (the location of OD-B11-S04: the Cimmerian shore and the pit behind, the open sand toward z 296; mother
# and son a few steps apart at z 135-140 as in OD-B11-S04; Achilles comes in from the right; the crew toward the front) ========
sid = 'OD-B26-S03'
src = json.loads((REPO / 'odyssey/keyframes/OD-B11-S04.json').read_text())
DEAD = json.loads(json.dumps(src['look'])); DEAD['lights'] = DEAD['lights'] + [dict(at=[60, 200, 290], color='#fff2dc', intensity=0.9, distance=520, decay=1.0)]; DEAD['exposure'] = 1.0
CH3 = (120, 245); O3, A3, AC3 = (10, 133), (-60, 140), (60, 150)
EMB = {'armRP': [-1.5, 0, -0.3], 'armLP': [-1.5, 0, 0.3], 'torsoP': [0.1, 0, 0]}
O_ = lambda x, z, tx, tz, pose=None: fig('odysseus', x, z, face=(tx, tz), props=False, **({'pose': pose} if pose else {}))
AN_ = lambda tx, tz: fig('anticleia', *A3, face=(tx, tz), props=False, pose={'headP': [0.15, 0, 0]})
ACH = lambda x, z, tx, tz: fig('achilles', x, z, face=(tx, tz), props=True)
D3 = lambda tx, tz: fig('director', CH3[0], CH3[1], face=(tx, tz), sit=True, props=False)
AD3 = lambda tx, tz: fig('firstad', 40, 240, face=(tx, tz), props=True)
C3 = lambda tx, tz, **kw: fig('cinematographer', -155, 250, face=(tx, tz), props=False, **kw)
base3 = lambda: [CHAIR(*CH3, -30, 140), CAMERA(-110, 235, -30, 140), CLAP]
cam3 = cam((200, 150, 330), (-20, 40, 150), 50)
crew3 = lambda: [D3(-30, 140), AD3(-30, 140), C3(-30, 140, pose=EYE)]
off3 = ACH(250, 185, 60, 150)
def emb(id, beat_, after=None, out=False):
    o = O_(*O3, *A3) if out else O_(-38, 138, *A3, EMB)
    k = key(id, [o, AN_(*(O3 if out else (-38, 138))), off3] + crew3(), base3(), DEAD, cam3, [dict(id='odysseus', primary=True), dict(id='anticleia', soft=True)], beat_, ['ithaca family memory'], after)
    if not out: k['touch'] = [['odysseus', 'anticleia']]   # his arms through her: she is a shade
    return k
SC[sid] = [
 key('K1', [O_(*O3, *A3), AN_(*O3), off3] + crew3(), base3(), DEAD, cam3, [dict(id='firstad', primary=True), dict(id='director', soft=True)], beat(sid, 'K1'), ['ithaca family memory']),
 emb('K2', 'The first embrace: his arms through her.'), emb('K2s', 'He steps back from her.', ['K2', 2.4], out=True),
 emb('K3', 'The second embrace.'), emb('K3s', 'He steps back.', ['K3', 1.6], out=True),
 emb('K4', 'The third embrace.'), emb('K4s', 'He steps back.', ['K4', 2.6], out=True),
 key('K5', [O_(*O3, 40, 240), AN_(*O3), off3, D3(-30, 140), AD3(250, 185), C3(-30, 140, pose=EYE)], base3(), DEAD, cam3,
     [dict(id='firstad', primary=True), dict(id='director', soft=True)], beat(sid, 'K5'), ['ithaca family memory']),
 key('K5a', [O_(*O3, *AC3), AN_(*AC3), ACH(*AC3, 40, 240), D3(*AC3), AD3(*AC3), C3(*AC3)], base3(), DEAD, cam3,
     [dict(id='achilles', primary=True), dict(id='firstad', soft=True)], 'Achilles comes up the shore in the visored helmet.', ['ithaca family memory'], ['K5', 4.2]),
 key('K6', [O_(*O3, *AC3), AN_(*AC3), ACH(*AC3, 40, 240), D3(*AC3), AD3(*AC3), C3(*AC3)], base3(), DEAD, cam3,
     [dict(id='achilles', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K6'), ['ithaca family memory']),
]
SHADES = {'OD-B26-S03': {'anticleia': {'opacity': 0.62, 'pale': 0.4, 'glow': 0.35}, 'achilles': {'opacity': 0.7, 'pale': 0.35, 'glow': 0.3}}}

# ======== E4: the Sea (the location of OD-B12-S03: the black ship at anchor on the set, its deck at y 50, the mast at (-17, 107), the
# four rowers on their benches, the helmsman aft at (-17, 232); the Sirens on the flowered shore at -z; the crew on the deck aft,
# Calypso a guest on the deck before the mast) ========
sid = 'OD-B26-S04'
src = json.loads((REPO / 'odyssey/keyframes/OD-B12-S03.json').read_text())
SEA = dict(src['look']); SEA['lights'] = [dict(at=[-17, 200, 230], color='#fff2dc', intensity=0.8, distance=420, decay=1.0)]
DECK = 50.0
row = {b['id']: b for b in src['blocking'] if b['id'].startswith('crew-at-the-oars') or b['id'] in ('the-sirens-2', 'the-sirens-4')}
def deck(id, x, z, face=None, **kw): e = fig(id, x, z, face=face, **kw); e['y'] = DECK; e['on'] = '*'; return e
CAM4, CAL = (-17, 185), (15, 120)
crew4 = lambda look: [deck('director', 70, 212, face=look, sit=True, props=False), deck('firstad', 25, 200, face=look, props=True), deck('cinematographer', -55, 195, face=look, props=False, pose=EYE)]
base4 = lambda tx, tz: [dict(CHAIR(70, 212, tx, tz), floor=False, at=[70, DECK, 212]), dict(CAMERA(*CAM4, tx, tz), floor=False, at=[CAM4[0], DECK, CAM4[1]]), CLAP]
rowers = lambda: [dict(row[i]) for i in sorted(row)]
cam4 = cam((-240, 170, 300), (-10, 60, 100), 48)
SC[sid] = [
 key('K1', rowers() + [deck('odysseus', -17, 107, face=(-17, 185), props=True), deck('calypso', 60, 150, face=(-17, 107), props=False)] + crew4((20, 20)), base4(20, 20), SEA, cam4,
     [dict(id='firstad', primary=True), dict(id='director', soft=True)], beat(sid, 'K1')),
 key('K2', rowers() + [deck('odysseus', -40, 120, face=CAL, props=True), deck('calypso', *CAL, face=CAM4, props=False)] + crew4(CAL), base4(*CAL), SEA, cam4,
     [dict(id='calypso', primary=True), dict(id='firstad', soft=True)], beat(sid, 'K2')),
 key('K2a', rowers() + [deck('odysseus', 3, 146, face=CAM4, props=True), deck('calypso', *CAL, face=CAM4, props=False)] + crew4(CAL), base4(*CAL), SEA, cam4,
     [dict(id='odysseus', primary=True), dict(id='calypso', soft=True)], beat(sid, 'K2a')),
 key('K3', rowers() + [deck('odysseus', -58, 128, face=CAL, props=True), deck('calypso', *CAL, face=CAM4, props=False)] + crew4(CAL), base4(*CAL), SEA, cam4,
     [dict(id='calypso', primary=True), dict(id='odysseus', soft=True)], beat(sid, 'K3')),
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
        if sid in SHADES: spec['shades'] = SHADES[sid]
        (REPO / 'odyssey/keyframes' / (sid + '.json')).write_text(json.dumps(spec, indent=1))
        print(sid, len(keys), 'keys')

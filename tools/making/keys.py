#!/usr/bin/env python3
"""tools/making/keys.py — the making-of film's keyframes: who stands where at each key, what props the key stages, the light.
Writes odyssey/keyframes/OD-B25-S0N.json in the format the keyframe gate (film-readymades/keyframes.cjs) and the take read.
Marks are written here in the studio's LDraw units (tools/making/studio.py: x right, z toward the far wall) and converted to the
location's frame (x * s, z -> (10 - z) * s, the scale the build gives the studio). Run: python3 tools/making/keys.py"""
import json, math, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]; sys.path.insert(0, str(Path(__file__).parent))
import lego_script as S
s = 0.8918918918918919
def P(x, z): return [round(x * s, 1), round((10 - z) * s, 1)]
def P3(x, h, z): return [round(x * s, 1), round((h + 8) * s, 1), round((10 - z) * s, 1)]

# the light: day in the studio (a key over the little set, a cool fill), night (the farm's green, a desk lamp), the dark (red)
SKY = ['#1b1d22', '#34363d']
DAY = dict(sky=SKY, fog=[1600, 3400], dim=0.3, fill=dict(sky='#e4e9f2', ground='#45464c', intensity=0.8),
           sun=dict(dir=[0.25, 0.9, 0.4], color='#fff2df', intensity=1.05, shadow=True), exposure=1.05,
           lights=[dict(at=P3(-220, 260, 200), color='#ffd9a0', intensity=1.3, distance=520), dict(at=P3(160, 200, 0), color='#fff0dc', intensity=0.7, distance=420)])
NIGHT = dict(sky=['#0b0e18', '#151a2b'], fog=[1400, 3000], dim=0.12, fill=dict(sky='#6b7fb8', ground='#1a1d28', intensity=0.62),
             sun=dict(dir=[-0.4, 0.8, 0.3], color='#9fb3ff', intensity=0.42, shadow=True), exposure=1.1,
             lights=[dict(at=P3(300, 160, 160), color='#8dffb0', intensity=1.7, distance=480), dict(at=P3(160, 120, 70), color='#ffd7a0', intensity=1.0, distance=300),
                     dict(at=P3(-220, 200, 150), color='#8fa6ff', intensity=0.6, distance=420)])
DARK = dict(sky=['#07080c', '#0d0f16'], fog=[1200, 2600], dim=0.08, sun=None, fill=dict(sky='#7a5560', ground='#160d10', intensity=0.42),
            exposure=1.15, lights=[dict(at=P3(280, 120, 80), color='#ff4a3a', intensity=1.9, distance=520), dict(at=P3(-200, 160, 100), color='#ff6a50', intensity=0.8, distance=420)])

# the marks (LDraw x, z)
O_SET = (-230, 160); CAM0 = (-210, -20); CINE0 = (-205, -90); CHAIR = (-40, -60); DESK_A = (160, 125); DESK_D = (105, 125)
HORSE = dict(name='horse', id='horse', at=None, rot=[0, -math.pi / 2, 0], floor=True, scale=0.2, free=True)
def prop(name, x, z, rot=0.0, scale=1.0, pid=None, h=None, floor=True, **kw):
    e = dict(name=name, id=pid or name, at=(P3(x, h, z) if h is not None else [P(x, z)[0], 0, P(x, z)[1]]), rot=[0, rot, 0], floor=floor, free=True)
    if scale != 1.0: e['scale'] = scale
    e.update(kw); return e
SET_PROPS = [prop('horse', -100, 205, rot=-math.pi / 2, scale=0.15), prop('raft', -300, 262, rot=0.3), prop('studioSign', 40, 300, scale=0.55, h=150, floor=False)]
def fig(id, x, z, face=None, pose=None, sit=False, props=None, absent=False, heading=None, **kw):
    e = dict(id=id, x=P(x, z)[0], z=P(x, z)[1], y='floor', free=True)
    if absent: return dict(id=id, absent=True, x=e['x'], z=e['z'], y='floor')
    if face is not None: e['face'] = P(*face) if isinstance(face, tuple) else face
    if pose: e['pose'] = pose
    if sit: e.update(sit=True, pose=dict(pose or {}, legRP=[-1.5708, 0, 0], legLP=[-1.5708, 0, 0]), reach=60, lift=1.5)
    if props is not None: e['props'] = props
    e.update(kw); return e
def cam(pos, target, fov=46): return dict(type='wide', pos=P3(*pos), target=P3(*target), fov=fov)
def key(id, blocking, props=(), look=None, camera=None, subjects=(), beat='', after=None):
    k = dict(id=id, beat=beat, text=beat, hide=[], props=list(props), blocking=blocking, camera=camera or cam((0, 260, -420), (-60, 60, 120)), subjects=list(subjects))
    if look: k['look'] = look
    if after: k['after'] = after
    return k
RAM = lambda x=-310, z=140, r=math.pi: prop('ram', x, z, rot=r)
CAMERA = lambda x, z, r, **kw: prop('movieCamera', x, z, rot=r, pid='camera', **kw)
def AIM(x, z, tx, tz): return math.atan2(tx - x, -(tz - z))   # the camera prop's yaw that turns its lens from (x, z) toward (tx, tz)
ARM_UP = {'armRP': [-1.45, 0, 0]}; POINT = {'armRP': [-1.35, 0, 0]}; PUSH = {'armRP': [-1.3, 0, 0], 'armLP': [-1.3, 0, 0]}; LENS = {'armRP': [-1.9, 0, 0]}

def beat(sid, k): return ' / '.join(f"{S.CAST[w]['name']}: {t}" for kk, w, _, _, t in S.SCENES[sid]['lines'] if kk == k)

SC = {}
# ---- 1: the animatic, the engine ----
sid = 'OD-B25-S01'
base = dict(director=fig('director', *CHAIR, face=O_SET, sit=True, props=False), cinematographer=fig('cinematographer', *CINE0, face=O_SET, props=False),
            agent=fig('agent', *DESK_A, face=(160, 0), props=False), odysseus=fig('odysseus', *O_SET, face=CAM0, props=True), examiner=fig('examiner', 0, 0, absent=True))
def B(**over): d = dict(base); d.update(over); return list(d.values())
pr = SET_PROPS + [RAM(), CAMERA(*CAM0, AIM(*CAM0, *O_SET))]
SC[sid] = [
 key('K1', B(), pr, DAY, cam((60, 210, -330), (-150, 60, 120), 44), [dict(id='odysseus', primary=True, min=0.05), dict(id='director', soft=True)], beat(sid, 'K1')),
 key('K2', B(director=fig('director', 110, 20, face=DESK_A, props=False), agent=fig('agent', *DESK_A, face=(110, 20), props=False)), pr, DAY,
     cam((20, 120, -120), (140, 70, 80), 42), [dict(id='director', primary=True, face=True), dict(id='agent', soft=True)], beat(sid, 'K2')),
 key('K3', B(director=fig('director', -70, 30, face=(-190, 140), props=False), agent=fig('agent', -175, 125, face=O_SET, props=False)), pr, DAY,
     cam((-60, 110, -60), (-200, 70, 140), 42), [dict(id='agent', primary=True, face=True), dict(id='odysseus', soft=True)], beat(sid, 'K3')),
 key('K4', B(director=fig('director', -60, -15, face=O_SET, props=False), agent=fig('agent', -130, -40, face=O_SET, props=False)), pr, DAY,
     cam((-120, 110, -60), (-220, 70, 160), 42), [dict(id='odysseus', primary=True, face=True)], beat(sid, 'K4')),
 key('K5', B(director=fig('director', -75, 0, face=(-130, -40), props=False), agent=fig('agent', -130, -40, face=(-75, 0), props=False),
             odysseus=fig('odysseus', -205, 165, face=(-95, 205), props=True)), pr, DAY,
     cam((-20, 100, -140), (-120, 70, 0), 40), [dict(id='director', primary=True, face=True), dict(id='agent', soft=True)], beat(sid, 'K5')),
]
# ---- 2: the camera in the wool; the night; the restart ----
sid = 'OD-B25-S02'
TK2 = json.loads((REPO / 'odyssey/take/making' / (sid + '.json')).read_text()); K4AT = next(g['start'] for g in TK2['voice']['segments'] if g['key'] == 'K4')
DOWN, UP = TK2['events']['down'][0], TK2['events']['up'][0]
base = dict(director=fig('director', *DESK_D, face=(105, 0), props=False), cinematographer=fig('cinematographer', -170, 2, face=(-170, 125), props=False),
            agent=fig('agent', *DESK_A, face=(160, 0), props=False), odysseus=fig('odysseus', -235, 150, face=(-170, 125), props=True), examiner=fig('examiner', 0, 0, absent=True))
pr0 = SET_PROPS + [RAM(-170, 125, math.pi)]
SC[sid] = [
 key('K1', B(), pr0 + [CAMERA(-170, 72, math.pi)], DAY, cam((-20, 140, -140), (-150, 70, 90), 46), [dict(id='cinematographer', primary=True), dict(id='director', soft=True)], beat(sid, 'K1')),
 key('K2', B(cinematographer=fig('cinematographer', -150, 15, face=DESK_D, props=False), agent=fig('agent', *DESK_A, face=(-150, 15), props=False),
             director=fig('director', *DESK_D, face=(-150, 15), props=False)), pr0 + [CAMERA(-170, 72, math.pi)], DAY,
     cam((0, 110, -100), (-60, 70, 60), 46), [dict(id='cinematographer', primary=True, face=True)], beat(sid, 'K2')),
 key('K3', B(cinematographer=fig('cinematographer', -66, -48, face=O_SET, props=False), director=fig('director', 40, -20, face=(-95, -40), props=False),
             agent=fig('agent', 85, 10, face=(-95, -40), props=False)), pr0 + [CAMERA(-110, 5, AIM(-110, 5, -235, 150))], DAY,
     cam((40, 120, -160), (-120, 70, 60), 44), [dict(id='cinematographer', primary=True, face=True), dict(id='director', soft=True)], beat(sid, 'K3')),
 key('K4', B(director=fig('director', *CHAIR, face=O_SET, sit=True, props=False), cinematographer=fig('cinematographer', 0, 0, absent=True),
             agent=fig('agent', 285, 150, face=(300, 300), props=False), odysseus=fig('odysseus', 225, 120, face=(285, 150), props=True)),
     pr0 + [CAMERA(-110, 5, AIM(-110, 5, -235, 150))], NIGHT, cam((120, 120, -40), (280, 90, 200), 46), [dict(id='agent', primary=True), dict(id='odysseus', soft=True)], beat(sid, 'K4')),
 key('K5', B(director=fig('director', *CHAIR, face=O_SET, sit=True, props=False), cinematographer=fig('cinematographer', 0, 0, absent=True),
             agent=fig('agent', 285, 150, face=(300, 300), props=False), odysseus=fig('odysseus', 225, 120, face=(285, 150), props=True)),
     pr0 + [CAMERA(-110, 5, AIM(-110, 5, -235, 150))], DARK, cam((140, 110, -20), (260, 80, 160), 46), [dict(id='agent', primary=True), dict(id='odysseus', soft=True)], 'The power goes: the container restarts.', after=['K4', round(DOWN - K4AT, 2)]),
 key('K6', B(director=fig('director', *CHAIR, face=O_SET, sit=True, props=False), cinematographer=fig('cinematographer', 0, 0, absent=True),
             agent=fig('agent', 285, 150, face=(300, 300), props=False), odysseus=fig('odysseus', 225, 120, face=(285, 150), props=True)),
     pr0 + [CAMERA(-110, 5, AIM(-110, 5, -235, 150))], NIGHT, cam((140, 110, -20), (260, 80, 160), 46), [dict(id='agent', primary=True, face=True)], 'The power comes back; the render resumes.', after=['K4', round(UP - K4AT, 2)]),
]
# ---- 3: the wall; keep both ----
sid = 'OD-B25-S03'
GATE = (330, -180)
base = dict(director=fig('director', 170, -60, face=(250, -180), props=False), cinematographer=fig('cinematographer', 225, -40, face=(250, -180), props=False),
            agent=fig('agent', 180, -180, face=GATE, pose=PUSH, props=False), odysseus=fig('odysseus', *O_SET, face=(-60, 0), props=True), examiner=fig('examiner', 0, 0, absent=True))
pr = SET_PROPS + [RAM(), CAMERA(*CAM0, AIM(*CAM0, *O_SET)), prop('reels16', 90, 290, h=120, floor=False)]
SC[sid] = [
 key('K1', B(), pr + [prop('bundle', 255, -180)], DAY, cam((60, 150, -330), (260, 90, -170), 44), [dict(id='agent', primary=True, face=True), dict(id='director', soft=True), dict(id='prop:bundle', soft=True, cut=True)], beat(sid, 'K1')),
 key('K1a', B(agent=fig('agent', 210, -115, face=(170, -60), props=False)), pr + [prop('bundle', 255, -180)], DAY, cam((60, 150, -330), (260, 90, -170), 44),
     [dict(id='agent', primary=True, face=True)], 'The agent steps round the block to answer.', after=['K1', 2.2]),
 key('K1b', B(agent=fig('agent', 200, -150, face=(250, -150), props=True)), pr + [prop('brickHeap', 250, -150)], DAY, cam((60, 150, -330), (260, 90, -170), 44),
     [dict(id='agent', primary=True), dict(id='prop:brickHeap', soft=True, cut=True)], 'The agent splits the bundle into small bricks.', after=['K1', 17.3]),
 key('K2', B(agent=fig('agent', 358, -185, face=(200, -185), props=True), director=fig('director', 225, -150, face=GATE, props=False), cinematographer=fig('cinematographer', 230, -60, face=GATE, props=False)),
     pr + [prop('brickHeap', 250, -150), prop('brickStack', 375, -240)], DAY, cam((150, 110, -200), (340, 80, -180), 46), [dict(id='agent', primary=True, face=True)], beat(sid, 'K2')),
 key('K3', B(agent=fig('agent', 60, 240, face=(20, 100), pose=ARM_UP, props=False), director=fig('director', -5, -35, face=(60, 240), props=False),
             cinematographer=fig('cinematographer', -110, -20, face=(60, 245), props=False)),
     pr + [prop('brickStack', 375, -240), dict(name='reel', id='reelNew', after=True, aim=dict(to='hand:agent:R', anchor='hub', dir=[0, -1, 0]))], DAY,
     cam((60, 120, 60), (70, 80, 260), 44), [dict(id='agent', primary=True), dict(id='director', soft=True)], beat(sid, 'K3')),
 key('K4', B(agent=fig('agent', 95, 225, face=(30, 210), props=False), director=fig('director', 30, 210, face=(95, 225), pose={'armRP': [-0.9, 0, 0]}, props=False),
             cinematographer=fig('cinematographer', 40, 130, face=(60, 230), props=False)),
     pr + [prop('brickStack', 375, -240), prop('reels17', 90, 290, h=48, floor=False, pid='kept')], DAY,
     cam((10, 110, 80), (60, 80, 240), 46), [dict(id='director', primary=True, face=True), dict(id='agent', soft=True)], beat(sid, 'K4')),
]
# ---- 4: the ledger; make it a film ----
sid = 'OD-B25-S04'
LECT = (-300, -200); EX0 = (-300, -160)
base = dict(director=fig('director', -215, -135, face=EX0, props=False), cinematographer=fig('cinematographer', -360, -110, face=EX0, props=False),
            agent=fig('agent', -250, -90, face=EX0, props=False), odysseus=fig('odysseus', -180, -195, face=EX0, props=True),
            examiner=fig('examiner', *EX0, face=LECT, pose={'armRP': [-1.2, 0, 0]}, props=True))
pr = SET_PROPS + [RAM(), CAMERA(*CAM0, AIM(*CAM0, *O_SET)), prop('reels16', 90, 290, h=120, floor=False), prop('reels17', 90, 290, h=48, floor=False, pid='kept'), prop('brickStack', 375, -240)]
SC[sid] = [
 key('K1', B(), pr, DAY, cam((-120, 110, -60), (-290, 80, -190), 44), [dict(id='examiner', primary=True, face=True), dict(id='director', soft=True)], beat(sid, 'K1')),
 key('K2', B(examiner=fig('examiner', 300, 175, face=(300, 300), pose={'armRP': [-1.2, 0, 0]}, props=True), director=fig('director', 200, 90, face=(300, 175), props=False),
             agent=fig('agent', 250, 60, face=(300, 175), props=False), cinematographer=fig('cinematographer', 140, 120, face=(300, 175), props=False), odysseus=fig('odysseus', 160, 40, face=(300, 175), props=True)),
     pr, DAY, cam((120, 110, 20), (300, 100, 220), 46), [dict(id='examiner', primary=True)], beat(sid, 'K2')),
 key('K3', B(examiner=fig('examiner', 25, 235, face=(150, 245), pose=LENS, props=True), director=fig('director', 30, 165, face=(25, 235), props=False),
             agent=fig('agent', 150, 160, face=(95, 240), props=False), cinematographer=fig('cinematographer', -40, 190, face=(25, 235), props=False), odysseus=fig('odysseus', 210, 200, face=(25, 235), props=True)),
     pr, DAY, cam((60, 110, 90), (90, 90, 270), 44), [dict(id='examiner', primary=True)], beat(sid, 'K3')),
 key('K4', B(examiner=fig('examiner', 80, 225, face=(30, 170), props=True), director=fig('director', 30, 170, face=(80, 225), props=False),
             agent=fig('agent', 150, 160, face=(80, 225), props=False), cinematographer=fig('cinematographer', -30, 210, face=(80, 225), props=False), odysseus=fig('odysseus', 210, 200, face=(80, 225), props=True)),
     pr, DAY, cam((-30, 100, 90), (60, 85, 210), 44), [dict(id='examiner', primary=True, face=True), dict(id='director', soft=True)], beat(sid, 'K4')),
 key('K5', B(examiner=fig('examiner', 80, 225, face=(30, 170), props=True), director=fig('director', 40, 120, face=(110, 100), props=False),
             agent=fig('agent', 110, 100, face=(40, 120), props=False), cinematographer=fig('cinematographer', -30, 170, face=(40, 120), props=False), odysseus=fig('odysseus', 180, 170, face=(40, 120), props=True)),
     pr, DAY, cam((40, 100, 0), (70, 80, 130), 44), [dict(id='director', primary=True, face=True), dict(id='agent', soft=True)], beat(sid, 'K5')),
 key('K6', B(examiner=fig('examiner', 130, 60, face=(-120, -60), props=True), director=fig('director', 40, 40, face=(-120, -60), props=False),
             agent=fig('agent', 85, 50, face=(-120, -60), props=False), odysseus=fig('odysseus', 175, 70, face=(-120, -60), props=True),
             cinematographer=fig('cinematographer', -180, -94, face=(60, 50), props=False)),
     [x for x in pr if x['id'] != 'camera'] + [CAMERA(-120, -60, AIM(-120, -60, 90, 50))], DAY, cam((-190, 125, -105), (70, 70, 40), 40),
     [dict(id='director', primary=True, face=True), dict(id='agent', soft=True), dict(id='examiner', soft=True)], beat(sid, 'K6')),
]

if __name__ == '__main__':
    for sid, keys in SC.items():
        spec = dict(scene=sid, location='odyssey-' + sid.lower(), title=S.SCENES[sid]['title'], source='The making of the LEGO Odyssey: odyssey/forensics/findings.json (the facts); tools/making/lego_script.py (the script)',
                    note='The making-of film in the LEGO film studio (tools/making/studio.py): the director, the agent, the cinematographer, Odysseus and the examiner. Marks in tools/making/keys.py.',
                    look=DAY, spread=0, blocking=[], walkHeight='first', keys=keys)
        (REPO / 'odyssey/keyframes' / (sid + '.json')).write_text(json.dumps(spec, indent=1))
        print(sid, len(keys), 'keys')

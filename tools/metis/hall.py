#!/usr/bin/env python3
"""tools/metis/hall.py — the hall's causal map (odyssey/metis, proof 03): the look, the keyframes and the shot plans of OD-B21-S07 (the
bow) and OD-B22-S01 (Antinous falls) on the Bow and the Hall kit (film-readymades/staging_hall.py), written from the kit's own frame.

  python3 tools/metis/hall.py            -> odyssey/metis/looks/hearth-hall.json, odyssey/keyframes/OD-B21-S07.json, OD-B22-S01.json,
                                            tools/cinematographer/plans/OD-B21-S07.json, OD-B22-S01.json (the shots re-laid; the
                                            performance, its sheet and its clock are not touched)

Every place is written in the kit's frame (LDraw units: x down the hall from the doors at -560 to the throne at +520, z across with the
front wall at +240, heights as yup over the base) and turned into the location's frame with the centre and scale the build gave it
(film-readymades/production/odyssey-od-b21-s07.json): film = ((x - cx) s, (yup - cy) s, (-z - cz) s).
The keys keep the beats, texts and poses the scenes had; the marks, faces, cameras, hides and props are the hall's.
"""
from pathlib import Path
import copy, json, math, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'film-readymades'))
import staging_hall as SH

loc = json.loads((ROOT / 'film-readymades/production/odyssey-od-b21-s07.json').read_text())
C, S = loc['center'], loc['scale']
r2 = lambda v: round(v, 2)
def F(x, yup, z): return [r2((x - C[0]) * S), r2((yup - C[1]) * S), r2((-z - C[2]) * S)]
def F2(x, z): p = F(x, 0, z); return p[0], p[2]
M = SH.MARKS
LOOK = 'odyssey/metis/looks/hearth-hall.json'

# ── the look: hearth and torches, the night in through the smoke hole and the doors (the kit's frame; odyssey-light.js turns it) ──
torch = dict(color='#ffa04a', intensity=1.25, distance=340, decay=2.0, flicker=0.22, sway=2.5)
look = {
    'name': 'hearth-hall', 'about': 'Odysseus\'s hall at night: the hearth and six torches the only warm light, flickering on the drawing; '
    'a dim blue night everywhere (a hemisphere), down through the clerestory\'s smoke hole (a spot) and in at the great doors while '
    'they stand open (a spot that closes with them). The kit\'s frame: LDraw units, x down the hall, yup, z across.',
    # five practicals carry light (the hearth, the torches on the two columns nearer the doors, the torches either side of the doors);
    # the two torches on the far columns burn (their flames are bricks lit from inside) but the hearth lights that end: the cost of a
    # light on the CPU renderer is paid on every pixel
    'lights': [dict(name='hearth', at=[300, 95, 0], color='#ff8c3a', intensity=1.7, distance=620, decay=1.7, flicker=0.32, sway=4)] +
              [dict(torch, name=n, at=[x, 195, z]) for n, x, z in (('torch c1', 140, -108), ('torch c2', 140, 108))] +
              [dict(torch, name=n, at=[x, 190, z], intensity=1.9, distance=400) for n, x, z in (('torch d1', -525, -140), ('torch d2', -525, 140))] +
              # the fire-bowl before the sill (staging_hall.BRAZIER): the firelight that keys the archer's face, low and warm
              [dict(name='brazier', at=[-445, 118, -80], color='#ffa04a', intensity=1.5, distance=300, decay=1.8, flicker=0.25, sway=2.5)],
    'edges': 0.22,
    'night': dict(sky='#3a4c7a', ground='#2a1a10', intensity=0.14),
    'moon': dict(at=[300, 460, 0], to=[300, 0, 0], color='#8aa4ff', intensity=0.9, angle=26, penumbra=0.7, distance=900, decay=1),
    'door': dict(at=[-800, 150, 0], to=[-300, 0, 0], color='#7f9cff', intensity=1.1, angle=20, penumbra=0.6, distance=1000, decay=1),
    'flames': [dict(a='hearth fire', b='hearth fire 2', seed=3), dict(a='torch flames', b='torch flames 2', seed=11)],
    'glow': dict(labels=['hearth fire', 'hearth fire 2', 'torch flames', 'torch flames 2'], color='#ff6a10', intensity=0.55, opacity=0.8),
}
# the key's look (odyssey-runtime.js kfLight/kfLook): the location's day lights nearly out, a night sky beyond the doors and the smoke hole
KEYLOOK = {'sky': ['#05070f', '#18203a'], 'fog': [1400, 3200], 'dim': 0.04, 'fill': {'sky': '#33405e', 'ground': '#1c130c', 'intensity': 0.04}, 'exposure': 1.15}

DOORS = {'leaves': [{'label': 'door leaf', 'hinge': list(SH.HINGES['door leaf']), 'open': -90}, {'label': 'door leaf 2', 'hinge': list(SH.HINGES['door leaf 2']), 'open': 90}]}


def blk(e, at, face, **kw):
    """a blocking entry at a kit mark (x, z), facing a kit point or an actor id"""
    x, z = F2(*at); out = dict(e); out.update(x=x, z=z, y='floor')
    out['face'] = face if isinstance(face, str) else list(F2(*face))
    out.pop('on', None); out.update(kw); return out


def cam(pos, target, fov):
    return {'type': 'wide', 'pos': F(*pos), 'target': target if isinstance(target, str) else F(*target), 'fov': fov}


def keys21():
    spec = json.loads((ROOT / 'odyssey/keyframes/OD-B21-S07.json').read_text())
    old = {k['id']: k for k in spec['keys']}
    SILL, LINE = M['sill'], (100, -10)
    # the suitors at the tables either side of the line, facing the sill; the corridor from the sill down the axes kept clear
    SUIT = {'six-suitors-1': (-300, 135), 'six-suitors-2': (-160, 135), 'six-suitors-3': (-320, -135), 'six-suitors-4': (-40, 135),
            'six-suitors-5': (-170, -135), 'six-suitors-6': (-40, -135)}
    TEL0, TEL1 = (-200, -135), (-500, 62)
    plan = {'K1': (SILL, TEL0), 'K2': (SILL, TEL0), 'K3': (SILL, TEL1), 'K4': (SILL, TEL1), 'K5': ((-505, -45), (-505, 45))}
    cams = {'K1': ((-552, 138, 52), (40, 60, -10), 50), 'K2': ((-470, 60, 70), (-530, 80, 0), 40), 'K3': ((-300, 110, -90), (-520, 70, 30), 44),
            'K4': ((-552, 96, 30), (70, 74, -10), 40), 'K5': ((-330, 90, -30), (-505, 75, 0), 38)}
    out = []
    for kid in ('K1', 'K2', 'K3', 'K4', 'K5'):
        k = copy.deepcopy(old[kid]); od, tl = plan[kid]
        bl = []
        for e in k['blocking']:
            if e['id'] == 'odysseus': bl.append(blk(e, od, 'telemachus' if kid == 'K5' else LINE))
            elif e['id'] == 'telemachus': bl.append(blk(e, tl, 'odysseus' if kid in ('K1', 'K2', 'K5') else LINE))
            else: bl.append(blk(e, SUIT[e['id']], SILL))
        k['blocking'] = bl
        k['hide'] = ['the arms']                                   # the pegs bare: the arms were carried to the storeroom (XIX.1-46)
        k['props'] = []                                            # the axes and the arrow are the set's now
        k['camera'] = cam(*cams[kid])
        k['subjects'] = [{'id': 'odysseus', 'min': 0.06, 'primary': True}]
        for x in ('turn', 'search', 'lensAllow'): k.pop(x, None)
        k.pop('look', None)
        out.append(k)
    spec['keys'] = out
    spec['look'] = KEYLOOK
    spec['note'] = ('Staged on the Bow and the Hall kit (film-readymades/staging_hall.py; tools/metis/hall.py writes these keys from the kit\'s frame): '
                    'the sill inside the great doors, the twelve axes on one line down the spine, their sockets at the height of the drawn bow, '
                    'the suitors at the tables either side of the line, the weapon pegs bare on the back wall by the doors. Night: the hearth and '
                    'six torches (odyssey/metis/looks/hearth-hall.json). The doors stand open until Telemachus reaches his father, then swing shut; '
                    'the arrow (a Technic axle) is slid down the line through all twelve sockets on the loose (33.42 s).')
    # the clock: the doors shut as Telemachus comes to the sill (the walk is 19.1-23.4 s); the arrow nocked from the draw, loosed at 33.42 s
    spec['hall'] = {'look': LOOK, 'doors': dict(DOORS, shut=[17.0, 19.0]),
                    'slides': [{'label': 'the arrow', 'from': [-470, 0, 0], 'showFrom': 33.0, 't0': 33.42, 't1': 34.17}]}
    return spec


def plan21(spec):
    P = json.loads((ROOT / 'tools/cinematographer/plans/OD-B21-S07.json').read_text())
    LINE_CAM = dict(pos=F(-640, 124, 30), target=F(120, 60, -10), fov=44)        # from the porch through the open doors, over the sill, down the line
    AXIS_REV = dict(pos=F(60, 140, -24), target=F(-520, 70, 0), fov=26)         # the same axis from its far end: the arrow, the twelve sockets, the archer
    shots = [
        dict(t0=0, t1=5.167, kind='WIDE', size='WIDE', subjects=['odysseus'], primary='odysseus', pin=LINE_CAM, beat='K1',
             why='establish the sill-to-axes line: the archer on the sill, the twelve axes down the spine, the suitors either side, the hearth beyond; the doors open behind the lens'),
        dict(t0=5.167, t1=9.6, kind='HOT', size='MID', subjects=['odysseus'], primary='odysseus', beat='K1'),
        dict(t0=9.6, t1=13.4, kind='INSERT', size='CLOSE', subjects=['odysseus'], primary='odysseus', object='bow', insert='the string plucked', beat='K2',
             pin=dict(pos=F(-470, 74, 46), target=F(-528, 70, 2), fov=36), why='hold on the bowstring\'s sound: the pluck and "Hear that. It still sings."'),
        dict(t0=13.4, t1=15.417, kind='REACT', size='MID', subjects=['six-suitors-1', 'six-suitors-2', 'six-suitors-4'], primary='six-suitors-1', line=['odysseus', 'six-suitors-1'], beat='K2'),
        dict(t0=15.417, t1=19.4, kind='WIDE', size='WIDE', subjects=['odysseus', 'telemachus'], primary='odysseus', beat='K2',
             pin=dict(pos=F(-250, 118, -70), target=F(-560, 72, 10), fov=50), why='the reverse on the doors: open on the night porch, then swung shut (17-19 s); the bare pegs on the back wall'),
        dict(t0=19.4, t1=23.27, kind='REACT', size='CLOSE', subjects=['six-suitors-2'], primary='six-suitors-2', line=['telemachus', 'six-suitors-2'], beat='K2'),
        dict(t0=23.27, t1=33.45, kind='WIDE', size='WIDE', subjects=['telemachus', 'odysseus'], primary='telemachus', beat='K3',
             pin=dict(pos=F(-330, 145, 75), target=F(-500, 90, -110), fov=54), why='two men at the threshold, the doors shut behind them, the pegs bare on the wall beside them'),
        dict(t0=33.45, t1=37.2, kind='INSERT', size='WIDE', subjects=['six-suitors-4'], primary='six-suitors-4', object='axes', insert='the arrow through the axes', beat='K4',
             pin=dict(pos=F(-150, 250, 150), target=F(-150, 70, -10), fov=62), why='cut on the loose (33.42 s) to the line from above its side: the arrow carried through all twelve sockets in nine drawings and out past the last'),
        dict(t0=37.2, t1=41.417, kind='INSERT', size='CLOSE', subjects=['six-suitors-4'], primary='six-suitors-4', object='the arrow', insert='out at the last', beat='K4',
             pin=dict(pos=F(150, 100, 50), target=F(70, 74, -10), fov=34), why='the arrow at rest: through the last socket and out, its bronze point past it'),
        dict(t0=41.417, t1=45.0, kind='HOT', size='MID', subjects=['odysseus'], primary='odysseus', line=['telemachus', 'odysseus'], beat='K5'),
        dict(t0=45.0, t1=48.25, kind='HOT', size='CLOSE', subjects=['odysseus'], primary='odysseus', line=['telemachus', 'odysseus'], beat='K5'),
        dict(t0=48.25, t1=51.45, kind='WIDE', size='WIDE', subjects=['odysseus', 'telemachus'], primary='odysseus', pin=AXIS_REV, beat='K5',
             why='return to the same hall axis, now his: down the line from its far end, the arrow through all twelve, the archer and his son on the sill before the shut doors'),
    ]
    for i, s in enumerate(shots): s.update(i=i, aim='head', angle='eye', lens='normal'); s.setdefault('line', None)
    P['shots'] = shots; P['title'] = 'The Bow Sings: the line, the string, the doors, the axes (the hall kit, tools/metis/hall.py)'
    P['generated'] = {'by': 'tools/metis/hall.py (from tools/cinematographer/plan.js\'s plan, re-laid by hand on the hall kit)', 'at': '2026-10-07'}
    return P


def keys22():
    spec = json.loads((ROOT / 'odyssey/keyframes/OD-B22-S01.json').read_text())
    old = {k['id']: k for k in spec['keys']}
    SILL, LINE, ANT = M['sill'], (100, -10), M['antinous']
    AT = {'suitors-1': (-320, -135), 'suitors-2': (-160, 135), 'suitors-3': (-300, 135), 'suitors-4': (-40, 135), 'suitors-5': (-170, -135)}
    WALL = (-470, -280)
    K4 = {'suitors-1': ((-505, -190), WALL), 'suitors-2': ((-455, -190), WALL), 'suitors-5': ((-405, -190), WALL),
          'suitors-3': ((-370, 195), (-370, 300)), 'suitors-4': ((60, 120), ANT)}
    ody = {'K1': (SILL, LINE), 'K2': ((-515, 10), ANT), 'K3': (SILL, ANT), 'K4': (SILL, LINE), 'K5': (SILL, LINE)}
    tel = {'K1': (-500, 62), 'K2': (-500, 62), 'K3': (-500, 62), 'K4': (-500, 62), 'K5': (-500, 62)}
    cams = {'K1': ((-552, 138, 52), (40, 60, -10), 50), 'K2': ((-552, 100, -34), (80, 80, 70), 36), 'K3': ((0, 120, 170), (100, 55, 70), 44),
            'K4': ((-300, 120, 40), (-470, 110, -230), 50), 'K5': ((-330, 90, -30), (-530, 75, 0), 38)}
    props = {'K1': [{'name': 'arrows', 'id': 'arrows', 'at': F(-500, 0, 0), 'floor': True, 'scale': 1.4}],
             'K3': [{'name': 'blood', 'id': 'blood', 'at': F(140, 0, 40), 'floor': True}, {'name': 'wine', 'id': 'wine', 'at': F(60, 0, 30), 'floor': True}]}
    out = []
    for kid in ('K1', 'K2', 'K3', 'K4', 'K5'):
        k = copy.deepcopy(old[kid]); bl = []
        for e in k['blocking']:
            i = e['id']
            if i == 'odysseus-revealed': bl.append(blk(e, *ody[kid]))
            elif i == 'telemachus': bl.append(blk(e, tel[kid], ANT if kid in ('K2', 'K3') else LINE))
            elif i == 'antinous': bl.append(blk(e, ANT if kid in ('K1', 'K2') else (84, 70), SILL))
            elif kid == 'K4': bl.append(blk(e, *K4[i]))
            elif kid == 'K5' and i in K4: bl.append(blk(e, K4[i][0], SILL))
            else: bl.append(blk(e, AT[i], ANT if kid in ('K2', 'K3') else SILL))
        k['blocking'] = bl
        k['hide'] = ['the arms']
        if kid in props: k['props'] = props[kid]
        elif kid == 'K2': pass                                      # the arrow aimed from the archer to Antinous's throat, as before
        else: k['props'] = []
        k['camera'] = cam(*cams[kid])
        for x in ('turn', 'search'): k.pop(x, None)
        k.pop('look', None)
        out.append(k)
    spec['keys'] = out
    spec['look'] = KEYLOOK
    spec['note'] = ('Staged on the Bow and the Hall kit (film-readymades/staging_hall.py; tools/metis/hall.py): Odysseus on the sill inside the '
                    'shut doors, the arrow of the contest at rest through the twelve axes, Antinous behind his table across the line beyond the '
                    'last axe, the suitors at the tables either side; they run for the arms to the pegs on the back wall by the doors, and to the '
                    'postern, and find them bare. Night: the hearth and six torches (odyssey/metis/looks/hearth-hall.json).')
    spec['hall'] = {'look': LOOK, 'doors': dict(DOORS, shut=[-2, -1])}
    return spec


def plan22(spec):
    P = json.loads((ROOT / 'tools/cinematographer/plans/OD-B22-S01.json').read_text())
    LINE_CAM = dict(pos=F(215, 104, -40), target=F(-520, 70, 0), fov=42)          # the axis from its far end, Antinous at his table beside it
    sh = {s['i']: s for s in P['shots']}
    sh[0].update(pin=LINE_CAM, why='the hall\'s axis from the sill: the line the arrow of the contest took, the suitors at the tables, Antinous beyond the last axe')
    sh[4].update(t1=12.4, kind='HOT', size='MID', subjects=['odysseus-revealed'], primary='odysseus-revealed', line=None,
                 pin=dict(pos=F(-552, 100, -34), target=F(80, 82, 70), fov=34), why='down the line of fire: the draw, Antinous small at his table at its end')
    sh[5].update(t0=12.4, kind='HOT', size='MID', subjects=['antinous'], primary='antinous', line=None,
                 pin=dict(pos=F(-90, 90, 20), target=F(80, 86, 70), fov=30), why='cut on the released force: from the loose (12.33 s) to Antinous, the cup at his lips')
    sh[12].update(pin=dict(pos=F(-300, 120, 40), target=F(-470, 112, -230), fov=50), subjects=['suitors-1', 'suitors-2', 'suitors-5'], primary='suitors-1', line=None,
                  why='the consequence: the pegs on the wall bare under their hands')
    sh[20].update(pin=LINE_CAM, line=None, why='the same hall axis, now his: the archer on the sill, the suitors at the bare walls')
    P['title'] = 'Antinous Falls: the line of fire, the bare pegs (the hall kit, tools/metis/hall.py)'
    P['generated'] = {'by': 'tools/metis/hall.py (from tools/cinematographer/plan.js\'s plan, five shots re-laid by hand on the hall kit)', 'at': '2026-10-07'}
    return P


def write(p, d): (ROOT / p).write_text(json.dumps(d, indent=1, ensure_ascii=False) + '\n'); print('wrote', p)


if __name__ == '__main__':
    write(LOOK, look)
    s21 = keys21(); write('odyssey/keyframes/OD-B21-S07.json', s21)
    write('tools/cinematographer/plans/OD-B21-S07.json', plan21(s21))
    if '--b22' in sys.argv:
        s22 = keys22(); write('odyssey/keyframes/OD-B22-S01.json', s22)
        write('tools/cinematographer/plans/OD-B22-S01.json', plan22(s22))
    print('centre', C, 'scale', S, '| sill', F(*M['sill'][:1], 0, M['sill'][1]))

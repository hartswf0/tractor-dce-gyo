"""Staging overlays: a scene card as the film player builds it, when the forage's card (odyssey/cards/<id>.mpd, odyssey/previs/<id>.json)
is not yet the set the scene is played on. The forage's files stay as the forage wrote them; build_odyssey.py calls card(sid, text, pv)
and builds from what it returns.

  OD-B09-S08  the forage's cave, with the two men Polyphemus eats at dawn added to the cast (crewman-1, crewman-2): the four helpers
              and Odysseus survive the scene, the two are seized, and actors are what the engine can put in a giant's fist
  OD-B09-S10  the cave mouth: the forage's card is a bare beach, so the set is the Cyclops kit's headland and shore
              (tools/forage/product/cyclops.py) without its posed moment (the giant, the stake, the four men, the bowl), its nameplate
              or the three rams in the yard (the keyframes stage the flock as props, which the creature rigs replace), turned so the
              lane out of the cave runs toward +z; the cast is Odysseus and six men for the undersides of the rams
"""
from pathlib import Path
import copy, json, math, re, sys

R = Path(__file__).parent; REPO = R.parent; CARDS = REPO / 'odyssey/cards'
HEAD = '0 Author: word to world, film-readymades/staging.py (from tools/odyssey-forage.js and tools/forage/product/cyclops.py)\n0 !LDRAW_ORG Unofficial_Model\n0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt\n'


def _file(text, name):
    """one FILE block of an MPD, header and all"""
    for b in re.split(r'(?m)^(?=0 FILE )', text):
        if b.startswith('0 FILE ' + name + '\n') or b.startswith('0 FILE ' + name + '\r\n'): return b.rstrip('\n') + '\n'
    raise KeyError(name)


def _renamed(block, old, new):
    return block.replace(old, new)


def _block(name, title, rows):
    return f'0 FILE {name}\n0 {title}\n0 Name: {name}\n' + HEAD + '\n' + '\n'.join(rows) + '\n'


def b09_s08(text, pv):
    """two more men in the cave: the dawn meal's victims, beside the pen where the giant finds them"""
    sid = 'OD-B09-S08'; top = f'{sid} - the-name-nobody-and-the-stake.ldr'
    src = _file((CARDS / 'OD-B09-S09.mpd').read_text(), 'OD-B09-S09 - warrior-3.ldr')
    src2 = _file((CARDS / 'OD-B09-S09.mpd').read_text(), 'OD-B09-S09 - warrior-4.ldr')
    extra = [('crewman-1', src, 'OD-B09-S09 - warrior-3.ldr', 160, 60), ('crewman-2', src2, 'OD-B09-S09 - warrior-4.ldr', 240, 60)]
    for name, blk, old, x, z in extra:
        fn = f'{sid} - {name}.ldr'
        text = text.rstrip('\n') + '\n\n' + _renamed(blk, old, fn).replace(old.replace('.ldr', '').split(' - ')[1].replace('-', ' '), name.replace('-', ' '))
        text = text.replace(f'1 16 140 -8 -40 1 0 0 0 1 0 0 0 1 {sid} - wine-cup.ldr',
                            f'1 16 140 -8 -40 1 0 0 0 1 0 0 0 1 {sid} - wine-cup.ldr\n1 16 {x} -8 {z} 1 0 0 0 1 0 0 0 1 {fn}', 1)
        pv['cast'].append(dict(who='ensemble.crew', name=name.replace('-', ' ').upper(), type='character', file=fn, at=[x, -8, z]))
    return text, pv


def b09_s10(text, pv):
    """the cave mouth and the yard before it, and the shore below, from the Cyclops kit; Odysseus and six men"""
    sid = 'OD-B09-S10'
    sys.path.insert(0, str(REPO / 'tools/forage/product'))
    import cyclops as C
    rows = [l for l in (CARDS / 'set.cyclops-cave.mpd').read_text().splitlines() if l.startswith('1 ')]
    groups = dict(floor=C.ground(), fire=C.fire(100, -240), racks=C.cheese_rack(-160, -220), moment=C.blinding(-60, -360),
                  laurels=C.greenery(), yard=C.yard_wall(), plaque=C.plaque(), shore=C.shore())
    galley = set(C.row(r['col'], C.mat_mul(C.mat_mul(C.T(260, -(C.GRASS + 8), C.SHORE + 200), C.RY(math.pi / 2)), r['m']), r['part']) for r in C.GALLEY)
    shore_fig = set(C.figure(C.W, 'warrior-4', 60, C.GRASS + 8, C.SHORE + 20, math.pi))
    taken = set(l for g in groups.values() for l in g)
    rock = [l for l in rows if l not in taken]
    # the roof off the vault, as the forage's caves are open above: over the main vault (the kit's ellipse at (-20, -250), 230 x 175
    # LDU) and behind the front of the mouth (z < -110), every rock part goes, so the floor inside is the ground a prop or a man is
    # set on and a camera can look in; the arch over the mouth tunnel stays, so from outside the mouth is still a mouth
    def roof(l):
        t = l.split(); x, y, z = float(t[2]), float(t[3]), float(t[4])
        return ((x + 20) / 222) ** 2 + ((z + 250) / 168) ** 2 < 1 and z < C.MOUTH and -y > C.FLOOR + 30
    cut = sum(roof(l) for l in rock); rock = [l for l in rock if not roof(l)]
    groups['laurels'] = [l for l in groups['laurels'] if not roof(l)]   # the plants that grew on the roof go with it
    base = [l for l in groups['floor'] if l.split()[-1] in ('3811.dat', '3857.dat')] + [l for l in groups['shore'] if l.split()[-1] in ('3857.dat', '3867.dat')]
    floor = [l for l in groups['floor'] if l not in base]
    yard = [l for l in groups['yard'] if not l.endswith('95341.dat')]                  # the rams are the keyframes' props
    shore = [l for l in groups['shore'] if l not in base and l not in galley and l not in shore_fig]
    ship = [l for l in groups['shore'] if l in galley]
    # the stage: one sub-build a piece; the kit's own frame turned half round, so the mouth opens toward +z in the film's world
    subs = [('the headland', rock), ('the cave floor', floor), ('the fire', groups['fire']), ('the cheese racks', groups['racks']),
            ('the laurels', groups['laurels']), ('the yard wall', yard), ('the shore', shore), ('the black ship', ship)]
    turn = '-1 0 0 0 1 0 0 0 -1'
    out = [f'0 FILE {sid}.ldr\n0 ESCAPE BENEATH THE RAMS\n0 Name: {sid}.ldr\n' + HEAD + '\n'
           f'1 16 0 0 0 {turn} {sid} - plate.ldr\n0 STEP\n1 16 0 0 0 {turn} {sid} - escape-beneath-the-rams.ldr\n0 STEP\n']
    out.append(_block(f'{sid} - plate.ldr', 'plate', base))
    cast_rows, cast_files = [], []
    # the men: Odysseus from the forage's card, six crew dressed as the forage's warriors (the kit's frame: the cave inside at -z, the
    # mouth at z ~ 100, the yard to z ~ 160); they stand inside the cave by the flock
    s09 = (CARDS / 'OD-B09-S09.mpd').read_text()
    odys = _file(text, f'{sid} - odysseus.ldr')
    cast_files.append(odys); cast_rows.append(f'1 16 -20 -12 -150 1 0 0 0 1 0 0 0 1 {sid} - odysseus.ldr')
    spots = [(-140, -200), (-100, -200), (-60, -200), (20, -200), (60, -200), (100, -200)]
    for i, (x, z) in enumerate(spots):
        w = (i % 4) + 1; old = f'OD-B09-S09 - warrior-{w}.ldr'; fn = f'{sid} - crewman-{i + 1}.ldr'
        cast_files.append(_file(s09, old).replace(old, fn).replace(f'warrior {w}', f'crewman {i + 1}'))
        cast_rows.append(f'1 16 {x} -12 {z} 1 0 0 0 1 0 0 0 1 {fn}')
    out.append(_block(f'{sid} - escape-beneath-the-rams.ldr', 'escape beneath the rams', [f'1 16 0 0 0 1 0 0 0 1 0 0 0 1 {sid} - the-cave-mouth.ldr'] + cast_rows))
    out.append(_block(f'{sid} - the-cave-mouth.ldr', 'the cave mouth', [f'1 16 0 0 0 1 0 0 0 1 0 0 0 1 {sid} - {n.replace(" ", "-")}.ldr' for n, _ in subs]))
    for n, rs in subs: out.append(_block(f'{sid} - {n.replace(" ", "-")}.ldr', n, rs))
    out += cast_files
    pv = copy.deepcopy(pv)
    pv['cast'] = [dict(who='character.odysseus', name='ODYSSEUS', type='character', file=f'{sid} - odysseus.ldr')] + \
                 [dict(who='ensemble.crew', name=f'CREWMAN {i + 1}', type='character', file=f'{sid} - crewman-{i + 1}.ldr') for i in range(6)]
    for s in pv['shots']: s['camera']['subject'] = 0
    pv['set'] = 'the cave mouth (the Cyclops kit)'
    return '\n'.join(o.rstrip('\n') + '\n' for o in out), pv


def add_cast(sid, top, src, extra):
    """an overlay that adds figures to a card's cast, each dressed as a figure of another card (src: that card's id): extra is
    [(its file's name there, the new figure's name, LDraw x, z, {old part: new part})], placed in the card's top group"""
    def f(text, pv):
        pv = copy.deepcopy(pv); s = (CARDS / (src + '.mpd')).read_text()
        for old, name, x, z, swap in extra:
            fn = f'{sid} - {name}.ldr'; oldf = f'{src} - {old}.ldr'
            blk = _file(s, oldf).replace(oldf, fn).replace(old.replace('-', ' '), name.replace('-', ' '))
            for a, b in (swap or {}).items(): blk = blk.replace(a, b)
            text = text.rstrip('\n') + '\n\n' + blk
            i = text.index(f'0 FILE {top}'); j = text.index('\n0 FILE ', i + 1) if '\n0 FILE ' in text[i + 1:] else len(text)
            grp = text[i:j].rstrip('\n') + f'\n1 16 {x} -8 {z} 1 0 0 0 1 0 0 0 1 {fn}\n'
            text = text[:i] + grp + text[j:]
            who = ('ensemble.' + re.sub(r'-\d+$', 's', name)) if re.search(r'-\d+$', name) else 'character.' + name
            pv['cast'].append(dict(who=who, name=name.replace('-', ' ').upper(), type='character', file=fn, at=[x, -8, z]))
        return text, pv
    return f


# the Ox Hoof (OD-B20-S04): the forage's hall holds only Ctesippus, the beggar and Telemachus; three suitors at the tables to laugh at
# the throw and fall silent at the prince's threat, dressed as the Hall of Death's (OD-B20-S05) suitors 2 and 3 and its fourth with
# another head (its own is suitor 2's)
b20_s04 = add_cast('OD-B20-S04', 'OD-B20-S04 - the-ox-hoof.ldr', 'OD-B20-S05',
                   [('suitor-2', 'suitor-2', -220, 20, None), ('suitor-3', 'suitor-3', 220, 20, None), ('suitor-4', 'suitor-4', -220, -120, {'3626bp3r': '3626bp35'})])

# Supplication at Arete's Knees (OD-B07-S03): two Phaeacian lords at their wine in the hall, to fall silent at the stranger (dressed as
# the Convoy's (OD-B13-S01) Phaeacian sailors 3 and 5; the keyframes empty their hands)
b07_s03 = add_cast('OD-B07-S03', 'OD-B07-S03 - supplication-at-arete-s-knees.ldr', 'OD-B13-S01',
                   [('sailor-3', 'phaeacian-1', 200, 60, None), ('sailor-5', 'phaeacian-2', -200, 60, None)])
# Athena Reveals Herself at Pylos (OD-B03-S05): the forage's card has Athena only inside its transformation set piece (a still figure
# beside a sea-eagle); Mentor, whose shape she wears, as an actor of the cast, dressed as the previous scene's (OD-B03-S04)
b03_s05 = add_cast('OD-B03-S05', 'OD-B03-S05 - athena-reveals-herself-at-pylos.ldr', 'OD-B03-S04',
                   [('athena-as-mentor', 'athena-as-mentor', 80, -200, None)])
# Telemachus Lands in Secret (OD-B15-S05): Piraeus, to whom Telemachus entrusts the seer, and two of the crew on the beach, dressed as
# the voyage's (OD-B15-S03) sailors 2, 3 and 4
b15_s05 = add_cast('OD-B15-S05', 'OD-B15-S05 - telemachus-lands-in-secret.ldr', 'OD-B15-S03',
                   [('sailor-2', 'piraeus', 100, -160, None), ('sailor-3', 'sailor-1', 60, -240, None), ('sailor-4', 'sailor-2', 140, -240, None)])

OVERLAYS = {'OD-B09-S08': b09_s08, 'OD-B09-S10': b09_s10, 'OD-B20-S04': b20_s04, 'OD-B07-S03': b07_s03, 'OD-B03-S05': b03_s05, 'OD-B15-S05': b15_s05}


def card(sid, text, pv):
    f = OVERLAYS.get(sid)
    return f(text, pv) if f else (text, pv)


if __name__ == '__main__':   # python staging.py OD-B09-S10 > out.mpd   (to look at a staged card in an LDraw viewer)
    sid = sys.argv[1]
    t, p = card(sid, (CARDS / (sid + '.mpd')).read_text(), json.loads((REPO / 'odyssey/previs' / (sid + '.json')).read_text()))
    sys.stdout.write(t)

#!/usr/bin/env python3
"""tools/forage/product/wardrobe.py — the Odyssey line's wardrobe: re-dress a cast minifigure without touching its card.

    import sys, os; sys.path.insert(0, <tools/forage/product>)
    from wardrobe import dress, COSTUMES, survey

The cast lives in odyssey/cards/character.*.mpd and ensemble.*.mpd and is used as it is by the film and the kits. `dress` reads a
figure exactly as kitlib.figure does (same card, sub, x, yup, z, rot, m; feet on yup, faces -z at rot 0, +z at rot pi) and returns its
rows with parts and colours swapped by a costume spec. The card is never written.

  dress(card, sub, costume, x=0, yup=0, z=0, rot=0, m=None)      rows, like kitlib.figure(card, sub, x, yup, z, rot)
  dress('character.penelope', 'penelope', 'penelope')            a name looks the spec up in COSTUMES
  parts_of(card, sub)                                            the figure's parts by role: [{role, part, col, m, desc}]
  survey()                                                       print every principal's parts, colours and part descriptions

A costume spec is a dict. Keys are ROLES, or a part id present on the figure (e.g. '4524': the cape it wears). Values:
  int                  recolour the part (e.g. 'torso': 320)
  'part'               change the part, keep its colour ('headgear': '60751')
  ('part', col)        change both;   None: take the part off
  on a role the figure does not have, a value ADDS the part at the role's mount.
Roles (by part family, measured in the figure's own frame, hip origin at (0, -40, 0)):
  hips 3815*          leg.r 3816* / leg.l 3817* ('legs' sets both)       torso 973*       arm.r 3818 / arm.l 3819 ('arms' both)
  hand.r / hand.l 3820 ('hands' both)   head 3626*    headgear: what sits on the head (hair, helmet, hat, hood) at the head mount
  crown: a second piece on the head (circlet, tiara, wreath) set `crown_dy` LDU higher    neck / neck2: capes, armour, satchel at the neck
  skirt: a cloth skirt or kilt at the waist, over the legs        lower: a one-piece hips-and-skirt (36036, 24068) that REPLACES
  hips and both legs        held.r / held.l: what a hand grips (a new one is set in the hand by a grip learned from the cast's cards)
  extra: [(part, col, 12-matrix in the figure's frame)] anything else.
The pose (arms, hands, head turn) is the card's own: only what is worn and held changes.
"""
import math, os, re, sys, functools, glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kitlib, ldbox
from kitlib import T, RY, mat_mul, row, CARDS, ROOT

PARTS = os.path.join(ROOT, 'ldraw/parts')
HIP_Y, NECK_Y, HEAD_Y = -40, -74, -96


@functools.lru_cache(maxsize=None)
def desc(pid):
    f = os.path.join(PARTS, pid + '.dat')
    if not os.path.exists(f): return '(not in ldraw/parts)'
    return open(f, errors='ignore').readline()[2:].strip()


@functools.lru_cache(maxsize=None)
def colours():
    out = {}
    for l in open(os.path.join(ROOT, 'ldraw/LDConfig.ldr'), errors='ignore'):
        t = l.split()
        if len(t) > 4 and t[1] == '!COLOUR' and t[3] == 'CODE': out[int(t[4])] = t[2].replace('_', ' ')
    return out


def cname(c): return colours().get(c, str(c))


def inv(a):
    """inverse of a rigid 12-element LDraw matrix"""
    R = [[a[3], a[4], a[5]], [a[6], a[7], a[8]], [a[9], a[10], a[11]]]
    Rt = [[R[c][r] for c in range(3)] for r in range(3)]
    t = [-sum(Rt[r][q] * a[q] for q in range(3)) for r in range(3)]
    return t + [Rt[0][0], Rt[0][1], Rt[0][2], Rt[1][0], Rt[1][1], Rt[1][2], Rt[2][0], Rt[2][1], Rt[2][2]]


def apply(m, p): return [m[r] + sum(m[3 + 3 * r + q] * p[q] for q in range(3)) for r in range(3)]


def _parse(r):
    t = r.split()
    return {'col': int(t[1]), 'm': [float(v) for v in t[2:14]], 'part': t[14].replace('.dat', '')}


def local(card, sub):
    """the figure in its own frame (kitlib.figure at the origin, rot 0): feet on y=0, hip origin at (0, -40, 0)"""
    return [_parse(r) for r in kitlib.figure(card, sub, 0, 0, 0, 0)]


LOWER = {'36036', '24068'}
CLOTH = ('Minifig Skirt', 'Minifig Cape', 'Minifig Armour', 'Minifig Body Armour', 'Minifig Satchel', 'Minifig Scarf', 'Minifig Breastplate')


def role_of(p):
    pid, (x, y, z) = p['part'], p['m'][:3]
    if pid.startswith('3815') or pid in LOWER: return 'hips'
    if pid.startswith('3816'): return 'leg.r'
    if pid.startswith('3817'): return 'leg.l'
    if pid.startswith('973'): return 'torso'
    if pid == '3818': return 'arm.r'
    if pid == '3819': return 'arm.l'
    if pid == '3820': return 'hand.r' if x < 0 else 'hand.l'
    if pid.startswith('3626'): return 'head'
    if abs(x) < 3 and abs(z) < 3:
        if abs(y - HEAD_Y) <= 4: return 'headgear'
        if HEAD_Y - 40 < y < HEAD_Y - 4: return 'crown'
        if abs(y - NECK_Y) <= 4: return 'beard' if desc(pid).startswith('Minifig Beard') else 'neck'
        if abs(y - HIP_Y) <= 3 and desc(pid).startswith('Minifig Skirt'): return 'skirt'
    return 'held'


def parts_of(card, sub, figure=None):
    P = figure or local(card, sub)
    hands = {role_of(p): p for p in P if p['part'] == '3820'}
    out, seen = [], {}
    for p in P:
        r = role_of(p)
        if r == 'held':
            x = apply(p['m'], (0, 0, 0))
            near = min(hands.items(), key=lambda kv: sum((a - b) ** 2 for a, b in zip(kv[1]['m'][:3], x)))[0] if hands else 'hand.r'
            r = 'held.' + near[-1]
        if r in ('headgear', 'neck', 'held.r', 'held.l', 'crown') and r in seen: r = r + '2' if r + '2' not in seen else r + '3'
        seen[r] = 1
        out.append(dict(p, role=r, desc=desc(p['part'])))
    return out


# ---- grips: how a hand holds a thing -------------------------------------------------------------------------------------------------
# The cast's cards show where a hand's grip is: a sword, a wand and a bow sit with their bar at (0, -0.82, -9.89) in the hand's frame,
# turned the same way (the sword's matrix relative to the hand is the canonical GRIP_M). Shields clip on at their own (SHIELD_M, from
# the round shield), bows at theirs (BOW_M). A new held part is put with its grip point GRIP[part] (in its own frame, on its bar) on
# the hand's grip. Parts already held in a card keep the card's placement unless the costume changes them.
GRIP = {'4497': (0, 30, 0), '43899': (0, 30, 0), '92290': (0, -32, 0), '27256': (0, -6, 0), '36752a': (0, 0, 0), '6124b': (0, -6, 0),
        '102498': (0, -2, 0), '95049': (0, 8, 0), '95050': (0, 8, 0), '93252': (0, 26, 0), '3847': (0, 0, 0), '18034': (0, 0, 0),
        '2542': (0, 40, 0), '4332': (0, 40, 0), '4496': (0, 30, 0), '3959': (0, 0, 0), '86208': (0, 0, 0), '3957a': (0, 60, 0)}
SHIELDS = {'3876', '92747', '2586', '30166', '59231', '75902', '91884'}
BOWS = {'4499', '93231'}
GRIP_AT = (0, -0.82, -9.89)


@functools.lru_cache(maxsize=None)
def grips():
    """{part: (inv(hand) * item, 'r'|'l')} for every part a hand holds somewhere in the cast (first seen)"""
    out = {}
    for f in sorted(glob.glob(os.path.join(CARDS, 'character.*.mpd')) + glob.glob(os.path.join(CARDS, 'ensemble.*.mpd'))):
        card = os.path.basename(f)[:-4]
        for sub in re.findall(r'(?m)^0 FILE ' + re.escape(card) + r' - (.+)\.ldr', open(f).read()):
            if sub == 'plate': continue
            try: P = parts_of(card, sub)
            except ValueError: continue
            hands = {p['role']: p for p in P if p['part'] == '3820'}
            for p in P:
                h = hands.get(p['role'][:6].replace('held', 'hand'))
                if p['role'].startswith('held') and p['part'] not in out and h:
                    out[p['part']] = (mat_mul(inv(h['m']), p['m']), p['role'][5])
    return out


def grip(part, hand_m):
    """the matrix that puts `part` in the hand whose matrix is hand_m"""
    G = grips()
    if part in SHIELDS: return mat_mul(hand_m, G['3876'][0])
    if part in BOWS: return mat_mul(hand_m, G['4499'][0])
    R = G['3847'][0][3:]
    g = GRIP.get(part, (0, 0, 0))
    return mat_mul(mat_mul(hand_m, list(GRIP_AT) + R), T(*[-v for v in g]))


MOUNT = {'headgear': T(0, HEAD_Y, 0), 'neck': T(0, NECK_Y, 0), 'neck2': T(0, NECK_Y, 0), 'skirt': T(0, HIP_Y, 0),
         'lower': T(0, HIP_Y, 0), 'crown': T(0, HEAD_Y, 0)}
GROUPS = {'legs': ('leg.r', 'leg.l'), 'arms': ('arm.r', 'arm.l'), 'hands': ('hand.r', 'hand.l')}


def _val(v, part, col):
    if v is None: return None
    if isinstance(v, int): return part, v
    if isinstance(v, str): return v, col
    return v[0], v[1]


def costume_rows(card, sub, costume):
    """the dressed figure in its own frame: [{part, col, m, role}]"""
    spec = COSTUMES[costume] if isinstance(costume, str) else dict(costume or {})
    for g, rs in GROUPS.items():
        if g in spec:
            for r in rs: spec.setdefault(r, spec[g])
    P = parts_of(card, sub)
    have = {p['role'] for p in P}
    out = []
    lower = spec.get('lower')
    for p in P:
        r = p['role']
        if lower and r in ('hips', 'leg.r', 'leg.l'): continue
        key = p['part'] if p['part'] in spec else r if r in spec else None
        if key is None: out.append(p); continue
        v = _val(spec[key], p['part'], p['col'])
        if v is None: continue
        m = p['m']
        if r.startswith('held') and v[0] != p['part']:
            h = next((q for q in P if q['role'] == r[:6].replace('held', 'hand')), None)
            if h: m = grip(v[0], h['m'])
        if r == 'crown' and v[0] != p['part']: m = mat_mul(MOUNT['crown'], T(0, -spec.get('crown_dy', 6), 0))
        out.append(dict(p, part=v[0], col=v[1], m=m))
    if lower:
        out.append({'part': lower[0], 'col': lower[1], 'm': MOUNT['lower'], 'role': 'hips'})
    hands = {p['role']: p for p in P if p['part'] == '3820'}
    for r, v in spec.items():
        if r in have or r in GROUPS or r in ('lower', 'extra', 'crown_dy') or not isinstance(v, (tuple, str)): continue
        if re.match(r'^\d', r): continue                      # a part id the figure does not wear: nothing to change
        part, col = _val(v, None, 0)
        if r.startswith('held'):
            h = hands.get(r.replace('held', 'hand')[:6])
            if not h: continue
            m = grip(part, h['m'])
        elif r == 'crown': m = mat_mul(MOUNT['crown'], T(0, -spec.get('crown_dy', 6), 0))
        else: m = MOUNT[r]
        out.append({'part': part, 'col': col, 'm': m, 'role': r})
    for part, col, m in spec.get('extra', []):
        out.append({'part': part, 'col': col, 'm': m, 'role': 'extra'})
    return out


def dress(card, sub, costume, x=0, yup=0, z=0, rot=0, m=None):
    """a figure's rows (as kitlib.figure(card, sub, x, yup, z, rot, m=m) would give) in the costume: a COSTUMES name or a spec dict"""
    base = mat_mul(T(x, -yup, z), m or RY(rot))
    return [row(p['col'], mat_mul(base, p['m']), p['part']) for p in costume_rows(card, sub, costume)]


# ---- the cast ----------------------------------------------------------------------------------------------------------------------
PRINCIPALS = [
    ('Odysseus', 'character.odysseus', 'odysseus'), ('Odysseus as the Trojan beggar', 'character.odysseus-as-trojan-beggar', 'odysseus-as-trojan-beggar'),
    ('Odysseus as the old beggar', 'character.odysseus-as-old-beggar', 'odysseus-as-old-beggar'),
    ('Odysseus as beggar (Eumaeus)', 'character.odysseus-as-beggar', 'odysseus-as-beggar'), ('Odysseus (Book 16)', 'character.odysseus-b16', 'odysseus-b16'),
    ('Odysseus revealed', 'character.odysseus-revealed', 'odysseus-revealed'), ('Odysseus restored', 'character.odysseus-restored', 'odysseus-restored'),
    ('Penelope', 'character.penelope', 'penelope'), ('Penelope at the loom', 'character.penelope-at-the-loom', 'penelope-at-the-loom'),
    ('Telemachus', 'character.telemachus', 'telemachus'), ('Athena', 'character.athena', 'athena'),
    ('Athena as Mentes', 'character.athena-as-mentes', 'athena-as-mentes'), ('Athena as Mentor', 'character.athena-as-mentor', 'athena-as-mentor'),
    ('Athena as herald', 'character.athena-as-herald', 'athena-as-herald'), ('Athena as pitcher girl', 'character.athena-as-pitcher-girl', 'athena-as-pitcher-girl'),
    ('Athena as shepherd', 'character.athena-as-shepherd', 'athena-as-shepherd'), ('Zeus', 'character.zeus', 'zeus'),
    ('Poseidon', 'character.poseidon', 'poseidon'), ('Hermes', 'character.hermes', 'hermes'),
    ('Hermes as young man', 'character.hermes-as-young-man', 'hermes-as-young-man'), ('Hermes psychopomp', 'character.hermes-psychopomp', 'hermes-psychopomp'),
    ('Calypso', 'character.calypso', 'calypso'), ('Circe', 'character.circe', 'circe'), ('Nausicaa', 'character.nausicaa', 'nausicaa'),
    ('Helen', 'character.helen', 'helen'), ('Menelaus', 'character.menelaus', 'menelaus'), ('Eurycleia', 'character.eurycleia', 'eurycleia'),
    ('Eumaeus', 'character.eumaeus', 'eumaeus'), ('Philoetius', 'character.philoetius', 'philoetius'), ('Laertes', 'character.laertes', 'laertes'),
    ('Laertes restored', 'character.laertes-restored', 'laertes-restored'), ('Antinous', 'character.antinous', 'antinous'),
    ('Eurymachus', 'character.eurymachus', 'eurymachus'), ('Amphinomus', 'character.amphinomus', 'amphinomus'),
    ('Melantho', 'character.melantho', 'melantho'), ('Melanthius', 'character.melanthius', 'melanthius'),
    ('Alcinous', 'character.alcinous', 'alcinous'), ('Arete', 'character.arete', 'arete'),
] + [(f'Suitor {i}', 'ensemble.suitors', f'suitor-{i}') for i in range(1, 6)] \
  + [(f'Crew {i}', 'ensemble.crew', f'sailor-{i}') for i in range(1, 6)] \
  + [(f'Disloyal maid {i}', 'ensemble.disloyal-maids', f'maid-{i}') for i in range(1, 6)] \
  + [(f'Loyal maid {i}', 'ensemble.loyal-maids', f'maid-{i}') for i in range(1, 3)] \
  + [(f"Nausicaa's maid {i}", 'ensemble.nausicaas-maids', f'maid-{i}') for i in range(1, 3)] \
  + [(f'Phaeacian sailor {i}', 'ensemble.phaeacian-sailors', f'sailor-{i}') for i in range(1, 3)] \
  + [(f'Phaeacian dancer {i}', 'ensemble.phaeacian-dancers', f'dancer-{i}') for i in range(1, 3)]

ORDER = ['torso', 'arm.r', 'arm.l', 'hand.r', 'hand.l', 'hips', 'leg.r', 'leg.l', 'skirt', 'head', 'headgear', 'crown', 'neck', 'neck2', 'held.r', 'held.l', 'held.r2', 'held.l2']


def survey(who=PRINCIPALS, out=sys.stdout):
    for name, card, sub in who:
        try: P = parts_of(card, sub)
        except (ValueError, FileNotFoundError) as e: print(f'{name}: {e}', file=out); continue
        print(f'\n{name}  [{card} / {sub}]', file=out)
        P.sort(key=lambda p: ORDER.index(p['role']) if p['role'] in ORDER else 99)
        for p in P:
            print(f"  {p['role']:9s} {p['part']:10s} {cname(p['col']):22s} {p['desc']}", file=out)


# ---- the costumes ------------------------------------------------------------------------------------------------------------------
# Colours: LDraw codes. Bronze Age dress, read from the frescoes and the poem (see odyssey/kits/wardrobe/COSTUMES.md).
WHITE, RED, DRED, SAFFRON, YELLOW, PURPLE, MAGENTA, DBLUE, MBLUE, AZURE, GOLD, TAN, DTAN, RB, DBROWN, BLACK, OLIVE, SANDBLUE, LBG, DBG, \
    NOUGAT, DORANGE, SANDGREEN, DTURQ, LAV = 15, 4, 320, 191, 14, 22, 26, 272, 73, 321, 297, 19, 28, 70, 308, 0, 330, 379, 71, 72, 92, 484, 378, 3, 30
BRONZE = GOLD
TUSK = WHITE                    # the boar's-tusk helmet: rows of split ivory plates

COSTUMES = {
    # Odysseus, the king at war and at sea: short kilt over bare legs, bronze corslet, boar's-tusk helmet, cloak; bow and sword
    'odysseus': {'skirt': ('600880c01', DRED), 'legs': YELLOW, 'hips': DRED, 'headgear': ('60751', TUSK), '4524': None,
                 'neck': ('2587', BRONZE), 'held.l': ('3847', BRONZE)},
    # the Trojan beggar: his own curls, a torn cloak, rags, a sack on his arm
    'odysseus-as-trojan-beggar': {'torso': ('973p4y', DTAN), 'arms': DTAN, 'hips': DTAN, 'legs': YELLOW, 'skirt': ('14295c01', DBROWN),
                                  'neck': ('86038c01', DBROWN)},
    # Athena's old beggar: rags and patched pera (wallet) on its cord, torn cloak, staff
    'odysseus-as-old-beggar': {'torso': ('973p4v', DTAN), 'arms': DTAN, 'hips': DTAN, 'legs': YELLOW, 'skirt': ('14295c01', DBROWN),
                               'neck': ('86038c01', DBROWN), 'neck2': ('61976', RB)},
    'odysseus-as-beggar': {'torso': ('973p4v', DTAN), 'arms': DTAN, 'hips': DTAN, 'legs': YELLOW, 'skirt': ('14295c01', DBROWN),
                           'neck': ('86038c01', DBROWN), 'neck2': ('61976', RB)},
    # Book 22: the rags thrown off on the threshold; bare-armed in the short chiton, the great bow and the quiver on his back
    'odysseus-revealed': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('600880c01', WHITE),
                          'neck': ('4498', RB)},
    # restored: bathed, a fresh chiton and a purple pharos pinned at the shoulder
    'odysseus-restored': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('14295c01', WHITE),
                          'neck': ('50231c01', MAGENTA)},
    'odysseus-king': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('14295c01', WHITE),
                      'neck': ('50231c01', MAGENTA)},
    # Penelope: the long robe of a queen in grief and a veil (kredemnon) drawn down, spindle / distaff
    'penelope': {'torso': ('973p5e', DBLUE), 'arms': DBLUE, 'lower': ('36036', DBLUE), 'headgear': ('4505a', WHITE)},
    'penelope-at-the-loom': {'torso': ('973p0w', PURPLE), 'arms': PURPLE, 'lower': ('36036', PURPLE), 'skirt': ('18200c01', SAFFRON)},
    # Telemachus: the prince in a short chiton, a cloak and two bronze spears (Book II); long hair, beardless
    'telemachus': {'torso': ('973p3y', WHITE), 'arms': WHITE, 'hips': RED, 'legs': YELLOW, 'skirt': ('600880c01', RED),
                   'neck': ('50231c01', RED), 'held.r': ('4497', BRONZE)},
    # Athena: helmet, bronze spear, the aegis over her shoulders, a long peplos
    'athena': {'lower': ('36036', WHITE), 'headgear': ('67037', BRONZE), 'neck': ('93565', GOLD), '4524': None,
               'held.l': ('2586', BRONZE), 'held.r': ('4497', BRONZE)},
    'athena-as-mentes': {'torso': ('973p4i', RB), 'arms': RB, 'hips': RB, 'legs': YELLOW, 'skirt': ('600880c01', RB),
                         'neck': ('50231c01', DORANGE), 'held.r': ('4497', BRONZE)},
    'athena-as-mentor': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'lower': ('36036', WHITE), 'neck': ('50231c01', DBLUE)},
    'athena-as-herald': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': SAFFRON, 'legs': YELLOW, 'skirt': ('600880c01', SAFFRON),
                         'headgear': ('11264', DBROWN), 'held.r': ('95049', RB)},
    'athena-as-pitcher-girl': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('600880c01', WHITE)},
    'athena-as-shepherd': {'torso': ('973p3y', TAN), 'arms': YELLOW, 'hips': TAN, 'legs': YELLOW, 'skirt': ('600880c01', TAN),
                           'neck': ('50231c01', OLIVE), 'held.r': ('93252', RB)},
    # Zeus: long himation / pharos, a sceptre that is also his thunder; seated king
    'zeus': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'lower': ('36036', WHITE), 'neck': ('50231c01', PURPLE), 'held.r': ('27256', GOLD)},
    # Poseidon: bare-chested under a sea-blue cloak, trident, a kilt
    'poseidon': {'torso': ('973pbi', YELLOW), 'arms': YELLOW, 'hips': DBLUE, 'legs': YELLOW, 'skirt': ('600880c01', DBLUE),
                 'neck': ('50231c01', DTURQ), 'held.r': ('92290', GOLD)},
    # Hermes: short chiton, traveller's cloak, winged cap for the petasos, golden wand; the winged sandals have no part: gold feet
    'hermes': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': WHITE, 'legs': GOLD, 'skirt': ('16820c01', WHITE),
               'headgear': ('60747', GOLD), 'neck': ('50231c01', SAFFRON), 'held.r': ('36752a', GOLD)},
    'hermes-psychopomp': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': WHITE, 'legs': GOLD, 'skirt': ('16820c01', WHITE),
                          'headgear': ('60747', GOLD), 'neck': ('50231c01', DBLUE), 'held.r': ('6124b', GOLD)},
    'hermes-as-young-man': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('600880c01', WHITE),
                            'neck': ('50231c01', SAFFRON)},
    # the nymphs and goddesses: flounced skirt (a plastic gown under a tiered cloth flounce), open-fronted bodice, long hair
    'calypso': {'torso': ('973p5c', DTURQ), 'arms': YELLOW, 'lower': ('36036', DTURQ), 'skirt': ('18200c01', WHITE), 'headgear': ('40239', DBROWN)},
    'circe': {'torso': ('973pb5', DRED), 'arms': YELLOW, 'lower': ('36036', DRED), 'skirt': ('18200c01', SAFFRON), 'headgear': ('53126', DORANGE),
              'held.r': ('6124b', GOLD)},
    'nausicaa': {'torso': ('973p0w', WHITE), 'arms': YELLOW, 'lower': ('36036', WHITE), 'skirt': ('18200c01', SAFFRON),
                 'headgear': ('93562', DBROWN), 'crown': ('33322', GOLD), 'crown_dy': 2},
    'helen': {'torso': ('973p5e', MAGENTA), 'arms': MAGENTA, 'lower': ('36036', MAGENTA), 'skirt': ('18200c01', SAFFRON),
              'headgear': ('40239', DBROWN), 'crown': ('33322', GOLD)},
    'arete': {'torso': ('973pmd', DBLUE), 'arms': DBLUE, 'lower': ('36036', DBLUE), 'skirt': ('18200c01', RED), 'crown': ('39262', GOLD)},
    'eurycleia': {'torso': ('973p88', SANDBLUE), 'arms': SANDBLUE, 'lower': ('36036', DTAN), 'headgear': ('4505a', TAN)},
    'maid': {'torso': ('973pd13', WHITE), 'arms': YELLOW, 'lower': ('36036', SAFFRON)},
    'maid-loyal': {'torso': ('973p88', TAN), 'arms': TAN, 'lower': ('36036', DTAN)},
    'melantho': {'torso': ('973p5e', RED), 'arms': YELLOW, 'lower': ('36036', RED), 'skirt': ('18200c01', SAFFRON)},
    # the men of the house: kings in the long robe and cloak, herdsmen in hide
    'menelaus': {'torso': ('973pa2', WHITE), 'arms': WHITE, 'lower': ('36036', WHITE), 'neck': ('50231c01', PURPLE), 'crown': ('11264', GOLD)},
    'alcinous': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'lower': ('36036', WHITE), 'neck': ('50231c01', RED), 'crown': ('39262', GOLD)},
    'laertes': {'torso': ('973p4v', DTAN), 'arms': DTAN, 'hips': DTAN, 'legs': DTAN, 'skirt': ('14295c01', DTAN)},
    'laertes-restored': {'torso': ('973pmc', WHITE), 'arms': WHITE, 'lower': ('36036', WHITE), 'neck': ('50231c01', DRED)},
    'eumaeus': {'torso': ('973pdg1', RB), 'arms': YELLOW, 'hips': RB, 'legs': YELLOW, 'skirt': ('600880c01', RB),
                'neck': ('50231c01', DORANGE), 'held.r': ('93252', RB)},
    'philoetius': {'torso': ('973p3y', TAN), 'arms': YELLOW, 'hips': TAN, 'legs': YELLOW, 'skirt': ('600880c01', TAN), 'neck': ('50231c01', RB)},
    'melanthius': {'torso': ('973p4i', DBROWN), 'arms': YELLOW, 'hips': DBROWN, 'legs': YELLOW, 'skirt': ('600880c01', DBROWN)},
    # suitors: rich young nobles, long-haired, fine cloaks; Antinous in red, Eurymachus in the moneyed long robe
    'antinous': {'torso': ('973p1p', RED), 'arms': RED, 'hips': RED, 'legs': YELLOW, 'skirt': ('600880c01', RED), 'neck': ('50231c01', PURPLE),
                 'headgear': ('11255', BLACK)},
    'eurymachus': {'torso': ('973p3l', MAGENTA), 'arms': MAGENTA, 'lower': ('36036', MAGENTA), 'neck': ('50231c01', SAFFRON)},
    'amphinomus': {'torso': ('973p1p', DBLUE), 'arms': DBLUE, 'hips': DBLUE, 'legs': YELLOW, 'skirt': ('600880c01', DBLUE),
                   'neck': ('50231c01', WHITE)},
    'suitor': {'arms': YELLOW, 'legs': YELLOW, 'skirt': ('600880c01', RED), 'neck': ('50231c01', SAFFRON)},
    # the crew: bare-legged oarsmen in short kilts; the fighters in boar's-tusk helmets with figure-eight shields
    'crew': {'torso': ('973p3y', WHITE), 'arms': YELLOW, 'hips': TAN, 'legs': YELLOW, 'skirt': ('600880c01', TAN)},
    'crew-warrior': {'torso': ('973pc6a', BRONZE), 'arms': YELLOW, 'hips': WHITE, 'legs': YELLOW, 'skirt': ('600880c01', WHITE),
                     'headgear': ('60751', TUSK), 'held.r': ('4497', BRONZE)},
    'phaeacian': {'torso': ('973p3y', SAFFRON), 'arms': YELLOW, 'hips': AZURE, 'legs': YELLOW, 'skirt': ('600880c01', AZURE)},
}


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'survey': survey()
    elif len(sys.argv) > 1 and sys.argv[1] == 'grips':
        for k, (m, h) in sorted(grips().items()): print(k, h, desc(k), [round(v, 2) for v in m[:3]])
    else: print(__doc__)

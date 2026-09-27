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
  crown: a second piece on the head (circlet, tiara, wreath) set `crown_dy` LDU higher    beard: a beard piece at the neck
  neck / neck2: capes, armour, a satchel or a quiver at the neck
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
        '2542': (0, 40, 0), '4332': (0, 40, 0), '4496': (0, 30, 0), '3957a': (0, -20, 0), '24855c01': (0, 12, 0)}
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
    if part in SHIELDS:                          # a shield hangs from its handle in the hand, its face to the front (-z), upright
        g = apply(hand_m, GRIP_AT)
        return T(g[0], g[1], g[2] - 4)
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
        key = r if r in spec else p['part'] if p['part'] in spec else None      # a role's value wins over a part id's
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

ORDER = ['torso', 'arm.r', 'arm.l', 'hand.r', 'hand.l', 'hips', 'leg.r', 'leg.l', 'skirt', 'head', 'headgear', 'crown', 'beard', 'neck', 'neck2', 'held.r', 'held.l', 'held.r2', 'held.l2']


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

MNOUGAT, DGREEN = 84, 288
BARE = {'leg.r': ('3816cpn4', YELLOW), 'leg.l': ('3817cpn4', YELLOW)}     # bare legs and sandals (Leg with Reddish Brown Sandals)
KILT = '600880c01'          # Minifig Skirt 1.1L with Straight Bottom: the short kilt / chiton skirt of the men
LONGKILT = '14295c01'       # Minifig Skirt 1.5L Fringed: a longer, ragged hem
DAGGER = '16820c01'         # Minifig Skirt 0.7L with 11 Diamond Points: the pointed kilt of the Hermes figures
FLOUNCE = '18200c01'        # Minifig Skirt 1.5L Fringed with Stepped Edge: the tiered flounce over a gown
GOWN = '36036'              # Minifig Hips and Skirt: the long gown / robe to the feet (replaces hips and legs)
CLOAK = '50231c01'          # Minifig Cape Cloth (formed): chlaina / pharos / chlamys
RAGS = '86038c01'           # Minifig Cape Cloth with Holes and Tattered Edges
AEGIS = '38301c01'          # Minifig Cape Cloth Scalloped 6 Points: a short fringed shoulder-cape
TUSKS = '60751'             # Minifig Helmet with Cheek Protection and Thin Bands: the boar's-tusk helmet
CORSLET = '2587'            # Minifig Armour Plate: breast and shoulder plates, the Dendra corslet
CHITON = '973p3y'           # Torso with Shirt with Open Collar and Wrinkles: a plain linen chiton
PHAROS = '973pmc'           # Torso with Robe Gather Lines, Wrinkles and Clasp at Right Shoulder: robe pinned with a brooch
RAGTOP = '973p4v'           # Torso with Dark Brown Collar, Patch, Rope Belt and Pouch: the beggar's rags and pera
BEADS = '973pd13'           # Torso with Dress and Red Beads Necklace: the women's bodice and bead necklace
APRON = '973p88'            # Torso with Dress, White Apron and Red Beads Necklace
VEILED = '973p5e'           # Torso with Gold Dress and Veil Top
BODICE = '973p0w'           # Torso with Female Gold Trim and Gold Belt: an open-fronted bodice edged in gold


def C(**kw):
    """a spec from keywords (held_r -> 'held.r'), with the dicts in `with_` merged in first"""
    out = {}
    for d in kw.pop('with_', ()): out.update(d)
    for k, v in kw.items(): out[k.replace('_r', '.r').replace('_l', '.l') if k.startswith(('held', 'arm', 'hand', 'leg')) else k] = v
    return out


COSTUMES = {
    # ---- Odysseus ----
    # at war and at sea (Books IX-XII): the red kilt, bare legs and sandals, the bronze corslet over his tunic, the boar's-tusk helmet
    # that Meriones lends him in Iliad X; the bow and the sword are the card's own
    'odysseus': C(with_=[BARE], hips=DRED, skirt=(KILT, DRED), headgear=(TUSKS, TUSK), neck=(CORSLET, BRONZE)),
    # the Trojan beggar of Helen's tale (IV): his own face and dark curls, a torn rag of a cloak, the rags of a slave, a sack
    'odysseus-as-trojan-beggar': C(with_=[BARE], head='3626bp88', headgear=('3901', DBROWN), beard=None,
                                   torso=(RAGTOP, DTAN), arms=DTAN, hips=DTAN, skirt=(LONGKILT, DBROWN), neck=(RAGS, DBROWN)),
    # Athena's old beggar (XIII 434-438): a vile cloak and tunic black with smoke, over them the bald hide of a deer, a staff,
    # and a pouch full of holes on a twisted cord
    'odysseus-as-old-beggar': C(with_=[BARE], torso=(RAGTOP, DTAN), arms=DTAN, hips=DBROWN, skirt=(LONGKILT, DBROWN),
                                neck=(RAGS, MNOUGAT), neck2=('61976', RB), held_l=None),
    # XXII: the rags stripped off on the threshold; the tunic, the quiver on his back, the great bow; the king's own face
    'odysseus-revealed': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE), neck=None,
                           **{'held.r2': None}, neck2=('4498', RB)),
    # VI and XXIII: bathed and anointed, a fresh tunic and the purple double cloak (XIX 225) pinned with a gold brooch; unarmed
    'odysseus-restored': C(with_=[BARE], torso=(PHAROS, WHITE), arms=WHITE, hips=WHITE, skirt=(LONGKILT, WHITE), neck=(CLOAK, MAGENTA),
                           held_r=None, held_l=None),
    # ---- the household ----
    # the queen in grief: the long robe, the veil (kredemnon) drawn over her head, her hair under it
    'penelope': C(torso=(VEILED, DBLUE), arms=DBLUE, lower=(GOWN, DBLUE), headgear=('30381', WHITE), held_r=None),
    # at the loom: the flounced skirt and open bodice of the frescoes, her bun, a wooden pin-beater in her hand
    'penelope-at-the-loom': C(torso=(BODICE, PURPLE), arms=YELLOW, lower=(GOWN, WHITE), skirt=(FLOUNCE, PURPLE), held_r=('36752a', RB)),
    # the prince: a white chiton and kilt, a red cloak, long hair, a bronze spear (II 10)
    'telemachus': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE), neck=(CLOAK, RED),
                    headgear=('88283', DBROWN), held_r=('4497', BRONZE)),
    # the old nurse: a long dark dress, an apron, a kerchief
    'eurycleia': C(torso=(APRON, DTAN), arms=DTAN, lower=(GOWN, DTAN), headgear=('4505a', WHITE)),
    # Laertes in the orchard (XXIV 227-231): a filthy patched tunic, stitched ox-hide leggings, gloves against the thorns, a goatskin cap
    'laertes': C(head='3626bp8m', torso=(RAGTOP, DTAN), arms=DTAN, hands=RB, hips=DTAN, legs=RB, skirt=(LONGKILT, DTAN),
                 headgear=('27059', MNOUGAT), neck=None),
    # Laertes restored (XXIV 365-371): bathed, anointed, a fine cloak; white-headed still; the spear he throws at Eupithes
    'laertes-restored': C(head='3626bp8m', headgear=('3901', WHITE), torso=(PHAROS, WHITE), arms=WHITE, lower=(GOWN, WHITE),
                          neck=(CLOAK, DRED), held_r=('4497', BRONZE)),
    # the swineherd (XIV 23-24: he is cutting himself sandals of ox-hide): a tunic, a hide cloak, sandals, his staff
    'eumaeus': C(with_=[BARE], torso=(CHITON, TAN), arms=YELLOW, hips=TAN, skirt=(KILT, TAN), neck=(CLOAK, RB)),
    # the cowherd: a sun-bleached tunic, bare shins, a dark cloak, the goad
    'philoetius': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE), neck=(CLOAK, DGREEN)),
    # the goatherd: a leather jerkin, a short kilt, his own cape
    'melanthius': C(with_=[BARE], torso=('973p4i', RB), arms=YELLOW, hips=DBROWN, skirt=(KILT, DBROWN)),
    # the maids: the bead necklace of the frescoes over a long skirt; Melantho in a flounced gift-gown she was never given for work
    'melantho': C(torso=(BEADS, SAFFRON), arms=YELLOW, lower=(GOWN, RED), skirt=(FLOUNCE, SAFFRON)),
    'maid': C(torso=(BEADS, WHITE), arms=YELLOW, lower=(GOWN, SAFFRON)),
    'maid-loyal': C(torso=(APRON, TAN), arms=TAN, lower=(GOWN, DTAN)),
    # ---- the suitors: rich young nobles, the long hair of the Achaeans, fine cloaks ----
    'antinous': C(with_=[BARE], torso=('973p1p', RED), arms=RED, hips=RED, skirt=(KILT, RED), neck=(CLOAK, PURPLE),
                  headgear=('11255', BLACK), held_r=GOLD),
    'eurymachus': C(torso=('973p3l', MAGENTA), arms=MAGENTA, lower=(GOWN, MAGENTA), neck=(CLOAK, SAFFRON), headgear=('20595', DBROWN)),
    'amphinomus': C(with_=[BARE], torso=('973p1p', DBLUE), arms=DBLUE, hips=DBLUE, skirt=(KILT, DBLUE), neck=(CLOAK, WHITE),
                    headgear=('11255', DBROWN)),
    'suitor': C(with_=[BARE], arms=YELLOW, hips=RED, skirt=(KILT, RED), neck=(CLOAK, SAFFRON), headgear=('40251', DBROWN)),
    # ---- the gods ----
    # Zeus: the long robe pinned at the shoulder, a purple mantle, his crown and his thunderbolt
    'zeus': C(torso=(PHAROS, WHITE), arms=WHITE, lower=(GOWN, WHITE), neck=(CLOAK, PURPLE)),
    # Poseidon: bare-chested, the gold-belted loincloth, a sea-green mantle, the trident
    'poseidon': C(torso=('973pbi', YELLOW), arms=YELLOW, hips=('3815bpq1', YELLOW), leg_r=('3816cpq1', YELLOW), leg_l=('3817cpq1', YELLOW),
                  neck=(CLOAK, DTURQ), held_r=('92290', GOLD)),
    # Athena as the Mycenae "warrior goddess": a white peplos, the boar's-tusk helmet, the fringed aegis, figure-eight shield, spear
    'athena': C(torso=('973pc2g', WHITE), arms=WHITE, lower=(GOWN, WHITE), headgear=(TUSKS, TUSK), neck=(AEGIS, GOLD),
                held_l=('2586', WHITE), held_r=('4497', BRONZE)),
    # her guises
    'athena-as-mentes': C(with_=[BARE], head='3626bpq5', headgear=('3901', BLACK), beard=None, torso=('973p4i', RB), arms=RB, hips=RB,
                          skirt=(KILT, RB), neck=(CLOAK, DORANGE), held_r=('4497', BRONZE)),
    'athena-as-mentor': C(torso=(PHAROS, SANDBLUE), arms=SANDBLUE, lower=(GOWN, SANDBLUE), neck=(CLOAK, DBLUE), held_r=RB),
    'athena-as-herald': C(with_=[BARE], headgear=('11264', DBROWN), torso=(CHITON, WHITE), arms=YELLOW, hips=SAFFRON,
                          skirt=(KILT, SAFFRON), neck=(CLOAK, RED), held_l=None, held_r=('95049', GOLD)),
    'athena-as-pitcher-girl': C(with_=[BARE], torso=('973pq6', WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE),
                                headgear=('62711', DBROWN), held_r=DORANGE),
    'athena-as-shepherd': C(with_=[BARE], torso=(CHITON, TAN), arms=YELLOW, hips=TAN, skirt=(KILT, TAN), neck=(CLOAK, OLIVE),
                            headgear=('88283', DBROWN), held_r=('3957a', RB)),
    # Hermes: short chiton with a pointed hem, a saffron chlamys, sandals, the winged cap, the golden wand
    'hermes': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(DAGGER, WHITE), headgear=('60747', GOLD),
                neck=(CLOAK, SAFFRON)),
    'hermes-psychopomp': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(DAGGER, WHITE), headgear=('60747', GOLD),
                           neck=(CLOAK, DBLUE), held_r=GOLD),
    # on the road to Circe: no divine tells, the moly in his hand (black root, milk-white flower)
    'hermes-as-young-man': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE), headgear=('88283', DBROWN),
                             neck=(CLOAK, SAFFRON), held_r=('24855c01', WHITE)),
    # ---- the nymphs and the Phaeacians: the flounced skirt and gold-edged bodice, long hair ----
    # Calypso as Homer dresses her (V 230-232): a great silver-white robe, a golden belt; a sea-green flounce; the golden shuttle (V 62)
    'calypso': C(torso=(BODICE, WHITE), arms=YELLOW, lower=(GOWN, WHITE), skirt=(FLOUNCE, DTURQ), held_r=('36752a', GOLD)),
    # Calypso at the loom in her cave: the sea-wave bodice
    'calypso-at-the-loom': C(torso=('973p5c', DTURQ), arms=YELLOW, lower=(GOWN, DTURQ), skirt=(FLOUNCE, WHITE), held_r=('36752a', GOLD)),
    'circe': C(torso=(BODICE, DRED), arms=YELLOW, lower=(GOWN, SAFFRON), skirt=(FLOUNCE, DRED), headgear=('13251', DORANGE)),
    'nausicaa': C(torso=(BODICE, WHITE), arms=YELLOW, lower=(GOWN, WHITE), skirt=(FLOUNCE, SAFFRON), headgear=('93562', DBROWN), held_r=None),
    'alcinous': C(torso=(PHAROS, WHITE), arms=WHITE, lower=(GOWN, WHITE), neck=(CLOAK, RED)),
    'arete': C(torso=('973pmd', DBLUE), arms=DBLUE, lower=(GOWN, DBLUE), skirt=(FLOUNCE, RED), headgear=('13251', LBG), crown=('33322', GOLD)),
    'phaeacian': C(with_=[BARE], torso=(CHITON, SAFFRON), arms=YELLOW, hips=AZURE, skirt=(KILT, AZURE), headgear=('40251', BLACK)),
    # ---- the crew ----
    'crew': C(torso=(CHITON, WHITE), arms=YELLOW, hips=TAN, legs=YELLOW, skirt=(KILT, TAN)),
    'crew-warrior': C(with_=[BARE], torso=(CHITON, WHITE), arms=YELLOW, hips=WHITE, skirt=(KILT, WHITE), headgear=(TUSKS, TUSK),
                      neck=(CORSLET, BRONZE), held_r=('4497', BRONZE), held_l=('2586', WHITE)),
    # ---- Sparta (IV) ----
    'helen': C(torso=(BODICE, MAGENTA), arms=YELLOW, lower=(GOWN, WHITE), skirt=(FLOUNCE, MAGENTA), headgear=('40239', DBROWN),
               crown=('33322', GOLD)),
    'menelaus': C(torso=(PHAROS, SAFFRON), arms=SAFFRON, lower=(GOWN, SAFFRON), neck=(CLOAK, PURPLE), headgear=('11264', TAN), beard=TAN),
}


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'survey': survey()
    elif len(sys.argv) > 1 and sys.argv[1] == 'grips':
        for k, (m, h) in sorted(grips().items()): print(k, h, desc(k), [round(v, 2) for v in m[:3]])
    else: print(__doc__)

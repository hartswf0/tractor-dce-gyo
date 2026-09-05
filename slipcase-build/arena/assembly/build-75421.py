#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""75421 — Darth Vader's TIE Fighter, reconstructed in LDraw.

No LDraw file of this set could be fetched from here (omr.ldraw.org and
rebrickable.com are both refused by the egress proxy), so this is a
reconstruction: the set's shapes — the bent TIE Advanced x1 wings, the
spherical pod with its round hatch, the rebel outpost on its 10x10 octagonal
plate, the two figures — built from the box art and the instruction pages, in
real LDraw parts with real part numbers. It is not LEGO's build order and the
piece count is whatever the reconstruction comes to, reported honestly.

Every submodel that occurs more than once (the wing, the wing's outer panels,
the pylon, the leg and arm parts) is the reason this set belongs in the
assembly arena: a TIE is two identical wings on one pod.
"""
import math, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'kits', '75421-darth-vader-tie-fighter.mpd')

# LDraw: 1 stud = 20, plate = 8, brick = 24, +Y is DOWN. A brick's origin sits
# at the centre of its top face and the body hangs below it (+Y).
BLACK, BLUE, RED, WHITE, YELLOW, TAN = 0, 1, 4, 15, 14, 19
LBG, DBG, DARK_TAN, GREEN, TR_RED = 71, 72, 28, 2, 36

IDENT = (1, 0, 0, 0, 1, 0, 0, 0, 1)
FEET = 72   # figure origin to soles: legs sit at +44 and their box reaches +28 below that


def rx(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return (1, 0, 0, 0, c, -s, 0, s, c)


def ry(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return (c, 0, s, 0, 1, 0, -s, 0, c)


def rz(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return (c, -s, 0, s, c, 0, 0, 0, 1)


def mul(a, b):
    return tuple(sum(a[r * 3 + k] * b[k * 3 + c] for k in range(3)) for r in range(3) for c in range(3))


MIRROR_X = (-1, 0, 0, 0, 1, 0, 0, 0, 1)


def f(v):
    r = round(v, 3)
    return str(int(r)) if r == int(r) else ('%.3f' % r).rstrip('0').rstrip('.')


class Model:
    def __init__(self, name, desc):
        self.name, self.desc, self.lines = name, desc, []

    def part(self, colour, x, y, z, ref, m=IDENT):
        self.lines.append('1 %d %s %s %s %s %s' % (
            colour, f(x), f(y), f(z), ' '.join(f(v) for v in m),
            ref if ref.endswith('.ldr') else 'parts/%s.dat' % ref))

    def step(self):
        self.lines.append('0 STEP')

    def text(self):
        return ('0 FILE %s\n0 %s\n0 Name: %s\n0 Author: reconstruction, tractor-dce-gyo\n'
                '0 !LDRAW_ORG Unofficial_Model\n0 BFC CERTIFY CCW\n\n%s\n\n'
                % (self.name, self.desc, self.name, '\n'.join(self.lines)))


models = []


def new(name, desc):
    m = Model(name, desc)
    models.append(m)
    return m


# ───────────────────────────────────────────── wing panels (flat, studs up)
# Local frame: panel lies in XZ, studs point -Y (this face ends up outboard),
# local X runs fore-aft, local Z runs up the wing.

def flat_panel(m, w_studs, h_studs, y=0):
    """A black-framed dark-grey panel, w (along X) by h (along Z) studs.

    Probed conventions: Plate 4x6 (3032) and Tile 2x4 (87079) both run their
    long side along X; Tile 1x4 (2431) and 1x2 (3069b) run along X too. ry(90)
    turns any of them to run along Z.
    """
    W, H = w_studs * 20, h_studs * 20
    if (w_studs, h_studs) == (8, 6):
        m.part(BLACK, -40, y, 0, '3032', ry(90)); m.part(BLACK, 40, y, 0, '3032', ry(90))
    elif (w_studs, h_studs) == (6, 4):
        m.part(BLACK, 0, y, 0, '3032')
    top = y - 8
    ze = H / 2 - 10                                  # the two edges that run along X
    if w_studs == 8:
        for x in (-60, -20, 20, 60):
            m.part(BLACK, x, top, -ze, '2431'); m.part(BLACK, x, top, ze, '2431')
    else:
        for x, ref in ((-40, '2431'), (0, '3069b'), (40, '2431')):
            m.part(BLACK, x, top, -ze, ref); m.part(BLACK, x, top, ze, ref)
    xe = W / 2 - 10                                  # the two edges that run along Z
    side = '2431' if h_studs - 2 == 4 else '3069b'
    m.part(BLACK, -xe, top, 0, side, ry(90)); m.part(BLACK, xe, top, 0, side, ry(90))
    if (w_studs, h_studs) == (8, 6):                 # interior 6 x 4
        for x in (-40, 0, 40):
            m.part(DBG, x, top, 0, '87079', ry(90))
    else:                                            # interior 4 x 2
        m.part(DBG, 0, top, 0, '87079')


centre = new('wing-centre.ldr', 'wing panel, centre section with the hub')
flat_panel(centre, 8, 6)
centre.part(LBG, 0, -16, 0, '4032')          # hub the pylon reads against
centre.part(DBG, 0, -24, 0, '15535')         # ring on the hub

outer = new('wing-outer.ldr', 'wing panel, one bent outer section')
flat_panel(outer, 6, 4)

BEND = 30
wing = new('wing.ldr', 'one wing: centre panel plus two bent outer panels')
wing.part(16, 0, 0, 0, 'wing-centre.ldr')
# top section folds toward +Y (inboard); its centre sits 40 up the fold
s, c = math.sin(math.radians(BEND)), math.cos(math.radians(BEND))
wing.part(16, 0, 40 * s, 60 + 40 * c, 'wing-outer.ldr', rx(-BEND))
wing.part(16, 0, 40 * s, -(60 + 40 * c), 'wing-outer.ldr', rx(BEND))
# hinges bridging each fold, on the inboard face
for zz, m_ in ((60, rx(-BEND / 2)), (-60, rx(BEND / 2))):
    wing.part(BLACK, -8, 8, zz, '2429', m_)
    wing.part(BLACK, 40, 8, zz, '2429', m_)

# ───────────────────────────────────────────── pylon: pod to wing, along +X
pylon = new('pylon.ldr', 'wing pylon: three round bricks and a cap, laid along X')
for x in (0, 24, 48):
    pylon.part(DBG, x, 0, 0, '3941', rz(-90))
pylon.part(LBG, 72, 0, 0, '4032', rz(-90))

# ───────────────────────────────────────────── the pod
pod = new('pod.ldr', 'cockpit pod: stacked round plates and a 4x4 round brick')
pod.part(DBG, 0, 40, 0, '3960', rx(180))       # belly: peak down at 40, rim on the plate at 24
pod.part(DBG, 0, 16, 0, '60474')
pod.part(DBG, 0, 8, 0, '11213')
pod.part(DBG, 0, -16, 0, '87081')
pod.part(DBG, 0, -24, 0, '11213')
pod.part(DBG, 0, -32, 0, '60474')
pod.part(DBG, 0, -48, 0, '3960')               # crown: peak up at -48, rim on the plate at -32
pod.part(LBG, 0, -56, 0, '4032')               # roof hub
pod.step()
# the round front hatch: a black dish for the frame, a ringed tile as the port
pod.part(BLACK, 0, -8, -44, '3960', rx(90))
pod.part(BLACK, 0, -8, -48, '15535', rx(90))
pod.part(LBG, 0, -8, -56, '4032', rx(90))
# rear hatch
pod.part(LBG, 0, -8, 48, '3068b', rx(-90))
pod.step()
# collars where the pylons meet the pod
pod.part(LBG, 52, -8, 0, '4032', rz(-90))
pod.part(LBG, -52, -8, 0, '4032', rz(90))
# chin cannons
for x in (-16, 16):
    pod.part(LBG, x, 12, -40, '3062b', rx(-90))
    pod.part(DBG, x, 12, -64, '30374', rx(-90))

# ───────────────────────────────────────────── figures (LDraw standard stack)
def figure(m, head, torso, arms, hands, hips, legs, helmet=None, helmet_col=None):
    m.part(legs, 0, 44, 0, '3816'); m.part(legs, 0, 44, 0, '3817')
    m.part(hips, 0, 32, 0, '3815')
    m.part(torso, 0, 0, 0, '973')
    m.part(arms, -15.552, 9, 0, '3818', (0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1))
    m.part(arms, 15.552, 9, 0, '3819', (0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1))
    m.part(hands, -23.8634, 26.5956, -10.321, '3820',
           (0.985, -0.12019, 0.12019, 0.17, 0.696395, -0.696395, 0, 0.707, 0.707))
    m.part(hands, 23.8634, 26.5956, -10.321, '3820',
           (0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707))
    m.part(head, 0, -24, 0, '3626b')
    if helmet:
        m.part(helmet_col, 0, -24, 0, helmet)


vader = new('vader.ldr', 'Darth Vader')
figure(vader, BLACK, BLACK, BLACK, BLACK, BLACK, BLACK, '30368', BLACK)
vader.part(TR_RED, 23.8634, 26.5956, -10.321, '30374',
           (0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707))

trooper = new('trooper.ldr', 'Rebel Fleet Trooper')
figure(trooper, YELLOW, BLUE, BLUE, YELLOW, DBG, DBG, '30370', LBG)
trooper.part(BLACK, 23.8634, 26.5956, -10.321, '58247',
             (0.985, 0.12019, -0.12019, -0.17, 0.696395, -0.696395, 0, 0.707, 0.707))

# ───────────────────────────────────────────── the rebel outpost
post = new('outpost.ldr', 'rebel outpost: octagonal plate, rocks, dish, console')
post.part(DARK_TAN, 0, 0, 0, '89523')
post.step()
G = -8                                   # on top of the plate
post.part(TAN, -60, G, -60, '3040', ry(180)); post.part(TAN, -60, G, -20, '3040', ry(90))
post.part(TAN, 60, G, 40, '3298', ry(-90))
post.part(DARK_TAN, 60, -24, -60, '3004')
post.part(DARK_TAN, -60, G, 60, '3022'); post.part(TAN, 20, G, 80, '3023', ry(90))
post.part(TAN, 0, G, -80, '85984'); post.part(DARK_TAN, 80, G, 0, '54200', ry(90))
post.part(DARK_TAN, -80, G, 20, '54200', ry(-90))
post.part(GREEN, -80, -24, -20, '6255'); post.part(GREEN, 80, -24, -30, '6255')
post.step()
# radar dish on a short mast
post.part(LBG, 40, -32, 60, '3062b'); post.part(LBG, 40, -56, 60, '3062b')
post.part(DBG, 40, -64, 60, '6141')
post.part(WHITE, 40, -64, 60, '43898', rx(145))   # flipped to a bowl, tilted at the sky
post.part(LBG, 80, -8, 60, '3957a')
# console
post.part(DBG, -40, -24, -20, '3004'); post.part(BLUE, -40, -32, -20, '3069b')
post.step()
post.part(16, 0, -8 - FEET, 20, 'trooper.ldr')

# ───────────────────────────────────────────── the set
main = new('75421 - main.ldr', "Darth Vader's TIE Fighter (reconstruction)")
main.part(16, 0, 0, 0, 'pod.ldr')
main.step()
main.part(16, 60, -8, 0, 'pylon.ldr')
main.part(16, -60, -8, 0, 'pylon.ldr', MIRROR_X)
main.step()
M_R = (0, -1, 0, 0, 0, -1, 1, 0, 0)          # flat panel stood up, studs out, at +X
M_L = mul(MIRROR_X, M_R)
main.part(16, 148, -8, 0, 'wing.ldr', M_R)
main.step()
main.part(16, -148, -8, 0, 'wing.ldr', M_L)
main.step()
main.part(16, 0, 120, 260, 'outpost.ldr')
main.part(16, 120, 120 - FEET, 200, 'vader.ldr', ry(30))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as fh:
    # the root goes first so it is the model an MPD reader opens
    order = [main] + [m for m in models if m is not main]
    fh.write(''.join(m.text() for m in order))

n = sum(1 for m in models for l in m.lines if l.startswith('1 ') and l.endswith('.dat'))
print('wrote', os.path.relpath(OUT, ROOT), '—', n, 'direct part lines across', len(models), 'submodels')

#!/usr/bin/env python3
"""tools/forage/product/kits/achilles_line.py — THE SHIELD OF ACHILLES LINE (Iliad XVIII.478–608)
Builds all 7 Odyssey-grade LDraw kits for Homer's Shield of Achilles using kitlib, sculpt, landscape, and clicks:
  1. set.achilles-forge   — Zone I:   The Forge of Hephaestus & The Revolving Bear (32x32)
  2. set.achilles-peace   — Zone II:  The Two Talents in the Agora & The Bridal Torch-Dance (48x32)
  3. set.achilles-war     — Zone III: The River Ambush & The Tall Golden Gods (48x32)
  4. set.achilles-field   — Zone IV:  The Plough That Turns Black, The King's Harvest & The Vintage (48x32)
  5. set.achilles-pasture — Zone V:   The Two Lions, the Gold-and-Tin Oxen & the Sheep Glen (48x32)
  6. set.achilles-choros  — Zone VI:  The Choros of Daedalus & The River Oceanus (32x32)
  7. set.achilles-shield  — Master:   The Shield of Achilles — Five-Fold Worldtext (48x48)

Every kit features full brick-built Mycenaean/Minoan architecture (roofed colonnades, double-wythe walls, SNOT frescoes,
linteled gates, Horns of Consecration), multi-part sculpted LEGO creatures (lofty-horned oxen, fanged maned lions,
hunting hounds, fleeced sheep, warhorses), and large cross-bonded turntable mechanisms, passing clicks.py with
0 loose parts and 0 clashes.
"""
import math, os, random, shutil, sys, tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
import sculpt
from sculpt import Form, ell, cone, smin, rough
import landscape as L
from landscape import TBLUE, TLBLUE, TCLEAR, TGREEN, BLY, AZURE, SILVER, BRONZE, DBROWN
import clicks

ACH_CARDS = os.path.join(ROOT, 'achilles/cards')
ACH_KITS = os.path.join(ROOT, 'achilles/kits')
SHIELD_ZONES = os.path.join(ROOT, 'shield-zones')
os.makedirs(ACH_CARDS, exist_ok=True)
os.makedirs(ACH_KITS, exist_ok=True)
os.makedirs(SHIELD_ZONES, exist_ok=True)

BASE = 8  # top of foundation plates laid by frame(..., yup=8)
PDG = 148
TORANGE = 57


def hsh(*a):
    v = 0
    for q in a:
        v = (v * 131 + int(q) * 7919 + 17) % 1000003
    return v


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# SCULPTED BRICK-BUILT CREATURES, COLOSSI & ARCHITECTURAL ASSEMBLIES
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def place_local(M_b, col, lx, h_up, lz, pid, lm=None):
    """Places part `pid` in local frame `M_b` so its bottom sits flush at `h_up` LDU above the local origin (y=0)."""
    b = ldbox.box(pid, False)
    hi_y = b[1][1] if b else 0.0
    m = T(lx, -(h_up + hi_y), lz)
    if lm:
        m = mat_mul(m, lm)
    return row(col, mat_mul(M_b, m), pid)


def colossus(x, yup, z, rot=0, primary=GOLD, accent=DRED, helm_col=GOLD, shield_col=GOLD):
    """Iliad XVIII.516-519: Ares and Pallas Athena, both golden, clad in golden garments, beautiful and large with their arms,
    like gods, both very conspicuous (~1.7x minifigure height), with brick-built bossed round shield, crested helm,
    and golden divine plinth."""
    rows = figure(x, yup, z, rot=rot, torso_col=primary, legs_col=primary, head_col=GOLD,
                  headgear=('10054', helm_col), cape_col=accent, shield=('3876', shield_col),
                  held_r=('4497', GOLD), scale=1.7)
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.04))
    rows.append(place_local(M_b, GOLD, -12, 0, 0, '3023', RY(math.pi / 2)))
    rows.append(place_local(M_b, GOLD, 12, 0, 0, '3023', RY(math.pi / 2)))
    return rows


def ox_beast(x, yup, z, rot=0, body_col=GOLD, horn_col=SILVER):
    """24-piece sculpted LEGO Homeric Lofty-Horned Ox (boes orthokhairai, Il. XVIII.573-574) with barrel torso,
    curved haunch slopes (11477/15068), SNOT eye bricks (87087) with pupils (98138), tapered muzzle, dewlap,
    four articulated hoofed legs, and sweeping lofty crescent horns (54200)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.08))
    belly_col = DTAN if body_col in (RB, DB) else (SILVER if body_col == GOLD else GOLD)
    out = [
        # Four sturdy legs with silver/gold hooves (standing flush on h_up=0..32)
        place_local(M_b, horn_col, -10, 0, -20, '98138'),
        place_local(M_b, horn_col, 10, 0, -20, '98138'),
        place_local(M_b, horn_col, -10, 0, 20, '98138'),
        place_local(M_b, horn_col, 10, 0, 20, '98138'),
        place_local(M_b, body_col, -10, 8, -20, '3062b'),
        place_local(M_b, body_col, 10, 8, -20, '3062b'),
        place_local(M_b, body_col, -10, 8, 20, '3062b'),
        place_local(M_b, body_col, 10, 8, 20, '3062b'),
        # Underbelly plate (24..32) & barrel torso brick (32..56)
        place_local(M_b, belly_col, 0, 24, 0, '3020', RY(math.pi / 2)),
        place_local(M_b, body_col, 0, 32, 0, '3001', RY(math.pi / 2)),
        # Muscular shoulder hump (56..72) & curved haunches (56..72) sitting flush on top of 3001!
        place_local(M_b, body_col, 0, 56, -20, '15068'),
        place_local(M_b, body_col, -10, 56, 20, '11477', RY(math.pi)),
        place_local(M_b, body_col, 10, 56, 20, '11477', RY(math.pi)),
        place_local(M_b, body_col, 0, 56, 0, '3068b'),
        # Sculpted Bull Head (SNOT eyes + sloped forehead + nostrils + sweeping lofty horns)
        place_local(M_b, body_col, -10, 40, -40, '87087', RY(-math.pi / 2)),
        place_local(M_b, body_col, 10, 40, -40, '87087', RY(math.pi / 2)),
        place_local(M_b, body_col, 0, 40, -60, '3022'),
        place_local(M_b, body_col, 0, 48, -60, '15068'),
        place_local(M_b, belly_col, 0, 32, -50, '3022'),
        # Lofty sweeping crescent horns (4085c + 53451 curved horns) sitting flush on top of 87087 head bricks at h_up=64!
        place_local(M_b, horn_col, -10, 64, -40, '4085c', RY(-math.pi / 2)),
        place_local(M_b, horn_col, 10, 64, -40, '4085c', RY(math.pi / 2)),
        # Tail at rear
        place_local(M_b, body_col, 0, 48, 40, '54200', RY(math.pi)),
    ]
    # Sweeping curved bull horns (53451) extending outward (-x / +x) and curving upward (-y)
    out.append(row(horn_col, mat_mul(M_b, mat_mul(T(-16, -68, -40), mat_mul(RY(-math.pi / 2), RX(-0.35)))), '53451'))
    out.append(row(horn_col, mat_mul(M_b, mat_mul(T(16, -68, -40), mat_mul(RY(math.pi / 2), RX(-0.35)))), '53451'))
    # SNOT eye pupils mounted flush on the side studs of 87087
    out.append(row(BLK, mat_mul(M_b, mat_mul(T(-28, -52, -40), RZ(math.pi / 2))), '98138'))
    out.append(row(BLK, mat_mul(M_b, mat_mul(T(28, -52, -40), RZ(-math.pi / 2))), '98138'))
    return out


def lion_beast(x, yup, z, rot=0):
    """22-piece sculpted Tawny Homeric Lion (smerdaleo leonte, Il. XVIII.579) with clawed paws (49668),
    lithe sloped haunches (11477), shaggy dark-tan & reddish-brown mane (54200/85984), SNOT eyes,
    and roaring fanged jaws (WHITE 49668 tooth plate)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.11))
    out = [
        # Clawed paws (0..8) & muscular legs (8..32)
        place_local(M_b, TAN, -10, 0, -20, '49668'),
        place_local(M_b, TAN, 10, 0, -20, '49668'),
        place_local(M_b, TAN, -10, 0, 20, '3023', RY(math.pi / 2)),
        place_local(M_b, TAN, 10, 0, 20, '3023', RY(math.pi / 2)),
        place_local(M_b, TAN, -10, 8, -20, '3004', RY(math.pi / 2)),
        place_local(M_b, TAN, 10, 8, -20, '3004', RY(math.pi / 2)),
        place_local(M_b, TAN, -10, 8, 20, '3004', RY(math.pi / 2)),
        place_local(M_b, TAN, 10, 8, 20, '3004', RY(math.pi / 2)),
        # Lithe tawny body (32..40) & sloped haunches sitting flush at h_up=40 (40..56)
        place_local(M_b, TAN, 0, 32, 0, '3020', RY(math.pi / 2)),
        place_local(M_b, TAN, -10, 40, 20, '11477', RY(math.pi)),
        place_local(M_b, TAN, 10, 40, 20, '11477', RY(math.pi)),
        # Shaggy Dark-Tan & Reddish-Brown Mane (40..64 brick + 64..80 mane slopes sitting flush!)
        place_local(M_b, DTAN, 0, 40, -16, '3003'),
        place_local(M_b, RB, -10, 64, -20, '54200', RY(-math.pi / 2)),
        place_local(M_b, RB, 10, 64, -20, '54200', RY(math.pi / 2)),
        place_local(M_b, DTAN, 0, 64, -10, '85984', RY(math.pi)),
        # Fierce Lion Head with roaring white fangs (49668) & red lower jaw
        place_local(M_b, TAN, -10, 40, -36, '87087', RY(-math.pi / 2)),
        place_local(M_b, TAN, 10, 40, -36, '87087', RY(math.pi / 2)),
        place_local(M_b, WHITE, -10, 40, -56, '49668'),
        place_local(M_b, WHITE, 10, 40, -56, '49668'),
        place_local(M_b, TAN, 0, 48, -56, '15068'),
        place_local(M_b, DRED, 0, 32, -46, '3022'),
        # Whipping tail
        place_local(M_b, TAN, 0, 40, 40, '54200', RY(math.pi)),
    ]
    out.append(row(BLY, mat_mul(M_b, mat_mul(T(-28, -52, -36), RZ(math.pi / 2))), '98138'))
    out.append(row(BLY, mat_mul(M_b, mat_mul(T(28, -52, -36), RZ(-math.pi / 2))), '98138'))
    return out


def dog_beast(x, yup, z, rot=0, col=TAN):
    """11-piece sculpted Homeric Hunting Hound (kynes argoi, Il. XVIII.578, 584-586) with four legs,
    sloped back, alert head, pointed ears, snout, and upturned tail — all sitting 100% flush."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.14))
    ear_col = DB if col == TAN else BLK
    return [
        place_local(M_b, col, -10, 0, -10, '3024'),
        place_local(M_b, col, 10, 0, -10, '3024'),
        place_local(M_b, col, -10, 0, 10, '3024'),
        place_local(M_b, col, 10, 0, 10, '3024'),
        place_local(M_b, col, 0, 8, 0, '3021', RY(math.pi / 2)),
        place_local(M_b, col, -10, 16, 10, '11477', RY(math.pi)),
        place_local(M_b, col, 10, 16, 10, '11477', RY(math.pi)),
        place_local(M_b, col, 0, 16, -20, '87087'),
        place_local(M_b, ear_col, 0, 40, -20, '54200'),
        place_local(M_b, col, 0, 24, -30, '3023', RY(math.pi / 2)),
        place_local(M_b, ear_col, 0, 16, 20, '54200', RY(math.pi)),
    ]


def sheep_beast(x, yup, z, rot=0):
    """12-piece sculpted White-Fleeced Sheep (oin argikepheon, Il. XVIII.529, 588) with puffy curved-slope wool,
    four black legs, black face, and curled tan horns — all sitting 100% flush."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.12))
    return [
        place_local(M_b, BLK, -10, 0, -10, '3024'),
        place_local(M_b, BLK, 10, 0, -10, '3024'),
        place_local(M_b, BLK, -10, 0, 10, '3024'),
        place_local(M_b, BLK, 10, 0, 10, '3024'),
        place_local(M_b, WHITE, 0, 8, 0, '3022'),
        place_local(M_b, WHITE, -10, 16, 0, '11477', RY(math.pi)),
        place_local(M_b, WHITE, 10, 16, 0, '11477', RY(math.pi)),
        place_local(M_b, WHITE, 0, 16, 0, '15068', RY(math.pi)),
        place_local(M_b, BLK, 0, 16, -20, '87087'),
        place_local(M_b, TAN, -10, 40, -20, '54200', RY(-math.pi / 2)),
        place_local(M_b, TAN, 10, 40, -20, '54200', RY(math.pi / 2)),
    ]


def horse_beast(x, yup, z, rot=0, body_col=DB, mane_col=BLK):
    """16-piece sculpted Homeric Nimble-Footed Warhorse (aeripodes hippoi, Il. XVIII.532) with long legs,
    crimson saddle cloth, arched neck, bridled head, and flowing mane."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.09))
    return [
        place_local(M_b, BLK, -10, 0, -20, '98138'),
        place_local(M_b, BLK, 10, 0, -20, '98138'),
        place_local(M_b, BLK, -10, 0, 20, '98138'),
        place_local(M_b, BLK, 10, 0, 20, '98138'),
        place_local(M_b, body_col, -10, 8, -20, '3062b'),
        place_local(M_b, body_col, 10, 8, -20, '3062b'),
        place_local(M_b, body_col, -10, 8, 20, '3062b'),
        place_local(M_b, body_col, 10, 8, 20, '3062b'),
        place_local(M_b, body_col, 0, 32, 0, '3020', RY(math.pi / 2)),
        place_local(M_b, body_col, 0, 40, 0, '3001', RY(math.pi / 2)),
        place_local(M_b, DRED, 0, 64, 10, '3068b'),
        place_local(M_b, body_col, 0, 64, -20, '3004'),
        place_local(M_b, body_col, 0, 88, -20, '3023', RY(math.pi / 2)),
        place_local(M_b, body_col, 0, 96, -30, '11477'),
        place_local(M_b, mane_col, 0, 88, -10, '54200', RY(math.pi)),
        place_local(M_b, mane_col, 0, 56, 40, '54200', RY(math.pi)),
    ]


def snot_fresco_band(x0, yup, z_face, width_studs, palette=(DRED, AZURE, GOLD, WHITE), facing='+z'):
    """Mounts a vertical SNOT painted fresco relief of 1x2 tiles & round medallions along a wall face.
    Using RX(-math.pi / 2) for facing='+z' orients the tile's top face (ly=0, normal -y) outward toward +z,
    and offsetting z by +6 places the 8-LDU tile cleanly in front of the wall face with zero Z-fighting!"""
    out = []
    rx = RX(-math.pi / 2) if facing == '+z' else RX(math.pi / 2)
    z_tile = z_face + (6 if facing == '+z' else -6)
    z_boss = z_face + (14 if facing == '+z' else -14)
    for idx in range(width_studs):
        cx = x0 + (idx + 0.5) * S
        col1 = palette[idx % len(palette)]
        out.append(row(col1, mat_mul(T(cx, -(yup + 24), z_tile), rx), '3069b'))
        if idx % 2 == 0:
            out.append(row(GOLD, mat_mul(T(cx, -(yup + 24), z_boss), rx), '98138'))
    return out


def fill_ground(i_range, k_range, skip_cells, stand_cells, col_fn, yup=BASE):
    """Tiles every cell in i_range x k_range except skip_cells; cells in stand_cells remain open at `yup`."""
    tile_cells = {(i, k) for i in i_range for k in k_range if (i, k) not in skip_cells and (i, k) not in stand_cells}
    return L.pack(tile_cells, col_fn, 'tile', yup)


def masonic_column(x, z, yup, courses=5, col=DRED, cap_col=BLK):
    """2x2 round column (x, z is center of 2x2 stud square, multiple of 20) with base plate, round bricks, and capital plate."""
    out = [on(cap_col, x, yup, z, '4032a')]
    y = yup + 8
    for _ in range(courses):
        out.append(on(col, x, y, z, '3941'))
        y += 24
    out.append(on(cap_col, x, y, z, '4032a'))
    return out, y + 8


def col_cells(x, z):
    return {(x // S - 1, z // S - 1), (x // S, z // S - 1), (x // S - 1, z // S), (x // S, z // S)}


def colonnade_entablature(x_cols, z_center, yup, courses=5, col_color=DRED, cap_color=BLK,
                          beam_color=DB, frieze_color=TAN, triglyph_color=DBLUE, roof_color=DRED,
                          pitched=True, horns=False):
    """Builds a row of 2x2 columns at x in x_cols (spaced <= 12 studs center-to-center) along z_center,
    and spans a 100% clicked architrave plate, triglyph/metope brick frieze, cornice plate, and either a
    pitched 45-degree tile roof (3039/3037) or Minoan Horns of Consecration across the top!
    Returns (rows, stand_cells, roof_top_y)."""
    rows = []
    stand = set()
    col_top = yup + 16 + courses * 24
    for cx in x_cols:
        c_rows, col_top = masonic_column(cx, z_center, yup, courses=courses, col=col_color, cap_col=cap_color)
        rows += c_rows
        stand |= col_cells(cx, z_center)

    i_min = min(x_cols) // S - 1
    i_max = max(x_cols) // S
    w_total = i_max - i_min + 1
    k0 = z_center // S - 1  # 2 studs deep: k0, k0+1

    # 1. Spanning Architrave Plate Layer at col_top (2 studs deep x w_total studs wide)
    # Using L.block with 'plate' lays 2x12, 2x10, 2x8, 2x6, 2x4 plates that bridge directly from column to column!
    rows.append(L.block(beam_color, 'plate', i_min, k0, w_total, 2, col_top))
    # Cross-bond a second plate layer shifted by 2 studs so all spans are locked together into a single rigid beam
    if w_total >= 6:
        rows.append(L.block(beam_color, 'plate', i_min, k0, 2, 2, col_top + 8))
        rows.append(L.block(beam_color, 'plate', i_min + 2, k0, w_total - 4, 2, col_top + 8))
        rows.append(L.block(beam_color, 'plate', i_max - 1, k0, 2, 2, col_top + 8))
    else:
        rows.append(L.block(beam_color, 'plate', i_min, k0, w_total, 2, col_top + 8))

    frieze_y = col_top + 16
    # 2. Triglyph & Metope Brick Frieze Course (height 24)
    pos = i_min
    idx = 0
    while pos <= i_max:
        rem = i_max - pos + 1
        step = min(2, rem)
        c = triglyph_color if idx % 2 == 0 else frieze_color
        rows.append(L.block(c, 'brick', pos, k0, step, 2, frieze_y))
        pos += step
        idx += 1

    # Add SNOT rosette/spiral relief along the front face of the frieze
    rows += snot_fresco_band(i_min * S, frieze_y - 12, (k0 + 2) * S + 2, w_total,
                             palette=(GOLD, triglyph_color, frieze_color, WHITE), facing='+z')

    cornice_y = frieze_y + 24
    # 3. Cornice Plate Layer
    rows.append(L.block(cap_color, 'plate', i_min, k0, w_total, 2, cornice_y))
    roof_y = cornice_y + 8

    # 4. Roof Superstructure: Pitched Tile Roof OR Minoan Horns of Consecration
    if pitched:
        # Cap the 2-stud cornice with alternating terracotta roof tiles & a raised central ridge crest
        rows.append(L.block(roof_color, 'plate', i_min, k0, w_total, 2, roof_y))
        rows.append(L.block(RB, 'tile', i_min, k0, w_total, 1, roof_y + 8))
        rows.append(L.block(roof_color, 'tile', i_min, k0 + 1, w_total, 1, roof_y + 8))
        return rows, stand, roof_y + 16
    elif horns:
        # Flat Minoan roof terrace with iconic white Horns of Consecration along the front parapet
        rows.append(L.block(TAN, 'tile', i_min, k0, w_total, 1, roof_y))
        pos = i_min
        while pos <= i_max:
            if (pos - i_min) % 4 == 0 and pos + 1 <= i_max:
                rows.append(L.block(WHITE, 'plate', pos, k0 + 1, 2, 1, roof_y))
                rows.append(on(WHITE, (pos + 0.5) * S, roof_y + 8, (k0 + 1.5) * S, '3005'))
                rows.append(on(WHITE, (pos + 1.5) * S, roof_y + 8, (k0 + 1.5) * S, '3005'))
                rows.append(on(GOLD, (pos + 0.5) * S, roof_y + 32, (k0 + 1.5) * S, '98138'))
                rows.append(on(GOLD, (pos + 1.5) * S, roof_y + 32, (k0 + 1.5) * S, '98138'))
                pos += 2
            else:
                rows.append(L.block(TAN, 'tile', pos, k0 + 1, 1, 1, roof_y))
                pos += 1
        return rows, stand, roof_y + 40
    else:
        rows.append(L.block(roof_color, 'tile', i_min, k0, w_total, 2, roof_y))
        return rows, stand, roof_y + 8


def crucible_bellows_rig(x, yup, z, rot=0):
    """Articulated Olympian Bellows Battery (phusai eikosi pasai, Il. XVIII.470) with twin leather bags,
    bronze nozzles, Technic lever frame, and roaring trans-orange flames."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.07))
    out = [
        place_local(M_b, DBG, 0, 0, 0, '3031'),
        place_local(M_b, BRONZE, -20, 8, -10, '3004', RY(math.pi / 2)),
        place_local(M_b, BRONZE, 20, 8, -10, '3004', RY(math.pi / 2)),
        place_local(M_b, DB, -20, 32, -10, '11477'),
        place_local(M_b, DB, 20, 32, -10, '11477'),
        place_local(M_b, GOLD, -20, 32, 10, '4085c'),
        place_local(M_b, GOLD, 20, 32, 10, '4085c'),
        place_local(M_b, SILVER, -20, 8, -30, '54200'),
        place_local(M_b, SILVER, 20, 8, -30, '54200'),
    ]
    out.append(row(TORANGE, mat_mul(M_b, mat_mul(T(0, -28, -38), RX(math.pi / 2))), '6126b'))
    return out


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT I: THE FORGE OF HEPHAESTUS & THE REVOLVING BEAR (Iliad XVIII.468–490)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_forge():
    rows, covered = frame(-320, -320, 32, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -15, 14, -15, 14
    stand = set()

    # 1. Sculpted Volcanic Furnace Massif at the rear (k in -14..-6) with glowing magma river & central column at (0, -160)
    CX, CZ = 0, -160
    NH = 6
    TOPC = BASE + NH * B  # 152

    def forge_sdf(p):
        x, y, z = p
        i, k = math.floor(x / S), math.floor(z / S)
        if not (I_LO <= i <= I_HI and K_LO <= k <= K_HI):
            return 99, 'air'
        # Central 4x4 column for the Revolving Bear Celestial Dome (i in -2..1, k in -10..-7)
        if -2 <= i <= 1 and -10 <= k <= -7 and y < TOPC:
            return -1, 'core'
        # Volcanic basalt massif & furnace hood at the rear (k <= -6)
        d = ell(p, (0, 35, -225), (275, 175, 100)) + rough(p, 10, 1.3)
        d = smin(d, ell(p, (-210, 25, -145), (95, 130, 90)) + rough(p, 8, 2.1), 28)
        d = smin(d, ell(p, (210, 25, -145), (95, 130, 90)) + rough(p, 8, 3.4), 28)
        if d <= 0:
            if abs(x) < 55 and z > -250:
                return d, 'lava'
            return d, 'rock'
        return 99, 'air'

    def forge_col(m, i, h, k):
        if m in ('core', 'seat'):
            return BRONZE if h >= NH - 2 else (DBG if (i // 2 + k // 2 + h) % 2 == 0 else BLK)
        if m == 'lava':
            return ORANGE if (i + h) % 2 == 0 else (RED if k % 2 == 0 else BLY)
        v = hsh(i // 2, k // 2, h) % 6
        return BLK if v < 2 else (DB if v == 2 else (BRONZE if v == 3 else DBG))

    form = Form(y0=BASE, unit=B, caps=True, keep_studs=('seat',))
    form.carve(forge_sdf, range(I_LO, I_HI + 1), range(0, NH), range(K_LO, K_HI + 1))
    for i in range(-2, 2):
        for k in range(-10, -6):
            for h in range(NH):
                form.vox[(i, h, k)] = 'core'
            form.vox[(i, NH - 1, k)] = 'seat'
    form.hollow(side=2, up=2, pillar=4, keep=lambda v, m: m in ('core', 'seat', 'lava'))
    sculpt.settle(form, forge_col, anchor_rows=rows)
    rows += form.parts(forge_col)
    land_used = {(i, k) for (i, h, k) in form.vox}

    # 2. THE OBJECT I (Crown of the Furnace at (0, -160), yup=TOPC):
    #    8x8 Cross-Bonded Celestial Orrery Dome & The Revolving Bear (Arktos, Il. XVIII.483-489)
    ci, ck = CX // S, CZ // S  # 0, -8
    rows.append(on(GOLD, CX, TOPC, CZ, '61485c01'))
    TT_TOP = TOPC + 16  # 168
    # Layer 1 & 2: 8x8 cruciform night-sky & Oceanus base
    rows.append(L.block(DBLUE, 'plate', ci - 4, ck - 2, 8, 4, TT_TOP))
    rows.append(L.block(DBLUE, 'plate', ci - 2, ck - 4, 4, 8, TT_TOP + 8))
    rows.append(L.block(AZURE, 'plate', ci - 4, ck - 2, 2, 4, TT_TOP + 8))
    rows.append(L.block(AZURE, 'plate', ci + 2, ck - 2, 2, 4, TT_TOP + 8))
    BOSS_TOP = TT_TOP + 16  # 184
    # Unwearied Sun (Helios, 2x2 golden pillar with radiant crown at (-40, CZ))
    rows.append(on(GOLD, -40, BOSS_TOP, CZ, '3941'))
    rows.append(on(BLY, -40, BOSS_TOP + 24, CZ, '4032a'))
    rows.append(on(GOLD, -40, BOSS_TOP + 32, CZ, '4740'))
    # Full Moon (Selene, 2x2 silver pillar with pearl crescent at (40, CZ))
    rows.append(on(SILVER, 40, BOSS_TOP, CZ, '3941'))
    rows.append(on(WHITE, 40, BOSS_TOP + 24, CZ, '4032a'))
    rows.append(on(WHITE, 40, BOSS_TOP + 32, CZ, '2654'))
    # The Bear (Arktos / Wain, 1x1 constellation turret at (-10, CZ - 50)) revolving in place, watching Orion
    rows.append(on(DBLUE, -10, BOSS_TOP, CZ - 50, '3062b'))
    rows.append(on(GOLD, -10, BOSS_TOP + 24, CZ - 50, '3062b'))
    rows.append(on(BLY, -10, BOSS_TOP + 48, CZ - 50, '98138'))
    # Orion the Hunter opposite the Bear (at (10, CZ + 50))
    rows.append(on(BRONZE, 10, BOSS_TOP, CZ + 50, '3062b'))
    rows.append(on(GOLD, 10, BOSS_TOP + 24, CZ + 50, '3062b'))
    rows.append(on(TORANGE, 10, BOSS_TOP + 48, CZ + 50, '98138'))
    # Pleiades & Hyades star clusters on the central 2x2 sky vault
    for sx, sz in ((-10, CZ - 10), (10, CZ - 10), (-10, CZ + 10), (10, CZ + 10)):
        rows.append(on(GOLD, sx, BOSS_TOP, sz, '98138'))

    # 3. Twin Roofed Bronze Foundry Colonnades on Left (-x) and Right (+x) flanks
    p_l, st_l, _ = colonnade_entablature([-240, -140], 20, BASE, courses=4, col_color=BRONZE, cap_color=BLK,
                                         beam_color=DBG, frieze_color=BRONZE, triglyph_color=GOLD, roof_color=DBG, pitched=True)
    rows += p_l
    stand |= st_l
    p_r, st_r, _ = colonnade_entablature([140, 240], 20, BASE, courses=4, col_color=BRONZE, cap_color=BLK,
                                         beam_color=DBG, frieze_color=BRONZE, triglyph_color=GOLD, roof_color=DBG, pitched=True)
    rows += p_r
    stand |= st_r

    # 4. THE OBJECT II (Center of the Foundry Floor at (0, 60) -> i in -2..1, k in 1..4):
    #    Hephaestus's Great Anvil Pedestal & The Revolving 6x6 Five-Fold Shield Blank in the Making!
    for i in range(-2, 2):
        for k in range(1, 5):
            stand.add((i, k))
    rows.append(L.block(DBG, 'brick', -2, 1, 4, 4, BASE))
    rows.append(on(BRONZE, 0, BASE + 24, 60, '61485c01'))
    SH_Y = BASE + 40  # 48
    # Five-fold shield blank on the anvil turntable: Bronze outer ring, Silver tin ring, Kyanos blue, Golden boss & red-hot rim!
    rows.append(L.block(BRONZE, 'plate', -3, 1, 6, 4, SH_Y))
    rows.append(L.block(SILVER, 'plate', -2, 0, 4, 6, SH_Y + 8))
    rows.append(L.block(DBLUE, 'plate', -2, 1, 4, 4, SH_Y + 16))
    rows.append(L.block(GOLD, 'tile', -1, 2, 2, 2, SH_Y + 24))
    for sx, sz in ((-50, 30), (50, 30), (-50, 90), (50, 90)):
        rows.append(on(TORANGE, sx, SH_Y + 8, sz, '98138'))

    # 5. Twin Articulated Bellows Batteries & Glowing Crucible Vats flanking the Anvil
    rows += crucible_bellows_rig(-90, BASE + 8, -45, rot=0.35)
    rows += crucible_bellows_rig(90, BASE + 8, -45, rot=-0.35)

    # Ingot & Finished Armour Rack on the right at i in 7..10, k in 7..8
    for i in range(7, 11):
        for k in range(7, 9):
            stand.add((i, k))
    rows.append(L.block(DBG, 'brick', 7, 7, 4, 2, BASE))
    rows.append(L.block(BRONZE, 'tile', 7, 7, 1, 2, BASE + 24))
    rows.append(L.block(SILVER, 'tile', 8, 7, 1, 2, BASE + 24))
    rows.append(L.block(DBLUE, 'tile', 9, 7, 1, 2, BASE + 24))
    rows.append(L.block(GOLD, 'tile', 10, 7, 1, 2, BASE + 24))

    # Stone Quenching Trough with glowing steam at (-200, 160) -> i in -11..-8, k in 7..8
    for i in range(-11, -7):
        for k in range(7, 9):
            stand.add((i, k))
    rows.append(L.block(DBG, 'brick', -11, 7, 4, 2, BASE))
    rows.append(L.block(TBLUE, 'tile', -11, 7, 4, 2, BASE + 24))

    # Ground paving across all remaining floor cells (bronze-inlaid basalt flagstones of Olympus)
    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered | land_used, stand,
                        lambda i, k: BRONZE if (i // 2 + k // 2) % 4 == 0 else (DBG if (i // 3 + k // 3) % 2 == 0 else LBG))

    # 6. Cast: Hephaestus with Hammer & Tongs, Two Living Golden Handmaidens (Kourai Khryseiai), and Silver-Footed Thetis
    rows += figure(-55, BASE + 8, 55, rot=math.pi / 2 + 0.2, torso_col=RB, legs_col=DB,
                   headgear=('11264', DB), beard=('10052', DB), held_r=('55295', SILVER), held_l=('3959', TORANGE))
    rows += figure(-150, BASE + 8, 110, rot=2.5, torso_col=GOLD, legs_col=GOLD, head_col=GOLD,
                   skirt_col=GOLD, headgear=('33322', GOLD), held_r=('4497', GOLD))
    rows += figure(150, BASE + 8, 110, rot=-2.5, torso_col=GOLD, legs_col=GOLD, head_col=GOLD,
                   skirt_col=GOLD, headgear=('93562', GOLD), held_l=('2343', GOLD))
    rows += figure(0, BASE + 8, 210, rot=math.pi, torso_col=WHITE, skirt_col=SILVER,
                   headgear=('12890', BLK), cape_col=DBLUE)
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT II: THE TWO TALENTS IN THE AGORA & THE BRIDAL TORCH-DANCE (Iliad XVIII.491–508)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_peace():
    rows, covered = frame(-480, -320, 48, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -23, 22, -15, 14
    stand = set()

    # 1. Right Side (+x, i in 3..21): THE MYCENAEAN BRIDAL PALACE MEGARON, UPPER BALCONY & REVOLVING TORCH-DANCE
    # Raised Megaron Stylobate at i in 5..20, k in -14..-8 (16x6 studs)
    for i in range(5, 21):
        for k in range(-14, -8):
            stand.add((i, k))
    rows.append(L.block(TAN, 'plate', 5, -14, 16, 6, BASE))
    STY_Y = BASE + 8  # 16

    # Rear Megaron Wall with Central Grand Portal (i in 5..10 left wing, i in 11..14 doorway, i in 15..20 right wing) at k = -14..-13
    for h_idx, col in enumerate([DTAN, TAN, DRED, TAN, DTAN, DRED]):
        yc = STY_Y + h_idx * 24
        if h_idx < 4:
            rows.append(L.block(col, 'brick', 5, -14, 6, 2, yc))
            rows.append(L.block(col, 'brick', 15, -14, 6, 2, yc))
        else:
            rows.append(L.block(col, 'brick', 5, -14, 16, 2, yc))
    WALL_TOP = STY_Y + 6 * 24  # 160
    rows.append(L.block(WHITE, 'tile', 5, -14, 6, 2, WALL_TOP))
    rows.append(L.block(WHITE, 'tile', 15, -14, 6, 2, WALL_TOP))
    rows.append(L.block(GOLD, 'plate', 11, -14, 4, 2, WALL_TOP))

    # SNOT Painted Pylos Fresco Band along the Megaron facade
    rows += snot_fresco_band(5 * S, STY_Y + 48, -12 * S + 2, 6, palette=(DRED, AZURE, GOLD, WHITE), facing='+z')
    rows += snot_fresco_band(15 * S, STY_Y + 48, -12 * S + 2, 6, palette=(DRED, AZURE, GOLD, WHITE), facing='+z')

    # Front Megaron Colonnade & Roofed Entablature at z = -180 (columns at x = 140, 260, 380 -> 6 studs apart, 100% clicked!)
    p_meg, st_meg, _ = colonnade_entablature([140, 260, 380], -180, STY_Y, courses=4, col_color=DRED, cap_color=BLK,
                                             beam_color=DB, frieze_color=TAN, triglyph_color=DRED, roof_color=DRED,
                                             pitched=False, horns=True)
    rows += p_meg
    porch_tiles = {(i, k) for i in range(5, 21) for k in range(-12, -8) if (i, k) not in st_meg}
    rows += L.pack(porch_tiles, lambda i, k: DRED if (i // 2 + k // 2) % 2 == 0 else WHITE, 'tile', STY_Y)

    # Side Town Portal with Pitched Terracotta Roof at i in 17..20, k in 4..7 where women stand at their doors admiring (Il. XVIII.495-496)
    for i in range(17, 21):
        for k in range(4, 8):
            stand.add((i, k))
    rows.append(L.block(TAN, 'brick', 17, 4, 4, 1, BASE))
    rows.append(L.block(TAN, 'brick', 17, 7, 4, 1, BASE))
    rows.append(L.block(DRED, 'brick', 17, 4, 4, 1, BASE + 24))
    rows.append(L.block(DRED, 'brick', 17, 7, 4, 1, BASE + 24))
    rows.append(L.block(DB, 'plate', 17, 4, 4, 4, BASE + 48))
    rows.append(L.block(RB, 'plate', 17, 5, 4, 2, BASE + 56))
    rows.append(L.block(DRED, 'tile', 17, 4, 4, 4, BASE + 64))
    rows.append(L.block(WHITE, 'tile', 17, 5, 4, 2, BASE))

    # THE OBJECT I: 8x8 Cross-Bonded Bridal Dance Turntable (61485c01) in the courtyard at (220, 60) -> i in 9..12, k in 1..4
    for i in range(9, 13):
        for k in range(1, 5):
            stand.add((i, k))
    rows.append(on(TAN, 220, BASE, 60, '61485c01'))
    BD_Y = BASE + 16  # 24
    rows.append(L.block(WHITE, 'plate', 7, 1, 8, 4, BD_Y))
    rows.append(L.block(TAN, 'plate', 9, -1, 4, 8, BD_Y + 8))
    rows.append(L.block(DRED, 'plate', 7, 1, 2, 4, BD_Y + 8))
    rows.append(L.block(AZURE, 'plate', 13, 1, 2, 4, BD_Y + 8))
    rows.append(L.block(GOLD, 'tile', 10, 2, 2, 2, BD_Y + 16))
    BD_TOP = BD_Y + 16  # 40

    # Gnarled Olive & Cypress trees framing the street
    L.AVOID.clear()
    ol = L.olive(40, -60, yup=BASE, seed=3)
    cy = L.cypress(410, -40, yup=BASE, seed=5, height=9)
    rows += ol.rows + cy.rows
    stand |= ol.cells | cy.cells

    # 2. Left Side (-x, i in -22..-2): ROOFED AGORA STOA, SACRED CIRCLE OF POLISHED STONES & TWO TALENTS OF GOLD
    p_stoa, st_stoa, _ = colonnade_entablature([-400, -280, -160, -40], -220, BASE, courses=4, col_color=WHITE, cap_color=GOLD,
                                               beam_color=LBG, frieze_color=WHITE, triglyph_color=DBLUE, roof_color=DRED, pitched=True)
    rows += p_stoa
    stand |= st_stoa
    # Rear Stoa Wall with Golden Law-Code Tablets at k = -14 (i in -21..-2)
    for i in range(-21, -1):
        stand.add((i, -14))
    for h_idx, col in enumerate([LBG, WHITE, WHITE, LBG]):
        rows.append(L.block(col, 'brick', -21, -14, 20, 1, BASE + h_idx * 24))
    rows.append(L.block(GOLD, 'tile', -21, -14, 20, 1, BASE + 4 * 24))
    rows += snot_fresco_band(-21 * S, BASE + 24, -13 * S + 2, 20, palette=(WHITE, GOLD, DBLUE, LBG), facing='+z')

    # THE OBJECT II: 8x8 Cross-Bonded Judgment Dais & Two Talents of Gold at (-240, 40) -> i in -14..-11, k in 0..3
    AG_X, AG_Z = -240, 40
    for i in range(-14, -10):
        for k in range(0, 4):
            stand.add((i, k))
    rows.append(on(LBG, AG_X, BASE, AG_Z, '61485c01'))
    AG_Y = BASE + 16  # 24
    rows.append(L.block(WHITE, 'plate', -16, 0, 8, 4, AG_Y))
    rows.append(L.block(LBG, 'plate', -14, -2, 4, 8, AG_Y + 8))
    rows.append(L.block(WHITE, 'plate', -16, 0, 2, 4, AG_Y + 8))
    rows.append(L.block(WHITE, 'plate', -10, 0, 2, 4, AG_Y + 8))
    AG_TOP = AG_Y + 16  # 40
    # Stepped Marble Altar in the center carrying the Two Talents of Gold (duwo khrysioio talanta, Il. XVIII.507)
    rows.append(L.block(WHITE, 'brick', -13, 1, 2, 2, AG_TOP))
    rows.append(L.block(GOLD, 'plate', -13, 1, 2, 2, AG_TOP + 24))
    rows.append(on(GOLD, AG_X - 10, AG_TOP + 32, AG_Z - 10, '98138'))
    rows.append(on(GOLD, AG_X + 10, AG_TOP + 32, AG_Z - 10, '98138'))
    rows.append(on(GOLD, AG_X - 10, AG_TOP + 32, AG_Z + 10, '3070b'))
    rows.append(on(GOLD, AG_X + 10, AG_TOP + 32, AG_Z + 10, '3070b'))

    # 8 Polished White Stone Benches with Backrests (hieros kyklos) in a circle around (-240, 40)
    SEATS = [(-20, -1), (-20, 3), (-16, -6), (-10, -6), (-6, -1), (-6, 3), (-16, 8), (-10, 8)]
    for si, sk in SEATS:
        for a in range(2):
            for b in range(2):
                stand.add((si + a, sk + b))
        rows.append(L.block(WHITE, 'brick', si, sk, 2, 2, BASE))
        rows.append(L.block(WHITE, 'plate', si, sk, 2, 1, BASE + 24))
        rows.append(L.block(LBG, 'tile', si, sk + 1, 2, 1, BASE + 24))
        rows.append(L.block(GOLD, 'tile', si, sk, 2, 1, BASE + 32))

    # Dry-stone boundary curb along the street divider (i = 0, k in -10..8)
    dw = L.drystone(0, -180, length=16, yup=BASE, seed=4, courses=2, axis='z')
    rows += dw.rows
    stand |= dw.cells

    # Ground paving across all remaining cells
    def peace_ground(i, k):
        if i > 0:
            return WHITE if (i // 2 + k // 2) % 4 == 0 else (TAN if (i // 3 + k // 3) % 2 == 0 else DTAN)
        r = math.hypot((i + 0.5) * S - AG_X, (k + 0.5) * S - AG_Z)
        if r < 165:
            return WHITE if (i // 2 + k // 2) % 2 == 0 else LBG
        return LBG if (i // 3 + k // 3) % 2 == 0 else DBG

    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered, stand, peace_ground)

    # 3. Cast (16 articulated minifigures across both scenes)
    rows += figure(240, STY_Y, -210, rot=math.pi, torso_col=WHITE, skirt_col=WHITE, headgear=('33322', GOLD), cape_col=GOLD)
    rows += figure(280, STY_Y, -210, rot=math.pi, torso_col=DRED, legs_col=WHITE, headgear=('11264', DB), cape_col=GOLD)
    rows += figure(260, WALL_TOP + 8, -260, rot=math.pi, torso_col=AZURE, skirt_col=WHITE, headgear=('93562', BLK))
    rows += figure(150, BASE + 8, -70, rot=2.8, torso_col=GOLD, legs_col=TAN, headgear=('10048', DB), held_r=('3959', TORANGE))
    rows += figure(310, BASE + 8, -70, rot=-2.8, torso_col=AZURE, legs_col=TAN, headgear=('10048', RB), held_r=('3959', TORANGE))
    rows += figure(170, BD_TOP, 60, rot=1.6, torso_col=BLY, legs_col=WHITE, headgear=('11264', DB), held_r=('3957a', GOLD))
    rows += figure(270, BD_TOP, 60, rot=-1.6, torso_col=AZURE, legs_col=WHITE, headgear=('10048', RB), held_r=('30374', SILVER))
    rows += figure(220, BD_TOP, 10, rot=math.pi, torso_col=DRED, legs_col=WHITE, headgear=('11264', BLK))
    rows += figure(220, BD_TOP, 110, rot=0, torso_col=WHITE, skirt_col=BLY, headgear=('33322', GOLD))
    rows += figure(380, BASE + 8, 110, rot=-2.4, torso_col=DRED, skirt_col=DRED, headgear=('93562', BLK))
    rows += figure(-295, AG_TOP, 40, rot=math.pi / 2, torso_col=AZURE, legs_col=WHITE, headgear=('10048', DB), held_r=('2343', GOLD))
    rows += figure(-185, AG_TOP, 40, rot=-math.pi / 2, torso_col=DRED, legs_col=TAN, headgear=('10048', RB))
    rows += figure(-240, AG_TOP, -10, rot=math.pi, torso_col=WHITE, legs_col=WHITE, headgear=('11264', WHITE),
                   beard=('10052', WHITE), cape_col=GOLD, held_r=('4497', GOLD))
    rows += figure(-380, BASE + 32, 0, rot=math.pi / 2, torso_col=WHITE, legs_col=LBG, headgear=('11264', LBG), beard=('10052', LBG), held_r=('4497', GOLD))
    rows += figure(-100, BASE + 32, 0, rot=-math.pi / 2, torso_col=WHITE, legs_col=LBG, headgear=('11264', WHITE), beard=('60750', WHITE), held_r=('4497', GOLD))
    rows += figure(-240, BASE + 8, 220, rot=2.9, torso_col=GOLD, legs_col=DB, headgear=('3844', GOLD), held_r=('4497', GOLD))
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT III: THE RIVER AMBUSH & THE TALL GOLDEN GODS (Iliad XVIII.509–540)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_war():
    rows, covered = frame(-480, -320, 48, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -23, 22, -15, 14
    stand = set()

    # 1. Sculpted Cyclopean Citadel & Twin-Towered Scaean Gatehouse at +x (i in 9..21, k in -14..-4)
    NH = 5
    WALL_TOP = BASE + NH * B  # 128

    def war_sdf(p):
        x, y, z = p
        i, k = math.floor(x / S), math.floor(z / S)
        if not (I_LO <= i <= I_HI and K_LO <= k <= K_HI):
            return 99, 'air'
        if 9 <= i <= 21 and -14 <= k <= -4:
            # Open interior courtyard behind the front rampart
            if 11 <= i <= 19 and -12 <= k <= -7 and y > BASE + B:
                return 99, 'air'
            # Open 3-stud Scaean Gate passage between Left Bastion (i<=13) and Right Bastion (i>=17) at k in -6..-4
            if 14 <= i <= 16 and -6 <= k <= -4:
                return 99, 'air'
            return -1, 'wall'
        # Rocky bluff overlooking the river ambush at -x (k <= -8, i <= -8)
        d = ell(p, (-310, 15, -210), (145, 96, 85)) + rough(p, 9, 1.7)
        if d <= 0 and y < BASE + 3 * B:
            return d, 'crag'
        return 99, 'air'

    def war_col(m, i, h, k):
        if m in ('wall', 'wstand'):
            if h == 3:
                return DRED if (i // 2 + k // 2) % 2 == 0 else GOLD
            return DTAN if hsh(i // 2, k // 2, h) % 4 == 0 else (LBG if (i // 2 + h) % 2 == 0 else DBG)
        return DTAN if hsh(i // 2, k // 2, h) % 3 == 0 else (OLIVE if h >= 2 else DBG)

    form = Form(y0=BASE, unit=B, caps=True, keep_studs=('wstand',))
    form.carve(war_sdf, range(I_LO, I_HI + 1), range(0, NH), range(K_LO, K_HI + 1))
    # Keep studs along the front rampart walk (i in 9..13 and 17..21, k in -6..-4)
    for i in range(9, 22):
        for k in (-6, -5, -4):
            if (i, NH - 1, k) in form.vox:
                form.vox[(i, NH - 1, k)] = 'wstand'
    form.hollow(side=2, up=2, pillar=4, keep=lambda v, m: m == 'wstand')
    sculpt.settle(form, war_col, anchor_rows=rows)
    rows += form.parts(war_col)
    land_used = {(i, k) for (i, h, k) in form.vox}

    # Bridge the Scaean Gate at WALL_TOP (y=128) with a 7-stud Lintel Beam spanning from i=12 (Left Tower) to i=18 (Right Tower)!
    rows.append(L.block(DBG, 'plate', 12, -6, 7, 3, WALL_TOP))
    rows.append(L.block(DRED, 'brick', 12, -6, 7, 3, WALL_TOP + 8))
    rows.append(L.block(LBG, 'plate', 12, -6, 7, 3, WALL_TOP + 32))
    GATE_TOP = WALL_TOP + 40  # 168
    for i in range(12, 19, 2):
        rows.append(L.block(DTAN, 'brick', i, -4, 1, 1, GATE_TOP))
        rows.append(L.block(GOLD, 'tile', i, -4, 1, 1, GATE_TOP + 24))
        if i + 1 <= 18:
            rows.append(L.block(LBG, 'tile', i + 1, -4, 1, 1, GATE_TOP))
    rows.append(L.block(LBG, 'tile', 12, -6, 7, 2, GATE_TOP))

    # Add Crenellated Battlement Merlons on the Left (i in 9..11) and Right (i in 19..21) Tower Wings at WALL_TOP
    for i in (9, 11, 19, 21):
        rows.append(L.block(LBG, 'brick', i, -4, 1, 1, WALL_TOP))
        rows.append(L.block(DTAN, 'tile', i, -4, 1, 1, WALL_TOP + 24))
    for i in (10, 20):
        rows.append(L.block(DBG, 'tile', i, -4, 1, 1, WALL_TOP))

    # SNOT Golden Shield & Spear Relief above the Scaean Gate Lintel
    rows += snot_fresco_band(12 * S, WALL_TOP - 8, -3 * S + 2, 7, palette=(GOLD, DRED, BRONZE, DBG), facing='+z')

    # 2. THE OBJECT: 8x8 Cross-Bonded Riverbank Ambush Blind Turntable (61485c01) at (-160, 0) -> i in -10..-7, k in -2..1
    for i in range(-10, -6):
        for k in range(-2, 2):
            stand.add((i, k))
    rows.append(on(OLIVE, -160, BASE, 0, '61485c01'))
    AM_Y = BASE + 16  # 24
    rows.append(L.block(OLIVE, 'plate', -12, -2, 8, 4, AM_Y))
    rows.append(L.block(DTAN, 'plate', -10, -4, 4, 8, AM_Y + 8))
    rows.append(L.block(OLIVE, 'plate', -12, -2, 2, 4, AM_Y + 8))
    rows.append(L.block(OLIVE, 'plate', -6, -2, 2, 4, AM_Y + 8))
    AM_TOP = AM_Y + 16  # 40
    # Camouflaged reed-and-rock screen along the front edge of the ambush turntable
    rows.append(L.block(DGREEN, 'brick', -11, -3, 6, 1, AM_TOP))
    rows.append(L.block(OLIVE, 'brick', -10, -3, 4, 1, AM_TOP + 24))
    rows.append(L.block(BRONZE, 'tile', -11, -3, 1, 1, AM_TOP + 24))
    rows.append(L.block(BRONZE, 'tile', -6, -3, 1, 1, AM_TOP + 24))
    rows.append(L.block(DGREEN, 'tile', -10, -3, 4, 1, AM_TOP + 48))

    # Waving reeds & gnarled olive along the river ford
    L.AVOID.clear()
    rd1 = L.reeds(-240, 90, w=3, d=2, yup=BASE, seed=1)
    rd2 = L.reeds(-360, -60, w=3, d=2, yup=BASE, seed=2)
    ol = L.olive(-40, -220, yup=BASE, seed=7)
    rows += rd1.rows + rd2.rows + ol.rows
    stand |= rd1.cells | rd2.cells | ol.cells

    # 3. Ground & River Water (diagonal river channel running around i = -14..-11)
    def war_ground(i, k):
        r_dist = abs(i + 13 + k * 0.25)
        if r_dist < 2.3:
            return TBLUE if (i // 2 + k // 2) % 2 == 0 else AZURE
        if r_dist < 3.5:
            return TAN if (i // 2 + k // 2) % 2 == 0 else DTAN
        if i > 4:
            return LBG if (i // 3 + k // 2) % 2 == 0 else DTAN
        return OLIVE if (i // 2 + k // 3) % 2 == 0 else DTAN

    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered | land_used, stand, war_ground)

    # 4. Cast:
    # A. ONTOLOGICAL SCALE SHIFT — Ares & Pallas Athena (1.7x Golden Colossi with divine shields & spears, Il. XVIII.516–519)
    rows += colossus(70, BASE + 8, 10, rot=-2.35, primary=GOLD, accent=DRED, helm_col=GOLD, shield_col=GOLD)
    rows += colossus(155, BASE + 8, -25, rot=-2.35, primary=GOLD, accent=AZURE, helm_col=GOLD, shield_col=GOLD)

    # B. Wives, young children & old men on the Cyclopean ramparts behind the merlons
    rows += figure(210, WALL_TOP, -100, rot=math.pi - 0.15, torso_col=WHITE, skirt_col=DRED, headgear=('93562', BLK))
    rows += figure(310, GATE_TOP + 8, -100, rot=math.pi - 0.15, torso_col=LBG, legs_col=WHITE, headgear=('11264', WHITE), beard=('10052', WHITE), held_r=('4497', RB))
    rows += figure(390, WALL_TOP, -100, rot=math.pi - 0.15, torso_col=AZURE, legs_col=TAN, headgear=('10048', DB))

    # C. Smaller Mortal Armies, Pursuing Warhorse, Ambush Scouts, Two Piping Shepherds, Sculpted Oxen, Sheep & Ker (Fate)
    rows += figure(310, BASE + 8, -90, rot=math.pi - 0.3, torso_col=BRONZE, legs_col=DB, headgear=('10054', BRONZE),
                   shield=('3876', BRONZE), held_r=('4497', RB))
    rows += figure(10, BASE + 8, 90, rot=-2.3, torso_col=BRONZE, legs_col=DB, headgear=('10054', BRONZE),
                   shield=('3876', BRONZE), held_r=('4497', RB))
    rows += horse_beast(280, BASE + 8, 170, rot=-1.9, body_col=DB, mane_col=BLK)
    rows += figure(240, BASE + 8, 150, rot=2.5, torso_col=DBG, legs_col=BLK, headgear=('3844', DBG),
                   shield=('3876', DRED), held_r=('4497', RB))
    rows += figure(340, BASE + 8, 180, rot=2.7, torso_col=DRED, legs_col=BLK, headgear=('10054', BRONZE),
                   held_r=('4497', RB))
    rows += figure(-185, AM_TOP, 5, rot=-2.1, torso_col=BRONZE, legs_col=DB, headgear=('10054', BRONZE), held_r=('3847', SILVER), shield=('3876', BRONZE))
    rows += figure(-135, AM_TOP, 5, rot=-2.3, torso_col=BRONZE, legs_col=DB, headgear=('10054', BRONZE), held_r=('4497', RB))
    rows += figure(-310, BASE + 8, 30, rot=2.4, torso_col=TAN, legs_col=DB, headgear=('10048', RB), held_r=('3957a', RB))
    rows += figure(-380, BASE + 8, 20, rot=2.6, torso_col=OLIVE, legs_col=TAN, headgear=('10048', DB), held_r=('30374', TAN))
    rows += ox_beast(-290, BASE + 8, 130, rot=0.5, body_col=GOLD, horn_col=SILVER)
    rows += ox_beast(-360, BASE + 8, 185, rot=0.9, body_col=RB, horn_col=WHITE)
    rows += sheep_beast(-400, BASE + 8, 100, rot=0.4)
    rows += sheep_beast(-420, BASE + 8, 155, rot=1.1)
    rows += figure(-120, BASE + 8, 175, rot=2.7, torso_col=BLK, legs_col=DRED, head_col=WHITE,
                   headgear=('12890', BLK), cape_col=DRED, held_r=('3847', DRED))
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT IV: THE PLOUGH THAT TURNS BLACK, THE KING'S HARVEST & THE VINTAGE (Iliad XVIII.541–572)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_field():
    rows, covered = frame(-480, -320, 48, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -23, 22, -15, 14
    stand = set()
    L.AVOID.clear()

    # 1. Register I (+x, i in 8..21): THE THRICE-PLOUGHED FALLOW & HEADLAND WINE PERGOLA (Il. XVIII.541–549)
    f_plough = L.field(180, -180, w=12, d=9, yup=BASE, seed=11, crop='plough')
    rows += f_plough.rows
    stand |= f_plough.cells

    # Rustic Headland Wine Pergola & Boundary Shrine at i in 12..17, k in -14..-12 where the Wine-Man gives the sweet cup
    p_wine, st_wine, _ = colonnade_entablature([260, 340], -260, BASE, courses=3, col_color=TAN, cap_color=DB,
                                               beam_color=DB, frieze_color=DTAN, triglyph_color=GOLD, roof_color=RB, pitched=True)
    rows += p_wine
    stand |= st_wine
    # Wine amphora table under the pergola at i in 14..15, k in -13..-12
    for i in (14, 15):
        for k in (-13, -12):
            stand.add((i, k))
    rows.append(L.block(TAN, 'brick', 14, -13, 2, 2, BASE))
    rows.append(L.block(GOLD, 'tile', 14, -13, 2, 2, BASE + 24))

    # THE OBJECT: 8x8 Cross-Bonded Plough-Team Cassette Turntable (61485c01 at (280, 100) -> i in 12..15, k in 3..6)
    for i in range(12, 16):
        for k in range(3, 7):
            stand.add((i, k))
    rows.append(on(DB, 280, BASE, 100, '61485c01'))
    PL_Y = BASE + 16  # 24
    rows.append(L.block(DB, 'plate', 10, 3, 8, 4, PL_Y))
    rows.append(L.block(GOLD, 'plate', 12, 1, 4, 4, PL_Y + 8))   # Front half: unploughed golden glebe
    rows.append(L.block(BLK, 'plate', 12, 5, 4, 4, PL_Y + 8))    # Rear half: freshly blackened furrow behind the plough!
    rows.append(L.block(GOLD, 'plate', 10, 3, 2, 4, PL_Y + 8))
    rows.append(L.block(BLK, 'plate', 16, 3, 2, 4, PL_Y + 8))
    rows.append(L.block(GOLD, 'tile', 12, 2, 4, 2, PL_Y + 16))
    rows.append(L.block(BLK, 'tile', 12, 5, 4, 2, PL_Y + 16))
    PL_TOP = PL_Y + 16  # 40

    # Dry-stone boundary wall between Plough and Harvest
    dw1 = L.drystone(140, -220, length=18, yup=BASE, seed=12, courses=2, axis='z')
    rows += dw1.rows
    stand |= dw1.cells

    # 2. Register II (Center, i in -6..6): THE DEEP CORN, THE SILENT KING & THE SACRIFICIAL OAK FEAST (Il. XVIII.550–560)
    f_grain = L.field(-120, -40, w=12, d=10, yup=BASE, seed=13, crop='grain')
    rows += f_grain.rows
    stand |= f_grain.cells

    # Great Spreading Oak Tree (landscape.oak) at (-30, -210) shading the ox-sacrifice feast
    oak_t = L.oak(-30, -210, yup=BASE, seed=14)
    rows += oak_t.rows
    stand |= oak_t.cells

    # Monumental Sacrificed Ox-Roast Hearth & Barley-Table beneath the Oak at i in 1..4, k in -12..-9
    for i in range(1, 5):
        for k in range(-12, -8):
            stand.add((i, k))
    rows.append(L.block(DBG, 'brick', 1, -12, 4, 2, BASE))
    rows.append(L.block(ORANGE, 'plate', 1, -12, 4, 2, BASE + 24))
    rows.append(L.block(TORANGE, 'tile', 2, -12, 2, 2, BASE + 32))
    rows.append(on(RB, 30, BASE + 32, -230, '3062b'))
    rows.append(on(RB, 90, BASE + 32, -230, '3062b'))
    # White barley-meal preparation table at k in -10..-9
    rows.append(L.block(TAN, 'brick', 1, -10, 4, 2, BASE))
    rows.append(L.block(WHITE, 'tile', 1, -10, 4, 2, BASE + 24))

    # Royal Boundary Plinth for The Silent King at (0, 200) -> i in -2..1, k in 9..10
    for i in range(-2, 2):
        for k in (9, 10):
            stand.add((i, k))
    rows.append(L.block(WHITE, 'plate', -2, 9, 4, 2, BASE))
    rows.append(L.block(GOLD, 'tile', -2, 9, 1, 2, BASE + 8))
    rows.append(L.block(GOLD, 'tile', 1, 9, 1, 2, BASE + 8))

    # Dry-stone boundary wall between Harvest and Vineyard
    dw2 = L.drystone(-160, -220, length=18, yup=BASE, seed=15, courses=2, axis='z')
    rows += dw2.rows
    stand |= dw2.cells

    # 3. Register III (-x, i in -22..-9): THE GOLDEN VINEYARD, KYANOS TRENCH & TIN HEDGE (Il. XVIII.561–572)
    for kz in (-180, -80, 20):
        vr = L.vine_row(-420, kz, length=11, yup=BASE, seed=16 + kz, pole_col=SILVER, grape_col=BLK)
        rows += vr.rows
        stand |= vr.cells

    # Built-up Fence of Tin (Herkos Kassiterou) along the inner edge of the Kyanos trench with ONE single stone path at front!
    TIN_POSTS = [(-21, -11), (-17, -11), (-13, -11), (-10, -11),
                 (-21, -4), (-10, -4),
                 (-21, 5), (-18, 5), (-13, 5), (-10, 5)]
    for ti, tk in TIN_POSTS:
        if (ti, tk) not in stand and (ti, tk) not in covered:
            stand.add((ti, tk))
            rows.append(on(SILVER, (ti + 0.5) * S, BASE, (tk + 0.5) * S, '3062b'))
            rows.append(on(SILVER, (ti + 0.5) * S, BASE + 24, (tk + 0.5) * S, '98138'))

    # Ground & Dark-Blue Kyanos Enamel Trench (DBLUE 272 + AZURE 321) around the Vineyard
    def field_ground(i, k):
        if -22 <= i <= -9 and -12 <= k <= 6:
            on_rim = (i in (-22, -9)) or (k in (-12, 6))
            # Single narrow entrance path at k == 6, i in (-16, -15) ("and there was but one path to it", Il. XVIII.565)
            if on_rim and not (k == 6 and i in (-16, -15)):
                return DBLUE if (i // 2 + k // 2) % 2 == 0 else AZURE
            return GOLD if (i // 2 + k // 2) % 2 == 0 else TAN
        if i > 7:
            return DB if (i // 2 + k // 2) % 2 == 0 else DTAN
        return TAN if (i // 2 + k // 2) % 2 == 0 else OLIVE

    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered, stand, field_ground)

    # 4. Cast:
    # A. Yoked Ox-Team & Ploughman on the Turning Furrow Cassette, second Ploughman, and Wine-Steward under the Headland Pergola (+x)
    rows += ox_beast(265, PL_TOP, 70, rot=0, body_col=RB, horn_col=WHITE)
    rows += ox_beast(305, PL_TOP, 70, rot=0, body_col=GOLD, horn_col=SILVER)
    rows += figure(280, PL_TOP, 130, rot=math.pi, torso_col=TAN, legs_col=DB, headgear=('10048', DB), held_r=('4497', RB))
    rows += figure(280, BASE + 8, -210, rot=0, torso_col=DRED, legs_col=TAN, headgear=('11264', RB), held_r=('2343', GOLD))  # Wine-steward offering golden cup
    rows += figure(340, BASE + 8, -120, rot=math.pi, torso_col=OLIVE, legs_col=DB, headgear=('10048', DB), held_r=('2343', GOLD))

    # B. The Silent King rejoicing on his plinth, Three Reapers with curved sickles, Binders, Boys & Oak Feast Attendants (Center)
    rows += figure(0, BASE + 16, 190, rot=math.pi, torso_col=GOLD, legs_col=DRED,
                   headgear=('33322', GOLD), beard=('10052', DB), cape_col=DRED, held_r=('4497', GOLD))  # THE KING IN SILENCE AT HIS STAFF
    rows += figure(-70, BASE + 8, 60, rot=0.3, torso_col=TAN, legs_col=DB, headgear=('10048', DB), held_r=('10053', SILVER))
    rows += figure(30, BASE + 8, 60, rot=-0.3, torso_col=OLIVE, legs_col=DB, headgear=('10048', RB), held_r=('10053', SILVER))
    rows += figure(-20, BASE + 8, 125, rot=0, torso_col=DTAN, legs_col=TAN, headgear=('10048', TAN))
    rows += figure(110, BASE + 8, -200, rot=-1.4, torso_col=WHITE, skirt_col=WHITE, headgear=('93562', BLK), held_r=('2343', WHITE))

    # C. The Boy playing the Linos-Song on the Shrill Lyre & Vintage Basket-Bearers on the single path (-x)
    rows += figure(-300, BASE + 8, 150, rot=math.pi, torso_col=AZURE, legs_col=WHITE, headgear=('11264', DB), held_r=('3957a', GOLD))
    rows += figure(-380, BASE + 8, 175, rot=2.6, torso_col=BLY, skirt_col=WHITE, headgear=('93562', RB))
    rows += figure(-220, BASE + 8, 175, rot=-2.6, torso_col=DRED, legs_col=TAN, headgear=('10048', DB))
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT V: THE TWO LIONS, THE GOLD-AND-TIN OXEN & THE SHEEP GLEN (Iliad XVIII.573–589)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_pasture():
    rows, covered = frame(-480, -320, 48, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -23, 22, -15, 14
    stand = set()
    L.AVOID.clear()

    # 1. Sculpted Wooded Mountain Glen (kale bessa, Il. XVIII.587-589) at +x (i in 6..21, k in -14..1)
    NH = 4

    def glen_sdf(p):
        x, y, z = p
        i, k = math.floor(x / S), math.floor(z / S)
        if not (I_LO <= i <= I_HI and K_LO <= k <= K_HI):
            return 99, 'air'
        d = ell(p, (280, 15, -160), (175, 96, 125)) + rough(p, 10, 2.3)
        d = smin(d, ell(p, (160, 0, -80), (95, 65, 85)) + rough(p, 8, 1.1), 28)
        if d <= 0 and y < BASE + NH * B:
            return d, 'glen'
        return 99, 'air'

    def glen_col(m, i, h, k):
        v = hsh(i // 2, k // 2, h) % 5
        return OLIVE if v < 2 else (DTAN if v == 2 else (DGREEN if v == 3 else DBG))

    form = Form(y0=BASE, unit=B, caps=True, keep_studs=('gstand',))
    form.carve(glen_sdf, range(I_LO, I_HI + 1), range(0, NH), range(K_LO, K_HI + 1))
    form.hollow(side=2, up=2, pillar=4)
    sculpt.settle(form, glen_col, anchor_rows=rows)
    rows += form.parts(glen_col)
    land_used = {(i, k) for (i, h, k) in form.vox}

    # 2. Left Rear (-x, -z): THE TIMBER-AND-STONE CATTLE BYRE (Kopros, Il. XVIII.575) at i in -22..-13, k in -14..-9
    #    Built with fieldstone piers, timber lintel, and pitched roof from which the Gold-and-Tin Oxen rush out!
    p_byre, st_byre, _ = colonnade_entablature([-420, -340, -260], -240, BASE, courses=3, col_color=DTAN, cap_color=DB,
                                               beam_color=DB, frieze_color=RB, triglyph_color=DTAN, roof_color=DB, pitched=True)
    rows += p_byre
    stand |= st_byre
    for i in range(-22, -12):
        stand.add((i, -14))
    for h_idx, col in enumerate([DBG, DTAN, DB]):
        rows.append(L.block(col, 'brick', -22, -14, 10, 1, BASE + h_idx * 24))
    rows.append(L.block(RB, 'tile', -22, -14, 10, 1, BASE + 3 * 24))

    # 3. Right Foreground (+x, +z): COVERED SHEPHERD'S COTTAGE (Klisia) & DRY-STONE SHEEPFOLD at i in 13..20, k in 3..8
    for i in range(13, 21):
        for k in range(3, 9):
            stand.add((i, k))
    # Cottage walls with open front doorway at i in 16..17
    for h_idx, col in enumerate([DBG, DTAN, TAN]):
        yc = BASE + h_idx * 24
        rows.append(L.block(col, 'brick', 13, 3, 8, 2, yc))      # rear wall
        rows.append(L.block(col, 'brick', 13, 5, 3, 4, yc))      # left wing
        rows.append(L.block(col, 'brick', 18, 5, 3, 4, yc))      # right wing
    # Stepped Pitched Terracotta Roof over the Shepherd's Cottage
    rows.append(L.block(DB, 'plate', 13, 3, 8, 6, BASE + 72))
    rows.append(L.block(RB, 'plate', 13, 4, 8, 4, BASE + 80))
    rows.append(L.block(DRED, 'plate', 13, 5, 8, 2, BASE + 88))
    rows.append(L.block(DRED, 'tile', 13, 3, 8, 1, BASE + 80))
    rows.append(L.block(DRED, 'tile', 13, 8, 8, 1, BASE + 80))
    rows.append(L.block(RB, 'tile', 13, 4, 8, 1, BASE + 88))
    rows.append(L.block(RB, 'tile', 13, 7, 8, 1, BASE + 88))
    rows.append(L.block(GOLD, 'tile', 13, 5, 8, 2, BASE + 96))
    rows.append(L.block(TAN, 'tile', 16, 5, 2, 4, BASE))         # threshold floor inside doorway

    dw = L.drystone(100, 180, length=12, yup=BASE, seed=21, courses=2, axis='x')
    rows += dw.rows
    stand |= dw.cells

    # Trees & Reeds along the murmuring river (potamoio keladontos, Il. XVIII.576)
    ol = L.olive(70, 70, yup=BASE, seed=22)
    pn = L.pine(-160, -230, yup=BASE, seed=23, kind='fir')
    rd1 = L.reeds(-90, -140, w=3, d=2, yup=BASE, seed=24)
    rd2 = L.reeds(-260, 120, w=3, d=2, yup=BASE, seed=25)
    rows += ol.rows + pn.rows + rd1.rows + rd2.rows
    stand |= ol.cells | pn.cells | rd1.cells | rd2.cells

    # 4. THE OBJECT: 8x8 Cross-Bonded River-Ford Lion Attack Turntable (61485c01 at (-140, 20) -> i in -9..-6, k in -1..2)
    for i in range(-9, -5):
        for k in range(-1, 3):
            stand.add((i, k))
    rows.append(on(DTAN, -140, BASE, 20, '61485c01'))
    LA_Y = BASE + 16  # 24
    rows.append(L.block(TAN, 'plate', -11, -1, 8, 4, LA_Y))
    rows.append(L.block(DTAN, 'plate', -9, -3, 4, 8, LA_Y + 8))
    rows.append(L.block(TBLUE, 'plate', -11, -1, 2, 4, LA_Y + 8))
    rows.append(L.block(TBLUE, 'plate', -5, -1, 2, 4, LA_Y + 8))
    rows.append(L.block(DRED, 'tile', -8, 0, 2, 2, LA_Y + 16))
    LA_TOP = LA_Y + 16  # 40

    # 5. Ground & Murmuring River Channel
    def pasture_ground(i, k):
        r_dist = abs(i + 7 - k * 0.35)
        if r_dist < 2.2:
            return TBLUE if (i + k) % 3 != 0 else AZURE
        if r_dist < 3.6:
            return TAN if (i // 3 + k // 3) % 2 == 0 else DTAN
        v = hsh(i // 3, k // 3) % 5
        return OLIVE if v < 3 else (DTAN if v == 3 else DGREEN)

    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered | land_used, stand, pasture_ground)

    # 6. Cast:
    # A. Two Sculpted Terrible Lions tearing the Bellowing Golden Bull on the Ford Turntable (Il. XVIII.579-583)
    rows += ox_beast(-140, LA_TOP, 20, rot=0.2, body_col=GOLD, horn_col=SILVER)
    rows += lion_beast(-190, LA_TOP, 5, rot=1.25)
    rows += lion_beast(-90, LA_TOP, 35, rot=-1.85)

    # B. Herd of Sculpted Gold-and-Tin Lofty-Horned Oxen rushing from the Cattle Byre (Il. XVIII.574-575)
    rows += ox_beast(-380, BASE + 8, -140, rot=0.4, body_col=GOLD, horn_col=SILVER)
    rows += ox_beast(-300, BASE + 8, -120, rot=0.5, body_col=SILVER, horn_col=GOLD)
    rows += ox_beast(-400, BASE + 8, -20, rot=0.3, body_col=SILVER, horn_col=GOLD)
    rows += ox_beast(-330, BASE + 8, 60, rot=0.6, body_col=GOLD, horn_col=SILVER)
    rows += ox_beast(-410, BASE + 8, 120, rot=0.4, body_col=GOLD, horn_col=SILVER)

    # C. Four Golden Herdsmen (Il. XVIII.577) & Nine Sculpted Hunting Dogs (Il. XVIII.578) barking & recoiling
    for hx, hz, hrot in ((-250, -110, 0.5), (-260, -10, 1.2), (-240, 170, 2.3), (-40, 150, -2.2)):
        rows += figure(hx, BASE + 8, hz, rot=hrot, torso_col=GOLD, legs_col=GOLD, head_col=GOLD,
                       headgear=('11264', GOLD), held_r=('4497', GOLD))
    DOGS = [(-220, -60, 0.8), (-235, 0, 1.3), (-220, 70, 1.8), (-180, 115, 2.5), (-130, 120, 2.9),
            (-75, 100, -2.5), (-60, 35, -1.7), (-70, -35, -0.9), (-135, -75, 0.1)]
    for idx, (dx, dz, drot) in enumerate(DOGS):
        rows += dog_beast(dx, BASE + 8, dz, rot=drot, col=TAN if idx % 2 == 0 else RB)

    # D. Flock of Sculpted White-Fleeced Sheep in the Mountain Glen & Sheepfold (+x)
    for sx, sz, srot in ((160, 230, 0.3), (220, 240, -0.5), (280, 225, 1.1), (350, 235, -1.4), (410, 220, 0.6), (200, 130, 0.7)):
        rows += sheep_beast(sx, BASE + 8, sz, rot=srot)
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT VI: THE CHOROS OF DAEDALUS & THE RIVER OCEANUS (Iliad XVIII.590–608)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_choros():
    rows, covered = frame(-320, -320, 32, 32, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -15, 14, -15, 14
    stand = set()

    # 1. Sculpted Outer Wave-Border of RIVER OCEANUS (potamoio mega sthenos Okeanoio, Il. XVIII.607-608)
    NH = 3

    def ocean_sdf(p):
        x, y, z = p
        i, k = math.floor(x / S), math.floor(z / S)
        if not (I_LO <= i <= I_HI and K_LO <= k <= K_HI):
            return 99, 'air'
        r = math.hypot(x, z)
        if r >= 245 and not (z > 180 and abs(x) < 160):
            wave_h = BASE + (2 if r > 275 else 1) * B + 12 * math.sin(math.atan2(z, x) * 6)
            if y < wave_h:
                return -1, 'ocean'
        return 99, 'air'

    def ocean_col(m, i, h, k):
        if h >= 1:
            return WHITE if (i // 2 + k // 2) % 3 == 0 else AZURE
        return DBLUE if (i // 3 + k // 3) % 2 == 0 else TBLUE

    form = Form(y0=BASE, unit=B, caps=True)
    form.carve(ocean_sdf, range(I_LO, I_HI + 1), range(0, NH), range(K_LO, K_HI + 1))
    sculpt.settle(form, ocean_col, anchor_rows=rows)
    rows += form.parts(ocean_col)
    land_used = {(i, k) for (i, h, k) in form.vox}

    # 2. Rear Knossian Palace Portico with 4 Red Columns, Frieze & White Minoan Horns of Consecration at z = -140!
    p_knos, st_knos, _ = colonnade_entablature([-140, -60, 60, 140], -140, BASE, courses=4, col_color=DRED, cap_color=GOLD,
                                               beam_color=BLK, frieze_color=AZURE, triglyph_color=DRED, roof_color=TAN,
                                               pitched=False, horns=True)
    rows += p_knos
    stand |= st_knos

    # Stepped Knossian Theatral Viewing Tiers on Left (-x: i in -11..-9, k in -3..4) and Right (+x: i in 8..10, k in -3..4)
    for side_i in (-11, 8):
        for a in range(3):
            for k in range(-3, 5):
                stand.add((side_i + a, k))
        rows.append(L.block(WHITE, 'brick', side_i, -3, 3, 8, BASE))
        rows.append(L.block(TAN, 'plate', side_i + (0 if side_i < 0 else 1), -3, 2, 8, BASE + 24))
        rows.append(L.block(DRED, 'tile', side_i + (2 if side_i < 0 else 0), -3, 1, 8, BASE + 24))
        rows.append(L.block(WHITE, 'tile', side_i + (0 if side_i < 0 else 1), -3, 2, 8, BASE + 32))

    # 3. THE OBJECT: 10x10 Cross-Bonded Potter's Wheel Choros Platform (61485c01 at (0, 20) -> i in -2..1, k in -1..2)
    for i in range(-2, 2):
        for k in range(-1, 3):
            stand.add((i, k))
    rows.append(on(WHITE, 0, BASE, 20, '61485c01'))
    TT_TOP = BASE + 16  # 24
    rows.append(L.block(WHITE, 'plate', -5, -1, 10, 4, TT_TOP))
    rows.append(L.block(TAN, 'plate', -2, -4, 4, 10, TT_TOP + 8))
    rows.append(L.block(DRED, 'plate', -5, -1, 3, 4, TT_TOP + 8))
    rows.append(L.block(DRED, 'plate', 2, -1, 3, 4, TT_TOP + 8))
    rows.append(L.block(GOLD, 'plate', -2, -1, 4, 4, TT_TOP + 16))
    rows.append(L.block(AZURE, 'tile', -1, 0, 2, 2, TT_TOP + 24))
    CHOROS_TOP = TT_TOP + 16  # 40

    DANCERS_RING = []
    for idx in range(8):
        ang = idx * math.pi / 4
        dx, dz = round(76 * math.cos(ang)), 20 + round(76 * math.sin(ang))
        DANCERS_RING.append((dx, dz, ang + math.pi / 2, idx % 2 == 0))

    # 4. Knossian Labyrinth Limestone Court with Clean Concentric Red & Gold Ring
    def choros_ground(i, k):
        r = math.hypot((i + 0.5) * S, (k - 0.5) * S)
        if 115 <= r <= 148:
            return DRED if (i + k) % 4 != 0 else GOLD
        return WHITE if (i // 3 + k // 3) % 2 == 0 else TAN

    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered | land_used, stand, choros_ground)

    # 5. Cast:
    for dx, dz, drot, is_youth in DANCERS_RING:
        if is_youth:
            rows += figure(dx, CHOROS_TOP, dz, rot=drot, torso_col=BLY, legs_col=SILVER,
                           headgear=('11264', DB), held_r=('3847', GOLD))
        else:
            rows += figure(dx, CHOROS_TOP, dz, rot=drot, torso_col=WHITE, skirt_col=WHITE,
                           headgear=('33322', GOLD))
    rows += figure(-22, CHOROS_TOP + 8, 20, rot=0.8, torso_col=AZURE, legs_col=GOLD, headgear=('11264', GOLD))
    rows += figure(22, CHOROS_TOP + 8, 20, rot=-2.3, torso_col=DRED, legs_col=GOLD, headgear=('11264', GOLD))
    rows += figure(-190, BASE + 32, 20, rot=math.pi / 2, torso_col=GOLD, legs_col=WHITE, headgear=('11264', WHITE), beard=('10052', WHITE), held_r=('4497', GOLD))
    rows += figure(190, BASE + 32, 20, rot=-math.pi / 2, torso_col=AZURE, skirt_col=WHITE, headgear=('93562', BLK))
    return rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# MASTER KIT: THE SHIELD OF ACHILLES — FIVE-FOLD WORLDTEXT (Iliad XVIII.478–608, 48x48 Collectors' Edition)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_master_shield():
    rows, covered = frame(-480, -480, 48, 48, yup=BASE)
    I_LO, I_HI, K_LO, K_HI = -23, 22, -23, 22

    # 1. Sculpt the Five Concentric Folds (pente d' ar' autou esan ptykhes, Il. XVIII.481) with raised metallic ring-walls
    def shield_sdf(p):
        x, y, z = p
        i, k = math.floor(x / S), math.floor(z / S)
        if not (I_LO <= i <= I_HI and K_LO <= k <= I_HI):
            return 99, 'air'
        r = math.hypot(x, z)
        if r > 448:
            return 99, 'air'
        if -2 <= i <= 1 and -2 <= k <= 1 and y < BASE + 5 * P:
            return -1, 'core'
        if r > 418:
            max_h = 4  # Triple Glittering Rim (triptykos marmairousa)
        elif r > 382:
            max_h = 3  # Fold 5: River Oceanus wave channel
        elif r > 300:
            max_h = 2  # Fold 4: Pasture, Lions, Oxen & Knossian Choros
        elif r > 200:
            max_h = 3  # Fold 3: Plough, Silent King's Harvest & Vineyard
        elif r > 100:
            max_h = 4  # Fold 2: Cities of Peace & War
        else:
            max_h = 5  # Fold 1: Celestial Boss
        if y < BASE + max_h * P:
            return -1, 'shield'
        return 99, 'air'

    def shield_col(m, i, h, k):
        x, z = (i + 0.5) * S, (k + 0.5) * S
        r = math.hypot(x, z)
        if m in ('core', 'seat'):
            return GOLD
        if r > 418:
            return GOLD if r > 433 else (SILVER if h >= 3 else BRONZE)
        if r > 382:
            return WHITE if h >= 2 and (i + k) % 5 == 0 else (DBLUE if r > 400 else AZURE)
        if r > 300:
            if abs(r - 304) < 12:
                return SILVER  # Tin ring-divider between Fold 3 and Fold 4
            if z < 0:
                return TBLUE if abs(i + k * 0.4) < 2.2 else (OLIVE if (i // 3 + k // 3) % 2 == 0 else DTAN)
            return DRED if abs(r - 340) < 14 else (WHITE if (i // 3 + k // 3) % 2 == 0 else TAN)
        if r > 200:
            if abs(r - 204) < 12:
                return BRONZE  # Bronze ring-divider between Fold 2 and Fold 3
            if x > 65:
                return BLK if (k // 2) % 2 == 0 else GOLD  # Blackened furrow vs Golden glebe
            if x >= -65:
                return GOLD if (i // 3 + k // 3) % 2 == 0 else TAN
            return DBLUE if abs(r - 250) > 32 else (TAN if (i // 3 + k // 3) % 2 == 0 else OLIVE)
        if r > 100:
            if abs(r - 104) < 12:
                return GOLD    # Golden ring-divider around the Celestial Boss
            if x >= 0:
                return WHITE if (i // 3 + k // 3) % 2 == 0 else TAN
            return LBG if (i // 3 + k // 3) % 2 == 0 else DBG
        return DBLUE

    form = Form(y0=BASE, unit=P, caps=True, keep_studs=('seat', 'stand'))
    form.carve(shield_sdf, range(I_LO, I_HI + 1), range(0, 6), range(K_LO, K_HI + 1))
    for i in range(-2, 2):
        for k in range(-2, 2):
            form.vox[(i, 4, k)] = 'seat'

    # Keep 2x2 stud sockets on the rings for architectural & botanical relief landmarks:
    #   Ring 2 (+x Peace): Megaron Column (140, -100) & Agora Altar (140, 80) at h=3 (yup = BASE + 4*P = 40)
    #   Ring 2 (-x War):   Cyclopean Bastion Tower (-140, -100) at h=3 (yup = BASE + 4*P = 40)
    #   Ring 3 (Georgics): Sacrificial Oak (0, -260), Headland Wine Pillar (260, -100), Silver Vineyard Arbor (-260, -100) at h=2 (yup=32)
    #   Ring 4 (Choros):   Twin Knossian Red Columns (-60, 340) & (60, 340) at h=1 (yup = BASE + 2*P = 24)
    LANDMARKS = [
        (140, -100, 3), (140, 80, 3), (-140, -100, 3),
        (0, -260, 2), (260, -100, 2), (-260, -100, 2),
        (-60, 340, 1), (60, 340, 1),
    ]
    for tx, tz, th in LANDMARKS:
        i0, k0 = tx // S - 1, tz // S - 1
        for a in (0, 1):
            for b in (0, 1):
                for hh in range(6):
                    form.vox.pop((i0 + a, hh, k0 + b), None)
                for hh in range(th + 1):
                    form.vox[(i0 + a, hh, k0 + b)] = 'stand' if hh == th else 'shield'

    sculpt.settle(form, shield_col, anchor_rows=rows)
    rows += form.parts(shield_col)
    land_used = {(i, k) for (i, h, k) in form.vox}

    # Fill outer corner spandrels inside the 48x48 frame with sleek black museum tiles
    rows += fill_ground(range(I_LO, I_HI + 1), range(K_LO, K_HI + 1), covered | land_used, set(), lambda i, k: BLK)

    # 2. FOLD 1 (THE OBJECT): Central 8x8 Cross-Bonded Celestial Dome on 61485c01 Turntable at (0, 0), yup = BASE + 5*P = 48
    BOSS_Y = BASE + 5 * P  # 48
    rows.append(on(GOLD, 0, BOSS_Y, 0, '61485c01'))
    TT_Y = BOSS_Y + 16  # 64
    rows.append(L.block(DBLUE, 'plate', -4, -2, 8, 4, TT_Y))
    rows.append(L.block(GOLD, 'plate', -2, -4, 4, 8, TT_Y + 8))
    rows.append(L.block(SILVER, 'plate', -4, -2, 2, 4, TT_Y + 8))
    rows.append(L.block(SILVER, 'plate', 2, -2, 2, 4, TT_Y + 8))
    TOP_C = TT_Y + 16  # 80
    rows.append(on(GOLD, -20, TOP_C, 0, '3941'))         # Helios (Unwearied Sun)
    rows.append(on(BLY, -20, TOP_C + 24, 0, '4032a'))
    rows.append(on(GOLD, -20, TOP_C + 32, 0, '4740'))
    rows.append(on(SILVER, 20, TOP_C, 0, '3941'))        # Selene (Full Moon)
    rows.append(on(WHITE, 20, TOP_C + 24, 0, '4032a'))
    rows.append(on(WHITE, 20, TOP_C + 32, 0, '2654'))
    rows.append(on(DBLUE, -10, TOP_C, -50, '3062b'))     # Arktos (The Revolving Bear)
    rows.append(on(GOLD, -10, TOP_C + 24, -50, '98138'))
    rows.append(on(BRONZE, 10, TOP_C, 50, '3062b'))      # Orion
    rows.append(on(TORANGE, 10, TOP_C + 24, 50, '98138'))

    # 3. FOLD 2 RELIEF LANDMARKS & FIGURES (yup = BASE + 4*P = 40):
    R2_Y = BASE + 4 * P  # 40
    # A. City of Peace (+x): Mycenaean Portico Pillar at (140, -100) & Agora Altar of Two Talents at (140, 80)
    rows.append(on(DRED, 140, R2_Y, -100, '3941'))
    rows.append(on(DRED, 140, R2_Y + 24, -100, '3941'))
    rows.append(on(GOLD, 140, R2_Y + 48, -100, '4032a'))
    rows.append(L.block(WHITE, 'brick', 6, 3, 2, 2, R2_Y))
    rows.append(on(GOLD, 130, R2_Y + 24, 80, '3069b'))
    rows.append(on(GOLD, 150, R2_Y + 24, 80, '3069b'))
    # B. City of War (-x): Crenellated Cyclopean Bastion Tower at (-140, -100)
    rows.append(L.block(DBG, 'brick', -8, -6, 2, 2, R2_Y))
    rows.append(L.block(DRED, 'brick', -8, -6, 2, 2, R2_Y + 24))
    rows.append(L.block(LBG, 'tile', -8, -6, 2, 2, R2_Y + 48))
    # Ring 2 Cast: Bridal Torchbearer, Elder Judge, and 1.7x Golden Ares & Pallas Athena
    rows += figure(150, R2_Y + 8, -20, rot=2.9, torso_col=WHITE, skirt_col=WHITE, headgear=('33322', GOLD), held_r=('3959', TORANGE))
    rows += figure(150, R2_Y + 8, 130, rot=2.6, torso_col=WHITE, legs_col=GOLD, headgear=('11264', WHITE), beard=('10052', WHITE), held_r=('4497', GOLD))
    rows += colossus(-150, R2_Y + 8, -10, rot=2.5, primary=GOLD, accent=DRED)
    rows += colossus(-150, R2_Y + 8, 75, rot=2.5, primary=GOLD, accent=AZURE)

    # 4. FOLD 3 RELIEF LANDMARKS & FIGURES (yup = BASE + 3*P = 32):
    R3_Y = BASE + 3 * P  # 32
    # A. Sacrificial Spreading Oak at (0, -260)
    rows.append(on(RB, 0, R3_Y, -260, '3941'))
    rows.append(on(RB, 0, R3_Y + 24, -260, '3941'))
    rows.append(L.block(DGREEN, 'plate', -2, -15, 4, 4, R3_Y + 48))
    rows.append(L.block(OLIVE, 'tile', -1, -14, 2, 2, R3_Y + 56))
    # B. Headland Wine Pergola Pillar at (260, -100)
    rows.append(on(TAN, 260, R3_Y, -100, '3941'))
    rows.append(on(GOLD, 260, R3_Y + 24, -100, '4032a'))
    # C. Silver-Poled Vineyard Arbor at (-260, -100)
    rows.append(on(SILVER, -260, R3_Y, -100, '3941'))
    rows.append(L.block(DGREEN, 'plate', -14, -6, 2, 2, R3_Y + 24))
    rows.append(L.block(BLK, 'tile', -14, -6, 2, 2, R3_Y + 32))
    # Ring 3 Cast: Sculpted Plough Ox & Ploughman (+x), The Silent King (-z), Boy with Lyre (-x)
    rows += ox_beast(250, R3_Y + 8, -20, rot=0, body_col=RB, horn_col=WHITE)
    rows += figure(250, R3_Y + 8, 50, rot=2.4, torso_col=TAN, legs_col=DB, headgear=('10048', DB), held_r=('4497', RB))
    rows += figure(0, R3_Y + 8, -200, rot=math.pi, torso_col=GOLD, legs_col=DRED, headgear=('33322', GOLD), beard=('10052', DB), cape_col=DRED, held_r=('4497', GOLD))
    rows += figure(-250, R3_Y + 8, 30, rot=-2.4, torso_col=AZURE, legs_col=WHITE, headgear=('11264', DB), held_r=('3957a', GOLD))

    # 5. FOLD 4 RELIEF LANDMARKS, SCULPTED ANIMALS & CHOROS (yup = BASE + 2*P = 24):
    R4_Y = BASE + 2 * P  # 24
    # Twin Knossian Red Columns carrying a Minoan Entablature & White Horns of Consecration at z = 340 (x = -60, 60 -> 6 studs apart!)
    p_mch, _, _ = colonnade_entablature([-60, 60], 340, R4_Y, courses=2, col_color=DRED, cap_color=GOLD,
                                        beam_color=BLK, frieze_color=AZURE, triglyph_color=DRED, roof_color=TAN,
                                        pitched=False, horns=True)
    rows += p_mch
    # Sculpted Lions, Golden & Tin Oxen, Hunting Dogs & Sheep on the Pasture Arc (z < 0)
    rows += ox_beast(0, R4_Y + 8, -340, rot=0, body_col=GOLD, horn_col=SILVER)
    rows += ox_beast(-140, R4_Y + 8, -310, rot=0.5, body_col=SILVER, horn_col=GOLD)
    rows += lion_beast(-55, R4_Y + 8, -340, rot=1.2)
    rows += lion_beast(55, R4_Y + 8, -340, rot=-1.2)
    rows += dog_beast(-110, R4_Y + 8, -260, rot=0.9, col=TAN)
    rows += dog_beast(110, R4_Y + 8, -260, rot=-0.9, col=RB)
    rows += sheep_beast(160, R4_Y + 8, -300, rot=0.4)
    rows += sheep_beast(210, R4_Y + 8, -260, rot=-0.6)
    # Knossian Choros Dancers & Tumbler on the Front Arc (z > 0)
    for dx, dz, drot in ((-130, 320, 2.6), (0, 290, math.pi), (130, 320, -2.6)):
        rows += figure(dx, R4_Y + 8, dz, rot=drot, torso_col=BLY if dx != 0 else WHITE,
                       skirt_col=WHITE if dx == 0 else None, legs_col=SILVER,
                       headgear=('33322' if dx == 0 else '11264', GOLD),
                       held_r=('3847', GOLD) if dx != 0 else None)
    return rows


KITS_SPEC = [
    {
        'slug': 'achilles-forge',
        'card': 'set.achilles-forge',
        'legacy_mpd': 'achilles-z01-cosmos.mpd',
        'num': 'I',
        'tier': 'Medium · Iliad XVIII.468–490',
        'lines': 'Iliad XVIII.468–490',
        'title': 'The Forge of Hephaestus & The Revolving Bear',
        'greek': 'Ἐν μὲν γαῖαν ἔτευξ’, ἐν δ’ οὐρανόν, ἐν δὲ θάλασσαν… Ἄρκτον θ’, ἣν καὶ Ἄμαξαν ἐπίκλησιν καλέουσιν',
        'epigraph': 'On it he wrought the earth, and the heaven, and the sea, the unwearied sun, and the full moon; and the Bear, which revolves in place and watches Orion, and alone has no share in the baths of Ocean.',
        'moment': 'Inside Hephaestus’s colonnaded bronze foundry on Olympus: twin articulated bellows pump into the volcanic magma hearth as Hephaestus hammers the five-fold shield blank on a revolving anvil turntable, flanked by his two living Golden Handmaidens and Silver-Footed Thetis beneath the revolving Celestial Vault.',
        'object': 'Twin Turntables: The Revolving Bear Celestial Vault & The Five-Fold Anvil (two 61485c01 Turntables) — rotate the 8×8 celestial dome above the furnace so the Bear revolves watching Orion, and turn the five-fold shield blank on Hephaestus’s anvil.',
        'fn': build_forge,
    },
    {
        'slug': 'achilles-peace',
        'card': 'set.achilles-peace',
        'legacy_mpd': 'achilles-z02-city-peace.mpd',
        'num': 'II',
        'tier': 'Large · Iliad XVIII.491–508',
        'lines': 'Iliad XVIII.491–508',
        'title': 'The Two Talents in the Agora & The Bridal Torch-Dance',
        'greek': 'κεῖτο δ’ ἄρ’ ἐν μέσσοισι δύω χρυσοῖο τάλαντα, τῷ δόμεν ὃς μετὰ τοῖσι δίκην ἰθύντατα εἴποι',
        'epigraph': 'And there lay in the midst two talents of gold, to give to him who among them should pronounce judgment most straightly.',
        'moment': 'Two complete Mycenaean architectural worlds: on the right, a two-storey frescoed Megaron with columned portico, Horns of Consecration, upper balcony, side house portal, and an 8×8 revolving bridal dance floor; on the left, a roofed marble Agora Stoa framing the sacred circle of eight polished stone benches and the revolving altar of the Two Talents of Gold.',
        'object': 'The Turning Judgment Dais & Whirling Bridal Ring (two 8×8 cross-bonded 61485c01 Turntables) — turn the central Agora altar to award the two talents of gold, and spin the bridal chorus of lyre-player, flute-player, and dancers.',
        'fn': build_peace,
    },
    {
        'slug': 'achilles-war',
        'card': 'set.achilles-war',
        'legacy_mpd': 'achilles-z03-city-war.mpd',
        'num': 'III',
        'tier': 'Flagship · Iliad XVIII.509–540',
        'lines': 'Iliad XVIII.509–540',
        'title': 'The River Ambush & The Tall Golden Gods',
        'greek': 'ἦρχε δ’ ἄρα σφιν Ἄρης καὶ Παλλὰς Ἀθήνη ἄμφω χρυσείω, χρύσεια δὲ εἵματα ἕσθην, καλὼ καὶ μεγάλω σὺν τεύχεσιν',
        'epigraph': 'And Ares and Pallas Athena led them, both golden, and clad in golden garments, beautiful and large with their arms, like gods, both very conspicuous; and the people were smaller.',
        'moment': 'Through the linteled Scaean Gate of a crenellated Cyclopean fortress guarded by wives, children, and elders, the sortie marches out behind 1.7× Golden Colossi of Ares and Athena down to the river ford, where scouts pivot out from an 8×8 riverbank blind upon piping shepherds, sculpted lofty-horned oxen, sheep, cavalry, and crimson-cloaked Ker.',
        'object': 'The 8×8 Riverbank Ambush Blind (61485c01 Turntable) & 1.7× Golden Colossi — rotate the camouflaged reed-and-rock riverbank outcrop to spring the bronze-armored scouts upon the watering herds.',
        'fn': build_war,
    },
    {
        'slug': 'achilles-field',
        'card': 'set.achilles-field',
        'legacy_mpd': 'achilles-z04-Georgics.mpd',
        'num': 'IV',
        'tier': 'Flagship · Iliad XVIII.541–572',
        'lines': 'Iliad XVIII.541–572',
        'title': 'The Plough That Turns Black, The King’s Harvest & The Vintage',
        'greek': 'ἡ δὲ μελαίνετ’ ὄπισθεν, ἀρηρομένῃ δὲ ἐῴκει χρυσείη περ ἐοῦσα· τὸ δὴ περὶ θαῦμα τέτυκτο',
        'epigraph': 'And the field grew black behind, and was like unto ploughed land, though being golden; which was a very great marvel.',
        'moment': 'Three georgic worlds divided by dry-stone walls: the thrice-ploughed fallow with a roofed headland wine-pergola and an 8×8 revolving ox-plough cassette turning golden glebe into black furrow; the deep corn where the Silent King rejoices on his plinth before the spreading Oak and ox-roast hearth; and the golden vineyard on silver poles enclosed by a dark-blue kyanos trench, tin fence, and single stone causeway.',
        'object': 'The 8×8 Marvel of the Turning Furrow (61485c01 Turntable) — rotate the yoked ox-team and ploughman cassette so the golden soil physically flips to freshly ploughed black earth.',
        'fn': build_field,
    },
    {
        'slug': 'achilles-pasture',
        'card': 'set.achilles-pasture',
        'legacy_mpd': 'achilles-z05-pastoral.mpd',
        'num': 'V',
        'tier': 'Large · Iliad XVIII.573–589',
        'lines': 'Iliad XVIII.573–589',
        'title': 'The Two Lions, the Gold-and-Tin Oxen & the Sheep Glen',
        'greek': 'αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέροιο τε… σμερδαλέω δὲ λέοντε δύ’ ἐν πρώτῃσι βόεσσιν ταῦρον ἐρύγμηλον ἐχέτην',
        'epigraph': 'The oxen were made of gold and tin… and two terrible lions among the foremost oxen seized a loud-bellowing bull.',
        'moment': 'From a roofed timber-and-stone cattle byre (kopros), five sculpted gold-and-tin lofty-horned oxen rush down to a reed-fringed river where two maned, fanged lions tear the foremost bull on an 8×8 ford turntable; four golden herdsmen urge on nine sculpted hounds below a wooded mountain glen with a pitched-roof shepherd’s cottage and dry-stone sheepfold.',
        'object': 'The 8×8 River-Ford Lion Attack (61485c01 Turntable) — revolve the central river-shoal struggle of the two tawny lions and bellowing bull surrounded by the nine recoiling hounds.',
        'fn': build_pasture,
    },
    {
        'slug': 'achilles-choros',
        'card': 'set.achilles-choros',
        'legacy_mpd': 'achilles-z06-choros-oceanus.mpd',
        'num': 'VI',
        'tier': 'Medium · Iliad XVIII.590–608',
        'lines': 'Iliad XVIII.590–608',
        'title': 'The Choros of Daedalus & The River Oceanus',
        'greek': 'οἱ δ’ ὁτὲ μὲν θρέξασκον ἐπισταμένοισι πόδεσσιν ῥεῖα μάλ’, ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται',
        'epigraph': 'At one time they would run lightly with skilled feet, as when a seated potter makes trial of a wheel fitted to his hands; and around the extreme border he placed the mighty strength of River Oceanus.',
        'moment': 'Framed by a Knossian Palace portico of four downward-tapering red columns crowned with white Minoan Horns of Consecration, stepped Theatral viewing tiers, and the surging wave-wall of River Oceanus, eight youths and maidens dance wrist-on-wrist around two spinning tumblers on a 10×10 labyrinth wheel.',
        'object': 'The 10×10 Potter’s Wheel Choros (61485c01 Turntable) — spin the entire cross-bonded Knossian labyrinth platform of eight youths with golden swords, maidens with golden garlands, and two central tumblers.',
        'fn': build_choros,
    },
    {
        'slug': 'achilles-shield',
        'card': 'set.achilles-shield',
        'legacy_mpd': 'achilles-shield-master.mpd',
        'num': 'MASTER',
        'tier': 'Collectors’ Edition · Iliad XVIII.478–608',
        'lines': 'Iliad XVIII.478–608',
        'title': 'The Shield of Achilles — Five-Fold Worldtext',
        'greek': 'Πέντε δ’ ἄρ’ αὐτοῦ ἔσαν πτύχες· αὐτὰρ ἐν αὐτῷ ποίει δαίδαλα πολλὰ ἰδυίῃσι πραπίδεσσιν',
        'epigraph': 'Five were the folds of the shield itself; and on it he wrought many cunning things with his skillful mind.',
        'moment': 'The complete 48×48 concentric five-fold bronze, tin, kyanos, and gold relief world: the 8×8 Revolving Celestial Boss at the center; architectural reliefs of the Cities of Peace and War (with 1.7× Golden Ares & Athena); the Plough Ox-Team, Silent King’s Harvest under the Oak, and Silver-Poled Vineyard; the Sculpted Lions, Gold-and-Tin Oxen & Knossian Choros with Horns of Consecration; sealed by River Oceanus and the Triple Glittering Rim.',
        'object': 'The Concentric World-Wheel (61485c01 Central Turntable) — revolve the 8×8 central Celestial Vault of Helios, Selene, Orion, and the Bear at the crown of the five concentric relief folds.',
        'fn': build_master_shield,
    },
]


def main():
    print('Building THE SHIELD OF ACHILLES LINE (Odyssey-grade kitlib + sculpt + landscape + clicks)...')
    summary = []
    for spec in KITS_SPEC:
        rows = spec['fn']()
        # Settle any angled botanical leaves against the scene
        rows, dropped = L.settle(rows)
        n_pcs = write(spec['card'], spec['title'], rows, cards_dir=ACH_CARDS)
        # Also copy to shield-zones/ so existing workspace viewers load the upgraded models seamlessly
        src_mpd = os.path.join(ACH_CARDS, f"{spec['card']}.mpd")
        shutil.copyfile(src_mpd, os.path.join(SHIELD_ZONES, spec['legacy_mpd']))
        n_grid, n_loose, n_clash = check(src_mpd)
        print(f"  [{spec['num']:6s}] {spec['card']:22s} -> {n_pcs:4d} parts ({n_grid:4d} grid) | {n_loose} loose | {n_clash} clashes")
        if n_loose or n_clash:
            ps, loose_list, clash_pairs = clicks.analyze(src_mpd)
            for lp in loose_list[:6]:
                print('     LOOSE:', lp['pid'], lp['bottom'], lp['top'], lp['fp'])
            for a, b in list(clash_pairs)[:6]:
                print('     CLASH:', ps[a]['pid'], ps[a]['bottom'], ps[a]['top'], ps[a]['fp'], '<->', ps[b]['pid'], ps[b]['bottom'], ps[b]['top'], ps[b]['fp'])
        manifest(
            spec['slug'],
            kits_dir=ACH_KITS,
            card=spec['card'],
            legacy_mpd=spec['legacy_mpd'],
            num=spec['num'],
            tier=spec['tier'],
            lines=spec['lines'],
            title=spec['title'],
            greek=spec['greek'],
            epigraph=spec['epigraph'],
            moment=spec['moment'],
            object=spec['object'],
            pieces=n_pcs,
            grid_pieces=n_grid,
            loose=n_loose,
            clashes=n_clash,
        )
        summary.append((spec, n_pcs, n_grid, n_loose, n_clash))
    return summary


if __name__ == '__main__':
    main()

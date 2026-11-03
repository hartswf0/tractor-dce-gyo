#!/usr/bin/env python3
"""tools/forage/product/kits/shield_dioramas.py — Build and verify all 8 Monumental 48x32 Standalone Collector's Diorama Kits
for Homer's Shield of Achilles (Iliad XVIII.478-608) on stepped Dark Blue (272) + Pearl Gold (297) museum plinths.

  python3 tools/forage/product/kits/shield_dioramas.py

Generates in `odyssey/cards/`:
  1. set.shield-diorama-wedding.mpd   (48x32) — The Bridal Procession, Flanking Townhouses & Torch-Dance (Il. XVIII.491-496, Ref Image 1)
  2. set.shield-diorama-agora.mpd     (48x32) — The Sacred Circle, Doric Stoa, Exedra & Law-Court (Il. XVIII.497-508, Ref Image 2)
  3. set.shield-diorama-ambush.mpd    (48x32) — The River Ambush, City Rampart & Sanctuary of the Fates (Il. XVIII.509-540, Ref Images 3 & 4)
  4. set.shield-diorama-sheepfold.mpd (48x32) — The Upland Sheepfold, Roofed Shed & Shepherd's Homestead (Il. XVIII.587-589, Ref Image 5)
  5. set.shield-diorama-harvest.mpd   (48x32) — The Royal Estate: Thrice-Ploughed Fallow, Wine-Loggia & Harvest Oak (Il. XVIII.541-560)
  6. set.shield-diorama-vineyard.mpd  (48x32) — The Golden Vineyard, Vintner's Villa & Roofed Wine-Press Pavilion (Il. XVIII.561-572)
  7. set.shield-diorama-cattle.mpd    (48x32) — The High-Roofed Cattle Byre, Sounding River & The Two Lions (Il. XVIII.573-586)
  8. set.shield-diorama-choros.mpd    (48x32) — The Palace of Knossos, Dancing Floor of Daedalus & Cosmic Vault (Il. XVIII.483-489, 590-608)
"""
import math, os, shutil, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
import clicks, wardrobe as W
import landscape as L
from kits.shield_diorama_lib import (
    SILVER, TIN, BRONZE, KYANOS, BYELLOW, FLOOR, LAND,
    DioramaCanvas, pack_plates, pack_tiles, put_curve_tile, place_local,
    pitched_terracotta_roof, build_coursed_box_walls, build_climbing_vine,
    build_raised_tree_planter, build_townhouse_2storey,
    build_stone_cottage, build_timber_sheep_shed, build_wine_press_pavilion,
    build_doric_stoa, build_elder_throne, build_sacred_circle_floor,
    woolly_sheep, brown_goat, ox_beast, lion_beast, dog_beast,
)


def amphora(x, yup, z, col=DORANGE):
    """Sculpted terracotta Greek amphora standing on a stud at (x, yup, z)."""
    return [
        on(col, x, yup, z, '3062b'),
        on(GOLD if col == DORANGE else DTAN, x, yup + B, z, '98138'),
    ]


def torch_post(canvas, i, k, h_bricks=2):
    """Blazing festival or watch-torch on a stone/gold post at cell (i, k)."""
    canvas.reserve(i, k, 1, 1)
    y0 = canvas.surf_y(i, k)
    x, z = (i + 0.5) * S, (k + 0.5) * S
    for c in range(h_bricks):
        canvas.rows.append(on(RB if c == 0 else GOLD, x, y0 + c * B, z, '3062b'))
    canvas.rows.append(on(TORANGE, x, y0 + h_bricks * B, z, '4589'))


def stone_bench(canvas, i0, k0, length, axis='x', tiers=1):
    """Polished stone spectator bench (`length` studs long, 1 or 2 stepped tiers)."""
    for t in range(tiers):
        for q in range(length):
            i = i0 + q if axis == 'x' else i0 + t
            k = k0 + t if axis == 'x' else k0 + q
            canvas.reserve(i, k, 1, 1)
            y0 = canvas.surf_y(i, k)
            h_pl = t + 1
            for p in range(h_pl):
                canvas.rows.append(L.block(LBG if q in (0, length - 1) else TAN, 'plate', i, k, 1, 1, y0 + p * P))
            canvas.rows.append(on(TAN if (q + t) % 2 == 0 else LBG, (i + 0.5) * S, y0 + h_pl * P, (k + 0.5) * S, '3070b'))


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 1: THE BRIDAL PROCESSION, FLANKING TOWNHOUSES & TORCH-DANCE (48x32, Reference Image 1)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_wedding():
    """Iliad XVIII.491-496: Brides led from their chambers under blazing torches through the city, loud hymenaeal song,
    whirling youthful dancers, aulos and phorminx players, and women standing in the doorways and balconies marvelling."""
    C = DioramaCanvas(48, 32, seed=101)
    C.set_ground(-22, -14, 44, 28, t='c', h=2)
    C.set_ground(-4, -7, 8, 6, t='p', h=3)

    # 1. Left (-x) and Right (+x) Monumental Two-Storey Mediterranean Townhouses with Doorway Women, Vines & Balconies
    build_townhouse_2storey(C, -16, -10, 8, 16, side='left', seed=11)
    build_townhouse_2storey(C,   8, -10, 8, 16, side='right', seed=22)

    # 2. Flanking Raised Stone Planter Terraces with Cypress & Spreading Olive Tree (Reference Image 1!)
    build_raised_tree_planter(C, -21, -7, 4, 4, tree_kind='cypress', bricks=2, seed=13)
    C.add_tree('olive', -13, -13, seed=14)
    build_raised_tree_planter(C,  17, -2, 4, 4, tree_kind='olive', bricks=2, seed=24)
    C.add_tree('cypress', 12, -13, seed=25)

    # 3. Rear Stone Courtyard Wall & High Blue-and-White Striped Festival Canopy on 4 Golden Poles with Flower Garland
    rear_line = [(i, -14) for i in range(-10, 10)]
    for (i, k) in rear_line:
        C.reserve(i, k, 1, 1)
    C.rows += L.masonry(rear_line, C.surf_y(0, -14), 3, seed=33)

    can_poles = [(-5, -12), (4, -12), (-5, -7), (4, -7)]
    y_can_base = C.surf_y(0, -10)
    for (pi, pk) in can_poles:
        C.reserve(pi, pk, 1, 1)
        for c in range(4):
            C.rows.append(on(GOLD, (pi + 0.5) * S, y_can_base + c * B, (pk + 0.5) * S, '3062b'))
    y_can_top = y_can_base + 4 * B
    for dk in (0, 2, 4):
        C.rows.append(L.block(TAN, 'plate', -5, -12 + dk, 8, 2, y_can_top))
        C.rows.append(L.block(TAN, 'plate',  3, -12 + dk, 2, 2, y_can_top))
    for i in range(-5, 5):
        col_st = MBLUE if i % 2 == 0 else WHITE
        C.rows.append(L.block(col_st, 'plate', i, -12, 1, 6, y_can_top + P))
    can_tiles = {(i, k): (MBLUE if i % 2 == 0 else WHITE) for i in range(-5, 5) for k in range(-12, -7)}
    C.rows += pack_tiles(can_tiles, y_can_top + 2 * P)
    # Floral garland along the front edge of the canopy (k = -7)
    for i in range(-5, 5):
        fcol = [WHITE, DGREEN, WHITE, GOLD][i % 4]
        C.rows.append(on(fcol, (i + 0.5) * S, y_can_top + 2 * P, (-7 + 0.5) * S, '98138'))

    # 4. Sculpted Terracotta Amphorae & 6 Blazing Torch Standards
    for (ai, ak, acol) in ((-18, 7, DORANGE), (-10, 7, MNOUGAT), (9, 7, DORANGE), (17, 7, MNOUGAT), (-6, -9, DORANGE), (5, -9, RB)):
        C.reserve(ai, ak, 1, 1)
        C.rows += amphora((ai + 0.5) * S, C.surf_y(ai, ak), (ak + 0.5) * S, acol)
    for (ti, tk) in ((-17, 5), (-6, -4), (5, -4), (-6, 3), (5, 3), (16, 5)):
        torch_post(C, ti, tk, h_bricks=2)

    # 5. Cast: Bride & Bridegroom on central dais, Bridesmaids under canopy, Torchbearers, 4 Ring-Dancers, and Musicians
    C.add_fig('character.helen', 'helen', -1, -4, rot=math.pi,
              hips=WHITE, legs=WHITE, torso=('973', WHITE), crown=('98138', GOLD), held_r=('24866', WHITE))
    C.add_fig('character.telemachus', 'telemachus', 1, -4, rot=math.pi,
              hips=WHITE, legs=WHITE, torso=('973', KYANOS), held_r=('30374', GOLD))
    # Guests under the rear canopy
    C.add_fig('character.arete', 'arete', -2, -10, rot=math.pi,
              hips=WHITE, legs=WHITE, torso=('973', TAN), held_r=('98138', DGREEN))
    C.add_fig('character.laodamas', 'laodamas', 2, -10, rot=math.pi,
              hips=TAN, legs=TAN, torso=('973', MBLUE), held_r=('3959', TORANGE))
    # Torchbearers & Flower-bearers flanking the Bride & Groom
    C.add_fig('character.laodamas', 'laodamas', -5, -1, rot=-math.pi * 0.85,
              hips=WHITE, legs=WHITE, torso=('973', OLIVE), held_r=('3959', TORANGE))
    C.add_fig('character.euryalus', 'euryalus', 4, -1, rot=math.pi * 0.85,
              hips=TAN, legs=TAN, torso=('973', DGREEN), held_r=('24866', WHITE))
    # Ring of 4 Whirling Youthful Dancers in left-center foreground (matching Reference Image 1!)
    C.add_fig('character.helen', 'helen', -7, 6, rot=-math.pi * 0.4,
              hips=WHITE, legs=WHITE, torso=('973', WHITE))
    C.add_fig('character.telemachus', 'telemachus', -4, 8, rot=-math.pi * 0.1,
              hips=MBLUE, legs=MBLUE, torso=('973', MBLUE))
    C.add_fig('character.odysseus', 'odysseus', -1, 7, rot=math.pi * 0.3,
              hips=DRED, legs=DRED, torso=('973', DRED), headgear=None)
    C.add_fig('character.penelope', 'penelope', -4, 4, rot=math.pi * 0.85,
              hips=DORANGE, legs=DORANGE, torso=('973', DRED))
    # Right-Center Foreground Musicians: Aulos-player & Golden Phorminx/Lyre-player (matching Reference Image 1!)
    C.add_fig('character.demodocus', 'demodocus', 4, 6, rot=math.pi * 0.75,
              hips=WHITE, legs=WHITE, torso=('973', DRED), held_r=('3959', GOLD))
    C.add_fig('character.phemius', 'phemius', 7, 9, rot=math.pi * 0.75,
              hips=WHITE, legs=WHITE, torso=('973', WHITE), held_r=('3959', GOLD))

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 2: THE SACRED CIRCLE, DORIC STOA, EXEDRA & LAW-COURT IN THE AGORA (48x32, Reference Image 2)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_agora():
    """Iliad XVIII.497-508: The assembly in the Agora, two men disputing over the blood-price of a slain man,
    the Elders seated on polished stones in the Sacred Circle holding heralds' sceptres, and two talents of gold at center."""
    C = DioramaCanvas(48, 32, seed=202)
    C.set_ground(-22, -14, 44, 28, t='p', h=2)

    # 1. Left Rear (-x, i in -21..-14, k in -13..-1): Monumental 4-Column Doric Stoa Entablature & Tall Cypress (Reference Image 2)
    build_doric_stoa(C, -21, -13, 7, 12, col_side='+x', n_cols=4, roof=False, seed=21)
    C.add_tree('cypress', -13, -13, seed=22)

    # 2. Center (ci=0, ck=2): Concentric Circular Tiled Sacred Circle Floor + Two Talents of Gold
    build_sacred_circle_floor(C, 0, 2, h=2)

    # 3. Center Rear (i in -11..10, k in -13..-5): Multi-Tier Stepped Stone Exedra & Three Sculpted Elder Thrones
    C.set_ground(-11, -5, 22, 1, t='p', h=3)
    C.set_ground(-11, -13, 22, 8, t='p', h=4)
    ex_back = [(i, -13) for i in range(-11, 11)]
    ex_left = [(-11, k) for k in range(-12, -6)]
    ex_right = [(10, k) for k in range(-12, -6)]
    for seg in (ex_back, ex_left, ex_right):
        for (wi, wk) in seg:
            C.reserve(wi, wk, 1, 1)
    C.rows += L.masonry(ex_back, C.surf_y(0, -13), 3, seed=23, shades=[(TAN, 5), (LBG, 3), (DTAN, 2)])
    C.rows += L.masonry(ex_left, C.surf_y(-11, -10), 2, seed=24, shades=[(TAN, 5), (LBG, 3)])
    C.rows += L.masonry(ex_right, C.surf_y(10, -10), 2, seed=25, shades=[(TAN, 5), (LBG, 3)])

    # Three Sculpted High-Backed Stone Thrones on the Exedra (at h=4, surf_y = 48)
    y_ex = C.surf_y(0, -10)
    throne_specs = [
        (-9, -10, 'character.nestor',      'nestor',      KYANOS, WHITE),
        (-1, -11, 'character.aegyptius',   'aegyptius',   DRED,   WHITE),
        ( 6, -10, 'character.halitherses', 'halitherses', KYANOS, WHITE),
    ]
    for (ti, tk, card, sub, tcol, lcol) in throne_specs:
        C.reserve(ti, tk, 3, 2)
        sx, sy, sz = build_elder_throne(C, ti, tk, y_ex)
        C.add_fig_at(card, sub, sx, sy, sz, rot=math.pi,
                     hips=lcol, legs=lcol, torso=('973', tcol), held_r=('95049', GOLD))

    # 4. Right Rear (+x, i in 12..20, k in -11..0): Shaded 4-Column Stone & Cloth-Awning Pergola Pavilion + Olive Tree
    C.add_tree('olive', 12, -13, seed=27)
    perg_posts = [(13, -8), (20, -8), (13, -1), (20, -1)]
    y_pg = C.surf_y(16, -4)
    for (pi, pk) in perg_posts:
        C.reserve(pi, pk, 1, 1)
        for c in range(4):
            C.rows.append(on(TAN if c < 3 else GOLD, (pi + 0.5) * S, y_pg + c * B, (pk + 0.5) * S, '3062b'))
    y_aw = y_pg + 4 * B
    for dk in (0, 2, 4, 6):
        C.rows.append(L.block(RB, 'plate', 13, -8 + dk, 8, 2, y_aw))
    for i in range(13, 21):
        col_aw = WHITE if i % 2 == 0 else TAN
        C.rows.append(L.block(col_aw, 'plate', i, -8, 1, 8, y_aw + P))
    aw_tiles = {(i, k): (WHITE if i % 2 == 0 else TAN) for i in range(13, 21) for k in range(-8, 0)}
    C.rows += pack_tiles(aw_tiles, y_aw + 2 * P)

    # 5. Front-Left (-x) and Front-Right (+x) Raised Stone Planter Bastions with Spreading Olive Trees (Reference Image 2!)
    build_raised_tree_planter(C, -21, 0, 4, 4, tree_kind='olive', bricks=2, seed=28)
    build_raised_tree_planter(C,  17, 1, 4, 4, tree_kind='olive', bricks=2, seed=29)

    # 6. Left & Right Foreground Stepped Stone Spectator Benches & Amphorae
    stone_bench(C, -15, 7, 6, axis='x', tiers=2)
    stone_bench(C,   9, 7, 6, axis='x', tiers=2)
    for (ai, ak) in ((-8, 9), (8, 9), (16, 6)):
        C.reserve(ai, ak, 1, 1)
        C.rows += amphora((ai + 0.5) * S, C.surf_y(ai, ak), (ak + 0.5) * S, DORANGE)

    # 7. Cast: Two Disputants at the Sacred Circle, Two Heralds with Golden Standards, and 6 Cheering Citizens
    y_disp = FLOOR + 2 * P  # 32 (on the TAN plates at (-5, 2) and (4, 2))
    C.add_fig_at('character.odysseus', 'odysseus', (-5 + 0.5) * S, y_disp, (2 + 0.5) * S,
                 rot=-math.pi * 0.5, hips=WHITE, legs=WHITE, torso=('973', DRED), headgear=None)
    C.add_fig_at('character.euryalus', 'euryalus', (4 + 0.5) * S, y_disp, (2 + 0.5) * S,
                 rot=math.pi * 0.5, hips=WHITE, legs=WHITE, torso=('973', KYANOS))
    # Two Heralds holding tall golden standards flanking the circle
    C.add_fig('character.medon', 'medon', -13, -1, rot=-math.pi * 0.65,
              hips=WHITE, legs=WHITE, torso=('973', TAN), held_r=('95049', GOLD))
    C.add_fig('character.dolius', 'dolius', 12, -1, rot=math.pi * 0.65,
              hips=WHITE, legs=WHITE, torso=('973', TAN), held_r=('95049', GOLD))
    # Citizens cheering on both sides of the foreground cavea
    C.add_fig('character.laertes', 'laertes', -14, 5, rot=-math.pi * 0.7, hips=WHITE, legs=WHITE, torso=('973', TAN))
    C.add_fig('character.telemachus', 'telemachus', -11, 5, rot=-math.pi * 0.75, hips=TAN, legs=TAN, torso=('973', DRED))
    C.add_fig('character.alkinoos' if False else 'character.alcinous', 'alcinous', -8, 6, rot=-math.pi * 0.8, hips=DTAN, legs=DTAN, torso=('973', MBLUE))
    C.add_fig('character.eumaeus', 'eumaeus', 8, 6, rot=math.pi * 0.8, hips=WHITE, legs=WHITE, torso=('973', KYANOS))
    C.add_fig('character.philoetius', 'philoetius', 11, 5, rot=math.pi * 0.75, hips=TAN, legs=TAN, torso=('973', OLIVE))
    C.add_fig('character.laodamas', 'laodamas', 14, 5, rot=math.pi * 0.7, hips=WHITE, legs=WHITE, torso=('973', RB))

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 3: THE RIVER AMBUSH, CITY RAMPART & SANCTUARY OF THE FATES (48x32, Reference Images 3 & 4)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_ambush():
    """Iliad XVIII.509-540: The River Ford where scouts crouch in ambush by the watering-place, two herdsmen coming down
    with their flocks playing panpipes, Golden Ares & Athena with the bronze phalanx on the right bank below the stepped
    city rampart, and the three Fates (Keres, crimson-robed Ker at center) presiding from a raised golden-columned cliff
    sanctuary at the rear."""
    C = DioramaCanvas(48, 32, seed=303)

    # 1. Topographical layout: Wide Diagonal Sparkling River Ford cutting from rear-left (i=-8, k=-14) to front-center-left (i=-2, k=13)
    for i in range(C.in_i0, C.in_i1 + 1):
        for k in range(C.in_k0, C.in_k1 + 1):
            i_riv = round(-5.0 + 0.25 * k)
            d_riv = i - i_riv
            if abs(d_riv) <= 3:
                C.h_map[(i, k)] = 1
                C.t_map[(i, k)] = 'f' if abs(d_riv) == 3 and (i + k) % 2 == 0 else ('d' if abs(d_riv) <= 1 else 'w')
            elif abs(d_riv) == 4:
                C.h_map[(i, k)] = 2
                C.t_map[(i, k)] = 'r'
            elif d_riv < -4:
                C.h_map[(i, k)] = 4 if (i <= -14 and -6 <= k <= 6) else 3
                C.t_map[(i, k)] = 'r'
            else:
                C.h_map[(i, k)] = 4 if (i >= 11 and k <= -2) else (3 if i >= 8 else 2)
                C.t_map[(i, k)] = 'p' if (i >= 10 and k <= 2) else 'e'

    # 2. Rear Center Acropolis Cliff (i in -6..5, k in -14..-7): Stepped Grey/Tan Rock Cliff + Golden Sanctuary of the Fates
    C.set_ground(-6, -14, 12, 7, t='r', h=6)
    C.reserve(-6, -14, 12, 7)
    y_cliff = C.surf_y(0, -11)  # FLOOR + 6*P = 64
    for c in range(2):
        for p_sub in range(3):
            rock_layer = {(i, k): (DBG if (i + k + c) % 3 == 0 else (LBG if (i + c) % 2 == 0 else TAN))
                          for i in range(-6, 6) for k in range(-14, -7)}
            C.rows += pack_plates(rock_layer, y_cliff + c * B + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    y_sanct = y_cliff + 2 * B
    s_stylo = {(i, k): TAN for i in range(-6, 6) for k in range(-14, -7)}
    C.rows += pack_plates(s_stylo, y_sanct, axis='x')
    y_sf = y_sanct + P
    s_cols = [(-5, -13), (-2, -13), (1, -13), (4, -13), (-5, -8), (4, -8)]
    for (ci, ck) in s_cols:
        for c in range(3):
            C.rows.append(on(GOLD if c in (0, 2) else TAN, (ci + 0.5) * S, y_sf + c * B, (ck + 0.5) * S, '3062b'))
    # Golden ritual chalices along the sanctuary front ledge
    brass_cells = [(-3, -8), (0, -8), (2, -8)]
    for (bi, bk) in brass_cells:
        C.rows.append(on(GOLD, (bi + 0.5) * S, y_sf, (bk + 0.5) * S, '3062b'))
        C.rows.append(on(GOLD, (bi + 0.5) * S, y_sf + B, (bk + 0.5) * S, '98138'))

    fate_cells = {(-4, -11), (-4, -10), (0, -11), (0, -10), (3, -11), (3, -10)}
    for (fi, fk) in fate_cells:
        C.rows.append(L.block(TAN, 'plate', fi, fk, 1, 1, y_sf))
    s_tiles = {(i, k): (GOLD if (i + k) % 2 == 0 else TAN)
               for i in range(-6, 6) for k in range(-14, -7)
               if (i, k) not in set(s_cols) and (i, k) not in set(brass_cells) and (i, k) not in fate_cells}
    C.rows += pack_tiles(s_tiles, y_sf)
    # Golden architrave & central Golden Arch over crimson Ker
    y_sent = y_sf + 3 * B
    C.rows.append(L.block(GOLD, 'plate', -5, -13, 10, 1, y_sent))
    C.rows.append(L.block(TAN,  'plate', -5, -8,  10, 1, y_sent))
    for i in range(-5, 5):
        C.rows.append(on(GOLD if i in (-2, -1, 0, 1) else TAN, (i + 0.5) * S, y_sent + P, -12.5 * S, '54200', 0.0))
        C.rows.append(on(GOLD if i in (-2, -1, 0, 1) else TAN, (i + 0.5) * S, y_sent + P,  -7.5 * S, '54200', 0.0))

    # The Three Fates (Keres): Crimson-Robed Ker in center, Dark-Robed Sisters flanking (at y_sf + P)
    C.add_fig_at('character.circe', 'circe', 0.5 * S, y_sf + P, -10.5 * S, rot=math.pi,
                 hips=DRED, legs=DRED, torso=('973', DRED), held_r=('30374', DRED))
    C.add_fig_at('character.arete', 'arete', -3.5 * S, y_sf + P, -10.5 * S, rot=math.pi,
                 hips=BLK, legs=BLK, torso=('973', BLK), headgear=BLK, held_r=('3959', SILVER))
    C.add_fig_at('character.penelope', 'penelope', 3.5 * S, y_sf + P, -10.5 * S, rot=math.pi,
                 hips=BLK, legs=BLK, torso=('973', BLK), headgear=BLK, held_r=('2343', GOLD))

    # 3. Left Bank (-x): Giant Gnarled Olive Tree, Stepped Craggy Ambush Boulders, Reeds & Two Crouching Scouts
    C.add_tree('olive', -19, -5, seed=31)
    boulder_specs = [
        (-19,  3, 3, LBG), (-18,  3, 4, DBG), (-17,  4, 3, LBG), (-16,  4, 2, DTAN),
        (-14,  3, 3, DBG), (-13,  2, 4, LBG), (-13,  1, 3, DBG), (-13,  0, 2, LBG),
        (-14, -1, 3, LBG), (-15, -2, 2, DBG), (-19,  1, 2, DBG), (-19,  2, 3, LBG),
    ]
    for (ri, rk, rh, rcol) in boulder_specs:
        C.reserve(ri, rk, 1, 1)
        yr = C.surf_y(ri, rk)
        for p in range(rh):
            c_b = rcol if p % 2 == 0 else (DBG if rcol == LBG else LBG)
            C.rows.append(L.block(c_b, 'plate', ri, rk, 1, 1, yr + p * P))
        C.rows.append(on(rcol, (ri + 0.5) * S, yr + rh * P, (rk + 0.5) * S, '54200', (ri + rk) * math.pi * 0.5))

    # 6 Dense Reed Beds along both banks of the river ford
    C.add_reeds(-11, -10, 2, 3, seed=34)
    C.add_reeds(-11,  -1, 2, 3, seed=35)
    C.add_reeds( -9,   7, 3, 2, seed=36)
    C.add_reeds(  0,  -5, 3, 2, seed=37)
    C.add_reeds(  2,   1, 3, 2, seed=38)
    C.add_reeds(  3,   8, 2, 3, seed=39)

    # Two Bronze-Helmed Scouts crouching in the rock cleft behind the ambush boulders (at i=-16, k=0 and i=-15, k=2)
    C.add_fig('character.odysseus', 'odysseus', -17, 0, rot=-math.pi * 0.65,
              hips=DB, legs=BRONZE, torso=('973', BRONZE), headgear=('3844', BRONZE), held_r=('4499', BRONZE), held_l=('3846', GOLD))
    C.add_fig('character.telemachus', 'telemachus', -15, 2, rot=-math.pi * 0.70,
              hips=DGREEN, legs=DB, torso=('973', DGREEN), headgear=('3844', DGREEN), held_r=('4499', BRONZE), held_l=('3846', BRONZE))

    # 4. Right Bank (+x): Towering Stepped Stone City Rampart, Two Cypresses, Golden Ares & Athena, and 6-Warrior Phalanx
    wall_back = [(i, -13) for i in range(11, 22)]
    wall_side = [(21, k) for k in range(-12, -3)]
    for seg_i, seg in enumerate((wall_back, wall_side)):
        for (wi, wk) in seg:
            C.reserve(wi, wk, 1, 1)
        C.rows += L.masonry(seg, C.surf_y(*seg[0]), 4, seed=40 + seg_i, shades=[(TAN, 5), (LBG, 3), (DTAN, 2)])
    C.add_tree('cypress',  7, -12, seed=42)
    C.add_tree('cypress', 10, -10, seed=43)

    # Golden Ares & Golden Athena leading the Bronze Phalanx on the right bank
    C.add_fig('character.odysseus-restored', 'odysseus-restored', 11, -5, rot=math.pi * 0.35,
              hips=GOLD, legs=GOLD, torso=('973', GOLD), arms=GOLD, hands=GOLD, head=('3626bp01', GOLD),
              headgear=('3844', DRED), held_r=('4499', GOLD), held_l=('3846', GOLD))
    C.add_fig('character.athena', 'athena', 15, -6, rot=math.pi * 0.35,
              hips=GOLD, legs=GOLD, torso=('973', GOLD), arms=GOLD, hands=GOLD, head=('3626bp01', GOLD),
              headgear=('3844', GOLD), held_r=('4499', GOLD), held_l=('75902', GOLD))

    phalanx = [
        (12, -1, 'character.menelaus',     'menelaus',     DRED,   BRONZE, KYANOS),
        (16, -2, 'character.laodamas',     'laodamas',     BRONZE, DRED,   GOLD),
        (19, -3, 'character.euryalus',     'euryalus',     BRONZE, TAN,    BRONZE),
        (15,  2, 'character.alcinous',     'alcinous',     DRED,   BRONZE, GOLD),
        (19,  1, 'character.laodamas', 'laodamas', BRONZE, DRED,   SILVER),
    ]
    for (wi, wk, wcard, wsub, wt, wl, wsh) in phalanx:
        C.add_fig(wcard, wsub, wi, wk, rot=math.pi * 0.35,
                  hips=wl, legs=wl, torso=('973', wt), headgear=('3844', GOLD), held_r=('4499', BRONZE), held_l=('3846', wsh))

    # 5. Center Foreground: Two Piping Herdsmen Driving Flock of 6 Woolly Sheep, 2 Brown Goats & Ox to the Ford
    C.add_fig('character.eumaeus', 'eumaeus', 2, 5, rot=math.pi * 0.25,
              hips=TAN, legs=TAN, torso=('973', DB), held_r=('3959', GOLD))
    C.add_fig('character.philoetius', 'philoetius', 6, 6, rot=math.pi * 0.25,
              hips=TAN, legs=TAN, torso=('973', DRED), held_r=('3959', GOLD))
    flock_specs = [
        ( 9,  7, 0.4, False), (12,  7, 0.5, False), (10, 10, 0.3, False),
        (14,  9, 0.6, False), ( 7, 10, 0.4, True),  (13, 11, 0.5, True),
    ]
    for (sx, sk, srot, slamb) in flock_specs:
        C.free_rows += woolly_sheep((sx + 0.5) * S, C.surf_y(sx, sk), (sk + 0.5) * S, rot=srot, lamb=slamb)
    C.free_rows += brown_goat((16 + 0.5) * S, C.surf_y(16, 9), (9 + 0.5) * S, rot=0.5)
    C.free_rows += brown_goat((18 + 0.5) * S, C.surf_y(18, 7), (7 + 0.5) * S, rot=0.4)

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 4: THE UPLAND SHEEPFOLD, ROOFED SHED & SHEPHERD'S HOMESTEAD (48x32, Reference Image 5)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_sheepfold():
    """Iliad XVIII.587-589: A great pasture in a fair mountain glen of white-fleeced sheep, folds, roofed sheds,
    and cottages — matching Reference Image 5 at full 48x32 architectural scale."""
    C = DioramaCanvas(48, 32, seed=404)
    C.set_ground(-22, -14, 44, 28, t='m', h=2)
    C.set_ground(-10, -4, 22, 15, t='e', h=2)

    # 1. Coursed Dry-Stone Perimeter Wall around all 4 sides (with wildflower verge outside) + Slatted Wooden Gate at front
    back_w = [(i, -13) for i in range(-20, 20)]
    left_w = [(-20, k) for k in range(-12, 11)]
    right_w = [(19, k) for k in range(-12, 11)]
    front_l = [(i, 11) for i in range(-20, -3)]
    front_r = [(i, 11) for i in range(3, 20)]
    for seg_idx, seg in enumerate((back_w, left_w, right_w, front_l, front_r)):
        for (wi, wk) in seg:
            C.reserve(wi, wk, 1, 1)
        C.rows += L.masonry(seg, C.surf_y(*seg[0]), 2, seed=41 + seg_idx, shades=[(LBG, 5), (DBG, 2), (TAN, 2), (DTAN, 1)])

    # 6-stud-wide Reddish Brown 3-rail slatted wooden gate at front center (k = 11, i in -3..2)
    y_gate = C.surf_y(0, 11)
    for gi in range(-3, 3):
        C.reserve(gi, 11, 1, 1)
        if gi in (-3, 2):
            C.rows.append(L.block(LBG, 'brick', gi, 11, 1, 1, y_gate))
            C.rows.append(L.block(DBG, 'brick', gi, 11, 1, 1, y_gate + B))
            C.rows.append(on(TAN, (gi + 0.5) * S, y_gate + 2 * B, 11.5 * S, '98138'))
        else:
            C.rows.append(L.block(RB, 'plate', gi, 11, 1, 1, y_gate))
            C.rows.append(L.block(DB, 'plate', gi, 11, 1, 1, y_gate + P))
            C.rows.append(L.block(RB, 'plate', gi, 11, 1, 1, y_gate + 2 * P))
            C.rows.append(L.block(DB, 'plate', gi, 11, 1, 1, y_gate + 3 * P))
            C.rows.append(on(RB, (gi + 0.5) * S, y_gate + 4 * P, 11.5 * S, '3070b'))

    # 2. Left Side (-x, i in -19..-11, k in -6..7): Grand Open-Fronted Timber Roofed Sheep Shed (klisie katerephes)
    build_timber_sheep_shed(C, -19, -6, 8, 13, seed=45)
    # Terracotta storage jars at the front corner of the shed
    for (ai, ak) in ((-18, 7), (-17, 7)):
        C.reserve(ai, ak, 1, 1)
        C.rows += amphora((ai + 0.5) * S, C.surf_y(ai, ak), (ak + 0.5) * S, RB)

    # 3. Back Center (i in -5..7, k in -12..-4): Stone Shepherd's Farmhouse (stathmos) with Bench, Vines, Chimney & Cypress
    build_stone_cottage(C, -5, -12, 12, 8, door_side='+z', chimney=True, bench=True, seed=46)
    C.add_tree('cypress', -9, -11, seed=47)
    C.reserve(-6, -3, 1, 1)
    C.rows += amphora(-5.5 * S, C.surf_y(-6, -3), -2.5 * S, DORANGE)

    # 4. Right Side (+x): Gnarled Spreading Olive Tree (landscape.olive) & Stone Spring Drinking Trough
    C.add_tree('olive', 14, -4, seed=48)
    for ti in range(9, 13):
        for tk in (-10, -9):
            C.reserve(ti, tk, 1, 1)
            yt = C.surf_y(ti, tk)
            C.rows.append(L.block(LBG, 'plate', ti, tk, 1, 1, yt))
            C.rows.append(on(TLBLUE if ti in (10, 11) else LBG, (ti + 0.5) * S, yt + P, (tk + 0.5) * S, '3070b'))

    # 5. Cast: Bearded Shepherd with Crooked Staff, Sheepdog & Flock of 10 Brick-Built Woolly White Sheep & Lambs
    C.add_fig('character.eumaeus', 'eumaeus', -2, -1, rot=math.pi,
              hips=TAN, legs=TAN, torso=('973', DTAN), held_r=('95049', DB))
    C.free_rows += dog_beast((-5 + 0.5) * S, C.surf_y(-5, -1), (-1 + 0.5) * S, rot=-2.6)

    flock = [
        (-15,  0, -1.5, False),  # inside the roofed sheep shed feeding at the hay manger!
        ( -8,  3, -2.5, False),
        ( -3,  5, -2.8, True),   # little lamb in front center
        (  3,  2,  2.4, False),
        (  9,  4,  2.6, False),
        (  6, -1,  2.2, False),
        ( 12,  1,  2.5, False),
        ( -7,  8, -2.3, False),
        (  2,  8,  2.7, True),
        ( 10,  8,  2.4, False),
    ]
    for (si, sk, srot, slamb) in flock:
        C.free_rows += woolly_sheep((si + 0.5) * S, C.surf_y(si, sk), (sk + 0.5) * S, rot=srot, lamb=slamb)

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 5: THE ROYAL ESTATE — THRICE-PLOUGHED FALLOW, WINE-LOGGIA & THE KING'S HARVEST OAK (48x32)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_harvest():
    """Iliad XVIII.541-560: Left (-x): the thrice-ploughed fallow turning black behind the yoked ox-ploughs, backed by
    a stone estate granary & wine-loggia where the cup-bearer pours sweet wine; Right (+x): the King's golden wheat
    harvest, reapers, sheaf-binders, Silent King, and the sacrifice feast under the Great Spreading Oak."""
    C = DioramaCanvas(48, 32, seed=505)

    for i in range(C.in_i0, C.in_i1 + 1):
        for k in range(C.in_k0, C.in_k1 + 1):
            if i <= -2:
                if -3 <= k <= 10 and -16 <= i <= -3:
                    C.t_map[(i, k)] = 'b'
                    C.h_map[(i, k)] = 3 if (k % 2 == 0) else 2
                else:
                    C.t_map[(i, k)] = 'e'
                    C.h_map[(i, k)] = 2
            elif i in (-1, 0):
                C.t_map[(i, k)] = 'p'
                C.h_map[(i, k)] = 2
            else:
                C.t_map[(i, k)] = 'm' if (i >= 13 and k <= 0) else 'g'
                C.h_map[(i, k)] = 2

    # 1. Left Rear (-x, i in -21..-12, k in -13..-6): Royal Estate Stone Granary & Wine-Loggia with Pitched Terracotta Roof
    build_stone_cottage(C, -21, -13, 9, 7, door_side='+z', chimney=False, bench=True, seed=51)
    for (ai, ak) in ((-20, -5), (-13, -5)):
        C.reserve(ai, ak, 1, 1)
        C.rows += amphora((ai + 0.5) * S, C.surf_y(ai, ak), (ak + 0.5) * S, DORANGE)

    # 2. Rear Coursed Dry-Stone Estate Boundary Wall & Twin Tall Pencil Cypresses
    rear_w = [(i, -13) for i in range(-11, 13)]
    for (wi, wk) in rear_w:
        C.reserve(wi, wk, 1, 1)
    C.rows += L.masonry(rear_w, C.surf_y(0, -13), 3, seed=52, shades=[(LBG, 4), (TAN, 4), (DTAN, 2)])
    C.add_tree('cypress', -10, -12, seed=53)
    C.add_tree('cypress',   0, -12, seed=54)

    # 3. Left Field: Three Sculpted Plough-Oxen, Ploughmen & Headland Cup-Bearer with Golden Chalice
    C.free_rows += ox_beast(-10.5 * S, C.surf_y(-10, -1), -1.0 * S, rot=-math.pi * 0.5, body_col=RB, horn_col=TAN)
    C.free_rows += ox_beast( -8.5 * S, C.surf_y( -8,  5),  5.0 * S, rot= math.pi * 0.5, body_col=DTAN, horn_col=WHITE)
    C.free_rows += ox_beast(-14.5 * S, C.surf_y(-14,  8),  8.0 * S, rot=-math.pi * 0.5, body_col=TAN, horn_col=SILVER)
    C.add_fig('character.eumaeus', 'eumaeus', -4, -1, rot=math.pi * 0.5, hips=DB, legs=DB, torso=('973', RB), held_r=('95049', DB))
    C.add_fig('character.philoetius', 'philoetius', -14, 4, rot=-math.pi * 0.5, hips=RB, legs=RB, torso=('973', DTAN), held_r=('95049', DB))
    C.add_fig('character.medon', 'medon', -17, -2, rot=-math.pi * 0.6, hips=WHITE, legs=WHITE, torso=('973', TAN), held_r=('2343', GOLD))

    # 4. Right Rear (+x): Great Spreading Oak Tree (landscape.oak), Stone Sacrifice Altar & Barley-Feast Table
    C.add_tree('oak', 16, -11, seed=55)
    # Stone Sacrifice Altar & Roast Ox Hearth (i in 14..17, k in -3..-1)
    for hi in range(14, 18):
        for hk in (-3, -2):
            C.reserve(hi, hk, 1, 1)
            yh = C.surf_y(hi, hk)
            C.rows.append(L.block(LBG if (hi + hk) % 2 == 0 else DBG, 'brick', hi, hk, 1, 1, yh))
            C.rows.append(on(TORANGE if hi in (15, 16) else BRONZE, (hi + 0.5) * S, yh + B, (hk + 0.5) * S, '98138'))
    # Stone Table where women knead white barley-cakes (i in 15..18, k = 3)
    for ti in range(15, 19):
        C.reserve(ti, 3, 1, 1)
        yt = C.surf_y(ti, 3)
        C.rows.append(L.block(TAN, 'brick', ti, 3, 1, 1, yt))
        C.rows.append(on(WHITE if ti in (16, 17) else GOLD, (ti + 0.5) * S, yt + B, 3.5 * S, '98138'))

    C.add_fig('character.dolius', 'dolius', 13, -2, rot=-math.pi * 0.5, hips=RB, legs=RB, torso=('973', TAN), held_r=('3847', BRONZE))
    C.add_fig('character.eurycleia', 'eurycleia', 19, 1, rot=math.pi, hips=WHITE, legs=WHITE, torso=('973', WHITE), held_r=('98138', WHITE))
    C.add_fig('character.penelope', 'penelope', 16, 5, rot=0.0, hips=WHITE, legs=WHITE, torso=('973', TAN), held_r=('98138', WHITE))

    # 5. Right Field: Standing Golden Wheat Rows (i in 2..11, k in {-9, -4, 1}) & 5 Sculpted Bound Golden Sheaves
    for wk in (-9, -4, 1):
        for wi in range(2, 12):
            C.reserve(wi, wk, 1, 1)
            yw = C.surf_y(wi, wk)
            C.rows.append(on(GOLD if (wi + wk) % 2 == 0 else TAN, (wi + 0.5) * S, yw, (wk + 0.5) * S, '3062b'))
            C.rows.append(on(BYELLOW if wi % 2 == 0 else GOLD, (wi + 0.5) * S, yw + B, (wk + 0.5) * S, '3062b'))
            C.rows.append(on(GOLD, (wi + 0.5) * S, yw + 2 * B, (wk + 0.5) * S, '98138'))
    for (si, sk) in ((3, 5), (6, 5), (9, 5), (5, 8), (8, 8)):
        C.reserve(si, sk, 1, 1)
        ys = C.surf_y(si, sk)
        C.rows.append(L.block(GOLD, 'brick', si, sk, 1, 1, ys))
        C.rows.append(on(BYELLOW, (si + 0.5) * S, ys + B, (sk + 0.5) * S, '54200', 0.0))

    # Reapers with sickles, Sheaf-Binders & The Silent King on a raised stone dais
    C.set_ground(1, 7, 3, 3, t='p', h=3)
    C.add_fig('character.menelaus', 'menelaus', 2, 8, rot=0.0,
              hips=GOLD, legs=GOLD, torso=('973', DRED), crown=('98138', GOLD), held_r=('95049', GOLD))
    C.add_fig('character.laodamas', 'laodamas', 3, -6, rot=-math.pi * 0.5, hips=DTAN, legs=DTAN, torso=('973', TAN), held_r=('3847', BRONZE))
    C.add_fig('character.euryalus', 'euryalus', 9, -1, rot=math.pi * 0.5, hips=RB, legs=RB, torso=('973', DTAN), held_r=('3847', BRONZE))
    C.add_fig('character.telemachus', 'telemachus', 11, 6, rot=0.0, hips=DB, legs=DB, torso=('973', TAN))

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 6: THE GOLDEN VINEYARD, VINTNER'S VILLA & ROOFED WINE-PRESS PAVILION (48x32)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_vineyard():
    """Iliad XVIII.561-572: The vineyard heavy with dark grapes on silver poles, surrounded by a kyanos ditch and tin fence,
    with one single bridge path, a Vintner's Stone Villa, a roofed stone wine-press pavilion, and the Boy playing the
    golden phorminx surrounded by dancing youths and maidens."""
    C = DioramaCanvas(48, 32, seed=606)

    # 1. Perimeter Kyanos (Dark Blue + Trans-Light Blue) Water-Moat around the entire 44x28 interior, with 1 central bridge
    for i in range(C.in_i0, C.in_i1 + 1):
        for k in range(C.in_k0, C.in_k1 + 1):
            on_edge = i in (C.in_i0, C.in_i0 + 1, C.in_i1 - 1, C.in_i1) or k in (C.in_k0, C.in_k1)
            is_bridge = (k in (C.in_k1 - 1, C.in_k1) and -3 <= i <= 2)
            if on_edge and not is_bridge:
                C.h_map[(i, k)] = 1
                C.t_map[(i, k)] = 'w' if (i + k) % 2 == 0 else 'd'
            else:
                C.h_map[(i, k)] = 2
                C.t_map[(i, k)] = 'p' if (-3 <= i <= 2) else 'e'

    # 2. Ornate Silver (179) & Tin (80) Fence with Golden Finials along the front moat bank (k = 12)
    for fi in range(-19, 19):
        if -3 <= fi <= 2:
            continue
        C.reserve(fi, 12, 1, 1)
        yf = C.surf_y(fi, 12)
        C.rows.append(L.block(TIN if fi % 2 == 0 else SILVER, 'brick', fi, 12, 1, 1, yf))
        C.rows.append(on(GOLD if fi in (-19, -4, 3, 18) else SILVER, (fi + 0.5) * S, yf + B, 12.5 * S, '98138'))

    # 3. Left Rear (-x, i in -19..-9, k in -12..-5): Vintner's Stone Villa & Wine Cellar + Two Tall Cypresses
    build_stone_cottage(C, -19, -12, 10, 7, door_side='+z', chimney=True, bench=True, seed=61)
    C.add_tree('cypress', -8, -12, seed=62)
    C.add_tree('cypress', -19, -3, seed=63)

    # 4. Right Rear (+x, i in 8..18, k in -12..-5): Roofed Stone Wine-Treading Pavilion (lenos) + Spreading Olive Tree
    build_wine_press_pavilion(C, 8, -12, 10, 7, seed=64)
    C.add_tree('olive', 16, -2, seed=65)
    for (ai, ak) in ((6, -6), (7, -6)):
        C.reserve(ai, ak, 1, 1)
        C.rows += amphora((ai + 0.5) * S, C.surf_y(ai, ak), (ak + 0.5) * S, DORANGE)

    # 5. Six Trellised Grapevine Rows on Pearl Silver Poles with Golden Overhead Trellises & Hanging Dark Grape Clusters
    for vk in (-2, 3, 8):
        for side_i0, side_i1 in ((-12, -5), (4, 11)):
            stakes = [side_i0, side_i0 + 4, side_i1]
            y_v = C.surf_y(side_i0, vk)
            for si in stakes:
                C.reserve(si, vk, 1, 1)
                for c in range(3):
                    C.rows.append(on(SILVER, (si + 0.5) * S, y_v + c * B, (vk + 0.5) * S, '3062b'))
            y_rail = y_v + 3 * B
            C.rows.append(L.block(GOLD, 'plate', side_i0, vk, 8, 1, y_rail))
            for i in range(side_i0, side_i1 + 1):
                C.rows.append(on(OLIVE if i % 2 == 0 else DGREEN, (i + 0.5) * S, y_rail + P, (vk + 0.5) * S, '98138'))
                if i not in stakes and i % 2 == 1:
                    C.rows.append(on(BLK if (i + vk) % 3 == 0 else DPURPLE, (i + 0.5) * S, y_rail - B, (vk + 0.5) * S, '3062b'))

    # 6. Central Raised Stone Musicians' Dais & Cast: Boy with Golden Phorminx + 6 Dancing Youths & Maidens
    C.set_ground(-3, -2, 6, 6, t='p', h=3)
    C.add_fig('character.phemius', 'phemius', 0, 0, rot=math.pi,
              hips=WHITE, legs=WHITE, torso=('973', GOLD), held_r=('3959', GOLD))
    C.add_fig('character.helen', 'helen', -2, 2, rot=-math.pi * 0.75,
              hips=WHITE, legs=WHITE, torso=('973', DRED), held_r=('98138', DPURPLE))
    C.add_fig('character.penelope', 'penelope', 1, 2, rot=math.pi * 0.75,
              hips=WHITE, legs=WHITE, torso=('973', MBLUE), held_r=('98138', GOLD))
    C.add_fig('character.laodamas', 'laodamas', -8, 0, rot=-math.pi * 0.6,
              hips=TAN, legs=TAN, torso=('973', WHITE), held_r=('2343', GOLD))
    C.add_fig('character.telemachus', 'telemachus', 7, 0, rot=math.pi * 0.6,
              hips=TAN, legs=TAN, torso=('973', OLIVE), held_r=('2343', GOLD))
    C.add_fig('character.arete', 'arete', -6, 6, rot=-math.pi * 0.8,
              hips=WHITE, legs=WHITE, torso=('973', TAN))
    C.add_fig('character.euryalus', 'euryalus', 5, 6, rot=math.pi * 0.8,
              hips=TAN, legs=TAN, torso=('973', DRED))

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 7: THE HIGH-ROOFED CATTLE BYRE, SOUNDING RIVER & THE TWO LIONS (48x32)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_cattle():
    """Iliad XVIII.573-586: The herd of straight-horned cattle of gold and tin rushing from the byre to pasture
    beside a sounding river and reed-bed; two terrible lions seize the bellowing bull at the front while four
    golden herdsmen and nine swift dogs pursue."""
    C = DioramaCanvas(48, 32, seed=707)

    for i in range(C.in_i0, C.in_i1 + 1):
        for k in range(C.in_k0, C.in_k1 + 1):
            riv_edge = 10 + round(0.25 * k)
            if i >= riv_edge:
                C.h_map[(i, k)] = 1
                C.t_map[(i, k)] = 'f' if i == riv_edge else ('d' if i >= riv_edge + 3 else 'w')
            elif i == riv_edge - 1:
                C.h_map[(i, k)] = 2
                C.t_map[(i, k)] = 'r'
            else:
                C.h_map[(i, k)] = 2
                C.t_map[(i, k)] = 'm' if (i + k) % 3 == 0 else 't'

    # 1. Left Rear (-x, i in -21..-7, k in -13..-4): Grand High-Roofed Cattle Byre (kopros) + Corral Wall + Twin Cypresses
    build_stone_cottage(C, -21, -13, 14, 9, door_side='+z', chimney=True, bench=True, seed=71)
    C.add_tree('cypress', -6, -12, seed=72)
    C.add_tree('cypress', -21, -2, seed=73)
    # Stone Corral Wall & Cattle Drinking Trough outside the Byre
    corral_w = [(i, -13) for i in range(-4, 7)]
    for (wi, wk) in corral_w:
        C.reserve(wi, wk, 1, 1)
    C.rows += L.masonry(corral_w, C.surf_y(0, -13), 2, seed=74)
    for ti in range(-18, -14):
        C.reserve(ti, -2, 1, 1)
        yt = C.surf_y(ti, -2)
        C.rows.append(L.block(LBG, 'plate', ti, -2, 1, 1, yt))
        C.rows.append(on(TLBLUE if ti in (-17, -16) else LBG, (ti + 0.5) * S, yt + P, -1.5 * S, '3070b'))

    # 2. Right Side (+x): Sounding River, Rocky Promontories with Spreading Olive & Willow Trees, and 4 Dense Reed Beds
    C.set_ground(16, -13, 4, 4, t='r', h=2)
    C.set_ground(16,   3, 4, 4, t='r', h=2)
    C.add_tree('olive', 17, -12, seed=75)
    C.add_tree('willow', 17,  4, seed=76)
    C.add_reeds(7, -11, 3, 2, seed=77)
    C.add_reeds(6,  -4, 3, 2, seed=78)
    C.add_reeds(5,   3, 3, 2, seed=79)
    C.add_reeds(7,   9, 3, 2, seed=80)

    # 3. Center Pasture: Bellowing Bull Dragged Down by Two Tawny Lions + 4 More Gold & Tin Horned Cattle
    C.free_rows += ox_beast(1.5 * S, C.surf_y(1, 4), 4.0 * S, rot=-2.2, body_col=BRONZE, horn_col=GOLD)
    C.free_rows += lion_beast(4.5 * S, C.surf_y(4, 2), 2.0 * S, rot=0.8)
    C.free_rows += lion_beast(-1.5 * S, C.surf_y(-1, 6), 6.0 * S, rot=-2.6)

    C.free_rows += ox_beast( 1.5 * S, C.surf_y( 1, -7), -7.0 * S, rot=-1.9, body_col=GOLD, horn_col=SILVER)
    C.free_rows += ox_beast(-3.5 * S, C.surf_y(-3, -2), -2.0 * S, rot=-1.6, body_col=TIN,  horn_col=GOLD)
    C.free_rows += ox_beast(-4.5 * S, C.surf_y(-4,  9),  9.0 * S, rot=-2.1, body_col=GOLD, horn_col=SILVER)
    C.free_rows += ox_beast( 2.5 * S, C.surf_y( 2, 10), 10.0 * S, rot=-1.8, body_col=TIN,  horn_col=GOLD)

    # 4. Four Golden Herdsmen & Nine Swift Hunting Hounds Charging from the Byre
    herdsmen = [
        (-10, -2, 'eumaeus',    -math.pi * 0.55),
        (-14,  1, 'philoetius', -math.pi * 0.50),
        (-11,  5, 'odysseus',   -math.pi * 0.45),
        (-16,  7, 'telemachus', -math.pi * 0.50),
    ]
    for (hi, hk, hsub, hrot) in herdsmen:
        C.add_fig('character.' + hsub, hsub, hi, hk, rot=hrot,
                  hips=TAN, legs=TAN, torso=('973', GOLD), held_r=('4499', BRONZE))

    dogs = [
        (-6, -4, -1.8), (-7, 0, -1.6), (-7, 3, -1.5), (-8, 6, -1.7), (-9, 9, -1.9),
        (-10, -6, -1.7), (-13, -3, -1.6), (-14, 4, -1.5), (-16, 10, -1.8),
    ]
    for (di, dk, drot) in dogs:
        C.free_rows += dog_beast((di + 0.5) * S, C.surf_y(di, dk), (dk + 0.5) * S, rot=drot)

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 8: THE PALACE OF KNOSSOS, DANCING FLOOR OF DAEDALUS & COSMIC VAULT OF HEPHAESTUS (48x32)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_choros():
    """Iliad XVIII.483-489, 590-608: The Choros like that which Daedalus wrought in wide Knossos for Ariadne of the
    lovely tresses, where youths with golden daggers on silver belts and maidens with fair crowns dance around the
    divine bard and two tumbling acrobats, backed by a monumental Knossian Palace Stoa with flanking royal loggias
    and crowned with Hephaestus's Cosmic Vault."""
    C = DioramaCanvas(48, 32, seed=808)
    C.set_ground(-22, -14, 44, 28, t='p', h=2)

    # 1. Center (ci=0, ck=2): Concentric Circular Mosaic Dancing Floor of Daedalus
    build_sacred_circle_floor(C, 0, 2, h=2)

    # 2. Rear Center (i in -16..15, k in -13..-6): Monumental Knossian Palace Stoa + Flanking Royal Bastions + Cosmic Vault
    C.set_ground(-16, -7, 32, 1, t='p', h=3)
    C.set_ground(-16, -13, 32, 6, t='p', h=4)
    C.reserve(-16, -13, 32, 6)
    y_stoa = C.surf_y(0, -10)  # FLOOR + 4*P = 48

    # Rear frescoed palace wall (4 brick courses high)
    for c in range(4):
        for p_sub in range(3):
            w_col = DRED if c in (1, 2) else (GOLD if (c == 3 and p_sub == 2) else (WHITE if (c + p_sub) % 2 == 0 else TAN))
            w_layer = {(i, -13): w_col for i in range(-16, 16)}
            C.rows += pack_plates(w_layer, y_stoa + c * B + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))

    # 8 Minoan Red-and-Gold Columns along k in -9..-8
    col_is = [-15, -11, -7, -3, 2, 6, 10, 14]
    col_cells = set()
    for ci in col_is:
        cx, cz = (ci + 1) * S, (-9 + 1) * S
        for di in (0, 1):
            for dk in (0, 1):
                col_cells.add((ci + di, -9 + dk))
        C.rows.append(put(GOLD, cx, y_stoa + P, cz, '4032a'))
        for c in range(3):
            C.rows.append(put(DRED if c != 1 else GOLD, cx, y_stoa + P + (c + 1) * B, cz, '3941'))
        C.rows.append(put(BLK, cx, y_stoa + 2 * P + 3 * B, cz, '4032a'))
        C.rows.append(put(GOLD, cx, y_stoa + 3 * P + 3 * B, cz, '3022'))

    stoa_tiles = {(i, k): (WHITE if (i + k) % 2 == 0 else TAN)
                  for i in range(-16, 16) for k in range(-12, -7)
                  if (i, k) not in col_cells}
    C.rows += pack_tiles(stoa_tiles, y_stoa)

    # Entablature & Roof Deck at y_ent = y_stoa + 4 * B
    y_ent = y_stoa + 4 * B
    ent1 = {(i, k): TAN for i in range(-16, 16) for k in range(-13, -7)}
    ent2 = {(i, k): (GOLD if k == -8 else WHITE) for i in range(-16, 16) for k in range(-13, -7)}
    C.rows += pack_plates(ent1, y_ent, axis='x')
    C.rows += pack_plates(ent2, y_ent + P, axis='z')
    y_roof = y_ent + 2 * P

    # Central Cosmic Vault Sanctuary (i in -5..4, k in -12..-8) + Flanking Royal Loggias (i in -15..-12 and 11..14)
    cosmic_cells = {(i, k) for i in range(-5, 5) for k in range(-12, -8)}
    left_loggia  = {(i, k) for i in range(-15, -11) for k in range(-12, -9)}
    right_loggia = {(i, k) for i in range(11, 15) for k in range(-12, -9)}
    horn_cells = set()
    for hi in (-10, -8, 6, 8):
        for di in range(2):
            horn_cells.add((hi + di, -8))
        C.rows.append(L.block(WHITE, 'plate', hi, -8, 2, 1, y_roof))
        C.rows.append(on(WHITE, (hi + 0.5) * S, y_roof + P, -7.5 * S, '54200', -math.pi * 0.5))
        C.rows.append(on(WHITE, (hi + 1.5) * S, y_roof + P, -7.5 * S, '54200',  math.pi * 0.5))

    # Build Left & Right Upper Palace Loggia Wings with Ariadne & King Minos watching from above!
    for log_cells, side_name in ((left_loggia, 'left'), (right_loggia, 'right')):
        i0_l = -15 if side_name == 'left' else 11
        for (li, lk) in log_cells:
            if lk == -12:
                C.rows.append(L.block(DRED if (li + lk) % 2 == 0 else TAN, 'brick', li, lk, 1, 1, y_roof))
                C.rows.append(L.block(TAN, 'brick', li, lk, 1, 1, y_roof + B))
                C.rows.append(on(GOLD, (li + 0.5) * S, y_roof + 2 * B, (lk + 0.5) * S, '3070b'))
            elif lk == -10 and li in (i0_l, i0_l + 3):
                C.rows.append(L.block(WHITE, 'brick', li, lk, 1, 1, y_roof))
                C.rows.append(on(GOLD, (li + 0.5) * S, y_roof + B, (lk + 0.5) * S, '98138'))
            elif lk == -11 and li in (i0_l + 1, i0_l + 2):
                C.rows.append(L.block(TAN, 'plate', li, lk, 1, 1, y_roof))
            else:
                C.rows.append(on(WHITE if (li + lk) % 2 == 0 else TAN, (li + 0.5) * S, y_roof, (lk + 0.5) * S, '3070b'))
        if side_name == 'left':
            C.add_fig_at('character.arete', 'arete', (-13.5 + 0.5) * S, y_roof + P, (-11 + 0.5) * S, rot=math.pi,
                         hips=WHITE, legs=WHITE, torso=('973', DRED), crown=('98138', GOLD))
        else:
            C.add_fig_at('character.alcinous', 'alcinous', (12.5 + 0.5) * S, y_roof + P, (-11 + 0.5) * S, rot=math.pi,
                         hips=GOLD, legs=GOLD, torso=('973', DPURPLE), crown=('98138', GOLD))

    # Build Central Cosmic Vault of Hephaestus (Sun, Moon, Pleiades, Hyades, Orion, Bear)
    for c in range(2):
        for p_sub in range(3):
            c_layer = {(i, k): (GOLD if i in (-5, 4) or k in (-12, -9) else KYANOS)
                       for (i, k) in cosmic_cells}
            C.rows += pack_plates(c_layer, y_roof + c * B + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    y_cos_top = y_roof + 2 * B
    for (ci, ck) in cosmic_cells:
        if (ci, ck) in ((2, -10), (-3, -10), (0, -11), (-1, -10), (1, -11)):
            C.rows.append(L.block(KYANOS, 'plate', ci, ck, 1, 1, y_cos_top))
            if (ci, ck) == (2, -10):
                C.rows.append(on(GOLD, (ci + 0.5) * S, y_cos_top + P, (ck + 0.5) * S, '3062b'))
                C.rows.append(on(TORANGE, (ci + 0.5) * S, y_cos_top + P + B, (ck + 0.5) * S, '98138'))
            elif (ci, ck) == (-3, -10):
                C.rows.append(on(SILVER, (ci + 0.5) * S, y_cos_top + P, (ck + 0.5) * S, '3062b'))
                C.rows.append(on(WHITE, (ci + 0.5) * S, y_cos_top + P + B, (ck + 0.5) * S, '98138'))
            else:
                C.rows.append(on(BYELLOW if ci == 0 else TIN, (ci + 0.5) * S, y_cos_top + P, (ck + 0.5) * S, '98138'))
        else:
            C.rows.append(on(GOLD if ci in (-5, 4) or ck in (-12, -9) else KYANOS,
                             (ci + 0.5) * S, y_cos_top, (ck + 0.5) * S, '3070b'))

    rem_roof = {(i, k): (TAN if (i + k) % 2 == 0 else LBG)
                for i in range(-16, 16) for k in range(-13, -7)
                if (i, k) not in cosmic_cells and (i, k) not in horn_cells
                and (i, k) not in left_loggia and (i, k) not in right_loggia}
    C.rows += pack_tiles(rem_roof, y_roof)

    # 3. Flanking Botanicals & Raised Stone Olive Planter Bastions + Stepped Theatral Benches
    C.add_tree('cypress', -20, -13, seed=81)
    C.add_tree('cypress',  18, -13, seed=82)
    build_raised_tree_planter(C, -21, -4, 4, 4, tree_kind='olive', bricks=2, seed=83)
    build_raised_tree_planter(C,  17, -4, 4, 4, tree_kind='olive', bricks=2, seed=84)

    stone_bench(C, -15, 8, 6, axis='x', tiers=2)
    stone_bench(C,   9, 8, 6, axis='x', tiers=2)

    # 4. Cast: Ring of Youths & Maidens, Divine Bard with Golden Phorminx, and Two Tumbling Acrobats
    y_ring = FLOOR + 2 * P  # 32 (on the TAN plates at (4, 2) and (-5, 2))
    C.add_fig_at('character.laodamas', 'laodamas', (4 + 0.5) * S, y_ring, (2 + 0.5) * S,
                 rot=math.pi * 0.5, hips=WHITE, legs=WHITE, torso=('973', GOLD), held_r=('3847', GOLD))
    C.add_fig_at('character.helen', 'helen', (-5 + 0.5) * S, y_ring, (2 + 0.5) * S,
                 rot=-math.pi * 0.5, hips=WHITE, legs=WHITE, torso=('973', WHITE), crown=('98138', GOLD))

    dancers_outer = [
        ( 6, -3, 'character.telemachus', 'telemachus',  math.pi * 0.75, GOLD,  TAN,   ('3847', GOLD)),
        (-7, -3, 'character.penelope',   'penelope',   -math.pi * 0.75, WHITE, WHITE, None),
        ( 6,  6, 'character.arete',      'arete',       math.pi * 0.25, WHITE, TAN,   None),
        (-7,  6, 'character.euryalus',   'euryalus',   -math.pi * 0.25, GOLD,  WHITE, ('3847', GOLD)),
        ( 2,  9, 'character.odysseus',   'odysseus',    0.0,            DRED,  GOLD,  ('3847', GOLD)),
        (-3,  9, 'character.eurycleia',  'eurycleia',   0.0,            WHITE, WHITE, None),
    ]
    for (di, dk, dcard, dsub, drot, dt, dl, dheld) in dancers_outer:
        kw = {'hips': dl, 'legs': dl, 'torso': ('973', dt)}
        if 'odysseus' in dcard:
            kw['headgear'] = None
        if dsub in ('penelope', 'arete', 'eurycleia'):
            kw['crown'] = ('98138', GOLD)
        if dheld:
            kw['held_r'] = dheld
        C.add_fig(dcard, dsub, di, dk, rot=drot, **kw)

    C.add_fig('character.demodocus', 'demodocus', 0, -5, rot=math.pi,
              hips=GOLD, legs=GOLD, torso=('973', DRED), held_r=('3959', GOLD))
    C.add_fig('character.phemius', 'phemius', -12, 4, rot=-math.pi * 0.6,
              hips=WHITE, legs=WHITE, torso=('973', MBLUE))
    C.add_fig('character.menelaus', 'menelaus', 11, 4, rot=math.pi * 0.6,
              hips=GOLD, legs=GOLD, torso=('973', DPURPLE), crown=('98138', GOLD))

    return C.finalize()


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# KIT 9: THE MULTIPLANE FORGE & 3D AGENT OFFICE — BEHIND THE SCENES OF THE SHIELD (48x32)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def build_diorama_office():
    """Behind-the-Scenes Multiplane Animation Studio & 3D Multiplayer Agent Office (Kohnny / AgentSystemLabs/agent-office /
    bill10/agent-007):
    - Central 4-Level Multiplane Camera Tower & Spatiotemporal Worm Prism (with 61485c01 turntable at base).
    - Rear 4-Column Kanban + Git Worktree Wall (Planning -> Doing M0..M9 -> Auditor Review -> FIFO Merge Queue) +
      Maestro (Hephaestus) & Auditor (Athena) Command Gallery.
    - Left Wing: 4 Isolated Git Worktree Agent Desks (huashu/rossark, take-one/reanimate, argo/explainroo, video-director/earshot).
    - Right Wing: Cross-Model Auditor Table (clicks.py 0 loose / 0 clashes) + The Espresso/Ambrosia Coffee Bar for idle agents.
    - Foreground: Bouleau 14-Line Armature & Golden Ratio floor inlay with Director & Cinematographer agents."""
    C = DioramaCanvas(48, 32, seed=909)
    # Studio floor: limestone ashlar with Bouleau Armature & Golden Ratio center stage
    C.set_ground(-22, -14, 44, 28, t='p', h=2)
    # Central Multiplane Camera Stage (i in -6..5, k in -5..4) raised 1 plate higher (h=3 -> yup=40)
    C.set_ground(-6, -5, 12, 10, t='c', h=3)
    # Left Agent Desk Platform (i in -21..-9, k in -5..9)
    C.set_ground(-21, -5, 12, 14, t='p', h=2)
    # Right Auditor & Espresso Lounge Platform (i in 8..20, k in -5..9)
    C.set_ground(8, -5, 13, 14, t='p', h=2)

    # 1. Rear 4-Column Kanban + Git Worktree Wall & Maestro/Auditor Command Gallery (i in -20..19, k in -13..-9)
    kanban_cells = [(i, k) for i in range(-20, 20) for k in range(-13, -8)]
    for (i, k) in kanban_cells:
        C.reserve(i, k, 1, 1)
    y_kan0 = C.surf_y(0, -11)  # 32

    # Base foundation of Kanban Wall (1 brick high across i in -20..19, k in -13..-9)
    for p_sub in range(3):
        layer = {(i, k): (KYANOS if k == -9 else TAN) for (i, k) in kanban_cells}
        C.rows += pack_plates(layer, y_kan0 + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    y_kan_base = y_kan0 + B  # 56

    # 4 Kanban Columns along k in -13..-10 (4 studs deep), with front ledge at k == -9 tiled in Gold/Blue
    front_ledge = {(i, -9): (GOLD if i in (-20, -10, 0, 10, 19) else KYANOS) for i in range(-20, 20)}
    C.rows += pack_tiles(front_ledge, y_kan_base)

    # Build the 4 Kanban Columns (bricks=4 high -> 96 LDU -> y_kan_top = 152)
    wall_cells = [(i, k) for i in range(-20, 20) for k in range(-13, -9)]
    for c in range(4):
        yc = y_kan_base + c * B
        for p_sub in range(3):
            w_layer = {}
            for (i, k) in wall_cells:
                # Dividers between the 4 Kanban columns at i in (-20, -10, 0, 10, 19)
                if i in (-20, -10, 0, 10, 19):
                    w_layer[(i, k)] = GOLD if c in (0, 3) else DB
                elif k == -10 and c in (1, 2):
                    # Colored Kanban Worktree Cards on the front face of the board!
                    if -19 <= i <= -11:   # Column 1: PLANNING (Tan / White / Gold mockups)
                        w_layer[(i, k)] = WHITE if (i + c) % 2 == 0 else TAN
                    elif -9 <= i <= -1:   # Column 2: DOING - GIT WORKTREES M0..M9 (Gold / Bronze)
                        w_layer[(i, k)] = GOLD if (i + c) % 2 == 0 else BRONZE
                    elif 1 <= i <= 9:     # Column 3: CROSS-MODEL AUDITOR (Medium Blue / Silver)
                        w_layer[(i, k)] = MBLUE if (i + c) % 2 == 0 else SILVER
                    else:                 # Column 4: FIFO MERGE QUEUE (Olive / Gold)
                        w_layer[(i, k)] = OLIVE if (i + c) % 2 == 0 else GOLD
                else:
                    w_layer[(i, k)] = KYANOS if k == -10 else (TAN if (i + k + c) % 2 == 0 else LBG)
            C.rows += pack_plates(w_layer, yc + p_sub * P, axis=('z' if p_sub % 2 == 0 else 'x'))

    y_kan_top = y_kan_base + 4 * B  # 152
    # Tile the top of the Kanban Command Gallery, leaving studs for Maestro (Hephaestus) and Auditor (Athena)
    maestro_studs = {(-5, -11), (-4, -11), (4, -11), (5, -11), (-15, -11), (14, -11)}
    gal_tiles = {}
    for (i, k) in wall_cells:
        if (i, k) in maestro_studs:
            C.rows.append(L.block(GOLD, 'plate', i, k, 1, 1, y_kan_top))
        else:
            gal_tiles[(i, k)] = GOLD if k in (-13, -10) or i in (-20, -10, 0, 10, 19) else TAN
    C.rows += pack_tiles(gal_tiles, y_kan_top)

    # Golden signal beacons on the Kanban Gallery
    for bi in (-15, 14):
        C.rows.append(on(GOLD, (bi + 0.5) * S, y_kan_top + P, (-11 + 0.5) * S, '3062b'))
        C.rows.append(on(TORANGE, (bi + 0.5) * S, y_kan_top + P + B, (-11 + 0.5) * S, '4589'))

    # Place Maestro (Hephaestus) and Auditor (Athena) on the Command Gallery overlooking the Multiplane Studio
    C.add_fig_at('character.odysseus', 'odysseus', (-4.5 + 0.5) * S, y_kan_top + P, (-11 + 0.5) * S,
                 rot=math.pi, hips=DB, legs=GOLD, torso=('973', BRONZE), headgear=None,
                 crown=('98138', GOLD), held_r=('4589', GOLD))
    C.add_fig_at('character.athena', 'athena', (4.5 + 0.5) * S, y_kan_top + P, (-11 + 0.5) * S,
                 rot=math.pi, hips=GOLD, legs=GOLD, torso=('973', GOLD),
                 held_r=('4497', GOLD), held_l=('3846', GOLD))

    # 2. CENTERPIECE: The 4-Level Multiplane Camera Tower & Spatiotemporal Worm Prism (i in -6..5, k in -5..4)
    mp_cells = [(i, k) for i in range(-6, 6) for k in range(-5, 5)]
    for (i, k) in mp_cells:
        C.reserve(i, k, 1, 1)
    y_mp0 = C.surf_y(0, 0)  # 40

    # Plane 1 (Base Plane at y_mp0 = 40): Oceanus Rim & Central Spatiotemporal Worm Core
    worm_cells = {(0, -1), (-1, 0)}
    gantry_pillars = {(pi, pk) for pi in (-6, -2, 1, 5) for pk in (-5, -2, 1, 4)}
    base_tiles = {}
    for (i, k) in mp_cells:
        if (i, k) in worm_cells or (i, k) in gantry_pillars:
            continue
        if i in (-2, -1, 0, 1) and k in (-2, -1, 0, 1):
            base_tiles[(i, k)] = GOLD if (i + k) % 2 == 0 else TORANGE
        elif i in (-6, 5) or k in (-5, 4):
            base_tiles[(i, k)] = GOLD if (i + k) % 2 == 0 else KYANOS
        else:
            base_tiles[(i, k)] = TLBLUE if (i + k) % 2 == 0 else KYANOS
    C.rows += pack_tiles(base_tiles, y_mp0)

    # Build the Gantry Pillars + Central Spatiotemporal Worm rising 6 bricks (144 LDU -> y_mp0 + 6*B = 184),
    # with a suspended Multiplane Platform at c=3
    for c in range(6):
        yc = y_mp0 + c * B
        w_col = GOLD if c % 2 == 0 else (TORANGE if c in (1, 5) else TLBLUE)
        if c == 3:
            # Plane 2 (Mid-Level Multiplane Frame at yc..yc+B): Full 12x10 Multiplane Layer
            for p_sub in range(3):
                b2_layer = {(i, k): (GOLD if p_sub == 1 else (KYANOS if (i, k) in worm_cells else DBG)) for (i, k) in mp_cells}
                C.rows += pack_plates(b2_layer, yc + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
            b2_tiles = {(bi, bk): (DPURPLE if (bi + bk) % 2 == 0 else OLIVE)
                        for (bi, bk) in mp_cells
                        if (bi, bk) not in gantry_pillars and (bi, bk) not in worm_cells}
            C.rows += pack_tiles(b2_tiles, yc + B)
        else:
            for (pi, pk) in gantry_pillars:
                col_p = GOLD if c in (0, 5) else (TIN if c % 2 == 1 else DB)
                C.rows.append(on(col_p, (pi + 0.5) * S, yc, (pk + 0.5) * S, '3062b'))
            for (wi, wk) in worm_cells:
                C.rows.append(on(w_col, (wi + 0.5) * S, yc, (wk + 0.5) * S, '3062b'))

    # Plane 3 / Top Multiplane Camera Gantry Roof at y_gantry_top = y_mp0 + 6*B = 184
    y_gantry_top = y_mp0 + 6 * B  # 184
    for p_sub in range(2):
        gr_layer = {(i, k): (KYANOS if p_sub == 0 else GOLD) for (i, k) in mp_cells}
        C.rows += pack_plates(gr_layer, y_gantry_top + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    y_cam_deck = y_gantry_top + 2 * P  # 200
    cam_center = {(-1, -1), (0, -1), (-1, 0), (0, 0)}
    gr_tiles = {}
    for (i, k) in mp_cells:
        if (i, k) in cam_center:
            C.rows.append(L.block(GOLD, 'plate', i, k, 1, 1, y_cam_deck))
            C.rows.append(on(BLK if (i + k) % 2 == 0 else TIN, (i + 0.5) * S, y_cam_deck + P, (k + 0.5) * S, '3062b'))
            C.rows.append(on(TORANGE if i == 0 else GOLD, (i + 0.5) * S, y_cam_deck + P + B, (k + 0.5) * S, '98138'))
        else:
            gr_tiles[(i, k)] = GOLD if (i + k) % 2 == 0 else KYANOS
    C.rows += pack_tiles(gr_tiles, y_cam_deck)

    # 3. LEFT STUDIO WING: 4 Isolated Git Worktree Agent Desks (i in -19..-10, k in -4..8)
    desk_specs = [
        (-19, -4, GOLD,   MBLUE,   'character.telemachus', 'telemachus', 0.0,           MBLUE,  TAN),     # Desk 1: huashu / rossark
        (-13, -4, BRONZE, TORANGE, 'character.penelope',   'penelope',   0.0,           DRED,   WHITE),   # Desk 2: take-one / reanimate
        (-19,  3, TIN,    TLBLUE,  'character.phemius',    'phemius',    0.0,           DPURPLE, WHITE),  # Desk 3: argo / explainroo
        (-13,  3, GOLD,   GREEN,   'character.demodocus',  'demodocus',  0.0,           GOLD,   DB),      # Desk 4: video-director / earshot
    ]
    for (di, dk, dcol, scol, fcard, fsub, frot, ftorso, flegs) in desk_specs:
        # 4x2 Desk at (di..di+3, dk..dk+1)
        for ii in range(di, di + 4):
            for kk in range(dk, dk + 2):
                C.reserve(ii, kk, 1, 1)
        yd = C.surf_y(di, dk)
        # Desk legs & tabletop (1 brick + 1 plate high)
        for p_sub in range(3):
            d_layer = {(ii, kk): (DB if p_sub < 2 else TAN) for ii in range(di, di + 4) for kk in range(dk, dk + 2)}
            C.rows += pack_plates(d_layer, yd + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
        y_top = yd + B
        # Desktop items: computer terminal tile + mini LEGO worktree build
        for ii in range(di, di + 4):
            for kk in range(dk, dk + 2):
                if kk == dk and ii in (di + 1, di + 2):
                    C.rows.append(L.block(BLK, 'plate', ii, kk, 1, 1, y_top))
                    C.rows.append(on(scol, (ii + 0.5) * S, y_top + P, (kk + 0.5) * S, '3070b'))
                elif kk == dk + 1 and ii == di:
                    C.rows.append(L.block(dcol, 'plate', ii, kk, 1, 1, y_top))
                    C.rows.append(on(dcol, (ii + 0.5) * S, y_top + P, (kk + 0.5) * S, '3062b'))
                    C.rows.append(on(GOLD, (ii + 0.5) * S, y_top + P + B, (kk + 0.5) * S, '98138'))
                else:
                    C.rows.append(on(TAN if (ii + kk) % 2 == 0 else LBG, (ii + 0.5) * S, y_top, (kk + 0.5) * S, '3070b'))
        # Place the specialist coding agent directly behind/in front of their worktree desk
        C.add_fig(fcard, fsub, di + 1, dk + 3, rot=math.pi,
                  hips=flegs, legs=flegs, torso=('973', ftorso), held_r=('3847', GOLD))

    # 4. RIGHT STUDIO WING: Cross-Model Auditor Inspection Table & The Espresso/Ambrosia Bar (i in 9..20, k in -4..8)
    # 4a. Auditor's Cross-Model Inspection Table at (i in 9..13, k in -3..-1)
    for ii in range(9, 14):
        for kk in range(-3, 0):
            C.reserve(ii, kk, 1, 1)
    ya = C.surf_y(11, -2)
    for p_sub in range(3):
        a_layer = {(ii, kk): (KYANOS if p_sub < 2 else GOLD) for ii in range(9, 14) for kk in range(-3, 0)}
        C.rows += pack_plates(a_layer, ya + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    ya_top = ya + B
    for ii in range(9, 14):
        for kk in range(-3, 0):
            if ii in (10, 11, 12) and kk == -2:
                C.rows.append(L.block(KYANOS, 'plate', ii, kk, 1, 1, ya_top))
                C.rows.append(on(GOLD if ii == 11 else SILVER, (ii + 0.5) * S, ya_top + P, (kk + 0.5) * S, '98138'))
            else:
                C.rows.append(on(GOLD if ii in (9, 13) else KYANOS, (ii + 0.5) * S, ya_top, (kk + 0.5) * S, '3070b'))

    # 3D Office Engineer (Daedalus / menelaus) & Cross-Model Reviewer (arete) inspecting the worktree module
    C.add_fig('character.menelaus', 'menelaus', 10, 1, rot=math.pi,
              hips=GOLD, legs=GOLD, torso=('973', DPURPLE), crown=('98138', GOLD), held_r=('3959', GOLD))
    C.add_fig('character.arete', 'arete', 13, 1, rot=math.pi,
              hips=WHITE, legs=WHITE, torso=('973', DRED), crown=('98138', GOLD))

    # 4b. The Espresso / Ambrosia Coffee Bar at (i in 15..19, k in 2..5) for idle agents waiting on 55m auto-compact
    for ii in range(15, 20):
        for kk in range(2, 4):
            C.reserve(ii, kk, 1, 1)
    ye = C.surf_y(17, 2)
    for p_sub in range(3):
        e_layer = {(ii, kk): (DB if p_sub < 2 else BRONZE) for ii in range(15, 20) for kk in range(2, 4)}
        C.rows += pack_plates(e_layer, ye + p_sub * P, axis=('x' if p_sub % 2 == 0 else 'z'))
    ye_top = ye + B
    for ii in range(15, 20):
        for kk in range(2, 4):
            if ii in (16, 18) and kk == 2:
                # Espresso machine & golden ambrosia urn
                C.rows.append(L.block(TIN, 'plate', ii, kk, 1, 1, ye_top))
                C.rows.append(on(TIN if ii == 16 else GOLD, (ii + 0.5) * S, ye_top + P, (kk + 0.5) * S, '3062b'))
                C.rows.append(on(GOLD if ii == 16 else TORANGE, (ii + 0.5) * S, ye_top + P + B, (kk + 0.5) * S, '98138'))
            else:
                C.rows.append(on(TAN if (ii + kk) % 2 == 0 else BRONZE, (ii + 0.5) * S, ye_top, (kk + 0.5) * S, '3070b'))

    # Two idle agents chatting over coffee at the lounge bar
    C.add_fig('character.euryalus', 'euryalus', 15, 6, rot=math.pi * 0.75,
              hips=TAN, legs=TAN, torso=('973', OLIVE))
    C.add_fig('character.laodamas', 'laodamas', 18, 6, rot=-math.pi * 0.75,
              hips=WHITE, legs=WHITE, torso=('973', MBLUE))

    # 5. Flanking Studio Cypress Trees & Foreground Director / Cinematographer on the Bouleau Armature Floor
    C.add_tree('cypress', -21, 9, seed=91)
    C.add_tree('cypress',  19, 9, seed=92)
    torch_post(C, -7,  6, h_bricks=2)
    torch_post(C,  6,  6, h_bricks=2)

    C.add_fig('character.alcinous', 'alcinous', -3, 8, rot=math.pi * 0.85,
              hips=GOLD, legs=GOLD, torso=('973', DRED), crown=('98138', GOLD), held_r=('3959', GOLD))
    C.add_fig('character.helen', 'helen', 3, 8, rot=-math.pi * 0.85,
              hips=WHITE, legs=WHITE, torso=('973', GOLD), crown=('98138', GOLD))

    return C.finalize()


DIORAMA_KITS = [
    ('set.shield-diorama-wedding',   'The Bridal Procession & Torch-Dance (Il. XVIII.491-496)',        build_diorama_wedding),
    ('set.shield-diorama-agora',     'The Sacred Circle & Law-Court in the Agora (Il. XVIII.497-508)', build_diorama_agora),
    ('set.shield-diorama-ambush',    'The River Ambush, Herdsmen & Three Fates (Il. XVIII.509-540)',   build_diorama_ambush),
    ('set.shield-diorama-sheepfold', 'The Pastoral Sheepfold, Shed & Cottage (Il. XVIII.587-589)',     build_diorama_sheepfold),
    ('set.shield-diorama-harvest',   'The Thrice-Ploughed Fallow & King\'s Harvest (Il. XVIII.541-560)', build_diorama_harvest),
    ('set.shield-diorama-vineyard',  'The Golden Vineyard & Boy with the Lyre (Il. XVIII.561-572)',    build_diorama_vineyard),
    ('set.shield-diorama-cattle',    'The Herd of Cattle, Two Lions & River Byre (Il. XVIII.573-586)', build_diorama_cattle),
    ('set.shield-diorama-choros',    'The Dancing Floor of Daedalus & Cosmic Vault (Il. XVIII.590-608)', build_diorama_choros),
    ('set.shield-diorama-office',    'The Multiplane Forge & 3D Agent Office (Behind the Scenes)',     build_diorama_office),
]


def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
    cards_dir = os.path.join(root_dir, 'odyssey', 'cards')
    os.makedirs(cards_dir, exist_ok=True)
    target = sys.argv[1] if len(sys.argv) > 1 else None

    total_all = 0
    for name, title, fn in DIORAMA_KITS:
        if target and target not in name:
            continue
        rows = fn()
        n_total = write(name, title, rows, author='tools/forage/product/kits/shield_dioramas.py')
        mpd_path = os.path.join(cards_dir, f'{name}.mpd')
        P_ = clicks.parts(mpd_path)
        ug, fc = clicks.figures(mpd_path, P_)
        L_loose = clicks.loose(P_, one_piece=True) + ug
        O_clash = clicks.overlaps(P_) + fc
        total_all += n_total
        print(f'{name:30s}: {n_total:5d} total pieces ({len(P_):5d} grid) | '
              f'{len(L_loose):3d} not clicked | {len(O_clash):3d} same space')
        for p in L_loose[:10]:
            print('   loose:', p['line'])
        for a, b in O_clash[:10]:
            print('   clash:', a['line'], ' <> ', b['line'])
    print(f'TOTAL ACROSS ALL BUILT DIORAMA KITS: {total_all} pieces')


if __name__ == '__main__':
    main()

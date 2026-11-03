#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m2.py — Section M2: The City at War (Iliad XVIII.509-540).

  python3 tools/forage/product/kits/shield_m2.py
    -> odyssey/cards/set.shield-m2.mpd
    -> odyssey/cards/set.shield-m2-on-frame.mpd

Homer's moment:
  "Their wives and young children stood on the wall to guard it, and with them the old men; the rest went out,
   led by Ares and Pallas Athena, both wrought in gold, and golden was the clothing they wore, tall and fair in
   their armour, as gods are, clear of the rest, for the people under them were smaller... When they came where
   they meant to set the ambush, by a river, at the watering-place where all cattle came, they sat down clothed
   in ruddy bronze... and these came soon, and two herdsmen followed them playing on pipes, suspecting no guile...
   and ruinous Fate, holding one man newly wounded, another unhurt, and dragging a third dead through the press
   by the feet."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m2():
    sec = 'm2'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m2'] at SEAT['m2'] = 52
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Define the sculpted topography of M2 (in plate layers above FLOOR['m2'] = 68):
    # - Upper acropolis rock bluff & besieged wall rampart (k <= -11): rises 3..6 plates
    # - Stepped golden war-dais of Ares & Pallas Athena (11 <= i <= 16, -5 <= k <= -1): rises 3..4 plates
    # - Reed-fringed ambush ridge overlooking the river (15 <= i <= 20, 0 <= k <= 3): rises 2..3 plates
    # - River watering-place channel (4 <= k <= 6): level 0 (lowest channel in M2)
    # - South riverbank & battle mound where Ruinous Fate drags the fallen warrior (k >= 9): rises 1..3 plates
    def h_fn(i, k):
        # Besieged city acropolis & wall walk at the upper/north end
        if k <= -11 and 2 <= i <= 15:
            if -16 <= k <= -13 and 3 <= i <= 10:
                return 8
            if k <= -17 and 2 <= i <= 9:
                return 6
            return 4
        # Stepped Golden Dais of Ares and Pallas Athena
        if 10 <= i <= 17 and -6 <= k <= -1:
            if 11 <= i <= 15 and -4 <= k <= -2:
                return 5
            return 3
        # Ambush bluff by the river reed-bed
        if 15 <= i <= 20 and 0 <= k <= 3:
            return 2
        # River watering-place stream bed
        river_z = 5.0 + 0.8 * math.sin((i - 6) * 0.35)
        if abs(k - river_z) <= 1.45:
            return 0
        # South riverbank battle mound (Ruinous Fate & cattle watering bank)
        if 3 <= i <= 9 and 9 <= k <= 16:
            return 3 if (4 <= i <= 8 and 10 <= k <= 13) else 2
        if 10 <= i <= 16 and 8 <= k <= 15:
            return 1
        return 0

    def col_fn(i, k, lv):
        # River watering-place channel in Dark Blue (272), Pearl Silver (179), and Trans-Clear (47)
        river_z = 5.0 + 0.8 * math.sin((i - 6) * 0.35)
        if lv == 0 and abs(k - river_z) <= 1.45:
            if abs(k - river_z) < 0.48:
                return TCLEAR if (i // 2) % 2 == 0 else SILVER
            return KYANOS
        # Golden Dais of Ares & Pallas Athena
        if 10 <= i <= 17 and -6 <= k <= -1 and lv >= 2:
            return GOLD if lv >= 4 else BRONZE
        # Besieged city acropolis & wall walk
        if k <= -11 and lv >= 3:
            return SILVER if lv >= 7 else BRONZE
        # Sortie road from city gate (-10) down to river (3)
        if 10 <= i <= 14 and -10 <= k <= 3 and lv == 0:
            return BRONZE
        # Coherent 6-stud ground zones in Dark Brown and Metallic Copper
        return BRONZE if (3 <= i <= 15 and 8 <= k <= 15) else DB

    # Cells where walls, battlements, reeds, cattle, gods, and mortal figures stand on studs
    merlon_cells = {(i, -13) for i in range(3, 11)}
    tower_cells  = {(3 + a, -18 + b) for a in (0, 1) for b in (0, 1) if (3 + a, -18 + b) in CELLS[sec]}
    wall_figs    = {(4, -15), (6, -15), (9, -15)}
    god_cells    = {(11 + a, -4 + b) for a in (0, 1) for b in (0, 1)} | {(14 + a, -4 + b) for a in (0, 1) for b in (0, 1)}
    sortie_figs  = {(10, -8), (15, -8)}
    reed_cells   = [(16, 1), (17, 2), (18, 1), (19, 2), (16, 3), (15, 2)]
    scout_cells  = {(18, 0)}
    cattle_1     = {(14 + a, 8 + b) for a in (0, 1) for b in (0, 1)}
    cattle_2     = {(10 + a, 8 + b) for a in (0, 1) for b in (0, 1)}
    herdsmen     = {(13, 13), (9, 14)}
    clash_cells  = {(5, 11), (7, 11), (4, 14)}

    keep = (
        merlon_cells | tower_cells | wall_figs | god_cells | sortie_figs
        | set(reed_cells) | scout_cells | cattle_1 | cattle_2 | herdsmen | clash_cells
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Coursed Bronze & Silver Battlements, Scaean Watchtower & Defenders on the Wall ──
    for i in range(3, 11, 2):
        ym = y_top[(i, -13)]
        rows.append(place_box(BRONZE, i, -13, ym,     '3004', 0.0))
        rows.append(put_curve(GOLD,   i, -13, ym + B, '25269', 1, 1))
        rows.append(place_box(SILVER, i + 1, -13, ym + B, '3070b', 0.0))

    # Flank watchtower at (3..4, -18..-17) in coursed Bronze & Dark Brown with Gold dome cap
    if len(tower_cells) == 4:
        yt = y_top[(3, -18)]
        rows.append(place_box(BRONZE, 3, -18, yt,         '3003', 0.0))
        rows.append(place_box(DB,     3, -18, yt + B,     '3003', 0.0))
        rows.append(place_box(GOLD,   3, -18, yt + 2 * B, '3022', 0.0))
        rows += put_curve_fan(lambda ci, ck: GOLD, 3, -18, 2, yt + 2 * B + P, 1, -1, curve_col=GOLD)

    # Wife, Young Child, and Old Man with staff on the besieged city wall
    rows += shield_fig(
        'character.penelope', 'penelope',
        {'hips': CLOTH_DRED, 'legs': CLOTH_DRED, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE, 'headgear': DB, 'held.r': None, 'held.l': None},
        (4 + 0.5) * S, y_top[(4, -15)], (-15 + 0.5) * S, rot=math.pi * 0.92
    )
    rows += shield_fig(
        'character.child-eumaeus-memory-variant', 'child-eumaeus-memory-variant',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_TAN, 'held.r': None, 'held.l': None},
        (6 + 0.5) * S, y_top[(6, -15)], (-15 + 0.5) * S, rot=math.pi
    )
    rows += shield_fig(
        'character.laertes', 'laertes',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_DTAN, 'held.r': ('95049', GOLD), 'held.l': None},
        (9 + 0.5) * S, y_top[(9, -15)], (-15 + 0.5) * S, rot=math.pi * 1.08
    )

    # ── 4. Ares & Pallas Athena Wrought in Gold, Raised & Tall Above the Mortal Army ──
    rows += god_fig('character.athena', 'athena', 11, -4, y_top[(11, -4)], rot=math.pi * 0.92, held_r='4499', held_l='75902')
    rows += god_fig('character.odysseus-restored', 'odysseus-restored', 14, -4, y_top[(14, -4)], rot=math.pi * 0.96, held_r='4499', held_l='3846')

    # Mortal townsmen marching out in ruddy bronze below the gods
    rows += shield_fig(
        'character.euryalus', 'euryalus',
        {'hips': DB, 'legs': BRONZE, 'torso': ('973', BRONZE), 'arms': CLOTH_DRED, 'headgear': ('3844', BRONZE), 'held.r': ('4499', BRONZE), 'held.l': None},
        (10 + 0.5) * S, y_top[(10, -8)], (-8 + 0.5) * S, rot=math.pi * 0.95
    )
    rows += shield_fig(
        'character.telemachus', 'telemachus',
        {'hips': DB, 'legs': BRONZE, 'torso': ('973', CLOTH_DRED), 'arms': BRONZE, 'headgear': ('3844', BRONZE), 'held.r': ('4499', BRONZE), 'held.l': None},
        (15 + 0.5) * S, y_top[(15, -8)], (-8 + 0.5) * S, rot=math.pi * 0.90
    )

    # ── 5. Reed Bed & Scout in Ruddy Bronze by the River Ambush ──
    for idx_r, (ri, rk) in enumerate(reed_cells):
        if (ri, rk) in y_top:
            rx, rz = (ri + 0.5) * S, (rk + 0.5) * S
            yr = y_top[(ri, rk)]
            h_reed = 2 if idx_r % 2 == 0 else 1
            for hr in range(h_reed):
                rows.append(on(DB if hr == 0 else BRONZE, rx, yr + hr * B, rz, '3062b'))
            rows.append(on(GOLD, rx, yr + h_reed * B, rz, '4589'))

    rows += shield_fig(
        'character.odysseus', 'odysseus',
        {'hips': BRONZE, 'legs': BRONZE, 'torso': ('973', BRONZE), 'arms': DB, 'headgear': ('3844', BRONZE), 'held.r': ('4499', BRONZE), 'held.l': None},
        (18 + 0.5) * S, y_top[(18, 0)], (0 + 0.5) * S, rot=math.pi * 0.85
    )

    # ── 6. Crooked-Horned Cattle Drinking at the River & Two Piping Herdsmen ──
    rows += cow_on(GOLD,   SILVER, 14, 8, y_top[(14, 8)], rot=0.12,  base_col=DB)
    rows += cow_on(TIN,    GOLD,   10, 8, y_top[(10, 8)], rot=-0.12, base_col=DB)

    rows += shield_fig(
        'character.phemius', 'phemius',
        {'hips': CLOTH_DTAN, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_TAN, 'held.r': ('3959', GOLD), 'held.l': None},
        (13 + 0.5) * S, y_top[(13, 13)], (13 + 0.5) * S, rot=-0.15
    )
    rows += shield_fig(
        'character.philoetius', 'philoetius',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_DTAN, 'held.r': ('3959', GOLD), 'held.l': None},
        (9 + 0.5) * S, y_top[(9, 14)], (14 + 0.5) * S, rot=0.15
    )

    # ── 7. Focal Moment: Ruinous Fate (Ker) Seizing & Dragging the Fallen Man by the Riverbank ──
    rows += shield_fig(
        'character.circe', 'circe',
        {'hips': BLK, 'legs': BLK, 'torso': ('973', CLOTH_DRED), 'arms': BLK, 'headgear': ('3844', GOLD), 'held.l': ('3847', GOLD), 'held.r': None},
        (5 + 0.5) * S, y_top[(5, 11)], (11 + 0.5) * S, rot=math.pi * 0.55
    )
    rows += shield_fig(
        'character.eumaeus', 'eumaeus',
        {'hips': DB, 'legs': DB, 'torso': ('973', BRONZE), 'arms': CLOTH_TAN, 'headgear': None, 'held.r': None, 'held.l': None},
        (7 + 0.5) * S, y_top[(7, 11)], (11 + 0.5) * S, rot=-math.pi * 0.45
    )
    rows += shield_fig(
        'character.menelaus', 'menelaus',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DRED), 'arms': BRONZE, 'headgear': ('3844', BRONZE), 'held.r': ('3847', BRONZE), 'held.l': None},
        (4 + 0.5) * S, y_top[(4, 14)], (14 + 0.5) * S, rot=math.pi * 0.25
    )

    return rows


if __name__ == '__main__':
    m2_rows = build_m2()
    n_alone = write('set.shield-m2', 'Shield of Achilles — M2: The City at War', m2_rows)
    n_frame = write('set.shield-m2-on-frame', 'Shield of Achilles — M2 on Frame', build_frame(['m2']) + m2_rows)
    print(f'set.shield-m2: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m2')
    check('set.shield-m2-on-frame')

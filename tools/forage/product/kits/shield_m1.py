#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m1.py — Section M1: The City at Peace (Iliad XVIII.490-508).

  python3 tools/forage/product/kits/shield_m1.py
    -> odyssey/cards/set.shield-m1.mpd
    -> odyssey/cards/set.shield-m1-on-frame.mpd

Homer's moment:
  "In the one were weddings and feastings, and they were leading the brides from their chambers through the city
   under blazing torches, and loud rose the bridal song; young men whirled in the dance, and among them flutes and
   lyres kept up their sound, while the women stood each at her doorway and marvelled. And the people were gathered
   in the place of assembly; for a quarrel had arisen, and two men were disputing over the blood-price of a man
   slain... And the elders sat on polished stones in a sacred circle, and held in their hands the staves of
   loud-voiced heralds; with these they sprang up and gave judgment in turn; and in the midst lay two talents of
   gold, to be given to him who among them should speak the straightest judgment."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m1():
    sec = 'm1'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m1'] at SEAT['m1'] = 52
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted civic terraces of M1:
    # - Upper Bridal Megaron Portico (k <= -12, -11 <= i <= -4): rises 4..6 plates
    # - Torch-lit Processional Street & Dance Terrace (-11 <= k <= -1, -19 <= i <= -10): rises 1..2 plates
    # - Lower Agora & Sacred Circle of Polished Stones (1 <= k <= 15, -18 <= i <= -6): stepped circular amphitheatre
    #   with sunken floor (h=1), polished silver stone ring (h=3), and central Judgment Altar (h=4) holding Two Talents of Gold
    sc_cx, sc_cz = -11.0, 8.0   # Center of the Sacred Circle (Hieros Kyklos)

    def h_fn(i, k):
        # Upper Bridal Chamber & Megaron Portico
        if k <= -12 and -11 <= i <= -4:
            if -16 <= k <= -13 and -10 <= i <= -4:
                return 6
            return 4
        # Torch-lit Bridal Procession Terrace
        if -10 <= k <= -2 and -19 <= i <= -11:
            return 2 if (-8 <= k <= -4 and -17 <= i <= -12) else 1
        # Sacred Circle of Polished Stones (Hieros Kyklos) in the Agora
        d_sc = math.hypot((i + 0.5) - sc_cx, (k + 0.5) - sc_cz)
        if d_sc <= 1.6:
            return 4   # Central Judgment Stone where the Two Talents of Gold lie
        if 3.2 <= d_sc <= 5.4:
            return 3   # Ring of polished silver stone seats for the Elders
        if d_sc < 3.2:
            return 1   # Paved floor inside the Sacred Circle
        return 0

    def col_fn(i, k, lv):
        d_sc = math.hypot((i + 0.5) - sc_cx, (k + 0.5) - sc_cz)
        if d_sc <= 1.6 and lv >= 3:
            return KYANOS if lv == 3 else GOLD
        if 3.2 <= d_sc <= 5.4 and lv >= 2:
            return SILVER if lv == 3 else TIN
        if d_sc < 3.2:
            return BRONZE
        if k <= -12 and lv >= 4:
            return BRONZE if lv < 6 else SILVER
        if -10 <= k <= -2 and -19 <= i <= -11:
            return GOLD if (-8 <= k <= -4 and -17 <= i <= -12) else BRONZE
        # Coherent 6-stud-wide civic terraces in Bronze and Dark Brown
        return BRONZE if -16 <= i <= -8 and -12 <= k <= 14 else DB

    # Studs left open for columns, torches, the Two Talents of Gold, and the cast of figures
    col_pillars = [(-10, -13), (-7, -13), (-4, -13)]
    door_women  = {(-8, -15), (-5, -15)}
    bridal_figs = {(-12, -9), (-14, -7), (-16, -5), (-12, -4)}
    elder_figs  = {(-15, 6), (-15, 10), (-11, 4)}
    disputants  = {(-9, 6), (-9, 10)}
    herald_fig  = {(-7, 8)}

    keep = (
        set(col_pillars) | door_women | bridal_figs
        | elder_figs | disputants | herald_fig
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Bridal Megaron Portico Columns, Architrave & Women Marvelling at the Doorway ──
    yp_base = y_top[(-10, -13)]
    for ci, ck in col_pillars:
        cx, cz = (ci + 0.5) * S, (ck + 0.5) * S
        rows.append(on(BRONZE, cx, yp_base,         cz, '3062b'))
        rows.append(on(SILVER, cx, yp_base + B,     cz, '3062b'))
        rows.append(on(GOLD,   cx, yp_base + 2 * B, cz, '3024'))
    # Bronze & Gold architrave beam spanning (-10, -13) .. (-4, -13) at yp_base + 2*B + P
    ya = yp_base + 2 * B + P
    rows.append(place_box(BRONZE, -10, -13, ya,     '3666', 0.0))
    rows.append(place_box(BRONZE, -4,  -13, ya,     '3024', 0.0))
    rows.append(place_box(GOLD,   -10, -13, ya + P, '6636', 0.0))
    rows.append(put_curve(GOLD,   -4,  -13, ya + P, '25269', 1, 1))

    # Women standing in the doorway marvelling at the bridal torches
    rows += shield_fig(
        'character.arete', 'arete',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN, 'headgear': DB, 'held.r': None, 'held.l': None},
        (-8 + 0.5) * S, y_top[(-8, -15)], (-15 + 0.5) * S, rot=math.pi
    )
    rows += shield_fig(
        'ensemble.wedding-household', 'maid-1',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_WHITE, 'held.r': ('2343', GOLD), 'held.l': None},
        (-5 + 0.5) * S, y_top[(-5, -15)], (-15 + 0.5) * S, rot=math.pi * 0.92
    )

    # ── 4. The Bridal Procession: Bride, Torch-Bearer, Lyre-Player & Whirling Young Dancer ──
    rows += shield_fig(
        'character.helen', 'helen',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE,
         'crown': ('98138', GOLD), 'held.r': ('3959', GOLD), 'held.l': None},
        (-12 + 0.5) * S, y_top[(-12, -9)], (-9 + 0.5) * S, rot=math.pi * 0.85
    )
    rows += shield_fig(
        'character.demodocus', 'demodocus',
        {'hips': CLOTH_DTAN, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_TAN, 'held.r': ('3959', GOLD), 'held.l': None},
        (-14 + 0.5) * S, y_top[(-14, -7)], (-7 + 0.5) * S, rot=math.pi * 0.75
    )
    rows += shield_fig(
        'character.laodamas', 'laodamas',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN, 'held.r': ('3959', GOLD), 'held.l': None},
        (-16 + 0.5) * S, y_top[(-16, -5)], (-5 + 0.5) * S, rot=-math.pi * 0.65
    )
    rows += shield_fig(
        'character.telemachus', 'telemachus',
        {'hips': CLOTH_DRED, 'legs': CLOTH_DRED, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_WHITE, 'held.r': None, 'held.l': None},
        (-12 + 0.5) * S, y_top[(-12, -4)], (-4 + 0.5) * S, rot=math.pi * 0.70
    )

    # ── 5. Focal Moment: The Sacred Circle of Polished Stones & The Two Talents of Gold ──
    # Note: The central Judgment Stone at (-12..-11, 7..8) is capped at level 4 in gleaming Pearl Gold (297)
    # by terrace_form (two side-by-side gold tiles representing the Two Talents of Gold!).
    # Around the Sacred Circle sit/stand the Elders on polished silver stones with golden herald staves (95049):
    rows += shield_fig(
        'character.nestor', 'nestor',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_WHITE,
         'held.r': ('95049', GOLD), 'held.l': None},
        (-15 + 0.5) * S, y_top[(-15, 6)], (6 + 0.5) * S, rot=-math.pi * 0.65
    )
    rows += shield_fig(
        'character.aegyptius', 'aegyptius',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_DTAN,
         'held.r': ('95049', GOLD), 'held.l': None},
        (-15 + 0.5) * S, y_top[(-15, 10)], (10 + 0.5) * S, rot=-math.pi * 0.35
    )
    rows += shield_fig(
        'character.halitherses', 'halitherses',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'held.r': ('95049', GOLD), 'held.l': None},
        (-11 + 0.5) * S, y_top[(-11, 4)], (4 + 0.5) * S, rot=math.pi
    )

    # The two disputants inside the circle arguing over the blood-price before the Two Talents of Gold
    rows += shield_fig(
        'character.odysseus', 'odysseus',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_TAN, 'headgear': None, 'held.r': None, 'held.l': None},
        (-9 + 0.5) * S, y_top[(-9, 6)], (6 + 0.5) * S, rot=math.pi * 0.75
    )
    rows += shield_fig(
        'character.euryalus', 'euryalus',
        {'hips': CLOTH_DTAN, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_DTAN, 'headgear': None, 'held.r': None, 'held.l': None},
        (-9 + 0.5) * S, y_top[(-9, 10)], (10 + 0.5) * S, rot=math.pi * 0.30
    )
    # Loud-voiced Herald standing at the eastern entry of the Sacred Circle with golden staff
    rows += shield_fig(
        'character.medon', 'medon',
        {'hips': CLOTH_RB, 'legs': CLOTH_RB, 'torso': ('973', BRONZE), 'arms': CLOTH_TAN, 'held.r': ('95049', GOLD), 'held.l': None},
        (-7 + 0.5) * S, y_top[(-7, 8)], (8 + 0.5) * S, rot=math.pi * 0.55
    )

    return rows


if __name__ == '__main__':
    m1_rows = build_m1()
    n_alone = write('set.shield-m1', 'Shield of Achilles — M1: The City at Peace', m1_rows)
    n_frame = write('set.shield-m1-on-frame', 'Shield of Achilles — M1 on Frame', build_frame(['m1']) + m1_rows)
    print(f'set.shield-m1: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m1')
    check('set.shield-m1-on-frame')
